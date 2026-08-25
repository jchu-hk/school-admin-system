import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DseExamBatch, DseBatchStatus } from './entities/dse-exam-batch.entity';
import { DseSubject, DseSubjectCategory } from './entities/dse-subject.entity';
import {
  DseRegistration,
  DseRegistrationStatus,
} from './entities/dse-registration.entity';
import {
  CreateDseBatchDto,
  UpdateDseBatchDto,
  QueryDseBatchDto,
  SubmitBatchDto,
  CreateRegistrationDto,
  UpdateRegistrationDto,
  QueryRegistrationDto,
  WithdrawRegistrationDto,
  SubmitRegistrationDto,
  SubjectSelectionDto,
} from './dto/dse-enrollment.dto';

/** 核心科目代码（Category A 核心：中文/英文/数学/公民与社会） */
const CORE_SUBJECT_CODES = ['CN', 'EN', 'MA', 'CS'];

@Injectable()
export class DseEnrollmentService {
  private readonly logger = new Logger(DseEnrollmentService.name);

  constructor(
    @InjectRepository(DseExamBatch)
    private readonly batchRepo: Repository<DseExamBatch>,
    @InjectRepository(DseSubject)
    private readonly subjectRepo: Repository<DseSubject>,
    @InjectRepository(DseRegistration)
    private readonly registrationRepo: Repository<DseRegistration>,
  ) {}

  // ==================== 报考批次 ====================

