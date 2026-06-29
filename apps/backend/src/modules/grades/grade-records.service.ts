import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { GradeRecord, RecordStatus } from './grade-record.entity';
import { GradeReview, ReviewAction, ReviewLevel } from './grade-review.entity';
import { GradeReview, ReviewAction, ReviewLevel } from './grade-review.entity';
import {
  GradeAuditAlert,
  AlertType,
  AlertSeverity,
  AlertStatus,
} from './grade-audit-alert.entity';
import {
  CreateGradeRecordDto,
  UpdateGradeRecordDto,
  SubmitGradeRecordDto,
  RevokeGradeRecordDto,
  ApproveGradeRecordDto,
  QueryGradeRecordsDto,
  ClassStatsDto,
} from './dto/grade-record.dto';

@Injectable()
export class GradeRecordsService {
  constructor(
    @InjectRepository(GradeRecord)
    private readonly gradeRecordRepository: Repository<GradeRecord>,
    @InjectRepository(GradeReview)
    private readonly gradeReviewRepository: Repository<GradeReview>,
    @InjectRepository(GradeAuditAlert)
    private readonly alertRepository: Repository<GradeAuditAlert>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateGradeRecordDto,
    _userId: string,
  ): Promise<GradeRecord> {
    const gradeRecord = this.gradeRecordRepository.create({
      ...dto,
      status: RecordStatus.DRAFT,
      submittedAt: null,
    });

    return this.gradeRecordRepository.save(gradeRecord);
  }

  async findAll(query: QueryGradeRecordsDto) {
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '10');

    const qb = this.gradeRecordRepository
      .createQueryBuilder('gr')
      .leftJoinAndSelect('gr.student', 's')
      .leftJoinAndSelect('gr.teacher', 't')
      .leftJoinAndSelect('gr.class', 'c');

    if (query.studentId)
      qb.andWhere('gr.studentId = :studentId', { studentId: query.studentId });
    if (query.teacherId)
      qb.andWhere('gr.teacherId = :teacherId', { teacherId: query.teacherId });
    if (query.classId)
      qb.andWhere('gr.classId = :classId', { classId: query.classId });
    if (query.academicYear)
      qb.andWhere('gr.academicYear = :academicYear', {
        academicYear: query.academicYear,
      });
    if (query.term) qb.andWhere('gr.term = :term', { term: query.term });
    if (query.status)
      qb.andWhere('gr.status = :status', { status: query.status });
    if (query.examName)
      qb.andWhere('gr.examName ILIKE :examName', {
        examName: `%${query.examName}%`,
      });

