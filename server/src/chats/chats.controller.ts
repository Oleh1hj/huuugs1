import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { ChatsService } from './chats.service';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  getMyConversations(@CurrentUser() me: User) {
    return this.chatsService.getMyConversations(me.id);
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
