import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DataAccessRequest,
  DataAccessRequestStatus,
  DataAccessRequestType,
} from '../entities/data-access-request.entity';
import { CreateDataAccessRequestDto } from '../dto/dar.dto';
import { User, UserRole } from '../../user/user.entity';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-log.entity';

const DAYS_MS = 24 * 60 * 60 * 1000;
/** PDPO 资料当事人申请响应时限（40 天），此处保留可覆盖。 */
const RESPONSE_DUE_DAYS = 40;

interface StateTransition {
  from: DataAccessRequestStatus[];
  to: DataAccessRequestStatus[];
}

/**
 * 状态机（dar_status）：
 * SUBMITTED → UNDER_REVIEW → APPROVED → COMPLETED
 *                    ↓              ↓
 *                  REJECTED    （执行删除/更正后）
 * SUBMITTED        → WITHDRAWN（未进入审批前申请人可撤回）
 * 非法转换抛 409（ConflictException）。
 */
const TRANSITIONS: Record<string, StateTransition> = {
  review: {
    from: [DataAccessRequestStatus.SUBMITTED],
    to: [
      DataAccessRequestStatus.UNDER_REVIEW,
      DataAccessRequestStatus.REJECTED,
    ],
  },
  approve: {
    from: [DataAccessRequestStatus.UNDER_REVIEW],
    to: [DataAccessRequestStatus.APPROVED],
  },
  reject: {
    from: [
      DataAccessRequestStatus.SUBMITTED,
      DataAccessRequestStatus.UNDER_REVIEW,
    ],
    to: [DataAccessRequestStatus.REJECTED],
  },
  complete: {
    from: [DataAccessRequestStatus.APPROVED],
    to: [DataAccessRequestStatus.COMPLETED],
  },
  withdraw: {
    from: [DataAccessRequestStatus.SUBMITTED],
    to: [DataAccessRequestStatus.WITHDRAWN],
  },
};

const REVIEWER_ROLES: UserRole[] = [
  UserRole.SCHOOL_DIRECTOR,
  UserRole.SYSTEM_ADMIN,
];

/**
 * F-COMP-001 资料当事人权利申请（DAR）：查询/更正/删除个人资料。
 * 含提交、审批（校务主任/系统管理员）、批准执行（响应）、撤回完整状态机，全程审计。
 */
@Injectable()
export class DataAccessRequestService {
  constructor(
    @InjectRepository(DataAccessRequest)
    private readonly darRepository: Repository<DataAccessRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  private assertTransition(
    current: DataAccessRequestStatus,
    op: keyof typeof TRANSITIONS,
    next: DataAccessRequestStatus,
  ) {
    const t = TRANSITIONS[op];
    if (!t.from.includes(current) || !t.to.includes(next)) {
      throw new ConflictException({
        code: 'DAR_INVALID_STATE_TRANSITION',
        message: `非法状态转换: ${current} → ${next}（操作 ${op}）`,
      });
    }
  }

  async create(
    user: User,
    dto: CreateDataAccessRequestDto,
    schoolId: string,
  ) {
    const subjectId = dto.subjectId ?? user.id;
    const subject = await this.userRepository.findOne({
      where: { id: subjectId },
    });
    if (!subject) {
      throw new BadRequestException({ code: 'DAR_SUBJECT_NOT_FOUND', message: '资料当事人不存在' });
    }

    // 资料当事人必须是本人或本人角色（家长代申请需 subject 为 STUDENT/PARENT）
    const isSelf = subjectId === user.id;
    const isGuardian = user.role === UserRole.PARENT;
    if (!isSelf && !isGuardian) {
      throw new ForbiddenException({
        code: 'DAR_NOT_ALLOWED_SUBJECT',
        message: '仅本人或家长可对资料当事人发起申请',
      });
    }

    const daysAgo = (days: number) =>
      new Date(Date.now() + days * DAYS_MS);

    const entity = this.darRepository.create({
      requestType: dto.requestType,
      dataScope: dto.dataScope,
      subjectId,
      requesterId: user.id,
      justification: dto.justification,
      status: DataAccessRequestStatus.SUBMITTED,
      responseDueAt: daysAgo(RESPONSE_DUE_DAYS),
      schoolId,
    });
    const saved = await this.darRepository.save(entity);

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DAR_SUBMITTED as any,
      resourceType: 'data_access_request',
      resourceId: saved.id,
      description: `资料当事人申请提交: ${dto.requestType}（${dto.dataScope}）subject=${subjectId}`,
      details: { requestType: dto.requestType, dataScope: dto.dataScope },
    });

