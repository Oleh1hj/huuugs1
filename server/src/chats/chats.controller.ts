import { Controller, Get, Patch, Post, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
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
  getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return this.chatsService.getMessages(
      conversationId,
      limit ?? 50,
      before ? new Date(before) : undefined,
    );
  }

  @Patch(':conversationId/read')
  markAsRead(
    @CurrentUser() me: User,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatsService.markAsRead(conversationId, me.id);
  }
}
