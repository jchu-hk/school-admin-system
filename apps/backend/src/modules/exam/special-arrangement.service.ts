import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import {
  SpecialExamArrangement,
  SpecialArrangementApproval,
  SpecialArrangementStatus,
  SpecialArrangementType,
  ApprovalAuthority,
  ApprovalAction,
} from './special-arrangement.entity';
import {
  CreateSpecialArrangementDto,
  ApproveArrangementDto,
  SpecialArrangementQueryDto,
} from './dto/special-arrangement.dto';

/**
 * 需要 HKEAA 审批的安排类型。
 * EXTRA_TIME/SEP_ROOM/SCRIBE/READER/BRAILLE 需 HKEAA；SEP_ROOM 另需学校级审批；WHEELCHAIR 仅需学校。
 * @see SPEC-SYSTEM-DESIGN §18.4 / SPEC-COMPLETE F-EXAM-003
 */
const HKEAA_REQUIRED_TYPES: SpecialArrangementType[] = [
  SpecialArrangementType.EXTRA_TIME,
  SpecialArrangementType.SEP_ROOM,
  SpecialArrangementType.SCRIBE,
  SpecialArrangementType.READER,
  SpecialArrangementType.BRAILLE,
];

/** HKEAA 与学校双审批的类型（需多级审批） */
const SCHOOL_AND_HKEAA_TYPES: SpecialArrangementType[] = [
  SpecialArrangementType.SEP_ROOM,
];

@Injectable()
export class SpecialArrangementService {
  constructor(
    @InjectRepository(SpecialExamArrangement)
    private readonly arrangementRepository: Repository<SpecialExamArrangement>,
    @InjectRepository(SpecialArrangementApproval)
    private readonly approvalRepository: Repository<SpecialArrangementApproval>,
  ) {}

  /** 生成安排单号 SEA-YYYY-S6-SUBJ-NNN */
  private async generateArrangementId(subject: string): Promise<string> {
    const year = new Date().getFullYear();
    const subjAbbr = subject
      .slice(0, 3)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') || 'SUB';
    const seq = await this.arrangementRepository.count() + 1;
    return `SEA-${year}-S6-${subjAbbr}-${String(seq).padStart(3, '0')}`;
  }

  /** 校验：需要 HKEAA 审批的类型必须标记 hkeaaApproved */
  private assertHkeaaApproval(
    arrangements: CreateSpecialArrangementDto['arrangements'],
    hkeaaApproved: boolean,
  ): void {
    const requiresHkeaa = arrangements.some((a) =>
      HKEAA_REQUIRED_TYPES.includes(a.type),
    );
    if (requiresHkeaa && !hkeaaApproved) {
      throw new UnprocessableEntityException({
        code: 'HKEAA_APPROVAL_REQUIRED',
        message: '涉及 HKEAA 审批的安排类型时，必须标记 HKEAA 审批',
      });
    }
  }

  /** 申请特别考试安排（创建后进入 DRAFT，可提交审批；亦可直接置 pending_approval） */
  async create(
    createDto: CreateSpecialArrangementDto,
    userId?: string,
  ): Promise<SpecialExamArrangement> {
    this.assertHkeaaApproval(createDto.arrangements, !!createDto.hkeaaApproved);

    const arrangement = this.arrangementRepository.create({
      ...createDto,
      arrangementId: await this.generateArrangementId(createDto.subject),
      examDate: createDto.examDate ? new Date(createDto.examDate) : null,
      status: SpecialArrangementStatus.DRAFT,
      createdBy: userId,
      arrangements: ((createDto.arrangements ?? []).map((a) => ({
        ...a,
      })) as unknown) as Array<Record<string, unknown>>,
    } as Partial<SpecialExamArrangement>);

    const saved = await this.arrangementRepository.save(arrangement);
    return saved;
  }

