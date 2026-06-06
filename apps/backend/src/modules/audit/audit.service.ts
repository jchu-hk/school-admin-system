import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    action: AuditAction,
    operatorId?: string,
    description?: string,
    ip?: string,
    requestParams?: any,
    responseStatus?: number,
  ): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      action,
      operatorId,
      description,
      ip,
      requestParams,
      responseStatus,
    });
    return this.auditLogRepository.save(log);
  }
}
