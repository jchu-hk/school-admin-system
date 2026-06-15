import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * 数据库健康检查项
 */
export interface DatabaseHealthCheck {
  /** 连接状态 */
  connection: {
    status: HealthStatus;
    message: string;
    responseTimeMs?: number;
  };
  /** WAL 积压状态 */
  walBacklog: {
    status: HealthStatus;
    message: string;
    walSizeMb?: number;
    thresholdMb: number;
  };
  /** 连接池使用率 */
  connectionPool: {
    status: HealthStatus;
    used: number;
    max: number;
    available: number;
  };
  /** 数据库版本 */
  version: string;
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  database?: DatabaseHealthCheck;
  checks: {
    name: string;
    status: HealthStatus;
    message?: string;
    details?: Record<string, unknown>;
  }[];
  slaMetrics?: {
    backupSuccessRate: number; // ≥ 99.9%
    lastBackupStatus: string;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 获取完整健康状态
   * 包含数据库连接检查、WAL积压检查等
   */
  async getFullHealthStatus(): Promise<HealthCheckResponse> {
    const checks: HealthCheckResponse['checks'] = [];
    let overallStatus: HealthStatus = HealthStatus.HEALTHY;

    // 1. 数据库连接检查
    const connectionCheck = await this.checkDatabaseConnection();
    checks.push({
      name: 'database_connection',
      status: connectionCheck.status,
      message: connectionCheck.message,
      details: {
        responseTimeMs: connectionCheck.responseTimeMs,
      },
    });

    // 2. WAL 积压检查
    const walCheck = await this.checkWalBacklog();
    checks.push({
      name: 'wal_backlog',
      status: walCheck.status,
      message: walCheck.message,
      details: {
        walSizeMb: walCheck.walSizeMb,
        thresholdMb: walCheck.thresholdMb,
      },
    });

    // 3. 连接池检查
    const poolCheck = await this.checkConnectionPool();
    checks.push({
      name: 'connection_pool',
      status: poolCheck.status,
      message: `已用: ${poolCheck.used}/${poolCheck.max}`,
      details: {
        used: poolCheck.used,
        max: poolCheck.max,
        available: poolCheck.available,
      },
    });

    // 4. 数据库版本检查
    const versionCheck = await this.checkDatabaseVersion();
    checks.push({
      name: 'database_version',
      status: HealthStatus.HEALTHY,
      message: versionCheck,
      details: { version: versionCheck },
    });

    // 判断总体状态
    const hasDegraded = checks.some((c) => c.status === HealthStatus.DEGRADED);
    const hasUnhealthy = checks.some(
      (c) => c.status === HealthStatus.UNHEALTHY,
    );
    if (hasUnhealthy) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (hasDegraded) {
      overallStatus = HealthStatus.DEGRADED;
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  /**
   * 数据库连接检查
   */
  async checkDatabaseConnection(): Promise<{
    status: HealthStatus;
    message: string;
    responseTimeMs?: number;
  }> {
    const start = Date.now();
    try {
      // 执行简单查询验证连接
      await this.dataSource.query('SELECT 1');
      const responseTimeMs = Date.now() - start;

      if (responseTimeMs < 1000) {
        return {
          status: HealthStatus.HEALTHY,
          message: '数据库连接正常',
          responseTimeMs,
        };
      } else {
        return {
          status: HealthStatus.DEGRADED,
          message: `数据库响应较慢: ${responseTimeMs}ms`,
          responseTimeMs,
        };
      }
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `数据库连接失败: ${error.message}`,
      };
    }
  }

  /**
   * WAL 积压检查
   * 阈值: Warning > 500MB, Critical > 1GB
   */
  async checkWalBacklog(): Promise<{
    status: HealthStatus;
    message: string;
    walSizeMb?: number;
    thresholdMb: number;
  }> {
    const warningThresholdMb = 500;
    const criticalThresholdMb = 1000;

    try {
      // 查询 WAL 积压大小 (PostgreSQL)
      const result = await this.dataSource.query(`
        SELECT
          pg_size_pretty(
            pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0'::pg_lsn)
          ) AS wal_size_pretty,
          pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0'::pg_lsn) AS wal_size_bytes
      `);

      // 获取复制槽延迟 (如果有从库)
      const replicationResult = await this.dataSource.query(`
        SELECT
          slot_name,
          pg_size_pretty(
            pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)
          ) AS replay_lag_pretty,
          pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) AS replay_lag_bytes
        FROM pg_replication_slots
        WHERE active = true
        LIMIT 5;
      `);

      const walSizeBytes = parseInt(result[0]?.wal_size_bytes || '0', 10);
      const walSizeMb = walSizeBytes / (1024 * 1024);

      // 取主 WAL 大小和从库延迟的最大值
      let maxWalMb = walSizeMb;
      for (const slot of replicationResult || []) {
        const lagBytes = parseInt(slot.replay_lag_bytes || '0', 10);
        const lagMb = lagBytes / (1024 * 1024);
        if (lagMb > maxWalMb) {
          maxWalMb = lagMb;
        }
      }

      if (maxWalMb >= criticalThresholdMb) {
        this.logger.error(
          `WAL 积压严重: ${maxWalMb.toFixed(2)}MB (阈值: ${criticalThresholdMb}MB)`,
        );
        return {
          status: HealthStatus.UNHEALTHY,
          message: `WAL 积压严重: ${maxWalMb.toFixed(2)}MB，需要立即处理`,
          walSizeMb: Math.round(maxWalMb * 100) / 100,
          thresholdMb: criticalThresholdMb,
        };
      } else if (maxWalMb >= warningThresholdMb) {
        this.logger.warn(
          `WAL 积压偏高: ${maxWalMb.toFixed(2)}MB (阈值: ${warningThresholdMb}MB)`,
        );
        return {
          status: HealthStatus.DEGRADED,
          message: `WAL 积压偏高: ${maxWalMb.toFixed(2)}MB，建议检查`,
          walSizeMb: Math.round(maxWalMb * 100) / 100,
          thresholdMb: warningThresholdMb,
        };
      }

      return {
        status: HealthStatus.HEALTHY,
        message: `WAL 积压正常: ${maxWalMb.toFixed(2)}MB`,
        walSizeMb: Math.round(maxWalMb * 100) / 100,
        thresholdMb: warningThresholdMb,
      };
    } catch (error) {
      // 如果查询失败，可能是非 PostgreSQL 数据库
      this.logger.warn(`WAL 检查失败: ${error.message}`);
      return {
        status: HealthStatus.HEALTHY,
        message: 'WAL 检查不适用 (非 PostgreSQL 或权限不足)',
        thresholdMb: warningThresholdMb,
      };
    }
  }

  /**
   * 连接池使用率检查
   */
  async checkConnectionPool(): Promise<{
    status: HealthStatus;
    used: number;
    max: number;
    available: number;
  }> {
    const warningThreshold = 0.8; // 80%
    const criticalThreshold = 0.9; // 90%

    try {
      // 查询当前连接数
      const result = await this.dataSource.query(`
        SELECT
          count(*) AS current_connections,
          (SELECT setting FROM pg_settings WHERE name = 'max_connections') AS max_connections
        FROM pg_stat_activity
        WHERE state IS NOT NULL
      `);

      const currentConnections = parseInt(
        result[0]?.current_connections || '0',
        10,
      );
      const maxConnections = parseInt(result[0]?.max_connections || '100', 10);
      const available = maxConnections - currentConnections;
      const usageRatio = currentConnections / maxConnections;

      if (usageRatio >= criticalThreshold) {
        return {
          status: HealthStatus.UNHEALTHY,
          used: currentConnections,
          max: maxConnections,
          available,
        };
      } else if (usageRatio >= warningThreshold) {
        return {
          status: HealthStatus.DEGRADED,
          used: currentConnections,
          max: maxConnections,
          available,
        };
      }

      return {
        status: HealthStatus.HEALTHY,
        used: currentConnections,
        max: maxConnections,
        available,
      };
    } catch (error) {
      this.logger.warn(`连接池检查失败: ${error.message}`);
      return {
        status: HealthStatus.HEALTHY,
        used: 0,
        max: 100,
        available: 100,
      };
    }
  }

  /**
   * 数据库版本检查
   */
  async checkDatabaseVersion(): Promise<string> {
    try {
      const result = await this.dataSource.query('SELECT version()');
      const version = result[0]?.version || 'Unknown';
      // 提取版本号部分
      const match = version.match(/PostgreSQL (\d+\.\d+)/);
      return match ? `PostgreSQL ${match[1]}` : version;
    } catch (error) {
      return `数据库版本获取失败: ${error.message}`;
    }
  }

  /**
   * 简单的健康状态 (兼容旧接口)
   */
  getHealthStatus(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
