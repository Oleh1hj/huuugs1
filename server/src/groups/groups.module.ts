import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupChat } from './group.entity';
import { GroupMembership } from './group-membership.entity';
import { GroupMessage } from './group-message.entity';
import { GroupInvite } from './group-invite.entity';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupsGateway } from './groups.gateway';
import { UsersModule } from '../users/users.module';
import { ChatsModule } from '../chats/chats.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupChat, GroupMembership, GroupMessage, GroupInvite]),
    UsersModule,
    ChatsModule,
    AuthModule,
  ],
  providers: [GroupsService, GroupsGateway],
  controllers: [GroupsController],
  exports: [GroupsService],
})
export class GroupsModule {}
