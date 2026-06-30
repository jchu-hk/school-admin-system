import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Not, IsNull } from 'typeorm';
import {
  TuitionPayment,
  TuitionStandard,
  TuitionPaymentStatus,
  SubStatus,
  SubsidyType,
} from './tuition.entity';
import {
  CreateTuitionStandardDto,
  UpdateTuitionStandardDto,
  TuitionStandardQueryDto,
  CreateTuitionPaymentDto,
  UpdateTuitionPaymentDto,
  TuitionPaymentQueryDto,
} from './dto/tuition.dto';

// ============ AC-04: Reconciliation Report Types ============
export interface ReconciliationReport {
  academicYear: string;
  generatedAt: string;
  summary: {
    totalStudents: number;
    totalReceivable: number;
    totalReceived: number;
    totalArrears: number;
    exemptCount: number;
    exemptAmount: number;
  };
  statusDistribution: {
    status: string;
    count: number;
    amount: number;
    percentage: number;
  }[];
  gradeDistribution: {
    grade: string;
    totalStudents: number;
    receivable: number;
    received: number;
    arrears: number;
  }[];
  overdueSummary: {
    totalOverdue: number;
    overdueAmount: number;
    overdueDays: number;
  };
  disputedSummary: {
    totalDisputed: number;
    disputedAmount: number;
  };
}

@Injectable()
export class TuitionService {
  constructor(
    @InjectRepository(TuitionStandard)
    private readonly standardRepository: Repository<TuitionStandard>,
    @InjectRepository(TuitionPayment)
    private readonly paymentRepository: Repository<TuitionPayment>,
  ) {}

  // ============ Tuition Standard Methods ============

  async createStandard(
    createDto: CreateTuitionStandardDto,
  ): Promise<TuitionStandard> {
    const existing = await this.standardRepository.findOne({
      where: {
        schoolId: createDto.schoolId || '',
        grade: createDto.grade,
        academicYear: createDto.academicYear,
      },
    });

    if (existing) {
      throw new ConflictException(
        `年级 ${createDto.grade} 在学年 ${createDto.academicYear} 的学费标准已存在`,
      );
    }

    const standard = this.standardRepository.create(createDto as any);
    const saved = await this.standardRepository.save(standard);
    return saved[0]; // save returns array for single entity
  }

