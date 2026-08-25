import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import {
  WitnessVerification,
  WitnessStep,
  WitnessType,
  WitnessStatus,
  WitnessStepStatus,
} from '../entities/witness.entity';
import {
  CreateWitnessVerificationDto,
  ConfirmWitnessDto,
  RejectWitnessDto,
  EscalateWitnessDto,
  CancelWitnessDto,
} from '../dto/witness.dto';
import { User, UserRole } from '../../user/user.entity';
import { AuditService } from '../../audit/audit.service';
import { NotificationService } from '../../notification/notification.service';
import { NotificationUrgency } from '../../notification/template.entity';
import { OtpService } from '../../otp/services/otp.service';
import { OtpType } from '../../otp/entities/otp.entity';

/** 所属角色的见证权限池：授权员工/主任/系统管理员（排除家长/学生） */
const WITNESS_ROLE_POOL: UserRole[] = [
  UserRole.SCHOOL_DIRECTOR,
  UserRole.SYSTEM_ADMIN,
  UserRole.SCHOOL_STAFF,
  UserRole.TEACHER,
];

const REMINDER_MINUTES = 30; // 30 分钟未处理 → 提醒见证人
const ESCALATION_MINUTES = 60; // 1 小时未处理 → 通知校务主任

@Injectable()
export class WitnessService {
  constructor(
    @InjectRepository(WitnessVerification)
    private readonly verificationRepository: Repository<WitnessVerification>,
    @InjectRepository(WitnessStep)
    private readonly stepRepository: Repository<WitnessStep>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly otpService: OtpService,
  ) {}

  /** 缓存单据状态 → 目标 step_order（后续锁定业务单据的联动钩子） */
  private getRequiredWitnesses(type: WitnessType): number {
    switch (type) {
      case WitnessType.CASH_RECEIPT:
        return 1;
      default:
        return 2;
    }
  }

  async create(
    user: User,
    dto: CreateWitnessVerificationDto,
    schoolId: string,
  ) {
    const requiredWitnesses = this.getRequiredWitnesses(dto.witnessType);
    const witnessIds = [dto.witness1Id, dto.witness2Id].filter(Boolean);

    // 见证人数校验
    if (witnessIds.length !== requiredWitnesses) {
      throw new BadRequestException({
        code: 'WITNESS_INVALID_COUNT',
        message: `需要的见证人数为 ${requiredWitnesses}，实际提供 ${witnessIds.length}`,
      });
    }

    // 见证人不得与发起人同人
    if (witnessIds.includes(user.id)) {
      throw new BadRequestException({
        code: 'WITNESS_SELF_SELECTED',
        message: '见证人不能与操作发起人是同一人',
      });
    }

    // 见证人之间不得同人（去重）
    if (new Set(witnessIds).size !== witnessIds.length) {
      throw new BadRequestException({
        code: 'WITNESS_INVALID_COUNT',
        message: '见证人不能重复',
      });
    }

    // 见证人角色池校验 + 载入数据库用户
    const witnesses = await this.userRepository.find({
      where: { id: In(witnessIds) },
    });
    if (witnesses.length !== witnessIds.length) {
      throw new BadRequestException({
        code: 'WITNESS_INVALID_COUNT',
        message: '见证人用户不存在',
      });
    }
    for (const w of witnesses) {
      if (!WITNESS_ROLE_POOL.includes(w.role)) {
        throw new ForbiddenException({
          code: 'WITNESS_ROLE_NOT_ALLOWED',
          message: `见证人 ${w.name} 的角色（${w.role}）不在授权见证角色池中`,
        });
      }
    }

    const verification = this.verificationRepository.create({
      witnessType: dto.witnessType,
      amount: dto.amount != null ? dto.amount.toString() : undefined,
      currency: dto.currency || 'HKD',
      businessRef: dto.businessRef || null,
      requesterId: user.id,
      witness1Id: dto.witness1Id || null,
      witness2Id: dto.witness2Id || null,
      requiredWitnesses,
      status: WitnessStatus.AWAIT_FIRST,
      schoolId,
    });

    // 创建见证步骤
    verification.steps = witnessIds.map((witnessId, idx) =>
      this.stepRepository.create({
        stepOrder: idx + 1,
        witnessId,
        status: WitnessStepStatus.PENDING,
        verificationId: verification.id || undefined,
      }),
    );

    await this.verificationRepository.save(verification);

    // 审计：witness_triggered
    await this.auditService.log({
      userId: user.id,
      action: 'witness_triggered',
      resourceType: 'WITNESS',
      resourceId: verification.id,
      details: {
        witnessType: dto.witnessType,
        amount: dto.amount,
        businessRef: dto.businessRef,
        requiredWitnesses,
        witness1Id: dto.witness1Id,
        witness2Id: dto.witness2Id,
        schoolId,
      },
    });

    await this.notifyAwaitingWitness(verification, 0);

    return this.toResponse(verification);
  }

