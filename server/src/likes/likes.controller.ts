import { Controller, Post, Get, Param, UseGuards, Version } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { LikesService } from './likes.service';

@Controller('likes')
@Version('1')
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /** Toggle like on a profile. Returns { liked, match, conversationId? } */
  @Post(':userId')
  toggle(@CurrentUser() me: User, @Param('userId') targetId: string) {
    return this.likesService.toggle(me.id, targetId);
  }

  /** IDs of all users I liked */
  @Get('given')
  myLikes(@CurrentUser() me: User) {
    return this.likesService.getLikedIds(me.id);
  }

  /** Profiles that liked me */
  @Get('received')
  whoLikedMe(@CurrentUser() me: User) {
    return this.likesService.getWhoLikedMe(me.id);
  }
}