    return saved;
  }

  /** 审批：submitted → under_review（进入审批流） */
  async startReview(id: string, user: User) {
    const dar = await this.getOr404(id);
    this.assertTransition(dar.status, 'review', DataAccessRequestStatus.UNDER_REVIEW);
    dar.status = DataAccessRequestStatus.UNDER_REVIEW;
    dar.reviewerId = user.id;
    await this.darRepository.save(dar);
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DAR_REVIEWED as any,
      resourceType: 'data_access_request',
      resourceId: dar.id,
      description: `资料当事人申请进入审批: ${dar.requestType}`,
    });
    return dar;
  }

  /** 审批通过：under_review → approved（批准执行） */
  async approve(id: string, user: User, note?: string) {
    const dar = await this.getOr404(id);
    if (!REVIEWER_ROLES.includes(user.role)) {
      throw new ForbiddenException({ code: 'DAR_REVIEWER_ONLY', message: '仅校务主任/系统管理员可审批' });
    }
    this.assertTransition(dar.status, 'approve', DataAccessRequestStatus.APPROVED);
    dar.status = DataAccessRequestStatus.APPROVED;
    dar.reviewerId = user.id;
    dar.reviewNote = note ?? dar.reviewNote;
    await this.darRepository.save(dar);
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DAR_APPROVED as any,
      resourceType: 'data_access_request',
      resourceId: dar.id,
      description: `资料当事人申请批准: ${dar.requestType}`,
      details: { note },
    });
    return dar;
  }

  /** 审批拒绝：submitted/under_review → rejected */
  async reject(id: string, user: User, note?: string) {
    const dar = await this.getOr404(id);
    if (!REVIEWER_ROLES.includes(user.role)) {
      throw new ForbiddenException({ code: 'DAR_REVIEWER_ONLY', message: '仅校务主任/系统管理员可审批' });
    }
    this.assertTransition(dar.status, 'reject', DataAccessRequestStatus.REJECTED);
    if (!note) {
      throw new BadRequestException({ code: 'DAR_REJECT_NEEDS_NOTE', message: '拒绝须提供原因' });
    }
    dar.status = DataAccessRequestStatus.REJECTED;
    dar.reviewerId = user.id;
    dar.reviewNote = note;
    await this.darRepository.save(dar);
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DAR_REJECTED as any,
      resourceType: 'data_access_request',
      resourceId: dar.id,
      description: `资料当事人申请拒绝: ${dar.requestType}，原因=${note}`,
    });
    return dar;
  }

  /** 批准后执行响应/更正/删除：approved → completed */
  async complete(id: string, user: User, responsePayload?: string) {
    const dar = await this.getOr404(id);
    if (!REVIEWER_ROLES.includes(user.role)) {
      throw new ForbiddenException({ code: 'DAR_REVIEWER_ONLY', message: '仅校务主任/系统管理员可执行' });
    }
    this.assertTransition(dar.status, 'complete', DataAccessRequestStatus.COMPLETED);
    dar.status = DataAccessRequestStatus.COMPLETED;
    dar.responsePayload = responsePayload ?? dar.responsePayload;
    dar.completedAt = new Date();
    await this.darRepository.save(dar);
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DAR_COMPLETED as any,
      resourceType: 'data_access_request',
      resourceId: dar.id,
      description: `资料当事人申请完成: ${dar.requestType}（erasure=${dar.requestType === DataAccessRequestType.ERASURE}）`,
    });
    return dar;
  }

  /** 撤回：submitted → withdrawn（仅申请人/本人，未进入审批时） */
  async withdraw(id: string, user: User) {
    const dar = await this.getOr404(id);
    if (dar.requesterId !== user.id && dar.subjectId !== user.id) {
      throw new ForbiddenException({ code: 'DAR_WITHDRAW_ONLY', message: '仅申请人可撤回' });
    }
    this.assertTransition(dar.status, 'withdraw', DataAccessRequestStatus.WITHDRAWN);
    dar.status = DataAccessRequestStatus.WITHDRAWN;
    await this.darRepository.save(dar);
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.DAR_WITHDRAWN as any,
      resourceType: 'data_access_request',
      resourceId: dar.id,
      description: `资料当事人申请撤回: ${dar.requestType}`,
    });
    return dar;
  }

  async findById(id: string, user: User) {
    const dar = await this.darRepository.findOne({
      where: { id },
      relations: ['subject', 'requester', 'reviewer'],
    });
    if (!dar) throw new NotFoundException({ code: 'DAR_NOT_FOUND', message: '申请不存在' });
    return dar;
  }

  async list(
    user: User,
    query: { status?: DataAccessRequestStatus; requestType?: DataAccessRequestType; page?: number; pageSize?: number },
  ) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.requestType) where.requestType = query.requestType;
    // 家长/学生仅能看自己相关的申请；校级角色可看全校
    const isStaff =
      user.role === UserRole.SYSTEM_ADMIN ||
      user.role === UserRole.SCHOOL_DIRECTOR ||
      user.role === UserRole.SCHOOL_STAFF;
    if (!isStaff) {
      where.requesterId = user.id;
    }

    const [items, total] = await this.darRepository.findAndCount({
      where,
      relations: ['subject', 'requester', 'reviewer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  private async getOr404(id: string): Promise<DataAccessRequest> {
    const dar = await this.darRepository.findOne({ where: { id } });
    if (!dar) throw new NotFoundException({ code: 'DAR_NOT_FOUND', message: '申请不存在' });
    return dar;
  }
}
