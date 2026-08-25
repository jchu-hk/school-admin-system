import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull, Or } from 'typeorm';
import {
  ConsentRecord,
  ConsentType,
  ConsentStatus,
  ConsentGranter,
  ConsentChannel,
} from '../entities/consent-record.entity';
import { CreateConsentDto } from '../dto/consent.dto';
import { User } from '../../user/user.entity';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-log.entity';

/**
 * F-COMP-001 同意管理。
 * 记录资料当事人对个人资料处理/共享/通知等的同意、撤回与过期状态（含版本追溯）。
 * 每次「撤回」产生新的 consent_records（status=revoked），保留历史签署证据链。
 */
@Injectable()
export class ConsentService {
  constructor(
    @InjectRepository(ConsentRecord)
    private readonly consentRepository: Repository<ConsentRecord>,
    private readonly auditService: AuditService,
  ) {}

  async grant(user: User, dto: CreateConsentDto, schoolId: string) {
    const subjectId = dto.subjectId ?? user.id;
    const last = await this.consentRepository.findOne({
      where: {
        subjectId,
        consentType: dto.consentType,
        status: ConsentStatus.GRANTED,
      },
      order: { version: 'DESC' },
    });
    const nextVersion = (last?.version ?? 0) + 1;
    const grantedAt = new Date();

    const entity = this.consentRepository.create({
      subjectId,
      consentType: dto.consentType,
      status: ConsentStatus.GRANTED,
      granter: dto.granter ?? ConsentGranter.SELF,
      channel: dto.channel ?? ConsentChannel.PORTAL,
      grantedAt,
      expiresAt: dto.expiresAt ?? null,
      version: nextVersion,
      studentId: dto.studentId ?? null,
      consentText: dto.consentText ?? null,
      recordedById: user.id,
      schoolId,
    });
    const saved = await this.consentRepository.save(entity);

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.CONSENT_GRANTED as any,
      resourceType: 'consent_record',
      resourceId: saved.id,
      description: `同意授予: ${dto.consentType} subject=${subjectId} v${nextVersion}`,
      details: { consentType: dto.consentType, version: nextVersion },
    });
    return saved;
  }

  /** 撤回同意（对当前有效 GRANTED 记录置 revoked，写审计） */
  async revoke(id: string, user: User) {
    const rec = await this.consentRepository.findOne({ where: { id } });
    if (!rec) throw new NotFoundException({ code: 'CONSENT_NOT_FOUND', message: '同意记录不存在' });
    if (rec.status !== ConsentStatus.GRANTED) {
      throw new BadRequestException({
        code: 'CONSENT_NOT_ACTIVE',
        message: '仅有效（granted）的同意记录可被撤回',
      });
    }
    rec.status = ConsentStatus.REVOKED;
    rec.revokedAt = new Date();
    await this.consentRepository.save(rec);

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.CONSENT_REVOKED as any,
      resourceType: 'consent_record',
      resourceId: rec.id,
      description: `同意撤回: ${rec.consentType} subject=${rec.subjectId}`,
    });
    return rec;
  }

  /** 标记过期（保留期/有效期到了自动或批量执行） */
  async expire(id: string, user: User) {
    const rec = await this.consentRepository.findOne({ where: { id } });
    if (!rec) throw new NotFoundException({ code: 'CONSENT_NOT_FOUND', message: '同意记录不存在' });
    if (rec.status !== ConsentStatus.GRANTED) {
      throw new BadRequestException({
        code: 'CONSENT_NOT_ACTIVE',
        message: '仅有效（granted）的同意记录可过期',
      });
    }
    rec.status = ConsentStatus.EXPIRED;
    await this.consentRepository.save(rec);
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.CONSENT_EXPIRED as any,
      resourceType: 'consent_record',
      resourceId: rec.id,
      description: `同意过期: ${rec.consentType} subject=${rec.subjectId}`,
    });
    return rec;
  }

  async list(
    user: User,
    query: { consentType?: ConsentType; status?: ConsentStatus; page?: number; pageSize?: number },
  ) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const where: any = {};
    if (query.consentType) where.consentType = query.consentType;
    if (query.status) where.status = query.status;

    const [items, total] = await this.consentRepository.findAndCount({
      where,
      relations: ['subject'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  /** 查询某当事人在某类型下的当前有效同意（含未过期） */
  async currentEffective(subjectId: string, consentType: ConsentType) {
    return this.consentRepository.findOne({
      where: {
        subjectId,
        consentType,
        status: ConsentStatus.GRANTED,
        expiresAt: Or(IsNull(), MoreThan(new Date())),
      },
      order: { version: 'DESC' },
    });
  }
}