  async findAllStandards(query: TuitionStandardQueryDto): Promise<{
    data: TuitionStandard[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const {
      page = 1,
      pageSize = 10,
      schoolId,
      grade,
      academicYear,
      isActive,
    } = query;

    const where: FindOptionsWhere<TuitionStandard> = {};

    if (schoolId) where.schoolId = schoolId;
    if (grade) where.grade = grade;
    if (academicYear) where.academicYear = academicYear;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await this.standardRepository.findAndCount({
      where,
      order: { academicYear: 'DESC', grade: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async findOneStandard(id: string): Promise<TuitionStandard> {
    const standard = await this.standardRepository.findOne({ where: { id } });
    if (!standard) {
      throw new NotFoundException(`学费标准 ID ${id} 不存在`);
    }
    return standard;
  }

  async updateStandard(
    id: string,
    updateDto: UpdateTuitionStandardDto,
  ): Promise<TuitionStandard> {
    const standard = await this.findOneStandard(id);
    Object.assign(standard, updateDto);
    return this.standardRepository.save(standard);
  }

  async removeStandard(id: string): Promise<void> {
    const standard = await this.findOneStandard(id);
    await this.standardRepository.remove(standard);
  }

  // ============ Tuition Payment Methods ============

  async createPayment(
    createDto: CreateTuitionPaymentDto,
  ): Promise<TuitionPayment> {
    const payment = this.paymentRepository.create({
      ...(createDto as any),
      ...createDto,
      paymentDate: createDto.paymentDate
        ? new Date(createDto.paymentDate)
        : null,
    } as TuitionPayment);
    return this.paymentRepository.save(payment);
  }

  async findAllPayments(query: TuitionPaymentQueryDto): Promise<{
    data: TuitionPayment[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const {
      page = 1,
      pageSize = 10,
      grade,
      academicYear,
      status,
      keyword,
    } = query;

    const where: FindOptionsWhere<TuitionPayment> = {};

    if (grade) where.grade = grade;
    if (academicYear) where.academicYear = academicYear;
    if (status) where.status = status;

    const [data, total] = await this.paymentRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    let filtered = data;
    if (keyword) {
      filtered = data.filter((p) =>
        p.studentName.toLowerCase().includes(keyword.toLowerCase()),
      );
    }

    return { data: filtered, total, page, pageSize };
  }

  async findOnePayment(id: string): Promise<TuitionPayment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['standard'],
    });
    if (!payment) {
      throw new NotFoundException(`缴费记录 ID ${id} 不存在`);
    }
    return payment;
  }

  async updatePayment(
    id: string,
    updateDto: UpdateTuitionPaymentDto,
  ): Promise<TuitionPayment> {
    const payment = await this.findOnePayment(id);
    Object.assign(payment, updateDto);
    if (updateDto.paymentDate) {
      payment.paymentDate = new Date(updateDto.paymentDate);
    }
    return this.paymentRepository.save(payment);
  }

  async removePayment(id: string): Promise<void> {
    const payment = await this.findOnePayment(id);
    await this.paymentRepository.remove(payment);
  }

  async findByStudent(studentId: string): Promise<TuitionPayment[]> {
    return this.paymentRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  // ============ AC-01: Subsidy/Exemption Methods ============

  /**
   * AC-01: Apply subsidy/exemption to a tuition payment
   * For full subsidy students: tuition=exempted, subsidy应付HK$550
   */
  async applySubsidy(
    paymentId: string,
    subsidyType: SubsidyType,
    subsidyAmount?: number,
    remark?: string,
  ): Promise<TuitionPayment> {
    const payment = await this.findOnePayment(paymentId);

    // For full exemption or exempted status
    if (
      subsidyType === SubsidyType.FULL ||
      subsidyType === SubsidyType.EXEMPTED
    ) {
      payment.status = 'exempted';
      // AC-01: Full subsidy should be HK$550
      payment.subsidyAmount =
        subsidyAmount || TuitionStandard.DEFAULT_FULL_SUBSIDY;
      payment.subsidyType = subsidyType;
      payment.subsidyRemark = remark || '全额资助';
    } else if (subsidyType === SubsidyType.PARTIAL) {
      payment.subsidyType = subsidyType;
      payment.subsidyAmount = subsidyAmount || 0;
      payment.subsidyRemark = remark;
    } else {
      // Remove subsidy
      payment.subsidyType = null;
      payment.subsidyAmount = null;
      payment.subsidyRemark = null;
      // Restore original status if was exempted
      if (payment.status === 'exempted') {
        payment.status = 'pending';
      }
    }

    return this.paymentRepository.save(payment);
  }

  /**
   * AC-01: Get subsidy summary for a payment
   */
  async getSubsidySummary(paymentId: string): Promise<{
    subsidyType: string;
    subsidyAmount: number;
    payableAmount: number;
    isExempted: boolean;
  }> {
    const payment = await this.findOnePayment(paymentId);
    const totalAmount = Number(payment.amount);
    const subsidyAmount = Number(payment.subsidyAmount) || 0;
    const isExempted =
      payment.status === 'exempted' ||
      payment.subsidyType === SubsidyType.EXEMPTED;

    return {
      subsidyType: payment.subsidyType || 'none',
      subsidyAmount,
      payableAmount: Math.max(0, totalAmount - subsidyAmount),
      isExempted,
    };
  }

  // ============ AC-04: Tuition Reconciliation Report ============

  /**
   * AC-04: Generate semester-end tuition reconciliation report
   * Shows: income, unpaid, status distribution
   */
  async generateReconciliationReport(
    academicYear: string,
  ): Promise<ReconciliationReport> {
    const payments = await this.paymentRepository.find({
      where: { academicYear },
    });

    // Calculate summary
    const totalStudents = new Set(payments.map((p) => p.studentId)).size;
    const totalReceivable = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const totalReceived = payments.reduce(
      (sum, p) => sum + Number(p.paidAmount || 0),
      0,
    );
    const totalArrears = totalReceivable - totalReceived;

    // Count exempt students
    const exemptPayments = payments.filter((p) => p.status === 'exempted');
    const exemptCount = new Set(exemptPayments.map((p) => p.studentId)).size;
    const exemptAmount = exemptPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    // Status distribution
    const statusCounts: Record<string, { count: number; amount: number }> = {};
    payments.forEach((p) => {
      const status = p.status;
      if (!statusCounts[status]) {
        statusCounts[status] = { count: 0, amount: 0 };
      }
      statusCounts[status].count++;
      statusCounts[status].amount += Number(p.amount);
    });

    const statusDistribution = Object.entries(statusCounts).map(
      ([status, data]) => ({
        status,
        count: data.count,
        amount: data.amount,
        percentage:
          payments.length > 0 ? (data.count / payments.length) * 100 : 0,
      }),
    );

    // Grade distribution
    const gradeData: Record<
      string,
      {
        totalStudents: number;
        receivable: number;
        received: number;
        arrears: number;
      }
    > = {};
    payments.forEach((p) => {
      const grade = p.grade || 'Unknown';
      if (!gradeData[grade]) {
        gradeData[grade] = {
          totalStudents: 0,
          receivable: 0,
          received: 0,
          arrears: 0,
        };
      }
      gradeData[grade].totalStudents++;
      gradeData[grade].receivable += Number(p.amount);
      gradeData[grade].received += Number(p.paidAmount || 0);
      gradeData[grade].arrears += Number(p.amount) - Number(p.paidAmount || 0);
    });

    const gradeDistribution = Object.entries(gradeData).map(
      ([grade, data]) => ({
        grade,
        ...data,
      }),
    );

    // Overdue summary
    const overduePayments = payments.filter(
      (p) => p.subStatus === SubStatus.OVERDUE,
    );
    const overdueSummary = {
      totalOverdue: overduePayments.length,
      overdueAmount: overduePayments.reduce(
        (sum, p) => sum + (Number(p.amount) - Number(p.paidAmount || 0)),
        0,
      ),
      overdueDays: Math.max(
        0,
        ...overduePayments.map((p) => p.overdueDays || 0),
      ),
    };

    // Disputed summary
    const disputedPayments = payments.filter(
      (p) => p.subStatus === SubStatus.DISPUTED,
    );
    const disputedSummary = {
      totalDisputed: disputedPayments.length,
      disputedAmount: disputedPayments.reduce(
        (sum, p) => sum + (Number(p.amount) - Number(p.paidAmount || 0)),
        0,
      ),
    };

    return {
      academicYear,
      generatedAt: new Date().toISOString(),
      summary: {
        totalStudents,
        totalReceivable,
        totalReceived,
        totalArrears,
        exemptCount,
        exemptAmount,
      },
      statusDistribution,
      gradeDistribution,
      overdueSummary,
      disputedSummary,
    };
  }

  // ============ AC-02: Overdue Check & Alert ============

  /**
   * AC-02: Check and update overdue payments
   * Updates sub_status to 'overdue' for late payments
   */
  async checkOverduePayments(): Promise<{
    updated: number;
    overdueList: {
      paymentId: string;
      studentName: string;
      overdueDays: number;
      amount: number;
    }[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find pending/partial payments with past due dates
    const payments = await this.paymentRepository.find({
      where: [
        { status: 'pending', paymentDeadline: Not(IsNull()) },
        { status: 'partial', paymentDeadline: Not(IsNull()) },
      ],
    });

    const overdueList: {
      paymentId: string;
      studentName: string;
      overdueDays: number;
      amount: number;
    }[] = [];
    let updated = 0;

    for (const payment of payments) {
      if (payment.paymentDeadline) {
        const dueDate = new Date(payment.paymentDeadline);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
          const overdueDays = Math.floor(
            (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
          );

          payment.subStatus = SubStatus.OVERDUE;
          payment.overdueDays = overdueDays;
          payment.lastOverdueCheckAt = new Date();
          payment.status = 'overdue';

          await this.paymentRepository.save(payment);
          updated++;

          overdueList.push({
            paymentId: payment.id,
            studentName: payment.studentName || 'Unknown',
            overdueDays,
            amount: Number(payment.amount) - Number(payment.paidAmount || 0),
          });
        }
      }
    }

    return { updated, overdueList };
  }

  // ============ AC-03: Dispute Management ============

  /**
   * AC-03: Create dispute for a payment (parent appeal)
   * Updates sub_status to 'disputed', pauses collection
   */
  async createDispute(
    paymentId: string,
    reason: string,
    _userId: string,
  ): Promise<TuitionPayment> {
    const payment = await this.findOnePayment(paymentId);

    if (payment.subStatus === SubStatus.DISPUTED) {
      throw new ConflictException('该缴费已在争议处理中');
    }

    payment.subStatus = SubStatus.DISPUTED;
    payment.disputeReason = reason;
    payment.status = 'pending'; // Pause collection

    return this.paymentRepository.save(payment);
  }

  /**
   * AC-03: Resolve dispute
   * Can adjust amount, waive payment, or maintain original
   */
  async resolveDispute(
    paymentId: string,
    resolution: 'adjusted' | 'waived' | 'maintained',
    newAmount?: number,
    _operatorId?: string,
  ): Promise<TuitionPayment> {
    const payment = await this.findOnePayment(paymentId);

    if (payment.subStatus !== SubStatus.DISPUTED) {
      throw new ConflictException('该缴费不在争议状态');
    }

    payment.disputeResolution = resolution;
    payment.disputeResolvedAt = new Date();

    if (resolution === 'adjusted' && newAmount !== undefined) {
      payment.amount = newAmount;
      payment.subStatus = SubStatus.NONE;
      payment.status = newAmount === 0 ? 'paid' : 'pending';
    } else if (resolution === 'waived') {
      payment.status = TuitionPaymentStatus.WAIVED;
      payment.subStatus = SubStatus.NONE;
    } else {
      // Maintained - resume normal status
      payment.subStatus = SubStatus.NONE;
      payment.status =
        Number(payment.amount) <= Number(payment.paidAmount)
          ? 'paid'
          : 'pending';
    }

    return this.paymentRepository.save(payment);
  }
}
