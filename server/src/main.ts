import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Increase body size limit for photo uploads (base64)
  app.use(require('express').json({ limit: '5mb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '5mb' }));

  // Security
  app.use(helmet({ crossOriginEmbedderPolicy: false }));

  // CORS — allow same-origin + any configured client URL
  app.enableCors({
    origin: process.env.CLIENT_URL
      ? [process.env.CLIENT_URL, /\.railway\.app$/]
      : true,
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // API versioning
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Huugs API running on http://localhost:${port}/api`);
}

bootstrap();