  async findById(id: string, user: User) {
    const verification = await this.verificationRepository.findOne({
      where: { id },
      relations: ['steps', 'steps.witness', 'requester', 'witness1', 'witness2'],
    });
    if (!verification) {
      throw new NotFoundException({
        code: 'WITNESS_NOT_FOUND',
        message: '见证单不存在',
      });
    }
    const involved =
      verification.requesterId === user.id ||
      verification.witness1Id === user.id ||
      verification.witness2Id === user.id ||
      user.role === UserRole.SCHOOL_DIRECTOR ||
      user.role === UserRole.SYSTEM_ADMIN;
    if (!involved) {
      throw new ForbiddenException('您无权查看该见证单');
    }
    return verification;
  }

  async getMyPending(user: User) {
    const steps = await this.stepRepository.find({
      where: {
        witnessId: user.id,
        status: WitnessStepStatus.PENDING,
      },
      relations: ['verification'],
    });
    const pending = steps
      .map((s) => s.verification)
      .filter(
        (v) =>
          v &&
          (v.status === WitnessStatus.AWAIT_FIRST ||
            v.status === WitnessStatus.AWAIT_SECOND ||
            v.status === WitnessStatus.TRIGGERED),
      )
      .filter(
        (v, i, arr) => arr.findIndex((x) => x.id === v.id) === i,
      );
    return {
      count: pending.length,
      items: pending.map((v) => ({
        verification_id: v.id,
        witness_type: v.witnessType,
        amount: v.amount,
        business_ref: v.businessRef,
      })),
    };
  }

