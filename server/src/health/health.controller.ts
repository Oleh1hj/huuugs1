import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    let dbOk = false;
    let dbType = 'unknown';
    try {
      await this.dataSource.query('SELECT 1');
      dbOk = true;
      dbType = this.dataSource.options.type as string;
    } catch {
      dbType = 'error';
    }

    return {
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk ? 'connected' : 'disconnected',
      dbType,
      // SQLite is ephemeral on Railway — messages won't survive restarts
      persistent: dbType === 'postgres',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
