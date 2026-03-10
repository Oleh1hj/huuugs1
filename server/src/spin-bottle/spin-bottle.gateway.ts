import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { ChatsGateway } from '../chats/chats.gateway';
import { LikesService } from '../likes/likes.service';
import { User } from '../users/user.entity';

interface ActiveSpin {
  spinnerId: string;
  targetId: string;
  expiresAt: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
export class SpinBottleGateway {
  @WebSocketServer() server: Server;

  /** spinId → spin state (lives 60s) */
  private activeSpins = new Map<string, ActiveSpin>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly chatsGateway: ChatsGateway,
    private readonly likesService: LikesService,
  ) {}

  /** Authenticate socket and return the User (or null) */
  private async getUser(socket: Socket): Promise<User | null> {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return null;
      const payload = this.jwtService.verify(token);
      return await this.usersService.findById(payload.sub);
    } catch {
      return null;
    }
  }

  /** Client spins the bottle → pick random online user of opposite gender */
  @SubscribeMessage('bottle:spin')
  async handleSpin(@ConnectedSocket() socket: Socket) {
    const spinner = await this.getUser(socket);
    if (!spinner) return;

    const onlineIds = this.chatsGateway.getOnlineUserIds();
    const candidateIds = onlineIds.filter((id) => id !== spinner.id);

    const candidates = await Promise.all(
      candidateIds.map((id) => this.usersService.findById(id)),
    );

    const oppositeGender = spinner.gender === 'male' ? 'female' : 'male';
    const validTargets = candidates.filter(
      (u): u is User => !!u && u.gender === oppositeGender,
    );

    if (validTargets.length === 0) {
      socket.emit('bottle:no-targets', {});
      return;
    }

    const target = validTargets[Math.floor(Math.random() * validTargets.length)];
    const spinId = randomUUID();

    this.activeSpins.set(spinId, {
      spinnerId: spinner.id,
      targetId: target.id,
      expiresAt: Date.now() + 60_000,
    });

    // Auto-cleanup after 60s
    setTimeout(() => this.activeSpins.delete(spinId), 60_000);

    // Broadcast spin result to ALL online users
    this.server.emit('bottle:result', {
      spinId,
      spinnerId: spinner.id,
      spinnerName: spinner.name,
      spinnerPhoto: spinner.photo,
      targetId: target.id,
      targetName: target.name,
      targetPhoto: target.photo,
    });
  }

  /** Spinner sends a heart to the target */
  @SubscribeMessage('bottle:heart')
  async handleHeart(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { spinId: string; targetId: string },
  ) {
    const spinner = await this.getUser(socket);
    if (!spinner) return;

    const spin = this.activeSpins.get(body.spinId);
    if (!spin) return;
    if (spin.spinnerId !== spinner.id) return;
    if (spin.targetId !== body.targetId) return;
    if (Date.now() > spin.expiresAt) {
      this.activeSpins.delete(body.spinId);
      return;
    }

    this.activeSpins.delete(body.spinId);

    // Toggle like — LikesService handles mutual check + notifies target via ChatsGateway
    const result = await this.likesService.toggle(spinner.id, body.targetId);

    // Also notify the spinner themselves if match
    if (result.match && result.conversationId) {
      const target = await this.usersService.findById(body.targetId);
      socket.emit('match', {
        partnerId: body.targetId,
        partnerName: target?.name ?? '',
        partnerPhoto: target?.photo ?? null,
        conversationId: result.conversationId,
      });
    }
  }
}