  async confirm(
    id: string,
    user: User,
    dto: ConfirmWitnessDto,
    clientIp?: string,
  ) {
    const verification = await this.verificationRepository.findOne({
      where: { id },
      relations: ['steps', 'requester', 'witness1', 'witness2'],
    });
    if (!verification) {
      throw new NotFoundException({
        code: 'WITNESS_NOT_FOUND',
        message: '见证单不存在',
      });
    }
    this.assertNotTerminal(verification.status, id);

    // 超时已升级 → 禁止继续
    if (verification.status === WitnessStatus.ESCALATED) {
      throw new ConflictException({
        code: 'WITNESS_TIMEOUT_ESCALATED',
        message: '见证单已超时升级至校务主任，请等待处理',
      });
    }

    // 找出当前应处理的 pending 步骤
    const currentStep = verification.steps.find(
      (s) => s.status === WitnessStepStatus.PENDING,
    );
    if (!currentStep) {
      throw new ConflictException({
        code: 'WITNESS_ALREADY_DECIDED',
        message: '见证单已无待处理步骤',
      });
    }

    // 必须是当前步骤见证人本人
    if (currentStep.witnessId !== user.id) {
      throw new ForbiddenException({
        code: 'NOT_YOUR_STEP',
        message: '当前不是您的见证步骤',
      });
    }
    // 该步骤已处理
    if (currentStep.status !== WitnessStepStatus.PENDING) {
      throw new ForbiddenException({
        code: 'WITNESS_ALREADY_DECIDED',
        message: '该见证步骤已处理',
      });
    }

    // 本人二次认证（短信 OTP）衔接
    await this.verifyWitnessOtp(user, dto, id, clientIp);

    currentStep.status = WitnessStepStatus.APPROVED;
    currentStep.comment = dto.comment || null;
    currentStep.ip = clientIp || null;
    currentStep.otpVerified = true;
    currentStep.decidedAt = new Date();
    await this.stepRepository.save(currentStep);

    // 审计：witness_approved_step
    await this.auditService.log({
      userId: user.id,
      action: 'witness_approved_step',
      resourceType: 'WITNESS',
      resourceId: verification.id,
      details: {
        stepOrder: currentStep.stepOrder,
        witnessId: user.id,
        comment: dto.comment,
        ip: clientIp,
      },
    });

    const decidedCount = verification.steps.filter(
      (s) => s.status === WitnessStepStatus.APPROVED,
    ).length;

    // 是否还有后续见证人待处理
    if (decidedCount < verification.requiredWitnesses) {
      verification.status = WitnessStatus.AWAIT_SECOND;
      await this.verificationRepository.save(verification);
      const nextWitnessId = verification.steps
        .find((s) => s.status === WitnessStepStatus.PENDING)?.witnessId;
      await this.notifyAwaitingWitness(verification, decidedCount);
      return {
        verificationId: verification.id,
        status: WitnessStatus.AWAIT_SECOND,
        nextWitnessId: nextWitnessId || null,
      };
    }

    // 全部见证完成 → 锁定
    verification.status = WitnessStatus.COMPLETED;
    verification.completedAt = new Date();
    verification.escalationNotified = false;
    await this.verificationRepository.save(verification);

    // 审计：witness_completed
    await this.auditService.log({
      userId: user.id,
      action: 'witness_completed',
      resourceType: 'WITNESS',
      resourceId: verification.id,
      details: {
        completedAt: verification.completedAt,
        businessRef: verification.businessRef,
      },
    });

    // TODO: 回调锁业务单据（报销/收支/备用金状态机联动）
    return this.toResponse(verification);
  }

  async reject(
    id: string,
    user: User,
    dto: RejectWitnessDto,
    clientIp?: string,
  ) {
    const verification = await this.verificationRepository.findOne({
      where: { id },
      relations: ['steps', 'requester', 'witness1', 'witness2'],
    });
    if (!verification) {
      throw new NotFoundException({
        code: 'WITNESS_NOT_FOUND',
        message: '见证单不存在',
      });
    }
    this.assertNotTerminal(verification.status, id);

    const currentStep = verification.steps.find(
      (s) => s.status === WitnessStepStatus.PENDING,
    );
    if (!currentStep) {
      throw new ConflictException({
        code: 'WITNESS_ALREADY_DECIDED',
        message: '见证单已无待处理步骤',
      });
    }
    if (currentStep.witnessId !== user.id) {
      throw new ForbiddenException({
        code: 'NOT_YOUR_STEP',
        message: '当前不是您的见证步骤',
      });
    }

    currentStep.status = WitnessStepStatus.REJECTED;
    currentStep.comment = dto.rejectionReason;
    currentStep.ip = clientIp || null;
    currentStep.decidedAt = new Date();
    await this.stepRepository.save(currentStep);

    verification.status = WitnessStatus.REJECTED;
    verification.rejectionReason = dto.rejectionReason;
    await this.verificationRepository.save(verification);

    // 审计：witness_rejected
    await this.auditService.log({
      userId: user.id,
      action: 'witness_rejected',
      resourceType: 'WITNESS',
      resourceId: verification.id,
      details: {
        stepOrder: currentStep.stepOrder,
        witnessId: user.id,
        rejectionReason: dto.rejectionReason,
        ip: clientIp,
      },
    });

    // 通知发起人
    await this.notificationService.sendNotification(
      {
        recipientIds: [verification.requesterId],
        title: '双人见证被拒绝',
        content: `您的见证申请（${verification.businessRef || verification.id}）被见证人拒绝。原因：${dto.rejectionReason}`,
        recipientType: 'staff',
        urgency: NotificationUrgency.HIGH,
      },
      undefined,
      undefined,
    );

    return { status: WitnessStatus.REJECTED };
  }

