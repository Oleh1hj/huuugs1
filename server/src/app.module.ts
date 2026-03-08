import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LikesModule } from './likes/likes.module';
import { ChatsModule } from './chats/chats.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    // Rate limiting: 100 req / 60s per IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Serve React frontend from dist/ (built by root npm run build)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'dist'),
      exclude: ['/api/(.*)'],
    }),

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
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
