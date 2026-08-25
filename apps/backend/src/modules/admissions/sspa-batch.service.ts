import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SspaBatch,
  SspaBatchStatus,
  DEFAULT_SCORING_WEIGHTS,
} from './entities/sspa-batch.entity';
import {
  CreateSspaBatchDto,
  UpdateSspaBatchDto,
  SspaBatchQueryDto,
} from './dto/sspa-batch.dto';
import { AuditService } from '../audit/audit.service';

/**
 * SSPA 批次服务 — 管理每年度中一自行分配窗口（F-ADM-001）
 * @see SPEC-SYSTEM-DESIGN §19.5
 */
@Injectable()
export class SspaBatchService {
  constructor(
    @InjectRepository(SspaBatch)
    private readonly batchRepo: Repository<SspaBatch>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateSspaBatchDto, operatorId?: string): Promise<SspaBatch> {
    const existing = await this.batchRepo.findOne({
      where: { year: dto.year },
    });
    if (existing) {
      throw new BadRequestException(`年度 ${dto.year} 的 SSPA 批次已存在`);
    }

    const batch = this.batchRepo.create({
      year: dto.year,
      name: dto.name,
      scoringWeights: dto.scoringWeights ?? DEFAULT_SCORING_WEIGHTS,
      seats: dto.seats,
      openAt: dto.openAt ? new Date(dto.openAt) : undefined,
      interviewDate: dto.interviewDate ? new Date(dto.interviewDate) : undefined,
      announcementDate: dto.announcementDate
        ? new Date(dto.announcementDate)
        : undefined,
      status: SspaBatchStatus.DRAFT,
      createdBy: operatorId,
    });

    const saved = await this.batchRepo.save(batch);

    await this.auditService.log({
      action: 'sspa_batch_created',
      userId: operatorId,
      resourceType: 'sspa_batch',
      resourceId: saved.id,
      details: { year: saved.year, seats: saved.seats },
      description: `创建 SSPA 批次 ${saved.name} (${saved.year})`,
    });

    return saved;
  }

  async findAll(query: SspaBatchQueryDto): Promise<{
    total: number;
    page: number;
    pageSize: number;
    items: SspaBatch[];
  }> {
    const { year, status, page = 1, pageSize = 20 } = query;
    const qb = this.batchRepo.createQueryBuilder('batch');

    if (year) qb.andWhere('batch.year = :year', { year });
    if (status) qb.andWhere('batch.status = :status', { status });

    qb.orderBy('batch.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { total, page, pageSize, items };
  }

  async findOne(id: string): Promise<SspaBatch> {
    const batch = await this.batchRepo.findOne({
      where: { id },
      relations: { creator: true },
    });
    if (!batch) throw new NotFoundException(`SSPA 批次 ${id} 不存在`);
    return batch;
  }

  async update(
    id: string,
    dto: UpdateSspaBatchDto,
    operatorId?: string,
  ): Promise<SspaBatch> {
    const batch = await this.findOne(id);
    if (batch.status === SspaBatchStatus.ARCHIVED) {
      throw new BadRequestException('已归档批次不可修改');
    }

    Object.assign(batch, {
      name: dto.name ?? batch.name,
      scoringWeights: dto.scoringWeights ?? batch.scoringWeights,
      seats: dto.seats ?? batch.seats,
      openAt: dto.openAt ? new Date(dto.openAt) : batch.openAt,
      interviewDate: dto.interviewDate
        ? new Date(dto.interviewDate)
        : batch.interviewDate,
      announcementDate: dto.announcementDate
        ? new Date(dto.announcementDate)
        : batch.announcementDate,
    });

    const saved = await this.batchRepo.save(batch);

    await this.auditService.log({
      action: 'sspa_batch_created',
      userId: operatorId,
      resourceType: 'sspa_batch',
      resourceId: saved.id,
      details: { updated: true },
      description: `更新 SSPA 批次 ${saved.name}`,
    });

    return saved;
  }

  /** 发布批次为开放申请状态 */
  async open(id: string, operatorId?: string): Promise<SspaBatch> {
    const batch = await this.findOne(id);
    if (batch.status !== SspaBatchStatus.DRAFT) {
      throw new BadRequestException('仅草稿批次可开放申请');
    }
    batch.status = SspaBatchStatus.OPEN;
    return this.batchRepo.save(batch);
  }
}
