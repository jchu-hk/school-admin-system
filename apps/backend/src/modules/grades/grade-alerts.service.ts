import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradeAuditAlert, AlertStatus } from './grade-audit-alert.entity';
import {
  QueryAlertsDto,
  AcknowledgeAlertDto,
  UpdateAlertStatusDto,
} from './dto/grade-alert.dto';

@Injectable()
export class GradeAlertsService {
  constructor(
    @InjectRepository(GradeAuditAlert)
    private readonly alertRepository: Repository<GradeAuditAlert>,
  ) {}

  async findAll(query: QueryAlertsDto) {
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '10');

    const qb = this.alertRepository
      .createQueryBuilder('ga')
      .leftJoinAndSelect('ga.teacher', 't')
      .leftJoinAndSelect('ga.gradeRecord', 'gr')
      .leftJoinAndSelect('ga.gradeReview', 'grev');

    if (query.type) qb.andWhere('ga.type = :type', { type: query.type });
    if (query.severity)
      qb.andWhere('ga.severity = :severity', { severity: query.severity });
    if (query.status)
      qb.andWhere('ga.status = :status', { status: query.status });
    if (query.teacherId)
      qb.andWhere('ga.teacherId = :teacherId', { teacherId: query.teacherId });

    qb.orderBy('ga.createdAt', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async findOne(id: string): Promise<GradeAuditAlert> {
    const alert = await this.alertRepository.findOne({
      where: { id },
      relations: [
        'teacher',
        'gradeRecord',
        'gradeReview',
        'acknowledgedByUser',
      ],
    });
    if (!alert) throw new Error('Alert not found');
    return alert;
  }

  async acknowledge(
    id: string,
    dto: AcknowledgeAlertDto,
    userId: string,
  ): Promise<GradeAuditAlert> {
    const alert = await this.findOne(id);

    if (alert.status !== AlertStatus.OPEN) {
      throw new Error('Only open alerts can be acknowledged');
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();
    alert.acknowledgementComment = dto.comment || '';

    return this.alertRepository.save(alert);
  }

  async updateStatus(
    id: string,
    dto: UpdateAlertStatusDto,
    userId: string,
  ): Promise<GradeAuditAlert> {
    const alert = await this.findOne(id);

    alert.status = dto.status;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    if (dto.comment) {
      alert.acknowledgementComment = dto.comment;
    }

    return this.alertRepository.save(alert);
  }

  async getOpenAlertsCount(_userId: string): Promise<number> {
    // TODO: 根据用户角色筛选
    return this.alertRepository.count({ where: { status: AlertStatus.OPEN } });
  }
}
