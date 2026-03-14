import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GroupsService } from './groups.service';
import { UsersService } from '../users/users.service';
import { ChatsGateway } from '../chats/chats.gateway';
import { User } from '../users/user.entity';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
export class GroupsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly groupsService: GroupsService,
    private readonly usersService: UsersService,
    private readonly chatsGateway: ChatsGateway,
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

  /** On connect: auto-join all group rooms for this user */
  async handleConnection(socket: Socket) {
    const user = await this.getUser(socket);
    if (!user) return;
    const memberships = await this.groupsService.getUserMemberships(user.id);
    memberships.forEach((m) => socket.join(`group:${m.groupId}`));
  }

  /** Join a specific group room */
  @SubscribeMessage('group:join')
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() groupId: string,
  ) {
    const user = await this.getUser(socket);
    if (!user) return;
    socket.join(`group:${groupId}`);
    return { event: 'group:joined', groupId };
  }

  /** Send a message to a group */
  @SubscribeMessage('group:message')
  async handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { groupId: string; text: string },
  ) {
    const user = await this.getUser(socket);
    if (!user || !body.text?.trim()) return;

    const msg = await this.groupsService.saveMessage(body.groupId, user.id, body.text.trim());

    this.server.to(`group:${body.groupId}`).emit('group:message', {
      id: msg.id,
      groupId: body.groupId,
      senderId: user.id,
      senderName: user.name,
      senderPhoto: user.photo,
      text: msg.text,
      createdAt: msg.createdAt,
    });
  }

  /** Typing indicator */
  @SubscribeMessage('group:typing')
  async handleTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() groupId: string,
  ) {
    const user = await this.getUser(socket);
    if (!user) return;
    socket.to(`group:${groupId}`).emit('group:typing', {
      userId: user.id,
      userName: user.name,
      groupId,
    });
  }

  /** Notify a user about a group invite */
  notifyGroupInvite(
    toUserId: string,
    payload: { groupId: string; groupName: string; fromName: string; inviteId: string },
  ) {
    this.chatsGateway.emitToUser(toUserId, 'group:invite', payload);
  }

  /** Notify all group members about a join request */
  notifyGroupRequest(
    groupId: string,
    payload: { requestId: string; fromId: string; fromName: string; fromPhoto: string | null },
  ) {
    this.server.to(`group:${groupId}`).emit('group:join-request', payload);
  }

  /** Notify group members that someone joined */
  notifyMemberJoined(groupId: string, payload: { userId: string; userName: string }) {
    this.server.to(`group:${groupId}`).emit('group:member-joined', payload);
  }
}
