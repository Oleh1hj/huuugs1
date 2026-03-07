import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LikesModule } from './likes/likes.module';
import { ChatsModule } from './chats/chats.module';

@Module({
  imports: [
    // Rate limiting: 100 req / 60s per IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Database — SQLite for dev, swap to postgres in prod via env
    TypeOrmModule.forRoot({
      type: (process.env.DB_TYPE as any) ?? 'better-sqlite3',
      database: process.env.DB_NAME ?? 'huugs.db',
      // For PostgreSQL:
      // host: process.env.DB_HOST,
      // port: +process.env.DB_PORT,
      // username: process.env.DB_USER,
      // password: process.env.DB_PASS,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production', // use migrations in prod
      logging: process.env.NODE_ENV === 'development',
    }),

    AuthModule,
    UsersModule,
    LikesModule,
    ChatsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