  async escalate(
    id: string,
    user: User,
    dto: EscalateWitnessDto,
  ) {
    const verification = await this.verificationRepository.findOne({
      where: { id },
      relations: ['steps'],
    });
    if (!verification) {
      throw new NotFoundException({
        code: 'WITNESS_NOT_FOUND',
        message: '见证单不存在',
      });
    }
    if (
      user.role !== UserRole.SCHOOL_DIRECTOR &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException('仅校务主任可执行升级处理');
    }
    this.assertNotTerminal(verification.status, id);

    // 可指定替代见证人
    if (dto.replacementWitnessId) {
      const currentStep = verification.steps.find(
        (s) => s.status === WitnessStepStatus.PENDING,
      );
      if (currentStep) {
        currentStep.witnessId = dto.replacementWitnessId;
        await this.stepRepository.save(currentStep);
      }
    }

    verification.status = WitnessStatus.ESCALATED;
    verification.escalationNotified = true;
    await this.verificationRepository.save(verification);

    // 审计：witness_escalated
    await this.auditService.log({
      userId: user.id,
      action: 'witness_escalated',
      resourceType: 'WITNESS',
      resourceId: verification.id,
      details: {
        replacementWitnessId: dto.replacementWitnessId || null,
        handledBy: user.id,
      },
    });

    return {
      status: WitnessStatus.ESCALATED,
      replacementWitnessId: dto.replacementWitnessId || null,
    };
  }

  async cancel(id: string, user: User, dto: CancelWitnessDto) {
    const verification = await this.verificationRepository.findOne({
      where: { id },
      relations: ['steps'],
    });
    if (!verification) {
      throw new NotFoundException({
        code: 'WITNESS_NOT_FOUND',
        message: '见证单不存在',
      });
    }
    if (
      verification.requesterId !== user.id &&
      user.role !== UserRole.SYSTEM_ADMIN &&
      user.role !== UserRole.SCHOOL_DIRECTOR
    ) {
      throw new ForbiddenException({
        code: 'NOT_REQUESTER',
        message: '仅发起人或审批角色可作废见证单',
      });
    }
    this.assertNotTerminal(verification.status, id);

    verification.status = WitnessStatus.CANCELLED;
    verification.rejectionReason = dto.reason || '由发起人作废';
    await this.verificationRepository.save(verification);

    await this.auditService.log({
      userId: user.id,
      action: 'witness_cancelled',
      resourceType: 'WITNESS',
      resourceId: verification.id,
      details: { reason: verification.rejectionReason },
    });

    return { status: WitnessStatus.CANCELLED };
  }

  /**
   * 超时检查（每分钟由 ScheduleModule 触发）：
   * - 30 分钟未处理 → 提醒见证人
   * - 60 分钟未处理 → 升级校务主任
   */
  @Cron('*/1 * * * *')
  async checkTimeouts() {
    const now = Date.now();
    const pendingVerifications = await this.verificationRepository.find({
      where: {
        status: In([
          WitnessStatus.TRIGGERED,
          WitnessStatus.AWAIT_FIRST,
          WitnessStatus.AWAIT_SECOND,
        ]),
      },
      relations: ['steps', 'steps.witness'],
    });

    for (const v of pendingVerifications) {
      const oldestPending = v.steps
        .filter((s) => s.status === WitnessStepStatus.PENDING)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      if (!oldestPending || !v.createdAt) continue;

      const createdTs = v.createdAt.getTime();
      const elapsedMin = (now - createdTs) / 60000;

      // 1 小时 → 升级（幂等，仅一次）
      if (elapsedMin >= ESCALATION_MINUTES && !v.escalationNotified) {
        v.status = WitnessStatus.ESCALATED;
        v.escalationNotified = true;
        await this.verificationRepository.save(v);
        await this.auditService.log({
          userId: undefined,
          action: 'witness_escalated',
          resourceType: 'WITNESS',
          resourceId: v.id,
          details: {
            auto: true,
            reason: '超时 60 分钟未处理',
            elapsedMinutes: Math.round(elapsedMin),
          },
        });
        await this.notifySchoolDirector(v);
        continue;
      }

      // 30 分钟 → 提醒（不改变状态）
      if (elapsedMin >= REMINDER_MINUTES && elapsedMin < ESCALATION_MINUTES) {
        await this.notificationService.sendNotification(
          {
            recipientIds: [oldestPending.witnessId],
            title: '双人见证待处理（超时提醒）',
            content: `见证单（${v.businessRef || v.id}）已等待 ${Math.round(elapsedMin)} 分钟，请及时处理，1 小时内未处理将升级至校务主任。`,
            recipientType: 'staff',
            urgency: NotificationUrgency.HIGH,
          },
          undefined,
          undefined,
        );
      }
    }
  }

