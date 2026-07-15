import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PortalAuditLog,
  PortalAuditEventType,
} from '../entities/portal-audit-log.entity';

/**
 * Portal 审计日志条目
 */
export interface AuditEvent {
  eventType: PortalAuditEventType;
  actorId: string;
  actorRole: string;
  targetId?: string;
  targetType?: string;
  action: string;
  /** 变更详情（需脱敏后传入） */
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  result?: 'SUCCESS' | 'FAILURE' | 'DENIED';
}

/**
 * 门户审计日志 Service
 *
 * 职责：
 * 1. 记录所有学生/家长门户操作
 * 2. 符合 PDPO 审计追踪要求（≥1年保留，敏感操作≥2年）
 * 3. 特别关注 403 DENIED 事件
 *
 * 使用方式
 * ```ts
 * await auditLogService.log({
 *   eventType: PortalAuditEventType.PROFILE_UPDATE,
 *   actorId: 'user-uuid',
 *   actorRole: 'student',
 *   targetId: 'student-uuid',
 *   targetType: 'students',
 *   action: 'UPDATE',
 *   changes: [{ field: 'phone', old: '****4567', new: '****7890' }],
 *   ipAddress: '192.168.1.100',
 *   userAgent: 'Mozilla/5.0...',
 *   result: 'SUCCESS',
 * });
 * ```
 */
@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(PortalAuditLog)
    private readonly auditLogRepo: Repository<PortalAuditLog>,
  ) {}

  /**
   * 记录一条审计日志
   *
   * @param event 审计事件对象
   */
  async log(event: AuditEvent): Promise<void> {
    const entry = this.auditLogRepo.create({
      eventType: event.eventType,
      actorId: event.actorId,
      actorRole: event.actorRole,
      targetId: event.targetId || null,
      targetType: event.targetType || null,
      action: event.action,
      changes: event.changes || null,
      ipAddress: event.ipAddress || null,
      userAgent: event.userAgent || null,
      result: event.result || 'SUCCESS',
    });

    await this.auditLogRepo.save(entry);
  }

  /**
   * 快速记录 DENIED / 403 事件
   *
   * @param options 审计日志参数
   */
  async logDenied(options: {
    actorId: string;
    actorRole: string;
    targetType?: string;
    targetId?: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    // 构造增强的 Denied 事件详情，包含请求路径和尝试的资源
    const changes: Record<string, any> = {
      reason: 'UNAUTHORIZED_ACCESS',
      deniedAt: new Date().toISOString(),
    };

    if (options.targetType) {
      changes.requestedResource = options.targetType;
    }
    if (options.targetId) {
      changes.requestedResourceId = options.targetId;
    }

    await this.log({
      eventType: PortalAuditEventType.UNAUTHORIZED_ACCESS,
      actorId: options.actorId,
      actorRole: options.actorRole,
      targetId: options.targetId,
      targetType: options.targetType,
      action: options.action,
      changes,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      result: 'DENIED',
    });
  }

  /**
   * 查询审计日志列表（分页）
   */
  async find(options: {
    actorId?: string;
    eventType?: PortalAuditEventType;
    result?: string;
    from?: Date;
    to?: Date;
    skip?: number;
    take?: number;
  }): Promise<[PortalAuditLog[], number]> {
    const qb = this.auditLogRepo.createQueryBuilder('log');

    if (options.actorId) {
      qb.andWhere('log.actorId = :actorId', { actorId: options.actorId });
    }
    if (options.eventType) {
      qb.andWhere('log.eventType = :eventType', {
        eventType: options.eventType,
      });
    }
    if (options.result) {
      qb.andWhere('log.result = :result', { result: options.result });
    }
    if (options.from) {
      qb.andWhere('log.createdAt >= :from', { from: options.from });
    }
    if (options.to) {
      qb.andWhere('log.createdAt <= :to', { to: options.to });
    }

    qb.orderBy('log.createdAt', 'DESC');

    if (options.skip !== undefined) {
      qb.skip(options.skip);
    }
    if (options.take !== undefined) {
      qb.take(options.take);
    }

    return qb.getManyAndCount();
  }
}