  /** 安排单列表（分页 + 筛选） */
  async findAll(query: SpecialArrangementQueryDto) {
    const {
      page = 1,
      pageSize = 10,
      subject,
      status,
      studentId,
      examId,
    } = query;

    const where: FindOptionsWhere<SpecialExamArrangement> = {};
    if (subject) where.subject = subject;
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (examId) where.examId = examId;

    const [data, total] = await this.arrangementRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  /** 安排单详情 */
  async findOne(id: string): Promise<SpecialExamArrangement> {
    const arrangement = await this.arrangementRepository.findOne({
      where: { id },
    });
    if (!arrangement) {
      throw new NotFoundException(`安排单 ID ${id} 不存在`);
    }
    return arrangement;
  }

  /** 安排单 + 审批记录 */
  async findWithApprovals(id: string) {
    const arrangement = await this.findOne(id);
    const approvals = await this.approvalRepository.find({
      where: { arrangementId: id },
      order: { approvalLevel: 'ASC', createdAt: 'ASC' },
    });
    return { ...arrangement, approvals };
  }

  /** 修改（仅 DRAFT / PENDING_APPROVAL 可改） */
  async update(id: string, updateDto: Partial<CreateSpecialArrangementDto>, userId?: string) {
    const arrangement = await this.findOne(id);
    if (
      arrangement.status !== SpecialArrangementStatus.DRAFT &&
      arrangement.status !== SpecialArrangementStatus.PENDING_APPROVAL &&
      arrangement.status !== SpecialArrangementStatus.REJECTED
    ) {
      throw new ConflictException({
        code: 'NOT_EDITABLE',
        message: '仅 DRAFT/PENDING_APPROVAL/REJECTED 状态的安排单可修改',
      });
    }

    if (updateDto.arrangements) {
      this.assertHkeaaApproval(
        updateDto.arrangements,
        updateDto.hkeaaApproved ?? arrangement.hkeaaApproved,
      );
    }

    const patch: Partial<SpecialExamArrangement> = { ...updateDto } as any;
    if (updateDto.examDate) patch.examDate = new Date(updateDto.examDate);
    if (updateDto.arrangements) patch.arrangements = updateDto.arrangements as any;
    if (updateDto.hkeaaApproved !== undefined) patch.hkeaaApproved = updateDto.hkeaaApproved;

    Object.assign(arrangement, patch);
    return this.arrangementRepository.save(arrangement);
  }

  /** 提交审批：DRAFT/REJECTED -> PENDING_APPROVAL */
  async submit(id: string): Promise<SpecialExamArrangement> {
    const arrangement = await this.findOne(id);
    if (
      arrangement.status !== SpecialArrangementStatus.DRAFT &&
      arrangement.status !== SpecialArrangementStatus.REJECTED
    ) {
      throw new ConflictException({
        code: 'INVALID_STATE',
        message: '仅 DRAFT/REJECTED 状态可提交审批',
      });
    }
    arrangement.status = SpecialArrangementStatus.PENDING_APPROVAL;
    return this.arrangementRepository.save(arrangement);
  }

  /** 审批通过（学校级 / HKEAA 多级） */
  async approve(id: string, dto: ApproveArrangementDto, userId?: string) {
    const arrangement = await this.findOne(id);
    if (arrangement.status !== SpecialArrangementStatus.PENDING_APPROVAL) {
      throw new ConflictException({
        code: 'INVALID_STATE',
        message: '仅 PENDING_APPROVAL 状态可审批',
      });
    }

    const approverType = dto.approverType ?? ApprovalAuthority.SCHOOL;
    const action = dto.action;
    const level = dto.approvalLevel ?? 1;

    // 记录审批步骤
    const approval = this.approvalRepository.create({
      arrangementId: id,
      approverType,
      approvalLevel: level,
      action,
      approvalRef: dto.approvalRef,
      approverId: approverType === ApprovalAuthority.SCHOOL ? userId : undefined,
      approvedAt: new Date(),
      comment: dto.comment,
    });
    await this.approvalRepository.save(approval);

    if (action === ApprovalAction.REJECT) {
      arrangement.status = SpecialArrangementStatus.REJECTED;
      return this.arrangementRepository.save(arrangement);
    }

    // APPROVE —— 判断是否所有所需审批均已到齐
    const requiresHkeaa = this.requiresHkeaa(arrangement);
    const requiresSchool = this.requiresSchool(arrangement);

    const approvals = await this.approvalRepository.find({
      where: { arrangementId: id },
    });
    const hasHkeaaApprove = approvals.some(
      (a) => a.approverType === ApprovalAuthority.HKEAA && a.action === ApprovalAction.APPROVE,
    );
    const hasSchoolApprove = approvals.some(
      (a) => a.approverType === ApprovalAuthority.SCHOOL && a.action === ApprovalAction.APPROVE,
    );

    const hkeaaOk = !requiresHkeaa || hasHkeaaApprove;
    const schoolOk = !requiresSchool || hasSchoolApprove;

    if (hkeaaOk && schoolOk) {
      arrangement.status = SpecialArrangementStatus.APPROVED;
      arrangement.approvedBy = userId;
      arrangement.approvedAt = new Date();
      if (requiresHkeaa && hasHkeaaApprove) arrangement.hkeaaApproved = true;
    } else {
      // 仍有后续审批级别，保持 PENDING_APPROVAL
      arrangement.status = SpecialArrangementStatus.PENDING_APPROVAL;
    }

    return this.arrangementRepository.save(arrangement);
  }

  /** 拒绝 */
  async reject(id: string, dto: ApproveArrangementDto, userId?: string) {
    return this.approve(id, { ...dto, action: ApprovalAction.REJECT }, userId);
  }

  /** 标记完成：APPROVED/ACTIVE -> COMPLETED */
  async complete(id: string): Promise<SpecialExamArrangement> {
    const arrangement = await this.findOne(id);
    if (
      arrangement.status !== SpecialArrangementStatus.APPROVED &&
      arrangement.status !== SpecialArrangementStatus.ACTIVE
    ) {
      throw new ConflictException({
        code: 'INVALID_STATE',
        message: '仅 APPROVED/ACTIVE 状态可标记完成',
      });
    }
    arrangement.status = SpecialArrangementStatus.COMPLETED;
    return this.arrangementRepository.save(arrangement);
  }

  /** 标记当日使用中：APPROVED -> ACTIVE */
  async activate(id: string): Promise<SpecialExamArrangement> {
    const arrangement = await this.findOne(id);
    if (arrangement.status !== SpecialArrangementStatus.APPROVED) {
      throw new ConflictException({
        code: 'INVALID_STATE',
        message: '仅 APPROVED 状态可激活',
      });
    }
    arrangement.status = SpecialArrangementStatus.ACTIVE;
    return this.arrangementRepository.save(arrangement);
  }

  /** 取消：DRAFT/PENDING_APPROVAL -> CANCELLED */
  async cancel(id: string): Promise<SpecialExamArrangement> {
    const arrangement = await this.findOne(id);
    if (
      arrangement.status !== SpecialArrangementStatus.DRAFT &&
      arrangement.status !== SpecialArrangementStatus.PENDING_APPROVAL
    ) {
      throw new ConflictException({
        code: 'INVALID_STATE',
        message: '仅 DRAFT/PENDING_APPROVAL 状态可取消',
      });
    }
    arrangement.status = SpecialArrangementStatus.CANCELLED;
    return this.arrangementRepository.save(arrangement);
  }

  /** 删除（仅 DRAFT/CANCELLED/REJECTED 可物理删除？此处软逻辑：返回 not allowed 提示改用 cancel） */
  async remove(id: string): Promise<void> {
    const arrangement = await this.findOne(id);
    if (arrangement.status !== SpecialArrangementStatus.DRAFT) {
      throw new ConflictException({
        code: 'NOT_REMOVABLE',
        message: '仅 DRAFT 状态的安排单可删除',
      });
    }
    await this.approvalRepository.delete({ arrangementId: id });
    await this.arrangementRepository.remove(arrangement);
  }

  /** 该安排单是否需要 HKEAA 审批 */
  private requiresHkeaa(arrangement: SpecialExamArrangement): boolean {
    const types = (arrangement.arrangements as Array<{ type: string }>)?.map(
      (a) => a.type,
    ) ?? [];
    return types.some((t) => HKEAA_REQUIRED_TYPES.includes(t as SpecialArrangementType));
  }

  /** 该安排单是否需要学校级审批（全部类型均需学校审批，SEP_ROOM 为学校+HKEAA 双级） */
  private requiresSchool(arrangement: SpecialExamArrangement): boolean {
    const types = (arrangement.arrangements as Array<{ type: string }>)?.map(
      (a) => a.type,
    ) ?? [];
    return types.some((t) => SCHOOL_AND_HKEAA_TYPES.includes(t as SpecialArrangementType) || !HKEAA_REQUIRED_TYPES.includes(t as SpecialArrangementType));
  }
}