  // ====================== private helpers ======================

  private assertNotTerminal(status: WitnessStatus, id: string) {
    if (
      status === WitnessStatus.COMPLETED ||
      status === WitnessStatus.REJECTED ||
      status === WitnessStatus.CANCELLED
    ) {
      throw new BadRequestException({
        code: 'WITNESS_ALREADY_DECIDED',
        message: '见证单已处于终态，无法继续操作',
      });
    }
  }

  /** 短信 OTP 二次认证（衔接 otp 模块） */
  private async verifyWitnessOtp(
    user: User,
    dto: ConfirmWitnessDto,
    verificationId: string,
    clientIp?: string,
  ) {
    try {
      await this.otpService.verifyOtp(
        user,
        { sessionId: dto.sessionId, code: dto.otp, otpType: OtpType.SMS },
        undefined,
        clientIp,
      );
    } catch (e) {
      await this.auditService.log({
        userId: user.id,
        action: 'witness_2fa_failed',
        resourceType: 'WITNESS',
        resourceId: verificationId,
        details: { error: e?.message, ip: clientIp },
      });
      throw new BadRequestException({
        code: 'WITNESS_2FA_FAILED',
        message: '短信 OTP 二次认证失败，无法代他人确认',
      });
    }
  }

  private async notifyAwaitingWitness(
    verification: WitnessVerification,
    decidedCount: number,
  ) {
    const next = verification.steps
      .filter((s) => s.status === WitnessStepStatus.PENDING)
      .sort((a, b) => a.stepOrder - b.stepOrder)[0];
    if (!next) return;
    await this.notificationService.sendNotification(
      {
        recipientIds: [next.witnessId],
        title: '新的双人见证待处理',
        content: `您有一条双人见证（${verification.witnessType}）待确认：${verification.businessRef || verification.id}`,
        recipientType: 'staff',
        urgency: NotificationUrgency.HIGH,
      },
      undefined,
      undefined,
    );
  }

  private async notifySchoolDirector(verification: WitnessVerification) {
    const directors = await this.userRepository.find({
      where: { role: UserRole.SCHOOL_DIRECTOR },
    });
    if (directors.length === 0) return;
    await this.notificationService.sendNotification(
      {
        recipientIds: directors.map((d) => d.id),
        title: '双人见证超时，需校务主任介入',
        content: `见证单（${verification.businessRef || verification.id}）超时未处理，请指定替代见证人或处理（升级/作废）。`,
        recipientType: 'staff',
        urgency: NotificationUrgency.CRITICAL,
      },
      undefined,
      undefined,
    );
  }

  private toResponse(v: WitnessVerification): any {
    return {
      verificationId: v.id,
      status: v.status,
      completedAt: v.completedAt,
      businessLocked: v.status === WitnessStatus.COMPLETED,
      requiredWitnesses: v.requiredWitnesses,
      witness1Id: v.witness1Id,
      witness2Id: v.witness2Id,
    };
  }
}
