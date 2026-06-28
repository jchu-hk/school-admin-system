import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { PermissionAuditLog } from '../entities/permission-audit-log.entity';

export interface PermissionAuditQuery {
  userId?: string;
  userRole?: string;
  action?: string;
  resource?: string;
  decision?: 'allow' | 'deny';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface PermissionAuditStats {
  totalChecks: number;
  allowCount: number;
  denyCount: number;
  denyRate: number;
  avgDecisionTimeMs: number;
  topDeniedResources: Array<{ resource: string; count: number }>;
  topDeniedActions: Array<{ action: string; count: number }>;
  roleStats: Array<{ role: string; checks: number; denyRate: number }>;
}

@Injectable()
export class PermissionAuditService {
  private readonly logger = new Logger(PermissionAuditService.name);

  constructor(
    @InjectRepository(PermissionAuditLog)
    private readonly auditRepository: Repository<PermissionAuditLog>,
  ) {}

  /**
   * 记录权限检查审计日志
   */
  async logPermissionCheck(
    userId: string,
    userRole: string,
    action: string,
    resource: string,
    decision: 'allow' | 'deny',
    reason?: string,
    matchedPolicy?: string,
    decisionTimeMs?: number,
    requestContext?: Record<string, any>,
    ip?: string,
    resourceId?: string,
  ): Promise<PermissionAuditLog> {
    try {
      const log = this.auditRepository.create({
        userId,
        userRole,
        action,
        resource,
        resourceId,
        decision,
        reason,
        matchedPolicy,
        decisionTimeMs: decisionTimeMs || 0,
        requestContext,
        ip,
      });
      return await this.auditRepository.save(log);
    } catch (err) {
      // 记录失败不应阻塞主流程，仅打印警告
      this.logger.warn(`[PermissionAudit] 日志记录失败: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * 查询权限审计日志
   */
  async queryLogs(query: PermissionAuditQuery): Promise<{
    data: PermissionAuditLog[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const {
      userId,
      userRole,
      action,
      resource,
      decision,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = query;

    const qb = this.auditRepository.createQueryBuilder('log');

    if (userId) {
      qb.andWhere('log.userId = :userId', { userId });
    }
    if (userRole) {
      qb.andWhere('log.userRole = :userRole', { userRole });
    }
    if (action) {
      qb.andWhere('log.action = :action', { action });
    }
    if (resource) {
      qb.andWhere('log.resource = :resource', { resource });
    }
    if (decision) {
      qb.andWhere('log.decision = :decision', { decision });
    }
    if (startDate) {
      qb.andWhere('log.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('log.createdAt <= :endDate', { endDate });
    }

    qb.orderBy('log.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, pageSize };
  }

  /**
   * 获取权限审计统计数据
   */
  async getStats(startDate?: Date, endDate?: Date): Promise<PermissionAuditStats> {
    const qb = this.auditRepository.createQueryBuilder('log');

    if (startDate) {
      qb.andWhere('log.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('log.createdAt <= :endDate', { endDate });
    }

    const logs = await qb.getMany();

    const totalChecks = logs.length;
    const allowCount = logs.filter((l) => l.decision === 'allow').length;
    const denyCount = logs.filter((l) => l.decision === 'deny').length;
    const denyRate = totalChecks > 0 ? denyCount / totalChecks : 0;

    const avgDecisionTimeMs =
      totalChecks > 0
        ? logs.reduce((sum, l) => sum + l.decisionTimeMs, 0) / totalChecks
        : 0;

    // 拒绝最多的资源
    const resourceDenyCounts: Record<string, number> = {};
    const actionDenyCounts: Record<string, number> = {};
    const roleStatsMap: Record<string, { checks: number; denies: number }> = {};

    logs.forEach((l) => {
      if (l.decision === 'deny') {
        resourceDenyCounts[l.resource] = (resourceDenyCounts[l.resource] || 0) + 1;
        actionDenyCounts[l.action] = (actionDenyCounts[l.action] || 0) + 1;
      }
      if (!roleStatsMap[l.userRole]) {
        roleStatsMap[l.userRole] = { checks: 0, denies: 0 };
      }
      roleStatsMap[l.userRole].checks++;
      if (l.decision === 'deny') {
        roleStatsMap[l.userRole].denies++;
      }
    });

    const topDeniedResources = Object.entries(resourceDenyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([resource, count]) => ({ resource, count }));

    const topDeniedActions = Object.entries(actionDenyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    const roleStats = Object.entries(roleStatsMap)
      .map(([role, stats]) => ({
        role,
        checks: stats.checks,
        denyRate: stats.checks > 0 ? stats.denies / stats.checks : 0,
      }))
      .sort((a, b) => b.checks - a.checks);

    return {
      totalChecks,
      allowCount,
      denyCount,
      denyRate,
      avgDecisionTimeMs,
      topDeniedResources,
      topDeniedActions,
      roleStats,
    };
  }

  /**
   * 获取用户权限检查历史
   */
  async getUserPermissionHistory(userId: string, limit = 50): Promise<PermissionAuditLog[]> {
    return this.auditRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取特定资源的权限检查历史
   */
  async getResourcePermissionHistory(resource: string, limit = 50): Promise<PermissionAuditLog[]> {
    return this.auditRepository.find({
      where: { resource },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 清理过期审计日志（保留最近N天）
   */
  async cleanOldLogs(retentionDays = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.auditRepository.delete({
      createdAt: LessThanOrEqual(cutoffDate),
    });

    this.logger.log(`[PermissionAudit] 已清理 ${result.affected || 0} 条过期日志`);
    return result.affected || 0;
  }
}