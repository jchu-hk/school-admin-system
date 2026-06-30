import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull, FindOptionsWhere } from 'typeorm';
import {
  InstallmentPlan,
  InstallmentPlanStatus,
} from './installment-plan.entity';
import {
  InstallmentSchedule,
  InstallmentScheduleStatus,
} from './installment-schedule.entity';
import {
  InstallmentPlanReview,
  InstallmentReviewAction,
} from './installment-review.entity';
import { TuitionPayment } from './tuition.entity';
import {
  ApplyInstallmentDto,
  ReviewInstallmentDto,
  UpdateInstallmentStatusDto,
  PayInstallmentScheduleDto,
  CreateDisputeDto,
  ResolveDisputeDto,
  InstallmentPlanQueryDto,
  SubStatusQueryDto,
  InstallmentPlanResponseDto,
  ApplyInstallmentResponseDto,
  InstallmentScheduleResponseDto,
  EarlyRepaymentResponseDto,
  SubStatusResponseDto,
  SubStatusItemDto,
} from './dto/installment.dto';
import { UserRole } from '../user/user.entity';

@Injectable()
export class InstallmentService {
  constructor(
    @InjectRepository(InstallmentPlan)
    private readonly planRepository: Repository<InstallmentPlan>,
    @InjectRepository(InstallmentSchedule)
    private readonly scheduleRepository: Repository<InstallmentSchedule>,
    @InjectRepository(InstallmentPlanReview)
    private readonly reviewRepository: Repository<InstallmentPlanReview>,
    @InjectRepository(TuitionPayment)
    private readonly paymentRepository: Repository<TuitionPayment>,
  ) {}

  // ============ Apply for Installment (PARENT) ============

  async applyInstallment(
    dto: ApplyInstallmentDto,
    userId: string,
  ): Promise<ApplyInstallmentResponseDto> {
    // 1. Validate tuition payment exists
    const payment = await this.paymentRepository.findOne({
      where: { id: dto.tuitionPaymentId },
    });

    if (!payment) {
      throw new NotFoundException('缴费记录不存在');
    }

    // 2. Check if parent owns this payment
    if (payment.studentId !== userId && payment.parentId !== userId) {
      throw new ForbiddenException('您无权为该缴费记录申请分期');
    }

    // 3. Validate installment count (2-12)
    if (dto.installmentCount < 2 || dto.installmentCount > 12) {
      throw new BadRequestException('分期期数必须在2-12期之间');
    }

    // 4. Check no existing active/pending plan
    const existingPlan = await this.planRepository.findOne({
      where: {
        tuitionPaymentId: dto.tuitionPaymentId,
        status: In([
          InstallmentPlanStatus.PENDING_REVIEW,
          InstallmentPlanStatus.ACTIVE,
        ]),
      },
    });

    if (existingPlan) {
      throw new ConflictException('该缴费记录已存在进行中的分期计划');
    }

    // 5. Check payment amount is sufficient for installment
    const totalAmount = Number(payment.amount);
    if (totalAmount <= 0) {
      throw new BadRequestException('缴费金额无效');
    }

    // 6. Calculate installment amounts (last installment gets the remainder)
    const schedules = this.calculateSchedules(
      totalAmount,
      dto.installmentCount,
      new Date(),
    );

    // 7. Create plan and schedules
    const plan = this.planRepository.create({
      tuitionPaymentId: dto.tuitionPaymentId,
      studentId: payment.studentId,
      studentName: payment.studentName,
      parentId: payment.parentId || userId,
      totalAmount,
      installmentCount: dto.installmentCount,
      installmentAmount: schedules[0].amount,
      startDate: schedules[0].dueDate,
      endDate: schedules[schedules.length - 1].dueDate,
      status: InstallmentPlanStatus.PENDING_REVIEW,
      reviewNotes: dto.reason,
      createdBy: userId,
    });

    const savedPlan = await this.planRepository.save(plan);

    // 8. Create schedules
    const scheduleEntities = schedules.map((s, index) =>
      this.scheduleRepository.create({
        planId: savedPlan.id,
        sequence: index + 1,
        amount: s.amount,
        dueDate: s.dueDate,
        status: InstallmentScheduleStatus.PENDING,
        createdBy: userId,
      }),
    );

    await this.scheduleRepository.save(scheduleEntities);

    // 9. Update payment sub_status to pending
    payment.subStatus = 'installment_plan';
    payment.installmentPlanId = savedPlan.id;
    await this.paymentRepository.save(payment);

    return {
      planId: savedPlan.id,
      status: savedPlan.status,
      schedules: schedules.map((s, i) => ({
        id: scheduleEntities[i].id,
        sequence: i + 1,
        amount: s.amount,
        dueDate: this.formatDate(s.dueDate),
        paidDate: null,
        status: 'pending',
      })),
      message: '申请已提交，请等待财务审核',
    };
  }

