import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import {
  ExamPaper,
  ExamPaperStatus,
  PaperRequestStatus,
  ExamPaperRequest,
  ExamPaperDistribution,
  PaperReturnStatus,
  PaperStorage,
} from './paper-management.entity';
import {
  CreatePaperRequestDto,
  ApprovePaperRequestDto,
  OrderPaperRequestDto,
  PaperRequestQueryDto,
  CreatePaperDto,
  PaperQueryDto,
  SealPaperDto,
  UpdatePaperStatusDto,
  DistributePaperDto,
  ReturnPaperDto,
  DestroyPaperDto,
  DistributionQueryDto,
} from './dto/paper-management.dto';

/**
 * 试卷生命周期状态机（exam_papers.status），非法转换抛 409。
 *
 * REQUIRED ──► PRINT_ORDERED ──► PRINTED ──► SEALED ──► IN_SAFE ──► DISTRIBUTED ──► USED
 *    │           │               │            │            │             │             │
 *    │           │               │            │            ▼             ▼             │
 *    └─► CANCELLED                └─► REJECTED   └─► LOST    └─► RETURNED   └─► ARCHIVED
 *                                                                                        │
 *                                                                                        ▼
 *                                                                                     DESTROYED
 */
const PAPER_TRANSITIONS: Record<ExamPaperStatus, ExamPaperStatus[]> = {
  [ExamPaperStatus.REQUIRED]: [
    ExamPaperStatus.PRINT_ORDERED,
    ExamPaperStatus.CANCELLED,
  ],
  [ExamPaperStatus.PRINT_ORDERED]: [
    ExamPaperStatus.PRINTED,
    ExamPaperStatus.REJECTED,
    ExamPaperStatus.CANCELLED,
  ],
  [ExamPaperStatus.PRINTED]: [
    ExamPaperStatus.SEALED,
    ExamPaperStatus.REJECTED,
  ],
  [ExamPaperStatus.SEALED]: [ExamPaperStatus.IN_SAFE, ExamPaperStatus.LOST],
  [ExamPaperStatus.IN_SAFE]: [ExamPaperStatus.DISTRIBUTED, ExamPaperStatus.LOST],
  [ExamPaperStatus.DISTRIBUTED]: [ExamPaperStatus.USED, ExamPaperStatus.RETURNED],
  [ExamPaperStatus.USED]: [
    ExamPaperStatus.RETURNED,
    ExamPaperStatus.ARCHIVED,
    ExamPaperStatus.LOST,
  ],
  [ExamPaperStatus.RETURNED]: [ExamPaperStatus.ARCHIVED],
  [ExamPaperStatus.ARCHIVED]: [ExamPaperStatus.DESTROYED],
  [ExamPaperStatus.DESTROYED]: [],
  [ExamPaperStatus.REJECTED]: [ExamPaperStatus.REQUIRED],
  [ExamPaperStatus.CANCELLED]: [],
  [ExamPaperStatus.LOST]: [],
};

@Injectable()
export class PaperManagementService {
  constructor(
    @InjectRepository(ExamPaper)
    private readonly paperRepository: Repository<ExamPaper>,
    @InjectRepository(ExamPaperRequest)
    private readonly requestRepository: Repository<ExamPaperRequest>,
    @InjectRepository(ExamPaperDistribution)
    private readonly distributionRepository: Repository<ExamPaperDistribution>,
  ) {}

  /* =====================================================================
   * 公共工具
   * ===================================================================== */

  private async generateRequestCode(subject: string): Promise<string> {
    const year = new Date().getFullYear();
    const abbr =
      subject.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'SUB';
    const seq = (await this.requestRepository.count()) + 1;
    return `EPR-${year}-${abbr}-${String(seq).padStart(3, '0')}`;
  }

  private async generatePaperCode(subject: string): Promise<string> {
    const year = new Date().getFullYear();
    const abbr =
      subject.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'SUB';
    const seq = (await this.paperRepository.count()) + 1;
    return `PAP-${year}-${abbr}-${String(seq).padStart(3, '0')}`;
  }

