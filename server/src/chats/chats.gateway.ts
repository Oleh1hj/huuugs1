import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatsService } from './chats.service';
import { UsersService } from '../users/users.service';

interface AuthSocket extends Socket {
  userId: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private userSockets = new Map<string, Set<string>>(); // userId → socketIds

  constructor(
    private readonly chatsService: ChatsService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(socket: AuthSocket) {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) { socket.disconnect(); return; }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user) { socket.disconnect(); return; }

      socket.userId = user.id;

      if (!this.userSockets.has(user.id)) this.userSockets.set(user.id, new Set());
      this.userSockets.get(user.id)!.add(socket.id);

      // Auto-join all user's conversation rooms
      const conversations = await this.chatsService.getMyConversations(user.id);
      conversations.forEach((c) => socket.join(`conv:${c.id}`));

      console.log(`✅ WS connected: ${user.name} (${socket.id})`);
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: AuthSocket) {
    if (socket.userId) {
      const sockets = this.userSockets.get(socket.userId);
      sockets?.delete(socket.id);
      if (sockets?.size === 0) this.userSockets.delete(socket.userId);
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() conversationId: string,
  ) {
    socket.join(`conv:${conversationId}`);
    return { event: 'joined', conversationId };
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() body: { conversationId: string; text: string },
  ) {
    if (!socket.userId || !body.text?.trim()) return;

    const message = await this.chatsService.saveMessage(
      body.conversationId,
      socket.userId,
      body.text.trim(),
    );

    // Broadcast to all participants (including sender for multi-device sync)
    this.server.to(`conv:${body.conversationId}`).emit('message', {
      id: message.id,
      conversationId: body.conversationId,
      senderId: socket.userId,
      text: message.text,
      createdAt: message.createdAt,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() conversationId: string,
  ) {
    socket.to(`conv:${conversationId}`).emit('typing', { userId: socket.userId });
  }

  /** Notify a specific user that they have a new match */
  notifyMatch(userId: string, payload: object) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((sid) => {
        this.server.to(sid).emit('match', payload);
      });
    }
  }
}
