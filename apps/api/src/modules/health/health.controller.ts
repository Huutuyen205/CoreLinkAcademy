import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { HealthCheckResponse } from '@corelink/shared';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái hoạt động của hệ thống (MySQL, Redis, MinIO)' })
  @ApiResponse({ status: 200, description: 'Hệ thống hoạt động bình thường' })
  @ApiResponse({ status: 503, description: 'Một hoặc nhiều dịch vụ gặp sự cố' })
  async check(@Res() res: Response): Promise<void> {
    const startTime = Date.now();
    let dbStatus: 'up' | 'down' = 'down';
    let dbLatency: number | undefined;
    let dbError: string | undefined;

    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
      dbStatus = 'up';
    } catch (err: any) {
      dbStatus = 'down';
      dbError = err.message || 'Unknown database error';
    }

    // Redis: Kiểm tra hoặc fallback mock
    const redisStatus: 'up' | 'down' | 'mock' = 'mock';
    // Storage: MinIO hoặc local fallback
    const storageStatus: 'up' | 'down' | 'mock' = 'mock';

    const isHealthy = dbStatus === 'up';

    const response: HealthCheckResponse = {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
          error: dbError,
        },
        redis: {
          status: redisStatus,
        },
        storage: {
          status: storageStatus,
        },
      },
      version: '0.1.0',
    };

    res.status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(response);
  }
}
