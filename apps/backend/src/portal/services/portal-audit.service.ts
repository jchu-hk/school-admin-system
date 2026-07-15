import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortalAuditLog, PortalAuditEventType } from '../entities/portal-audit-log.entity';

/**
 * 门户审计日志服务
 * 用于记录所有学生/家长门户操作记录
 */
@Injectable()
export class PortalAuditService {
  constructor(
    @InjectRepository(PortalAuditLog)
    private auditLogRepo: Repository<PortalAuditLog>,
  ) {}

  /**
   * 记录门户操作审计日志
   */
  async log(params: {
    eventType: PortalAuditEventType;
    actorId: string;
    actorRole: string;
    targetId?: string;
    targetType?: string;
    action: string;
    changes?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    result: string;
  }): Promise<PortalAuditLog> {
    const log = this.auditLogRepo.create({
      eventType: params.eventType,
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetId: params.targetId,
      targetType: params.targetType,
      action: params.action,
      changes: params.changes || null,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      result: params.result,
    });
    return this.auditLogRepo.save(log);
  }

  /**
   * 记录越权访问尝试
   */
  async logUnauthorizedAccess(params: {
    actorId: string;
    actorRole: string;
    targetType: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
  }): Promise<PortalAuditLog> {
    return this.log({
      eventType: PortalAuditEventType.UNAUTHORIZED_ACCESS,
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetType: params.targetType,
      action: params.action,
      changes: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      result: 'DENIED',
    });
  }
}
