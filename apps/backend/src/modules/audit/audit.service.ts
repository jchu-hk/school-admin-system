import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

export interface AuditLogOptions {
  userId?: string;
  action: AuditAction | string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  description?: string;
  ip?: string;
  requestParams?: any;
  responseStatus?: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    action: AuditAction | AuditLogOptions,
    operatorId?: string,
    description?: string,
    ip?: string,
    requestParams?: any,
    responseStatus?: number,
  ): Promise<AuditLog> {
    // Support both old API: log(action, operatorId, description, ip, params, status)
    // and new API: log({ action, userId, resourceType, resourceId, details, ... })
    let opts: AuditLogOptions;
    if (typeof action === 'object' && action !== null && 'action' in action) {
      opts = action as AuditLogOptions;
    } else {
      opts = {
        action: action as AuditAction,
        userId: operatorId,
        description,
        ip,
        requestParams,
        responseStatus,
      };
    }

    const log = this.auditLogRepository.create({
      operatorId: opts.userId,
      action: opts.action as AuditAction,
      resourceType: opts.resourceType,
      resourceId: opts.resourceId,
      details: opts.details,
      description: opts.description,
      ip: opts.ip,
      requestParams: opts.requestParams,
      responseStatus: opts.responseStatus,
    });
    return this.auditLogRepository.save(log) as any;
  }
}
