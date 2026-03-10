import { Module } from '@nestjs/common';
import { SpinBottleGateway } from './spin-bottle.gateway';
import { UsersModule } from '../users/users.module';
import { ChatsModule } from '../chats/chats.module';
import { LikesModule } from '../likes/likes.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, ChatsModule, LikesModule, AuthModule],
  providers: [SpinBottleGateway],
})
export class SpinBottleModule {}
