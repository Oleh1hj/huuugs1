import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync } from 'fs';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LikesModule } from './likes/likes.module';
import { ChatsModule } from './chats/chats.module';
import { SupportModule } from './support/support.module';
import { SpinBottleModule } from './spin-bottle/spin-bottle.module';
import { GroupsModule } from './groups/groups.module';

const distPath = join(__dirname, '..', '..', 'dist');

@Module({
  imports: [
    // Rate limiting: 100 req / 60s per IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Serve React frontend only if dist/ exists (monorepo setup)
    // In two-service Railway setup, frontend is served separately
    ...(existsSync(distPath)
      ? [ServeStaticModule.forRoot({ rootPath: distPath, exclude: ['/api/(.*)'] })]
      : []),

    // Database — SQLite for dev, PostgreSQL in prod via DATABASE_URL
    TypeOrmModule.forRoot(
      process.env.DATABASE_URL
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            autoLoadEntities: true,
            synchronize: true,
          }
        : {
            type: 'better-sqlite3' as any,
            database: process.env.DB_NAME ?? 'huugs.db',
            autoLoadEntities: true,
            synchronize: true,
            logging: process.env.NODE_ENV === 'development',
          },
    ),

    AuthModule,
    UsersModule,
    LikesModule,
    ChatsModule,
    SupportModule,
    SpinBottleModule,
    GroupsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