  /** 校验状态转换，非法则抛 409（含 code） */
  private assertTransition(
    from: ExamPaperStatus,
    to: ExamPaperStatus,
  ): void {
    const allowed = PAPER_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `非法状态转换：${from} -> ${to}`,
      });
    }
  }

  /** 追加保管链条目（不可变只追加） */
  private appendCustody(
    paper: ExamPaper,
    action: string,
    actor?: string,
    note?: string,
  ): void {
    const chain = Array.isArray(paper.custodyChain)
      ? [...paper.custodyChain]
      : [];
    chain.push({
      actor: actor,
      action,
      at: new Date().toISOString(),
      note,
    });
    paper.custodyChain = chain;
  }

  private async findPaperOrThrow(id: string): Promise<ExamPaper> {
    const paper = await this.paperRepository.findOne({ where: { id } });
    if (!paper) {
      throw new NotFoundException(`试卷 ID ${id} 不存在`);
    }
    return paper;
  }

  private async findRequestOrThrow(id: string): Promise<ExamPaperRequest> {
    const req = await this.requestRepository.findOne({ where: { id } });
    if (!req) {
      throw new NotFoundException(`印刷申请 ID ${id} 不存在`);
    }
    return req;
  }

  private async findDistributionOrThrow(
    id: string,
  ): Promise<ExamPaperDistribution> {
    const dist = await this.distributionRepository.findOne({ where: { id } });
    if (!dist) {
      throw new NotFoundException(`分发记录 ID ${id} 不存在`);
    }
    return dist;
  }

  /* =====================================================================
   * F-EXAM-002a/b 印刷申请管理（exam_paper_requests）
   * ===================================================================== */

  /** 需求统计 + 创建印刷申请（F-EXAM-002a/b）：draft */
  async createRequest(
    dto: CreatePaperRequestDto,
    userId?: string,
  ): Promise<ExamPaperRequest> {
    const request = this.requestRepository.create({
      ...dto,
      requestCode: await this.generateRequestCode(dto.subject),
      status: PaperRequestStatus.DRAFT,
      createdBy: userId,
    } as Partial<ExamPaperRequest>);
    return this.requestRepository.save(request);
  }

  /** 印刷申请列表 */
  async findAllRequests(query: PaperRequestQueryDto) {
    const { page = 1, pageSize = 10, subject, status, examId } = query;
    const where: FindOptionsWhere<ExamPaperRequest> = {};
    if (subject) where.subject = subject;
    if (status) where.status = status;
    if (examId) where.examId = examId;

    const [data, total] = await this.requestRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page, pageSize };
  }

  async findRequest(id: string): Promise<ExamPaperRequest> {
    return this.findRequestOrThrow(id);
  }

  /** 审批印刷申请：draft -> approved */
  async approveRequest(
    id: string,
    dto: ApprovePaperRequestDto,
    userId?: string,
  ): Promise<ExamPaperRequest> {
    const request = await this.findRequestOrThrow(id);
    if (request.status !== PaperRequestStatus.DRAFT) {
      throw new ConflictException({
        code: 'INVALID_STATE',
        message: '仅 DRAFT 状态的印刷申请可审批',
      });
    }
    request.status = PaperRequestStatus.APPROVED;
    request.approvedBy = userId;
    request.updatedBy = userId;
    return this.requestRepository.save(request);
  }

  /** 生成供应商印刷订单：approved -> ordered（F-EXAM-002b） */
  async orderRequest(
    id: string,
    dto: OrderPaperRequestDto,
    userId?: string,
  ): Promise<ExamPaperRequest> {
    const request = await this.findRequestOrThrow(id);
    if (request.status !== PaperRequestStatus.APPROVED) {
      throw new ConflictException({
        code: 'INVALID_STATE',
        message: '仅 APPROVED 状态的印刷申请可下单',
      });
    }
    request.status = PaperRequestStatus.ORDERED;
    request.supplier = dto.supplier;
    request.orderedCount = dto.orderedCount ?? request.requiredCount;
    request.orderNo = dto.orderNo ?? request.orderNo;
    request.updatedBy = userId;
    return this.requestRepository.save(request);
  }

  /** 印刷完成收货：ordered -> received（衔接 F-EXAM-002c 密封追踪起点 PRINT_ORDERED/PRINTED） */
  async receiveRequest(id: string, userId?: string): Promise<ExamPaperRequest> {
    const request = await this.findRequestOrThrow(id);
    if (request.status !== PaperRequestStatus.ORDERED) {
      throw new ConflictException({
        code: 'INVALID_STATE',
        message: '仅 ORDERED 状态的印刷申请可确认收货',
      });
    }
    request.status = PaperRequestStatus.RECEIVED;
    request.updatedBy = userId;
    return this.requestRepository.save(request);
  }

  /** 取消印刷申请：draft -> cancelled */
  async cancelRequest(id: string, userId?: string): Promise<ExamPaperRequest> {
    const request = await this.findRequestOrThrow(id);
    if (request.status !== PaperRequestStatus.DRAFT) {
      throw new ConflictException({
        code: 'INVALID_STATE',
        message: '仅 DRAFT 状态的印刷申请可取消',
      });
    }
    request.status = PaperRequestStatus.CANCELLED;
    request.updatedBy = userId;
    return this.requestRepository.save(request);
  }

  /* =====================================================================
   * F-EXAM-002c 密封追踪（exam_papers）
   * ===================================================================== */

  /** 录入试卷（初始 REQUIRED） */
  async createPaper(
    dto: CreatePaperDto,
    userId?: string,
  ): Promise<ExamPaper> {
    const paper = this.paperRepository.create({
      ...dto,
      paperCode: dto.paperCode || (await this.generatePaperCode(dto.subject)),
      status: ExamPaperStatus.REQUIRED,
      custodyChain: [],
      createdBy: userId,
    } as Partial<ExamPaper>);
    return this.paperRepository.save(paper);
  }

  /** 试卷列表 */
  async findAllPapers(query: PaperQueryDto) {
    const { page = 1, pageSize = 10, subject, status, examId } = query;
    const where: FindOptionsWhere<ExamPaper> = {};
    if (subject) where.subject = subject;
    if (status) where.status = status;
    if (examId) where.examId = examId;

    const [data, total] = await this.paperRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page, pageSize };
  }

  /** 试卷详情（含保管链 custodyChain） */
  async findPaper(id: string): Promise<ExamPaper> {
    return this.findPaperOrThrow(id);
  }

  /**
   * 密封试卷（PRINTED -> SEALED），记录 sealNo 并追加保管链。
   * 密封为保管链的起点；每步流转追加 {actor, action, at} 形成可审计保管链（衔接 F-COMP-003/audit_logs）。
   */
  async sealPaper(
    id: string,
    dto: SealPaperDto,
    userId?: string,
  ): Promise<ExamPaper> {
    const paper = await this.findPaperOrThrow(id);
    this.assertTransition(paper.status, ExamPaperStatus.SEALED);
    paper.status = ExamPaperStatus.SEALED;
    paper.sealNo = dto.sealNo;
    if (dto.storageLocation) paper.storageLocation = dto.storageLocation;
    paper.updatedBy = userId;
    this.appendCustody(paper, 'sealed', userId, `seal_no=${dto.sealNo}`);
    return this.paperRepository.save(paper);
  }

  /**
   * 通用状态流转。SEALED->IN_SAFE（入保险箱）也会记录 storage=SAFE；
   * 任何 ->LOST 均抛 409（遗失触发告警，见 API-DESIGN §9.3 错误码 PAPER_LOST_ALERT）。
   */
  async transitionStatus(
    id: string,
    dto: UpdatePaperStatusDto,
    userId?: string,
  ): Promise<ExamPaper> {
    const paper = await this.findPaperOrThrow(id);
    // LOST 属于异常状态，单独走告警语义，禁止直接通用流转设置
    if (dto.status === ExamPaperStatus.LOST) {
      throw new ConflictException({
        code: 'PAPER_LOST_ALERT',
        message: '试卷遗失已触发告警（请通过遗失登记流程处置）',
      });
    }
    this.assertTransition(paper.status, dto.status);
    paper.status = dto.status;
    paper.updatedBy = userId;
    if (dto.status === ExamPaperStatus.IN_SAFE && !paper.storageLocation) {
      paper.storageLocation = PaperStorage.SAFE;
    }
    if (dto.status === ExamPaperStatus.RETURNED) {
      paper.storageLocation = PaperStorage.SAFE;
    }
    this.appendCustody(paper, dto.status, userId, dto.note);
    return this.paperRepository.save(paper);
  }

  /* =====================================================================
   * F-EXAM-002e 分发记录（签到/签收）
   * ===================================================================== */

  /** 分发（DISTRIBUTED，监考员签收）：IN_SAFE/SEALED -> DISTRIBUTED */
  async distributePaper(
    id: string,
    dto: DistributePaperDto,
    userId?: string,
  ): Promise<ExamPaper> {
    const paper = await this.findPaperOrThrow(id);
    this.assertTransition(paper.status, ExamPaperStatus.DISTRIBUTED);
    paper.status = ExamPaperStatus.DISTRIBUTED;
    paper.updatedBy = userId;
    this.appendCustody(
      paper,
      'distributed',
      userId,
      `invigilator=${dto.invigilatorId}`,
    );
    await this.paperRepository.save(paper);

    // 分发记录（签到/签收）
    const distribution = this.distributionRepository.create({
      paperId: id,
      examId: dto.examId ?? paper.examId,
      invigilatorId: dto.invigilatorId,
      distributedAt: new Date(),
      distributedCount: dto.distributedCount,
      signature: dto.signature,
      returnStatus: PaperReturnStatus.PENDING,
      createdBy: userId,
    } as Partial<ExamPaperDistribution>);
    await this.distributionRepository.save(distribution);

    return paper;
  }

  /** 回收（RETURNED）：DISTRIBUTED/USED -> RETURNED */
  async returnPaper(
    id: string,
    dto: ReturnPaperDto,
    userId?: string,
  ): Promise<ExamPaper> {
    const paper = await this.findPaperOrThrow(id);
    this.assertTransition(paper.status, ExamPaperStatus.RETURNED);
    paper.status = ExamPaperStatus.RETURNED;
    paper.storageLocation = PaperStorage.SAFE;
    paper.updatedBy = userId;
    this.appendCustody(paper, 'returned', userId, dto.note);
    await this.paperRepository.save(paper);

    // 更新最近一条待返收分发记录
    const pending = await this.distributionRepository.find({
      where: { paperId: id },
      order: { createdAt: 'DESC' },
    });
    for (const dist of pending) {
      if (
        dist.returnStatus === PaperReturnStatus.PENDING ||
        dist.returnStatus === PaperReturnStatus.PARTIAL
      ) {
        dist.returnedAt = new Date();
        dist.returnedCount = dto.returnedCount;
        dist.returnStatus =
          dto.returnedCount >= dist.distributedCount
            ? PaperReturnStatus.COMPLETE
            : PaperReturnStatus.PARTIAL;
        dist.note = dto.note ?? dist.note;
        await this.distributionRepository.save(dist);
        break;
      }
    }
    return paper;
  }

  /* =====================================================================
   * F-EXAM-002f 回收与销毁
   * ===================================================================== */

  /** 归档：RETURNED -> ARCHIVED，可设保存期限 */
  async archivePaper(
    id: string,
    retentionUntil?: Date,
    userId?: string,
  ): Promise<ExamPaper> {
    const paper = await this.findPaperOrThrow(id);
    this.assertTransition(paper.status, ExamPaperStatus.ARCHIVED);
    paper.status = ExamPaperStatus.ARCHIVED;
    if (retentionUntil) paper.retentionUntil = retentionUntil;
    paper.updatedBy = userId;
    this.appendCustody(paper, 'archived', userId, 'retention_until=' + (retentionUntil?.toISOString() ?? ''));
    return this.paperRepository.save(paper);
  }

  /**
   * 审批销毁：ARCHIVED -> DESTROYED。
   * 记录 destroyApprovedAt/By；分发记录同步 destroyedAt。销毁为终态，仅审批人可触发（角色约束见控制器）。
   */
  async destroyPaper(
    id: string,
    dto: DestroyPaperDto,
    userId?: string,
  ): Promise<ExamPaper> {
    const paper = await this.findPaperOrThrow(id);
    if (paper.status !== ExamPaperStatus.ARCHIVED) {
      throw new ConflictException({
        code: 'INVALID_STATE',
        message: '仅 ARCHIVED 状态的试卷可审批销毁（归档保存期满后销毁）',
      });
    }
    paper.status = ExamPaperStatus.DESTROYED;
    paper.destroyApprovedAt = new Date();
    paper.destroyApprovedBy = dto.approvedById;
    paper.updatedBy = userId;
    this.appendCustody(paper, 'destroyed', dto.approvedById, dto.reason);
    await this.paperRepository.save(paper);

    await this.distributionRepository
      .createQueryBuilder()
      .update(ExamPaperDistribution)
      .set({ destroyedAt: new Date(), note: dto.reason })
      .where('paper_id = :id', { id })
      .execute();

    return paper;
  }

  /** 标记考试使用中：DISTRIBUTED -> USED */
  async markUsed(id: string, userId?: string): Promise<ExamPaper> {
    const paper = await this.findPaperOrThrow(id);
    this.assertTransition(paper.status, ExamPaperStatus.USED);
    paper.status = ExamPaperStatus.USED;
    paper.updatedBy = userId;
    this.appendCustody(paper, 'used', userId);
    return this.paperRepository.save(paper);
  }

  /** 登记遗失（触发告警语义）：SEALED/IN_SAFE/USED -> LOST。为异常终态，记录后不可恢复。 */
  async markLost(id: string, note?: string, userId?: string): Promise<ExamPaper> {
    const paper = await this.findPaperOrThrow(id);
    this.assertTransition(paper.status, ExamPaperStatus.LOST);
    paper.status = ExamPaperStatus.LOST;
    paper.updatedBy = userId;
    this.appendCustody(paper, 'lost', userId, note);
    return this.paperRepository.save(paper);
  }

  /* =====================================================================
   * 分发/回收记录查询
   * ===================================================================== */

  async findAllDistributions(query: DistributionQueryDto) {
    const { page = 1, pageSize = 10, paperId, invigilatorId, returnStatus } =
      query;
    const where: FindOptionsWhere<ExamPaperDistribution> = {};
    if (paperId) where.paperId = paperId;
    if (invigilatorId) where.invigilatorId = invigilatorId;
    if (returnStatus) where.returnStatus = returnStatus;

    const [data, total] = await this.distributionRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page, pageSize };
  }

  async findDistribution(id: string): Promise<ExamPaperDistribution> {
    return this.findDistributionOrThrow(id);
  }
}