  // ============ Calculate Installment Schedules ============

  private calculateSchedules(
    totalAmount: number,
    count: number,
    startDate: Date,
  ): { amount: number; dueDate: Date }[] {
    const baseAmount = Math.floor((totalAmount * 100) / count) / 100;
    const remainder =
      Math.round((totalAmount - baseAmount * count) * 100) / 100;

    const schedules: { amount: number; dueDate: Date }[] = [];
    const start = new Date(startDate);
    start.setDate(1); // First day of month

    for (let i = 0; i < count; i++) {
      const dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + i);

      const amount = i === count - 1 ? baseAmount + remainder : baseAmount;
      schedules.push({ amount, dueDate });
    }

    return schedules;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // ============ Get Installment Plan ============

  async getInstallmentPlan(
    planId: string,
    userId?: string,
    userRole?: UserRole,
  ): Promise<InstallmentPlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { id: planId },
      relations: ['schedules', 'tuitionPayment'],
    });

    if (!plan) {
      throw new NotFoundException('分期计划不存在');
    }

    // Access control
    if (userId && userRole === UserRole.PARENT) {
      if (plan.parentId !== userId && plan.studentId !== userId) {
        throw new ForbiddenException('您无权查看此分期计划');
      }
    }

    const schedules = await this.scheduleRepository.find({
      where: { planId },
      order: { sequence: 'ASC' },
    });

    return this.toPlanResponse(plan, schedules);
  }

  // ============ Get Student Installment Plans ============

  async getStudentInstallmentPlans(
    studentId: string,
    query: InstallmentPlanQueryDto,
  ): Promise<{
    data: InstallmentPlanResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const where: FindOptionsWhere<InstallmentPlan> = { studentId };
    if (query.status) {
      where.status = query.status as InstallmentPlanStatus;
    }

    const [plans, total] = await this.planRepository.findAndCount({
      where,
      relations: ['schedules'],
      order: { createdAt: 'DESC' },
      skip: ((query.page || 1) - 1) * (query.pageSize || 10),
      take: query.pageSize || 10,
    });

    const data = plans.map((plan) =>
      this.toPlanResponse(plan, plan.schedules || []),
    );

    return {
      data,
      total,
      page: query.page || 1,
      pageSize: query.pageSize || 10,
    };
  }

  // ============ Get Parent Installment Plans ============

  async getParentInstallmentPlans(
    parentId: string,
    query: InstallmentPlanQueryDto,
  ): Promise<{
    data: InstallmentPlanResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const where: FindOptionsWhere<InstallmentPlan> = { parentId };
    if (query.status) {
      where.status = query.status as InstallmentPlanStatus;
    }

    const [plans, total] = await this.planRepository.findAndCount({
      where,
      relations: ['schedules'],
      order: { createdAt: 'DESC' },
      skip: ((query.page || 1) - 1) * (query.pageSize || 10),
      take: query.pageSize || 10,
    });

    const data = plans.map((plan) =>
      this.toPlanResponse(plan, plan.schedules || []),
    );

    return {
      data,
      total,
      page: query.page || 1,
      pageSize: query.pageSize || 10,
    };
  }

  // ============ Get Pending Review Plans (FINANCE_STAFF) ============

  async getPendingReviewPlans(query: InstallmentPlanQueryDto): Promise<{
    data: InstallmentPlanResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const [plans, total] = await this.planRepository.findAndCount({
      where: { status: InstallmentPlanStatus.PENDING_REVIEW },
      relations: ['schedules'],
      order: { createdAt: 'ASC' },
      skip: ((query.page || 1) - 1) * (query.pageSize || 10),
      take: query.pageSize || 10,
    });

    const data = plans.map((plan) =>
      this.toPlanResponse(plan, plan.schedules || []),
    );

    return {
      data,
      total,
      page: query.page || 1,
      pageSize: query.pageSize || 10,
    };
  }

  // ============ Review Installment Plan (FINANCE_STAFF) ============

  async reviewInstallmentPlan(
    planId: string,
    dto: ReviewInstallmentDto,
    reviewerId: string,
  ): Promise<InstallmentPlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { id: planId },
      relations: ['schedules'],
    });

    if (!plan) {
      throw new NotFoundException('分期计划不存在');
    }

    if (plan.status !== InstallmentPlanStatus.PENDING_REVIEW) {
      throw new BadRequestException('该分期计划不在待审核状态');
    }

    if (dto.action === 'reject' && !dto.reason) {
      throw new BadRequestException('拒绝时必须填写原因');
    }

    // Check if already reviewed
    const existingReview = await this.reviewRepository.findOne({
      where: { planId },
    });

    if (existingReview) {
      throw new ConflictException('该分期申请已审核，请勿重复提交');
    }

    // Create review record
    const review = this.reviewRepository.create({
      planId,
      reviewerId,
      action:
        dto.action === 'approve'
          ? InstallmentReviewAction.APPROVE
          : InstallmentReviewAction.REJECT,
      reason: dto.action === 'reject' ? dto.reason : dto.notes,
    });
    await this.reviewRepository.save(review);

    // Update plan status
    plan.status =
      dto.action === 'approve'
        ? InstallmentPlanStatus.ACTIVE
        : InstallmentPlanStatus.CANCELLED;
    plan.reviewBy = reviewerId;
    plan.reviewAt = new Date();
    plan.reviewNotes = dto.notes || dto.reason;
    await this.planRepository.save(plan);

    // Update payment sub_status
    const payment = await this.paymentRepository.findOne({
      where: { id: plan.tuitionPaymentId },
    });
    if (payment) {
      payment.subStatus = dto.action === 'approve' ? 'installment_plan' : null;
      payment.installmentPlanId = dto.action === 'approve' ? plan.id : null;
      await this.paymentRepository.save(payment);
    }

    const schedules = await this.scheduleRepository.find({
      where: { planId },
      order: { sequence: 'ASC' },
    });

    return this.toPlanResponse(plan, schedules);
  }

  // ============ Update Installment Status ============

  async updateInstallmentStatus(
    planId: string,
    dto: UpdateInstallmentStatusDto,
    userId: string,
  ): Promise<InstallmentPlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { id: planId },
      relations: ['schedules'],
    });

    if (!plan) {
      throw new NotFoundException('分期计划不存在');
    }

    const validTransitions: Record<string, string[]> = {
      [InstallmentPlanStatus.PENDING_REVIEW]: [
        InstallmentPlanStatus.ACTIVE,
        InstallmentPlanStatus.CANCELLED,
      ],
      [InstallmentPlanStatus.ACTIVE]: [
        InstallmentPlanStatus.COMPLETED,
        InstallmentPlanStatus.CANCELLED,
        InstallmentPlanStatus.EXPIRED,
      ],
    };

    const allowed = validTransitions[plan.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `状态从 '${plan.status}' 无法转换为 '${dto.status}'`,
      );
    }

    plan.status = dto.status as InstallmentPlanStatus;
    plan.updatedBy = userId;
    if (dto.remark) {
      plan.reviewNotes = (plan.reviewNotes || '') + ` [${dto.remark}]`;
    }
    await this.planRepository.save(plan);

    // If cancelled, cancel all pending schedules
    if (dto.status === InstallmentPlanStatus.CANCELLED) {
      await this.scheduleRepository.update(
        { planId, status: InstallmentScheduleStatus.PENDING },
        { status: InstallmentScheduleStatus.CANCELLED, updatedBy: userId },
      );
    }

    // If completed, mark all schedules as paid
    if (dto.status === InstallmentPlanStatus.COMPLETED) {
      await this.scheduleRepository.update(
        { planId },
        {
          status: InstallmentScheduleStatus.PAID,
          paidDate: new Date(),
          updatedBy: userId,
        },
      );

      // Update payment
      const payment = await this.paymentRepository.findOne({
        where: { id: plan.tuitionPaymentId },
      });
      if (payment) {
        payment.subStatus = 'paid';
        payment.status = 'paid';
        await this.paymentRepository.save(payment);
      }
    }

    const schedules = await this.scheduleRepository.find({
      where: { planId },
      order: { sequence: 'ASC' },
    });

    return this.toPlanResponse(plan, schedules);
  }

  // ============ Pay Installment Schedule ============

  async paySchedule(
    scheduleId: string,
    dto: PayInstallmentScheduleDto,
    userId: string,
  ): Promise<InstallmentScheduleResponseDto> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['plan'],
    });

    if (!schedule) {
      throw new NotFoundException('分期记录不存在');
    }

    if (
      schedule.plan.parentId !== userId &&
      schedule.plan.studentId !== userId
    ) {
      throw new ForbiddenException('无权操作此分期计划');
    }

    if (schedule.status === InstallmentScheduleStatus.PAID) {
      throw new BadRequestException('该期次已还款，无需重复还款');
    }

    if (schedule.status === InstallmentScheduleStatus.CANCELLED) {
      throw new BadRequestException('该期次已取消');
    }

    // Update schedule
    schedule.status = InstallmentScheduleStatus.PAID;
    schedule.paidDate = new Date();
    schedule.paidTransactionId = dto.transactionId;
    schedule.updatedBy = userId;
    await this.scheduleRepository.save(schedule);

    // Check if all schedules are paid → complete plan
    const allSchedules = await this.scheduleRepository.find({
      where: { planId: schedule.planId },
    });

    const allPaid = allSchedules.every(
      (s) =>
        s.status === InstallmentScheduleStatus.PAID ||
        s.status === InstallmentScheduleStatus.CANCELLED,
    );
    const anyPending = allSchedules.some(
      (s) => s.status === InstallmentScheduleStatus.PENDING,
    );

    if (!anyPending && allPaid) {
      const plan = await this.planRepository.findOne({
        where: { id: schedule.planId },
      });
      if (plan) {
        plan.status = InstallmentPlanStatus.COMPLETED;
        plan.updatedBy = userId;
        await this.planRepository.save(plan);

        // Update payment
        const payment = await this.paymentRepository.findOne({
          where: { id: plan.tuitionPaymentId },
        });
        if (payment) {
          payment.subStatus = 'paid';
          payment.status = 'paid';
          await this.paymentRepository.save(payment);
        }
      }
    }

    return {
      id: schedule.id,
      sequence: schedule.sequence,
      amount: Number(schedule.amount),
      dueDate: this.formatDate(schedule.dueDate),
      paidDate: schedule.paidDate ? this.formatDate(schedule.paidDate) : null,
      status: schedule.status,
    };
  }

  // ============ Early Repayment ============

  async getEarlyRepaymentAmount(
    planId: string,
  ): Promise<EarlyRepaymentResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { id: planId },
      relations: ['schedules'],
    });

    if (!plan) {
      throw new NotFoundException('分期计划不存在');
    }

    if (plan.status !== InstallmentPlanStatus.ACTIVE) {
      throw new BadRequestException('只能对生效中的分期计划申请提前还款');
    }

    // Check for overdue schedules
    const hasOverdue = plan.schedules?.some(
      (s) => s.status === InstallmentScheduleStatus.OVERDUE,
    );
    if (hasOverdue) {
      throw new BadRequestException(
        '存在逾期期次，需先处理逾期后再申请提前还款',
      );
    }

    // Calculate remaining principal
    const remainingSchedules =
      plan.schedules?.filter(
        (s) => s.status === InstallmentScheduleStatus.PENDING,
      ) || [];

    const remainingPrincipal = remainingSchedules.reduce(
      (sum, s) => sum + Number(s.amount),
      0,
    );

    return {
      remainingPrincipal,
      earlyRepaymentAmount: remainingPrincipal,
      message: `提前还款金额为剩余所有期次之和：$${remainingPrincipal.toFixed(2)}`,
    };
  }

  async confirmEarlyRepayment(
    planId: string,
    transactionId: string,
    userId: string,
  ): Promise<InstallmentPlanResponseDto> {
    const plan = await this.planRepository.findOne({
      where: { id: planId },
      relations: ['schedules'],
    });

    if (!plan) {
      throw new NotFoundException('分期计划不存在');
    }

    if (plan.status !== InstallmentPlanStatus.ACTIVE) {
      throw new BadRequestException('只能对生效中的分期计划确认提前还款');
    }

    // Mark all pending schedules as paid
    const pendingSchedules =
      plan.schedules?.filter(
        (s) => s.status === InstallmentScheduleStatus.PENDING,
      ) || [];

    if (pendingSchedules.length > 0) {
      await this.scheduleRepository.update(
        { planId, status: InstallmentScheduleStatus.PENDING },
        {
          status: InstallmentScheduleStatus.PAID,
          paidDate: new Date(),
          paidTransactionId: transactionId,
          updatedBy: userId,
        },
      );
    }

    // Complete plan
    plan.status = InstallmentPlanStatus.COMPLETED;
    plan.updatedBy = userId;
    await this.planRepository.save(plan);

    // Update payment
    const payment = await this.paymentRepository.findOne({
      where: { id: plan.tuitionPaymentId },
    });
    if (payment) {
      payment.subStatus = 'paid';
      payment.status = 'paid';
      await this.paymentRepository.save(payment);
    }

    const schedules = await this.scheduleRepository.find({
      where: { planId },
      order: { sequence: 'ASC' },
    });

    return this.toPlanResponse(plan, schedules);
  }

  // ============ Sub Status Query ============

  async getSubStatus(
    query: SubStatusQueryDto,
    userId?: string,
  ): Promise<SubStatusResponseDto> {
    const installmentPlan: SubStatusItemDto[] = [];
    const overdue: SubStatusItemDto[] = [];
    const disputed: SubStatusItemDto[] = [];

    // Get installment_plan sub_status payments
    if (!query.type || query.type === 'installment_plan') {
      const where: FindOptionsWhere<TuitionPayment> = {
        subStatus: 'installment_plan',
      };
      if (query.mine && userId) {
        where.parentId = userId;
      }

      const payments = await this.paymentRepository.find({
        where,
        relations: ['installmentPlan'],
      });

      for (const p of payments) {
        if (p.installmentPlan?.schedules) {
          const nextPending = p.installmentPlan.schedules.find(
            (s) => s.status === InstallmentScheduleStatus.PENDING,
          );
          installmentPlan.push({
            studentId: p.studentId,
            studentName: p.studentName,
            amount: nextPending ? Number(nextPending.amount) : Number(p.amount),
            dueDate: nextPending
              ? this.formatDate(nextPending.dueDate)
              : undefined,
            paymentId: p.id,
          });
        }
      }
    }

    // Get overdue sub_status payments
    if (!query.type || query.type === 'overdue') {
      const where: FindOptionsWhere<TuitionPayment> = {
        subStatus: 'overdue',
      };
      if (query.mine && userId) {
        where.parentId = userId;
      }

      const payments = await this.paymentRepository.find({
        where,
        relations: ['installmentPlan', 'installmentPlan.schedules'],
      });
      const today = new Date();

      for (const p of payments) {
        // 计算逾期天数：基于分期期次的到期日
        let overdueDays = 0;
        if (p.installmentPlan?.schedules) {
          const overdueSchedules = p.installmentPlan.schedules.filter(
            (s) => s.status === InstallmentScheduleStatus.OVERDUE,
          );
          if (overdueSchedules.length > 0) {
            // 取最早逾期的期次
            const earliestOverdue = overdueSchedules.reduce((earliest, s) => {
              const due = new Date(s.dueDate);
              return due < new Date(earliest.dueDate) ? s : earliest;
            });
            overdueDays = Math.floor(
              (today.getTime() - new Date(earliestOverdue.dueDate).getTime()) /
                (1000 * 60 * 60 * 24),
            );
          }
        }
        overdue.push({
          studentId: p.studentId,
          studentName: p.studentName,
          amount: Number(p.amount),
          overdueDays: overdueDays > 0 ? overdueDays : 0,
          paymentId: p.id,
        });
      }
    }

    // Get disputed sub_status payments
    if (!query.type || query.type === 'disputed') {
      const where: FindOptionsWhere<TuitionPayment> = {
        subStatus: 'disputed',
      };
      if (query.mine && userId) {
        where.parentId = userId;
      }

      const payments = await this.paymentRepository.find({ where });

      for (const p of payments) {
        disputed.push({
          studentId: p.studentId,
          studentName: p.studentName,
          amount: Number(p.amount),
          paymentId: p.id,
        });
      }
    }

    return { installmentPlan, overdue, disputed };
  }

  // ============ Dispute ============

  async createDispute(
    paymentId: string,
    _dto: CreateDisputeDto,
    _userId: string,
  ): Promise<{ message: string }> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('缴费记录不存在');
    }

    if (payment.subStatus === 'disputed') {
      throw new ConflictException('该缴费已在争议处理中');
    }

    payment.subStatus = 'disputed';
    await this.paymentRepository.save(payment);

    return { message: '争议已提交，财务人员将尽快处理' };
  }

  async resolveDispute(
    paymentId: string,
    dto: ResolveDisputeDto,
    _userId: string,
  ): Promise<{ message: string }> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('缴费记录不存在');
    }

    if (payment.subStatus !== 'disputed') {
      throw new BadRequestException('该缴费不在争议状态');
    }

    if (dto.resolution === 'adjusted' && dto.newAmount !== undefined) {
      payment.amount = dto.newAmount;
    }

    if (dto.resolution === 'waived') {
      payment.subStatus = 'paid';
      payment.status = 'paid';
    } else {
      payment.subStatus = payment.amount > 0 ? 'overdue' : 'paid';
    }

    await this.paymentRepository.save(payment);

    return { message: '争议已解决' };
  }

  // ============ Overdue Check (Cron Job) ============

  async checkOverdueSchedules(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find pending schedules past due date
    const overdueSchedules = await this.scheduleRepository.find({
      where: {
        status: InstallmentScheduleStatus.PENDING,
        dueDate: Not(IsNull()),
      },
      relations: ['plan'],
    });

    for (const schedule of overdueSchedules) {
      const dueDate = new Date(schedule.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        schedule.status = InstallmentScheduleStatus.OVERDUE;
        schedule.updatedBy = 'system';
        await this.scheduleRepository.save(schedule);

        // Update payment sub_status to overdue if not already
        if (schedule.plan) {
          const payment = await this.paymentRepository.findOne({
            where: { id: schedule.plan.tuitionPaymentId },
          });
          if (payment && payment.subStatus !== 'paid') {
            payment.subStatus = 'overdue';
            await this.paymentRepository.save(payment);
          }
        }
      }
    }
  }

  // ============ Helper ============

  private toPlanResponse(
    plan: InstallmentPlan,
    schedules: InstallmentSchedule[],
  ): InstallmentPlanResponseDto {
    return {
      id: plan.id,
      tuitionPaymentId: plan.tuitionPaymentId,
      studentId: plan.studentId,
      studentName:
        plan.studentName || (plan as any).tuitionPayment?.studentName || '',
      totalAmount: Number(plan.totalAmount),
      installmentCount: plan.installmentCount,
      installmentAmount: Number(plan.installmentAmount),
      startDate: this.formatDate(plan.startDate),
      endDate: plan.endDate ? this.formatDate(plan.endDate) : null,
      status: plan.status,
      reviewNotes: plan.reviewNotes,
      createdAt: plan.createdAt.toISOString(),
      schedules: schedules.map((s) => ({
        id: s.id,
        sequence: s.sequence,
        amount: Number(s.amount),
        dueDate: this.formatDate(s.dueDate),
        paidDate: s.paidDate ? this.formatDate(s.paidDate) : null,
        status: s.status,
      })),
    };
  }
}
