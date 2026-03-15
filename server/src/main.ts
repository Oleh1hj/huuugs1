import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';
import * as express from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Gzip compression — reduces response size ~70% (critical at scale)
  app.use(compression());

  // Increase body size limit for photo uploads (base64)
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Security headers
  app.use(helmet({ crossOriginEmbedderPolicy: false }));

  // CORS — allow same-origin + any configured client URL
  app.enableCors({
    origin: process.env.CLIENT_URL
      ? [process.env.CLIENT_URL, /\.railway\.app$/]
      : true,
    credentials: true,
  });

  // Global validation — strips unknown fields, auto-transforms types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global error handler — consistent JSON error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global prefix + versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  const dbType = process.env.DATABASE_URL
    ? '✅ PostgreSQL (persistent)'
    : '⚠️  SQLite (EPHEMERAL — messages will be lost on restart! Set DATABASE_URL in Railway)';
  console.log(`🚀 Huugs API running on port ${port}`);
  console.log(`🗄️  Database: ${dbType}`);
}

bootstrap();
