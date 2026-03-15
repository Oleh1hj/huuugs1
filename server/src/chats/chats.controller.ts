import { Controller, Get, Patch, Post, Param, Query, Body, UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { UsersService } from '../users/users.service';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly chatsGateway: ChatsGateway,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  getMyConversations(@CurrentUser() me: User) {
    return this.chatsService.getMyConversations(me.id);
  }

  /** Open/find a direct conversation. Allowed if me is admin OR target is admin. */
  @Post('with/:userId')
  async openConversation(@CurrentUser() me: User, @Param('userId') userId: string) {
    const target = await this.usersService.findById(userId);
    if (!target) throw new ForbiddenException('User not found');
    if (!me.isAdmin && !target.isAdmin) {
      throw new ForbiddenException('Only admin conversations are allowed this way');
    }
    const conv = await this.chatsService.findOrCreateConversation(me.id, userId);
    return { conversationId: conv.id };
  }

  @Get('online-users')
  getOnlineUsers() {
    return { ids: this.chatsGateway.getOnlineUserIds() };
  }

  @Get(':conversationId/messages')
  async getMessages(
    @CurrentUser() me: User,
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    const conv = await this.chatsService.findConversationById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.userAId !== me.id && conv.userBId !== me.id) throw new ForbiddenException();
    return this.chatsService.getMessages(
      conversationId,
      limit ?? 50,
      before ? new Date(before) : undefined,
    );
  }

  /** Send a message via HTTP (reliable fallback when WebSocket is unavailable) */
  @Post(':conversationId/messages')
  async sendMessage(
    @CurrentUser() me: User,
    @Param('conversationId') conversationId: string,
    @Body('text') text: string,
  ) {
    text = (text ?? '').trim();
    if (!text) return;
    const conv = await this.chatsService.findConversationById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.userAId !== me.id && conv.userBId !== me.id) throw new ForbiddenException();
    const message = await this.chatsService.saveMessage(conversationId, me.id, text);
    // Notify other participants via WebSocket in real-time
    this.chatsGateway.server?.to(`conv:${conversationId}`).emit('message', {
      id: message.id,
      conversationId,
      senderId: me.id,
      text: message.text,
      isRead: false,
      createdAt: message.createdAt,
    });
    return message;
  }

  @Patch(':conversationId/read')
  markAsRead(
    @CurrentUser() me: User,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatsService.markAsRead(conversationId, me.id);
  }
}