    qb.orderBy('gr.createdAt', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total, page, pageSize };
  }

  async findOne(id: string): Promise<GradeRecord> {
    const record = await this.gradeRecordRepository.findOne({
      where: { id },
      relations: ['student', 'teacher', 'class', 'approver', 'revoker'],
    });
    if (!record) throw new NotFoundException('Grade record not found');
    return record;
  }

  async update(id: string, dto: UpdateGradeRecordDto): Promise<GradeRecord> {
    const record = await this.findOne(id);

    // 只能修改草稿状态
    if (record.status !== RecordStatus.DRAFT) {
      throw new BadRequestException('Can only update draft records');
    }

    Object.assign(record, dto);
    return this.gradeRecordRepository.save(record);
  }

  async submit(
    id: string,
    dto: SubmitGradeRecordDto,
    userId: string,
  ): Promise<GradeRecord> {
    const record = await this.findOne(id);

    // 检查是否可以提交
    if (record.status !== RecordStatus.DRAFT) {
      throw new BadRequestException('Only draft records can be submitted');
    }

    if (record.teacherId !== userId) {
      throw new ForbiddenException(
        'Only the teacher who created the record can submit it',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // 更新记录状态
      record.status = RecordStatus.PENDING_APPROVAL;
      record.submittedAt = new Date();
      // 设置可撤回截止时间（48小时后）
      record.canRevokeUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await manager.save(record);

      // 记录审核历史
      const review = manager.create(GradeReview, {
        gradeRecordId: record.id,
        reviewerId: userId,
        action: ReviewAction.SUBMIT,
        level: ReviewLevel.TEACHER,
        comment: dto.reason || 'Submitted for approval',
        previousData: { status: RecordStatus.DRAFT },
        newData: { status: RecordStatus.PENDING_APPROVAL },
      });
      await manager.save(review);

      return record;
    });
  }

  async revoke(
    id: string,
    dto: RevokeGradeRecordDto,
    userId: string,
  ): Promise<GradeRecord> {
    const record = await this.findOne(id);

    // 检查撤回条件
    if (record.status !== RecordStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Only pending approval records can be revoked',
      );
    }

    if (record.teacherId !== userId) {
      throw new ForbiddenException(
        'Only the teacher who created the record can revoke it',
      );
    }

    if (!record.canRevokeUntil || new Date() > record.canRevokeUntil) {
      throw new BadRequestException('Revoke period has expired (48 hours)');
    }

    return this.dataSource.transaction(async (manager) => {
      // 记录撤回前的数据
      const previousData = JSON.parse(JSON.stringify(record));

      // 更新记录状态
      record.status = RecordStatus.DRAFT;
      record.revokedAt = new Date();
      record.revokedBy = userId;
      record.revokedReason = dto.reason;
      record.submittedAt = null;
      record.canRevokeUntil = null;
      await manager.save(record);

      // 记录审核历史
      const review = manager.create(GradeReview, {
        gradeRecordId: record.id,
        reviewerId: userId,
        action: ReviewAction.REVOKE,
        level: ReviewLevel.TEACHER,
        comment: `Revoked: ${dto.reason}`,
        previousData,
        newData: { status: RecordStatus.DRAFT },
      });
      await manager.save(review);

      // 创建审计告警
      const alert = manager.create(GradeAuditAlert, {
        gradeRecordId: record.id,
        gradeReviewId: review.id,
        type: AlertType.GRADE_REVOKED,
        severity: AlertSeverity.HIGH,
        status: AlertStatus.OPEN,
        message: `教师 ${record.teacher.name || userId} 在审批前撤回了学生 ${record.student.name || record.studentId} 的成绩记录`,
        teacherId: userId,
        notifiedUserIds: [], // 待定：需要查询校务主任列表
        metadata: {
          originalScore: record.overallScore,
          revokeReason: dto.reason,
          revokeTime: record.revokedAt,
        },
      });
      await manager.save(alert);

      return record;
    });
  }

  async approve(
    id: string,
    dto: ApproveGradeRecordDto,
    userId: string,
  ): Promise<GradeRecord> {
    const record = await this.findOne(id);

    if (record.status !== RecordStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Only pending approval records can be approved',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // 确定审批级别
      const currentLevel = record.approvalLevel;
      const nextLevel = currentLevel + 1;

      // 更新记录
      record.approvalLevel = nextLevel;
      record.approvedBy = userId;
      record.approvedAt = new Date();
      record.approvalComment = dto.comment;

      // 根据审批级别决定最终状态
      if (nextLevel >= ReviewLevel.PRINCIPAL) {
        record.status = RecordStatus.APPROVED;
      }

      await manager.save(record);

      // 记录审核历史
      const review = manager.create(GradeReview, {
        gradeRecordId: record.id,
        reviewerId: userId,
        action: ReviewAction.APPROVE,
        level: nextLevel,
        comment: dto.comment,
        previousData: {
          approvalLevel: currentLevel,
          status: RecordStatus.PENDING_APPROVAL,
        },
        newData: { approvalLevel: nextLevel, status: record.status },
      });
      await manager.save(review);

      return record;
    });
  }

  async reject(
    id: string,
    dto: ApproveGradeRecordDto,
    userId: string,
  ): Promise<GradeRecord> {
    const record = await this.findOne(id);

    if (record.status !== RecordStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Only pending approval records can be rejected',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // 更新记录状态
      record.status = RecordStatus.REJECTED;
      record.approvedBy = userId;
      record.approvedAt = new Date();
      record.approvalComment = dto.comment;

      await manager.save(record);

      // 记录审核历史
      const review = manager.create(GradeReview, {
        gradeRecordId: record.id,
        reviewerId: userId,
        action: ReviewAction.REJECT,
        level: record.approvalLevel + 1,
        comment: dto.comment,
        previousData: { status: RecordStatus.PENDING_APPROVAL },
        newData: { status: RecordStatus.REJECTED },
      });
      await manager.save(review);

      return record;
    });
  }

  async getClassStats(dto: ClassStatsDto) {
    const records = await this.gradeRecordRepository.find({
      where: {
        classId: dto.classId,
        academicYear: dto.academicYear,
        term: dto.term,
        examName: dto.examName,
        status: RecordStatus.APPROVED,
      },
      relations: ['student'],
    });

    if (records.length === 0) {
      return {
        totalStudents: 0,
        scoreDistribution: [],
        gradeDistribution: {},
        classAverage: 0,
        gradeAverage: 0,
      };
    }

    // 计算总分分布
    const scores = records.map((r) => r.overallScore);
    const distribution = [
      { range: '90-100', count: scores.filter((s) => s >= 90).length },
      { range: '80-89', count: scores.filter((s) => s >= 80 && s < 90).length },
      { range: '70-79', count: scores.filter((s) => s >= 70 && s < 80).length },
      { range: '60-69', count: scores.filter((s) => s >= 60 && s < 70).length },
      { range: '0-59', count: scores.filter((s) => s < 60).length },
    ];

    // 计算等级分布
    const gradeDistribution: Record<string, number> = {};
    records.forEach((record) => {
      record.subjects.forEach((subject) => {
        const grade = subject.grade;
        gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
      });
    });

    // 计算平均分
    const classAverage = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    // 计算年级平均分（简化版，实际需要查询所有班级）
    const gradeAverage = classAverage; // TODO: 从数据库计算全年级平均

    return {
      totalStudents: records.length,
      scoreDistribution: distribution,
      gradeDistribution,
      classAverage: Number(classAverage.toFixed(2)),
      gradeAverage: Number(gradeAverage.toFixed(2)),
      students: records.map((r) => ({
        id: r.student.id,
        name: r.student.name,
        overallScore: r.overallScore,
        classRank: r.classRank,
        gradeRank: r.gradeRank,
      })),
    };
  }

  async getStudentHistory(studentId: string, academicYear?: string) {
    const qb = this.gradeRecordRepository
      .createQueryBuilder('gr')
      .leftJoinAndSelect('gr.teacher', 't')
      .leftJoinAndSelect('gr.class', 'c')
      .where('gr.studentId = :studentId', { studentId })
      .andWhere('gr.status = :status', { status: RecordStatus.APPROVED })
      .orderBy('gr.academicYear', 'DESC')
      .addOrderBy('gr.term', 'DESC');

    if (academicYear) {
      qb.andWhere('gr.academicYear = :academicYear', { academicYear });
    }

    return qb.getMany();
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);

    // 只能删除草稿状态
    if (record.status !== RecordStatus.DRAFT) {
      throw new BadRequestException('Can only delete draft records');
    }

    await this.gradeRecordRepository.delete(id);
  }
}