  async createBatch(dto: CreateDseBatchDto, userId?: string): Promise<DseExamBatch> {
    const existing = await this.batchRepo.findOne({
      where: { batchCode: dto.batchCode },
    });
    if (existing) {
      throw new ConflictException(`批次编码 ${dto.batchCode} 已存在`);
    }
    const openAt = new Date(dto.openAt);
    const closeAt = new Date(dto.closeAt);
    if (openAt >= closeAt) {
      throw new BadRequestException('报名截止时间必须在开放时间之后');
    }
    const batch = this.batchRepo.create({
      academicYear: dto.academicYear,
      batchCode: dto.batchCode,
      name: dto.name,
      openAt,
      closeAt,
      lateFeePerSubject: dto.lateFeePerSubject ?? 560,
      minSubjects: dto.minSubjects ?? 6,
      maxSubjects: dto.maxSubjects ?? 8,
      requireDeclaration: dto.requireDeclaration ?? true,
      requirePhoto: dto.requirePhoto ?? true,
      status: DseBatchStatus.DRAFT,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.batchRepo.save(batch);
  }

  async findAllBatches(query: QueryDseBatchDto): Promise<DseExamBatch[]> {
    const where: Record<string, unknown> = {};
    if (query.academicYear) where.academicYear = query.academicYear;
    if (query.status) where.status = query.status;
    return this.batchRepo.find({
      where,
      order: { academicYear: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOneBatch(id: string): Promise<DseExamBatch> {
    const batch = await this.batchRepo.findOne({ where: { id } });
    if (!batch) throw new NotFoundException(`报考批次 ${id} 不存在`);
    return batch;
  }

  async updateBatch(
    id: string,
    dto: UpdateDseBatchDto,
    userId?: string,
  ): Promise<DseExamBatch> {
    const batch = await this.findOneBatch(id);
    if (batch.status !== DseBatchStatus.DRAFT) {
      throw new BadRequestException('仅 DRAFT 状态的批次可修改字段');
    }
    if (dto.openAt && dto.closeAt) {
      if (new Date(dto.openAt) >= new Date(dto.closeAt)) {
        throw new BadRequestException('报名截止时间必须在开放时间之后');
      }
    }
    Object.assign(batch, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.openAt !== undefined ? { openAt: new Date(dto.openAt) } : {}),
      ...(dto.closeAt !== undefined ? { closeAt: new Date(dto.closeAt) } : {}),
      ...(dto.lateFeePerSubject !== undefined
        ? { lateFeePerSubject: dto.lateFeePerSubject }
        : {}),
      ...(dto.minSubjects !== undefined ? { minSubjects: dto.minSubjects } : {}),
      ...(dto.maxSubjects !== undefined ? { maxSubjects: dto.maxSubjects } : {}),
      ...(dto.requireDeclaration !== undefined
        ? { requireDeclaration: dto.requireDeclaration }
        : {}),
      ...(dto.requirePhoto !== undefined ? { requirePhoto: dto.requirePhoto } : {}),
      updatedBy: userId,
    });
    return this.batchRepo.save(batch);
  }

  async openBatch(id: string, userId?: string): Promise<DseExamBatch> {
    const batch = await this.findOneBatch(id);
    if (batch.status !== DseBatchStatus.DRAFT) {
      throw new BadRequestException(`仅 DRAFT 状态的批次可开放，当前 ${batch.status}`);
    }
    batch.status = DseBatchStatus.OPEN;
    batch.updatedBy = userId;
    return this.batchRepo.save(batch);
  }

  async closeBatch(id: string, userId?: string): Promise<DseExamBatch> {
    const batch = await this.findOneBatch(id);
    if (![DseBatchStatus.OPEN, DseBatchStatus.ONGOING].includes(batch.status)) {
      throw new BadRequestException(`仅 OPEN/ONGOING 状态可截止，当前 ${batch.status}`);
    }
    batch.status = DseBatchStatus.CLOSED;
    batch.updatedBy = userId;
    return this.batchRepo.save(batch);
  }

  async submitBatch(id: string, dto: SubmitBatchDto, userId?: string): Promise<DseExamBatch> {
    const batch = await this.findOneBatch(id);
    if (batch.status !== DseBatchStatus.CLOSED) {
      throw new BadRequestException(`仅 CLOSED 状态的批次可提交 HKEAA，当前 ${batch.status}`);
    }
    batch.status = DseBatchStatus.SUBMITTED;
    batch.submittedAt = new Date();
    if (dto.hkeaaRef !== undefined) batch.hkeaaRef = dto.hkeaaRef;
    batch.updatedBy = userId;
    return this.batchRepo.save(batch);
  }

  async confirmBatch(id: string, dto: SubmitBatchDto, userId?: string): Promise<DseExamBatch> {
    const batch = await this.findOneBatch(id);
    if (batch.status !== DseBatchStatus.SUBMITTED) {
      throw new BadRequestException(
        `仅 SUBMITTED 状态的批次可由 HKEAA 确认，当前 ${batch.status}`,
      );
    }
    batch.status = DseBatchStatus.CONFIRMED;
    batch.confirmedAt = new Date();
    if (dto.hkeaaRef !== undefined) batch.hkeaaRef = dto.hkeaaRef;
    batch.updatedBy = userId;
    return this.batchRepo.save(batch);
  }

  async cancelBatch(id: string, userId?: string): Promise<DseExamBatch> {
    const batch = await this.findOneBatch(id);
    if (
      batch.status === DseBatchStatus.SUBMITTED ||
      batch.status === DseBatchStatus.CONFIRMED
    ) {
      throw new BadRequestException('已提交/已确认的批次不可取消');
    }
    batch.status = DseBatchStatus.CANCELLED;
    batch.updatedBy = userId;
    return this.batchRepo.save(batch);
  }

  // ==================== 报考科目字典 ====================

  async listSubjects(): Promise<DseSubject[]> {
    return this.subjectRepo.find({
      where: { isActive: true },
      order: { isCore: 'DESC', category: 'ASC', subjectCode: 'ASC' },
    });
  }

  async getSubjectsByCodes(codes: string[]): Promise<DseSubject[]> {
    return this.subjectRepo.find({
      where: { subjectCode: In(codes), isActive: true },
    });
  }

  // ==================== 报考记录 ====================

  async createRegistration(
    dto: CreateRegistrationDto,
    userId?: string,
  ): Promise<DseRegistration> {
    const batch = await this.findOneBatch(dto.batchId);
    if (batch.status === DseBatchStatus.DRAFT) {
      throw new BadRequestException('报考批次未开放');
    }

    // 同一批次同一学生唯一
    const dup = await this.registrationRepo.findOne({
      where: { batchId: dto.batchId, studentId: dto.studentId },
    });
    if (dup) {
      throw new ConflictException('该学生在当前批次已存在报考记录');
    }

    const selections = await this.buildSelections(dto.subjectSelections);
    this.validateSelections(selections, batch);

    const isLate = new Date() > new Date(batch.closeAt);
    const lateFeeTotal = isLate
      ? selections.length * Number(batch.lateFeePerSubject)
      : 0;

    // 特别安排标记（衔接 F-EXAM-003）
    const hasSpecialNeeds =
      (dto.specialArrangements && Object.keys(dto.specialArrangements).length > 0) ||
      (dto.specialArrangementIds && dto.specialArrangementIds.length > 0);
    if (hasSpecialNeeds && !dto.photoUrl) {
      throw new BadRequestException(
        '涉及特别安排须上传医疗/SEN 报告（photoUrl）方可标记',
      );
    }

    const registrationId = this.generateRegistrationId(batch.academicYear);

    const registration = this.registrationRepo.create({
      batchId: dto.batchId,
      studentId: dto.studentId,
      registrationId,
      studentNo: dto.studentNo || '',
      hkdseNo: dto.hkdseNo,
      subjectSelections: selections,
      totalSubjects: selections.length,
      specialArrangements: dto.specialArrangements || {},
      hasSpecialNeeds,
      declarationSigned: dto.declarationSigned || false,
      photoUrl: dto.photoUrl,
      isLate,
      lateFeeTotal,
      // 逾期报考记 LATE；否则资料齐全记 PREPARED，否则 DRAFT
      status: isLate
        ? DseRegistrationStatus.LATE
        : this.isReadyToSubmit(dto.declarationSigned)
          ? DseRegistrationStatus.PREPARED
          : DseRegistrationStatus.DRAFT,
      createdBy: userId,
      updatedBy: userId,
    });
    this.logger.log(`创建报考记录 ${registrationId}（科目 ${selections.length}）`);
    return this.registrationRepo.save(registration);
  }

  async findAllRegistrations(query: QueryRegistrationDto) {
    const where: Record<string, unknown> = {};
    if (query.batchId) where.batchId = query.batchId;
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status;
    const [items, total] = await this.registrationRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: query.offset ?? 0,
      take: query.limit ?? 50,
    });
    return { items, total };
  }

  async findOneRegistration(id: string): Promise<DseRegistration> {
    const reg = await this.registrationRepo.findOne({ where: { id } });
    if (!reg) throw new NotFoundException(`报考记录 ${id} 不存在`);
    return reg;
  }

  async updateRegistration(
    id: string,
    dto: UpdateRegistrationDto,
    userId?: string,
  ): Promise<DseRegistration> {
    const reg = await this.findOneRegistration(id);
    if (
      ![DseRegistrationStatus.DRAFT, DseRegistrationStatus.PREPARED].includes(
        reg.status,
      )
    ) {
      throw new BadRequestException(
        `仅 DRAFT/PREPARED 状态的报考记录可修改，当前 ${reg.status}`,
      );
    }
    const batch = await this.findOneBatch(reg.batchId);

    let selections = reg.subjectSelections;
    if (dto.subjectSelections !== undefined) {
      selections = await this.buildSelections(dto.subjectSelections);
      this.validateSelections(selections, batch);
    }

    const declarationSigned =
      dto.declarationSigned !== undefined
        ? dto.declarationSigned
        : reg.declarationSigned;
    const isLate = new Date() > new Date(batch.closeAt);
    const lateFeeTotal = isLate
      ? selections.length * Number(batch.lateFeePerSubject)
      : reg.lateFeeTotal;

    Object.assign(reg, {
      ...(dto.studentNo !== undefined ? { studentNo: dto.studentNo } : {}),
      ...(dto.hkdseNo !== undefined ? { hkdseNo: dto.hkdseNo } : {}),
      subjectSelections: selections,
      totalSubjects: selections.length,
      declarationSigned,
      ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
      ...(dto.specialArrangements !== undefined
        ? { specialArrangements: dto.specialArrangements }
        : {}),
      isLate,
      lateFeeTotal,
      status: this.isReadyToSubmit(declarationSigned)
        ? DseRegistrationStatus.PREPARED
        : DseRegistrationStatus.DRAFT,
      updatedBy: userId,
    });
    return this.registrationRepo.save(reg);
  }

  async submitRegistration(
    id: string,
    dto: SubmitRegistrationDto,
    userId?: string,
  ): Promise<DseRegistration> {
    const reg = await this.findOneRegistration(id);
    if (reg.status === DseRegistrationStatus.SUBMITTED) {
      throw new BadRequestException('报考已提交 HKEAA');
    }
    const batch = await this.findOneBatch(reg.batchId);
    if (batch.status === DseBatchStatus.SUBMITTED || batch.status === DseBatchStatus.CONFIRMED) {
      throw new BadRequestException('批次已提交 HKEAA，无法再提交报考');
    }

    const isLate = new Date() > new Date(batch.closeAt);
    if (isLate && reg.status !== DseRegistrationStatus.LATE) {
      const lateFeeTotal =
        reg.totalSubjects * Number(batch.lateFeePerSubject);
      reg.isLate = true;
      reg.lateFeeTotal = lateFeeTotal;
    }

    if (batch.requirePhoto && !reg.photoUrl && !dto.photoUrl) {
      throw new BadRequestException('批次要求报名照，请上传 photoUrl');
    }
    if (batch.requireDeclaration && !reg.declarationSigned) {
      throw new BadRequestException('须签署声明书（declarationSigned=true）方可提交');
    }

    reg.status = isLate
      ? DseRegistrationStatus.LATE
      : DseRegistrationStatus.SUBMITTED;
    if (dto.photoUrl) reg.photoUrl = dto.photoUrl;
    reg.submittedAt = new Date();
    reg.updatedBy = userId;
    return this.registrationRepo.save(reg);
  }

  async withdrawRegistration(
    id: string,
    dto: WithdrawRegistrationDto,
    userId?: string,
  ): Promise<DseRegistration> {
    const reg = await this.findOneRegistration(id);
    const batch = await this.findOneBatch(reg.batchId);
    const afterClose = new Date() > new Date(batch.closeAt);
    if (afterClose && !dto.medicalProofUrl) {
      throw new BadRequestException('截止后退选须提供医疗证明（medicalProofUrl）');
    }
    if (reg.status === DseRegistrationStatus.SUBMITTED || reg.status === DseRegistrationStatus.HKEAA_CONFIRMED) {
      throw new BadRequestException('已提交/确认的报考记录不可退选');
    }
    reg.status = DseRegistrationStatus.WITHDRAWN;
    reg.withdrawReason = dto.reason;
    reg.updatedBy = userId;
    return this.registrationRepo.save(reg);
  }

  async cancelRegistration(id: string, userId?: string): Promise<DseRegistration> {
    const reg = await this.findOneRegistration(id);
    if (reg.status === DseRegistrationStatus.SUBMITTED || reg.status === DseRegistrationStatus.HKEAA_CONFIRMED) {
      throw new BadRequestException('已提交/确认的报考记录不可取消');
    }
    reg.status = DseRegistrationStatus.CANCELLED;
    reg.updatedBy = userId;
    return this.registrationRepo.save(reg);
  }

  async hkeaaConfirmRegistration(id: string, userId?: string): Promise<DseRegistration> {
    const reg = await this.findOneRegistration(id);
    if (reg.status !== DseRegistrationStatus.SUBMITTED && reg.status !== DseRegistrationStatus.LATE) {
      throw new BadRequestException(
        `仅 SUBMITTED/LATE 记录可由 HKEAA 确认，当前 ${reg.status}`,
      );
    }
    reg.status = DseRegistrationStatus.HKEAA_CONFIRMED;
    reg.confirmedAt = new Date();
    reg.updatedBy = userId;
    return this.registrationRepo.save(reg);
  }

  // ==================== 私有辅助 ====================

  /** 将 DTO 科目选择编码为 subject_selections 元素（含科目字典信息） */
  private async buildSelections(
    selections: SubjectSelectionDto[],
  ): Promise<Array<Record<string, unknown>>> {
    const codes = selections.map((s) => s.subjectCode);
    if (codes.length === 0) {
      throw new BadRequestException('至少选择 1 科');
    }
    const distinctCodes = Array.from(new Set(codes));
    if (distinctCodes.length !== codes.length) {
      throw new BadRequestException('所选科目存在重复');
    }
    const subjects = await this.getSubjectsByCodes(distinctCodes);
    if (subjects.length !== distinctCodes.length) {
      throw new BadRequestException('存在无效或未启用的科目代码');
    }
    const subjectMap = new Map(subjects.map((s) => [s.subjectCode, s]));
    return selections.map((sel) => {
      const subj = subjectMap.get(sel.subjectCode);
      return {
        subject_code: subj.subjectCode,
        subject_name: `${subj.subjectNameZh} (${subj.subjectNameEn})`,
        category: subj.category,
        language: subj.language || null,
        is_core: subj.isCore,
        status: 'registered',
        seat_no: null,
      };
    });
  }

  /**
   * 校验规则：
   * - 科目总数 >= minSubjects 且 <= maxSubjects（默认 6~8）
   * - Category A 核心（中文/英文/数学/公民与社会）4 科必须全部包含
   */
  private validateSelections(
    selections: Array<Record<string, unknown>>,
    batch: DseExamBatch,
  ): void {
    if (selections.length < batch.minSubjects) {
      throw new BadRequestException(
        { code: 'MIN_SUBJECTS_NOT_MET', message: '科目数量不足' },
        '科目数量不足',
      );
    }
    if (selections.length > batch.maxSubjects) {
      throw new BadRequestException(
        { code: 'MAX_SUBJECTS_EXCEEDED', message: '科目数量超限' },
        '科目数量超限',
      );
    }
    const selectedCodes = selections.map((s) =>
      String(s['subject_code']),
    );
    const missingCores = CORE_SUBJECT_CODES.filter((c) => !selectedCodes.includes(c));
    if (missingCores.length > 0) {
      throw new BadRequestException(
        { code: 'CORE_MISSING', message: '缺少核心科目', missing: missingCores },
        '缺少核心科目',
      );
    }
  }

  private isReadyToSubmit(declarationSigned: boolean): boolean {
    return declarationSigned === true;
  }

  /** 生成报考编号：DSE-<学年起始年>-<6位序列> */
  private generateRegistrationId(academicYear: string): string {
    const year = academicYear.split('-')[0] || '2026';
    const seq = String(Date.now() % 1000000).padStart(6, '0');
    return `DSE-${year}-${seq}`;
  }
}
