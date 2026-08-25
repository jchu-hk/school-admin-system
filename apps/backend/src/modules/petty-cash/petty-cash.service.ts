import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, ILike } from 'typeorm';
import {
  PettyCashConfig,
  PettyCashReimbursement,
  PettyCashTransaction,
  PettyCashConfigStatus,
  PettyCashWorkflowStatus,
  PettyCashStatus,
  OcrStatus,
  WitnessLevel,
  PettyCashTxType,
} from './entities/petty-cash.entity';
import {
  CreateReimbursementDto,
  SubmitReimbursementDto,
  ApproveReimbursementDto,
  RejectReimbursementDto,
  CancelReimbursementDto,
  QueryReimbursementDto,
  TopUpDto,
  QueryTransactionDto,
  CreateConfigDto,
  UpdateConfigDto,
  ConfirmConfigDto,
} from './dto/petty-cash.dto';
import { User } from '../user/user.entity';
import { AcademicYear } from '../student/student.entity';
import { WitnessService } from '../witness/services/witness.service';
import { WitnessType } from '../witness/entities/witness.entity';
import { AuditService } from '../audit/audit.service';

const DOUBLE_WITNESS_AMOUNT = 500; // >HK$500 双人见证
const LOW_BALANCE_THRESHOLD = 500; // 低于此提示补充
const ZERO_BALANCE = 0; // 为 0 禁提交
const TOP_UP_MAX = 5000; // 单笔补充上限

type UserLike = { id?: string; username?: string };

/**
 * 零用现金报销（F-FIN-002）服务
 * @see SPEC-SYSTEM-DESIGN §20.3 / §17.5（见证复用 WitnessService）
 */
