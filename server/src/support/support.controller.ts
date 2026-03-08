import {
  Controller, Get, Post, Param, Body, UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { SupportService } from './support.service';
import { IsString, MinLength, MaxLength } from 'class-validator';

class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text: string;
}

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ── User routes ──────────────────────────────────────────────────

  @Get('my')
  getMyChat(@CurrentUser() user: User) {
    return this.supportService.getMyMessages(user.id);
  }

  @Post('message')
  sendMessage(@CurrentUser() user: User, @Body() dto: SendMessageDto) {
    return this.supportService.sendMessage(user.id, dto.text);
  }

  @Get('unread')
  getUnread(@CurrentUser() user: User) {
    return this.supportService.countUnreadForUser(user.id).then((count) => ({ count }));
  }

  // ── Admin routes ─────────────────────────────────────────────────

  @Get('admin/conversations')
  getConversations(@CurrentUser() user: User) {
    if (!user.isAdmin) throw new ForbiddenException('Admin only');
    return this.supportService.getConversationList();
  }

  @Get('admin/unread')
  getAdminUnread(@CurrentUser() user: User) {
    if (!user.isAdmin) throw new ForbiddenException('Admin only');
    return this.supportService.countUnreadForAdmin().then((count) => ({ count }));
  }

  @Get('admin/conversation/:userId')
  getConversation(@CurrentUser() user: User, @Param('userId') userId: string) {
    if (!user.isAdmin) throw new ForbiddenException('Admin only');
    return this.supportService.getAdminConversation(userId);
  }

  @Post('admin/reply/:userId')
  adminReply(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    if (!user.isAdmin) throw new ForbiddenException('Admin only');
    return this.supportService.adminReply(userId, dto.text);
  }
}
