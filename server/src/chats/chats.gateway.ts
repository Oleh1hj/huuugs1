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
    origin: true,
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

      const isFirstSocket = !this.userSockets.has(user.id);
      if (!this.userSockets.has(user.id)) this.userSockets.set(user.id, new Set());
      this.userSockets.get(user.id)!.add(socket.id);

      // Auto-join all user's conversation rooms
      const conversations = await this.chatsService.getMyConversations(user.id);
      conversations.forEach((c) => socket.join(`conv:${c.id}`));

      // Notify conversation partners that user came online (only on first socket)
      if (isFirstSocket) {
        conversations.forEach((c) => {
          socket.to(`conv:${c.id}`).emit('online', { userId: user.id });
        });
      }

      console.log(`✅ WS connected: ${user.name} (${socket.id})`);
    } catch {
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: AuthSocket) {
    if (socket.userId) {
      const sockets = this.userSockets.get(socket.userId);
      sockets?.delete(socket.id);
      if (sockets?.size === 0) {
        this.userSockets.delete(socket.userId);
        // Notify partners that user went offline
        const conversations = await this.chatsService.getMyConversations(socket.userId);
        conversations.forEach((c) => {
          socket.to(`conv:${c.id}`).emit('offline', { userId: socket.userId });
        });
      }
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

    try {
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
        isRead: false,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error('[WS] handleMessage save failed:', err);
      socket.emit('message-error', { conversationId: body.conversationId, text: body.text?.trim() });
    }
  }

  @SubscribeMessage('read')
  async handleRead(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() conversationId: string,
  ) {
    if (!socket.userId) return;
    await this.chatsService.markAsRead(conversationId, socket.userId);
    // Notify all participants so the sender sees the ✓✓ update
    this.server.to(`conv:${conversationId}`).emit('read', {
      conversationId,
      readByUserId: socket.userId,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() conversationId: string,
  ) {
    socket.to(`conv:${conversationId}`).emit('typing', { userId: socket.userId });
  }

  /** Return IDs of all currently connected users */
  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
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

  /** Notify a specific user they received a super-like */
  notifySuperLike(userId: string, payload: object) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((sid) => {
        this.server.to(sid).emit('super-like', payload);
      });
    }
  }

  /** Emit an event to all sockets of a specific user */
  emitToUser(userId: string, event: string, payload: object) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((sid) => {
        this.server.to(sid).emit(event, payload);
      });
    }
  }
}