@Injectable()
export class PettyCashService {
  constructor(
    @InjectRepository(PettyCashConfig)
    private readonly configRepository: Repository<PettyCashConfig>,
    @InjectRepository(PettyCashReimbursement)
    private readonly reimbursRepository: Repository<PettyCashReimbursement>,
    @InjectRepository(PettyCashTransaction)
    private readonly txRepository: Repository<PettyCashTransaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AcademicYear)
    private readonly academicYearRepository: Repository<AcademicYear>,
    private readonly witnessService: WitnessService,
    private readonly auditService: AuditService,
  ) {}

  // ==================== 备用金配置 ====================

  async createConfig(dto: CreateConfigDto, userId?: string) {
    const year = await this.academicYearRepository.findOne({
      where: { id: dto.academicYearId },
    });
    if (!year) {
      throw new BadRequestException({ code: 'YEAR_NOT_FOUND', message: '学年不存在' });
    }
    const existing = await this.configRepository.findOne({
      where: { academicYearId: dto.academicYearId },
    });
    if (existing) {
      throw new ConflictException({
        code: 'CONFIG_EXISTS',
        message: '该学年已存在备用金配置',
      });
    }
    const base = dto.baseSingleLimit ?? 3000;
    const cpiCurrent = dto.cpiCurrent ?? 1.0;
    const cpiBase = dto.cpiBase ?? 1.0;
    const effective = Math.round((base * (cpiCurrent / cpiBase)) * 100) / 100;
    const config = this.configRepository.create({
      academicYearId: dto.academicYearId,
      baseSingleLimit: base,
      cpiCurrent,
      cpiBase,
      effectiveSingleLimit: effective,
      floatCap: dto.floatCap ?? 5000,
      floatLowThreshold: dto.floatLowThreshold ?? 500,
      configStatus: PettyCashConfigStatus.PENDING,
    });
    await this.configRepository.save(config);
    await this.auditService.log({
      userId,
      action: 'petty_cash_config_created',
      resourceType: 'PETTY_CASH_CONFIG',
      resourceId: config.id,
      details: { academicYearId: dto.academicYearId, effective },
    });
    return config;
  }

  async updateConfig(id: string, dto: UpdateConfigDto, userId?: string) {
    const config = await this.configRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException({ code: 'CONFIG_NOT_FOUND', message: '配置不存在' });
    }
    if (config.configStatus === PettyCashConfigStatus.CONFIRMED) {
      throw new ConflictException({
        code: 'CONFIG_CONFIRMED',
        message: '已确认配置不可修改，请新建学年配置',
      });
    }
    if (dto.baseSingleLimit != null) config.baseSingleLimit = dto.baseSingleLimit;
    if (dto.cpiCurrent != null) config.cpiCurrent = dto.cpiCurrent;
    if (dto.cpiBase != null) config.cpiBase = dto.cpiBase;
    if (dto.floatCap != null) config.floatCap = dto.floatCap;
    if (dto.floatLowThreshold != null) config.floatLowThreshold = dto.floatLowThreshold;
    config.effectiveSingleLimit =
      Math.round((config.baseSingleLimit * (config.cpiCurrent / config.cpiBase)) * 100) / 100;
    await this.configRepository.save(config);
    await this.auditService.log({
      userId,
      action: 'petty_cash_config_updated',
      resourceType: 'PETTY_CASH_CONFIG',
      resourceId: config.id,
      details: { effectiveSingleLimit: config.effectiveSingleLimit },
    });
    return config;
  }

  async confirmConfig(id: string, dto: ConfirmConfigDto, userId?: string) {
    const config = await this.configRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException({ code: 'CONFIG_NOT_FOUND', message: '配置不存在' });
    }
    if (config.configStatus === PettyCashConfigStatus.CONFIRMED) {
      throw new ConflictException({ code: 'CONFIG_CONFIRMED', message: '配置已确认' });
    }
    config.configStatus = PettyCashConfigStatus.CONFIRMED;
    config.confirmedBy = dto.confirmedBy || userId || null;
    config.confirmedAt = new Date();
    await this.configRepository.save(config);
    await this.auditService.log({
      userId: userId || dto.confirmedBy,
      action: 'petty_cash_config_confirmed',
      resourceType: 'PETTY_CASH_CONFIG',
      resourceId: config.id,
      details: { effectiveSingleLimit: config.effectiveSingleLimit },
    });
    return config;
  }

  async findActiveConfig(academicYearId: string) {
    const config = await this.configRepository.findOne({
      where: { academicYearId, configStatus: PettyCashConfigStatus.CONFIRMED },
    });
    if (!config) {
      throw new NotFoundException({
        code: 'CONFIG_NOT_FOUND',
        message: '该学年无已确认的备用金配置',
      });
    }
    return config;
  }

  // ==================== 报销申请 ====================

  async createReimbursement(
    dto: CreateReimbursementDto,
    user?: UserLike,
    academicYearId?: string,
  ) {
    const config = await this.resolveConfig(academicYearId);
    return this.reimbursRepository.save(
      this.reimbursRepository.create({
        transactionNo: await this.nextTransactionNo('PC'),
        applicantId: user?.id,
        amount: dto.amount,
        payee: dto.payee,
        description: dto.description,
        category: dto.category,
        receiptUrl: dto.receiptUrl,
        ocrResult: { not_performed: true },
        ocrStatus: OcrStatus.NOT_PERFORMED,
        singleLimit: config.effectiveSingleLimit,
        witnessLevel: this.computeWitnessLevel(dto.amount, config.effectiveSingleLimit),
        status: PettyCashStatus.DRAFT,
        workflowStatus: PettyCashWorkflowStatus.DRAFT,
        remarks: dto.remarks,
      }),
    );
  }

  async submitReimbursement(id: string, dto: SubmitReimbursementDto, user?: UserLike) {
    const reimb = await this.reimbursRepository.findOne({ where: { id } });
    if (!reimb) {
      throw new NotFoundException({ code: 'REIMB_NOT_FOUND', message: '报销单不存在' });
    }
    this.assertWorkflow(reimb, [PettyCashWorkflowStatus.DRAFT]);
    // 申请人与发起人一致
    if (reimb.applicantId !== user?.id) {
      throw new ForbiddenException({ code: 'NOT_APPLICANT', message: '仅申请人可提交报销' });
    }

    const config = await this.resolveConfig(undefined);
    const balance = await this.getBalance('');
    if (balance <= ZERO_BALANCE) {
      throw new ConflictException({
        code: 'FLOAT_EMPTY',
        message: '备用金余额为 0，禁止提交报销，请先补充备用金',
      });
    }
    // 单笔限额校验
    if (reimb.amount > (config.effectiveSingleLimit ?? 3000)) {
      throw new BadRequestException({
        code: 'OVER_LIMIT',
        message: `报销金额超过单笔限额 HK$${config.effectiveSingleLimit}`,
      });
    }

    const needDouble = reimb.amount > DOUBLE_WITNESS_AMOUNT;
    reimb.singleLimit = config.effectiveSingleLimit;
    reimb.floatBalanceBefore = balance;
    reimb.witnessLevel = needDouble ? WitnessLevel.DOUBLE : WitnessLevel.SINGLE;

    if (!needDouble) {
      // ≤HK$500 单人见证 → 直接进审批
      reimb.workflowStatus = PettyCashWorkflowStatus.PENDING_APPROVAL;
      reimb.status = PettyCashStatus.PENDING_APPROVAL;
      await this.reimbursRepository.save(reimb);
      await this.auditService.log({
        userId: user?.id,
        action: 'petty_cash_submitted_single',
        resourceType: 'PETTY_CASH_REIMBURSEMENT',
        resourceId: reimb.id,
        details: { amount: reimb.amount, witnessLevel: 'single' },
      });
      return { id: reimb.id, status: reimb.workflowStatus, witnessRequired: false };
    }

    // >HK$500 → 双人见证（复用 WitnessService）
    reimb.workflowStatus = PettyCashWorkflowStatus.WITNESS_IN_PROGRESS;
    reimb.status = PettyCashStatus.WITNESS_IN_PROGRESS;
    await this.reimbursRepository.save(reimb);

    const witnessResult = await this.witnessService.create(
      user as User,
      {
        witnessType: WitnessType.CASH_PAYMENT,
        amount: reimb.amount,
        currency: 'HKD',
        businessRef: reimb.transactionNo,
        witness1Id: dto.witness1Id,
        witness2Id: dto.witness2Id,
      },
      (user as any)?.schoolId || '',
    );

    reimb.witnessVerificationId = witnessResult.verificationId;
    await this.reimbursRepository.save(reimb);

    await this.auditService.log({
      userId: user?.id,
      action: 'petty_cash_witness_triggered',
      resourceType: 'PETTY_CASH_REIMBURSEMENT',
      resourceId: reimb.id,
      details: {
        verificationId: witnessResult.verificationId,
        amount: reimb.amount,
      },
    });

    return { id: reimb.id, status: reimb.workflowStatus, witnessVerificationId: witnessResult.verificationId };
  }

  async approveReimbursement(id: string, dto: ApproveReimbursementDto, user?: UserLike) {
    const reimb = await this.reimbursRepository.findOne({ where: { id } });
    if (!reimb) {
      throw new NotFoundException({ code: 'REIMB_NOT_FOUND', message: '报销单不存在' });
    }
    this.assertWorkflow(reimb, [PettyCashWorkflowStatus.PENDING_APPROVAL]);
    reimb.approvedBy = user?.id;
    reimb.approvedAt = new Date();
    reimb.workflowStatus = PettyCashWorkflowStatus.APPROVED;
    reimb.status = PettyCashStatus.APPROVED;
    reimb.remarks = dto.comment || reimb.remarks;
    await this.reimbursRepository.save(reimb);
    await this.auditService.log({
      userId: user?.id,
      action: 'petty_cash_approved',
      resourceType: 'PETTY_CASH_REIMBURSEMENT',
      resourceId: reimb.id,
      details: { comment: dto.comment },
    });
    return { id: reimb.id, status: reimb.workflowStatus };
  }

  async rejectReimbursement(id: string, dto: RejectReimbursementDto, user?: UserLike) {
    const reimb = await this.reimbursRepository.findOne({ where: { id } });
    if (!reimb) {
      throw new NotFoundException({ code: 'REIMB_NOT_FOUND', message: '报销单不存在' });
    }
    this.assertWorkflow(reimb, [PettyCashWorkflowStatus.PENDING_APPROVAL]);
    reimb.rejectionReason = dto.reason;
    reimb.workflowStatus = PettyCashWorkflowStatus.REJECTED;
    reimb.status = PettyCashStatus.REJECTED;
    await this.reimbursRepository.save(reimb);
    await this.auditService.log({
      userId: user?.id,
      action: 'petty_cash_rejected',
      resourceType: 'PETTY_CASH_REIMBURSEMENT',
      resourceId: reimb.id,
      details: { reason: dto.reason },
    });
    return { id: reimb.id, status: reimb.workflowStatus };
  }

  async cancelReimbursement(id: string, dto: CancelReimbursementDto, user?: UserLike) {
    const reimb = await this.reimbursRepository.findOne({ where: { id } });
    if (!reimb) {
      throw new NotFoundException({ code: 'REIMB_NOT_FOUND', message: '报销单不存在' });
    }
    this.assertWorkflow(reimb, [
      PettyCashWorkflowStatus.DRAFT,
      PettyCashWorkflowStatus.OCRA_PENDING,
      PettyCashWorkflowStatus.MANUAL_AMOUNT,
      PettyCashWorkflowStatus.WITNESS_REQUIRED,
      PettyCashWorkflowStatus.WITNESS_IN_PROGRESS,
      PettyCashWorkflowStatus.PENDING_APPROVAL,
    ]);
    reimb.workflowStatus = PettyCashWorkflowStatus.CANCELLED;
    reimb.status = PettyCashStatus.CANCELLED;
    reimb.remarks = [reimb.remarks, dto.reason].filter(Boolean).join('; ') || null;
    await this.reimbursRepository.save(reimb);
    await this.auditService.log({
      userId: user?.id,
      action: 'petty_cash_cancelled',
      resourceType: 'PETTY_CASH_REIMBURSEMENT',
      resourceId: reimb.id,
      details: { reason: dto.reason },
    });
    return { id: reimb.id, status: reimb.workflowStatus };
  }

  /**
   * 出账（PAID）：仅 approved 可出账，扣减备用金余额。
   * 备注：正式流程可承载于见证完成后回调自动出账；此处提供手动出账端点。
   */
  async markPaid(id: string, user?: UserLike, academicYearId?: string) {
    const reimb = await this.reimbursRepository.findOne({ where: { id } });
    if (!reimb) {
      throw new NotFoundException({ code: 'REIMB_NOT_FOUND', message: '报销单不存在' });
    }
    this.assertWorkflow(reimb, [
      PettyCashWorkflowStatus.APPROVED,
      PettyCashWorkflowStatus.PENDING_APPROVAL,
    ]);
    const balance = await this.getBalance(academicYearId || '');
    if (reimb.amount > balance) {
      throw new ConflictException({
        code: 'FLOAT_INSUFFICIENT',
        message: '备用金余额不足，无法出账',
      });
    }
    reimb.workflowStatus = PettyCashWorkflowStatus.PAID;
    reimb.status = PettyCashStatus.PAID;
    reimb.paidAt = new Date();
    await this.reimbursRepository.save(reimb);

    await this.recordExpense(reimb, balance, academicYearId || '', user?.id);
    return { id: reimb.id, status: reimb.workflowStatus, paidAt: reimb.paidAt };
  }

  async findReimbursements(query: QueryReimbursementDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Record<string, unknown> = {};
    if (query.applicantId) where.applicantId = query.applicantId;
    if (query.status) where.workflowStatus = query.status;
    if (query.keyword) {
      where.transactionNo = ILike(`%${query.keyword}%`);
    }
    const [items, total] = await this.reimbursRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { items, total, page, limit };
  }

  async findReimbursement(id: string) {
    const reimb = await this.reimbursRepository.findOne({ where: { id }, relations: ['transactions'] });
    if (!reimb) {
      throw new NotFoundException({ code: 'REIMB_NOT_FOUND', message: '报销单不存在' });
    }
    return reimb;
  }

  // ==================== 备用金补充（F-FIN-001 衔接） ====================

  /**
   * 备用金补充：先 WitnessService.create 成功再写 top_up 交易（保外键一致）。
   */
  async topUp(dto: TopUpDto, user?: UserLike, academicYearId?: string) {
    if (dto.amount > TOP_UP_MAX) {
      throw new BadRequestException({
        code: 'TOP_UP_EXCEED',
        message: `单笔补充上限 HK$${TOP_UP_MAX}`,
      });
    }
    // 1. 先触发双人见证（petty_cash 类型），成功后才写入流水
    const witnessResult = await this.witnessService.create(
      user as User,
      {
        witnessType: WitnessType.PETTY_CASH,
        amount: dto.amount,
        currency: 'HKD',
        businessRef: dto.referenceNo || `PC-TOPUP-${Date.now()}`,
        witness1Id: dto.witness1Id,
        witness2Id: dto.witness2Id,
      },
      (user as any)?.schoolId || '',
    );

    const balance = await this.getBalance(academicYearId || '');
    const tx = this.txRepository.create({
      academicYearId: academicYearId || ('' as any),
      txType: PettyCashTxType.TOP_UP,
      amount: dto.amount,
      floatBalanceAfter: Math.round((balance + dto.amount) * 100) / 100,
      referenceNo: dto.referenceNo || null,
      createdBy: user?.id || ('' as any),
    });
    await this.txRepository.save(tx);

    await this.auditService.log({
      userId: user?.id,
      action: 'petty_cash_top_up',
      resourceType: 'PETTY_CASH_TRANSACTION',
      resourceId: tx.id,
      details: {
        amount: dto.amount,
        verificationId: witnessResult.verificationId,
        referenceNo: dto.referenceNo,
        balanceAfter: tx.floatBalanceAfter,
      },
    });

    return {
      transactionId: tx.id,
      txType: 'top_up',
      amount: dto.amount,
      floatBalanceAfter: tx.floatBalanceAfter,
      witnessVerificationId: witnessResult.verificationId,
    };
  }

  // ==================== 流水与余额 ====================

  async findTransactions(query: QueryTransactionDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const where: Record<string, unknown> = {};
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.txType) where.txType = query.txType;
    const [items, total] = await this.txRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { items, total, page, limit, floatBalance: await this.getBalance(query.academicYearId || '') };
  }

  /** 备用金余额 = Σ(top_up +) − Σ(expense −) */
  async getBalance(academicYearId: string): Promise<number> {
    const rows = await this.txRepository.find({
      where: academicYearId ? { academicYearId: academicYearId as any } : {},
    });
    return rows.reduce((sum, r) => {
      if (r.txType === PettyCashTxType.TOP_UP) return sum + Number(r.amount);
      return sum - Number(r.amount);
    }, 0);
  }

  async getFloatStatus(academicYearId: string) {
    const balance = await this.getBalance(academicYearId);
    return {
      balance,
      low: balance < LOW_BALANCE_THRESHOLD,
      empty: balance <= ZERO_BALANCE,
      message: balance <= ZERO_BALANCE
        ? '备用金余额为 0，请立即补充'
        : balance < LOW_BALANCE_THRESHOLD
          ? `备用金余额低于 HK$${LOW_BALANCE_THRESHOLD}，建议补充`
          : null,
    };
  }

  // ==================== helpers ====================

  private async resolveConfig(academicYearId?: string): Promise<PettyCashConfig> {
    // 若未传学年，回退到任一年份的已确认配置（仅为读取限额默认）
    const where = academicYearId
      ? { academicYearId, configStatus: PettyCashConfigStatus.CONFIRMED }
      : { configStatus: PettyCashConfigStatus.CONFIRMED };
    const config = await this.configRepository.findOne({ where: where as any });
    if (!config) {
      return this.configRepository.create({
        baseSingleLimit: 3000,
        cpiCurrent: 1.0,
        cpiBase: 1.0,
        effectiveSingleLimit: 3000,
        floatCap: 5000,
        floatLowThreshold: 500,
        configStatus: PettyCashConfigStatus.CONFIRMED,
      } as PettyCashConfig);
    }
    return config;
  }

  private computeWitnessLevel(amount: number, limit: number): WitnessLevel {
    if (amount > Math.min(limit, DOUBLE_WITNESS_AMOUNT)) return WitnessLevel.DOUBLE;
    return WitnessLevel.SINGLE;
  }

  private assertWorkflow(reimb: PettyCashReimbursement, allowed: PettyCashWorkflowStatus[]) {
    if (!allowed.includes(reimb.workflowStatus)) {
      throw new ConflictException({
        code: 'ILLEGAL_TRANSITION',
        message: `当前状态 ${reimb.workflowStatus} 不允许该操作`,
      });
    }
  }

  private async nextTransactionNo(prefix: string): Promise<string> {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const count = await this.reimbursRepository.count({
      where: { transactionNo: MoreThan(`${prefix}-${ymd}-`) },
    });
    return `${prefix}-${ymd}-${String(count + 1).padStart(4, '0')}`;
  }

  private async recordExpense(
    reimb: PettyCashReimbursement,
    balanceBefore: number,
    academicYearId: string,
    userId?: string,
  ) {
    const balanceAfter = Math.round((balanceBefore - reimb.amount) * 100) / 100;
    const tx = this.txRepository.create({
      academicYearId: academicYearId as any,
      txType: PettyCashTxType.EXPENSE,
      amount: reimb.amount,
      reimbursementId: reimb.id,
      floatBalanceAfter: balanceAfter,
      createdBy: userId as any,
    });
    await this.txRepository.save(tx);
  }
}
