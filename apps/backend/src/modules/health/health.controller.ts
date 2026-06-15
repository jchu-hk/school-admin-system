import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { HealthService, HealthCheckResponse } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * 简单健康检查 (兼容旧接口)
   * GET /health
   */
  @Get()
  @ApiOperation({ summary: 'Get service health status (simple)' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth(): { status: string; timestamp: string } {
    return this.healthService.getHealthStatus();
  }

  /**
   * 完整健康检查 (包含数据库健康状态)
   * GET /health/detailed
   */
  @Get('detailed')
  @ApiOperation({ summary: 'Get detailed health status including database checks' })
  @ApiResponse({
    status: 200,
    description: 'Detailed health status',
    type: Object,
  })
  async getDetailedHealth(): Promise<HealthCheckResponse> {
    return this.healthService.getFullHealthStatus();
  }

  /**
   * 数据库健康专项检查
   * GET /health/database
   */
  @Get('database')
  @ApiOperation({ summary: 'Get database health status (WAL, connection pool)' })
  @ApiResponse({
    status: 200,
    description: 'Database health check result',
    type: Object,
  })
  async getDatabaseHealth(): Promise<{
    connection: { status: string; message: string; responseTimeMs?: number };
    walBacklog: { status: string; message: string; walSizeMb?: number; thresholdMb: number };
    connectionPool: { status: string; used: number; max: number; available: number };
    version: string;
  }> {
    const response = await this.healthService.getFullHealthStatus();
    const dbCheck = response.checks.find((c) => c.name === 'database_connection');
    const walCheck = response.checks.find((c) => c.name === 'wal_backlog');
    const poolCheck = response.checks.find((c) => c.name === 'connection_pool');
    const versionCheck = response.checks.find((c) => c.name === 'database_version');

    return {
      connection: {
        status: dbCheck?.status || 'unknown',
        message: dbCheck?.message || '',
        responseTimeMs: dbCheck?.details?.responseTimeMs as number,
      },
      walBacklog: {
        status: walCheck?.status || 'unknown',
        message: walCheck?.message || '',
        walSizeMb: walCheck?.details?.walSizeMb as number,
        thresholdMb: walCheck?.details?.thresholdMb as number,
      },
      connectionPool: {
        status: poolCheck?.status || 'unknown',
        used: poolCheck?.details?.used as number,
        max: poolCheck?.details?.max as number,
        available: poolCheck?.details?.available as number,
      },
      version: versionCheck?.message || 'unknown',
    };
  }
}
