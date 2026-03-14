import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { GroupsService } from './groups.service';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  getMyGroups(@CurrentUser() me: User) {
    return this.groupsService.getMyGroups(me.id);
  }

  @Post()
  createGroup(
    @CurrentUser() me: User,
    @Body() body: { name: string; description?: string },
  ) {
    return this.groupsService.createGroup(me.id, body.name, body.description);
  }

  @Get('invites/mine')
  getMyInvites(@CurrentUser() me: User) {
    return this.groupsService.getMyInvites(me.id);
  }

  @Get(':groupId')
  getGroupDetails(@CurrentUser() me: User, @Param('groupId') groupId: string) {
    return this.groupsService.getGroupDetails(groupId, me.id);
  }

  @Get(':groupId/messages')
  getMessages(
    @CurrentUser() me: User,
    @Param('groupId') groupId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.groupsService.getMessages(
      groupId,
      me.id,
      limit ? parseInt(limit) : undefined,
      before ? new Date(before) : undefined,
    );
  }

  @Post(':groupId/invite/:userId')
  inviteUser(
    @CurrentUser() me: User,
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.groupsService.inviteUser(groupId, me.id, userId);
  }

  @Post(':groupId/request')
  requestJoin(@CurrentUser() me: User, @Param('groupId') groupId: string) {
    return this.groupsService.requestJoin(groupId, me.id);
  }

  @Patch('invites/:inviteId')
  respondToInvite(
    @CurrentUser() me: User,
    @Param('inviteId') inviteId: string,
    @Body() body: { accept: boolean },
  ) {
    return this.groupsService.respondToInvite(inviteId, me.id, body.accept);
  }

  @Delete(':groupId/leave')
  leaveGroup(@CurrentUser() me: User, @Param('groupId') groupId: string) {
    return this.groupsService.leaveGroup(groupId, me.id);
  }
}
