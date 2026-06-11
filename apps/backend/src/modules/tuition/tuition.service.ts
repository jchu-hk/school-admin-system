import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TuitionStandard,
  TuitionPayment,
  TuitionArrears,
  TuitionStatus,
} from './tuition.entity';
import {
  CreateTuitionStandardDto,
  UpdateTuitionStandardDto,
  CreateTuitionPaymentDto,
  UpdateTuitionPaymentDto,
  PayTuitionDto,
} from './dto/tuition.dto';

@Injectable()
export class TuitionService {
  constructor(
    @InjectRepository(TuitionStandard)
    private standardRepository: Repository<TuitionStandard>,
    @InjectRepository(TuitionPayment)
    private paymentRepository: Repository<TuitionPayment>,
    @InjectRepository(TuitionArrears)
    private arrearsRepository: Repository<TuitionArrears>,
  ) {}

  // ===== TuitionStandard =====

  async findAllStandards(
    page: number = 1,
    limit: number = 10,
    schoolId?: string,
    gradeId?: string,
    isActive?: boolean,
  ) {
    const queryBuilder = this.standardRepository
      .createQueryBuilder('standard')
      .where('standard.deletedAt IS NULL');

    if (schoolId) {
      queryBuilder.andWhere('standard.schoolId = :schoolId', { schoolId });
    }
    if (gradeId) {
      queryBuilder.andWhere('standard.gradeId = :gradeId', { gradeId });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('standard.isActive = :isActive', { isActive });
    }

    const [standards, total] = await queryBuilder
      .orderBy('standard.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { standards, total };
  }

  async findStandardById(id: string): Promise<TuitionStandard> {
    const standard = await this.standardRepository.findOne({
      where: { id, deletedAt: null },
    });
    if (!standard) {
      throw new NotFoundException('学费标准不存在');
    }
    return standard;
  }

  async createStandard(dto: CreateTuitionStandardDto): Promise<TuitionStandard> {
    const standard = this.standardRepository.create(dto);
    return this.standardRepository.save(standard);
  }

  async updateStandard(id: string, dto: UpdateTuitionStandardDto): Promise<TuitionStandard> {
    const standard = await this.findStandardById(id);
    Object.assign(standard, dto);
    return this.standardRepository.save(standard);
  }

  async deleteStandard(id: string): Promise<void> {
    const standard = await this.findStandardById(id);
    await this.standardRepository.softRemove(standard);
  }

  // ===== TuitionPayment =====

  async findAllPayments(
    page: number = 1,
    limit: number = 10,
    studentId?: string,
    parentId?: string,
    status?: TuitionStatus,
    schoolId?: string,
  ) {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.tuitionStandard', 'tuitionStandard')
      .leftJoinAndSelect('payment.parent', 'parent')
      .leftJoinAndSelect('payment.operator', 'operator')
      .where('payment.deletedAt IS NULL');

    if (studentId) {
      queryBuilder.andWhere('payment.studentId = :studentId', { studentId });
    }
    if (parentId) {
      queryBuilder.andWhere('payment.parentId = :parentId', { parentId });
    }
    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }
    if (schoolId) {
      queryBuilder.andWhere('tuitionStandard.schoolId = :schoolId', { schoolId });
    }

    const [payments, total] = await queryBuilder
      .orderBy('payment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { payments, total };
  }

  async findPaymentById(id: string): Promise<TuitionPayment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['tuitionStandard', 'parent', 'operator'],
    });
    if (!payment) {
      throw new NotFoundException('缴费记录不存在');
    }
    return payment;
  }

  async createPayment(dto: CreateTuitionPaymentDto): Promise<TuitionPayment> {
    const standard = await this.findStandardById(dto.tuitionStandardId);

    const payment = this.paymentRepository.create({
      ...dto,
      totalAmount: standard.amount,
      status: TuitionStatus.PENDING,
      paidAmount: 0,
    });

    return this.paymentRepository.save(payment);
  }

  async updatePayment(id: string, dto: UpdateTuitionPaymentDto, operatorId: string): Promise<TuitionPayment> {
    const payment = await this.findPaymentById(id);

    if (dto.status && dto.status !== payment.status) {
      if (dto.status === TuitionStatus.PAID) {
        payment.paidAt = new Date();
        payment.paidAmount = payment.totalAmount;
        dto.paidAmount = payment.totalAmount;
      }
    }

    Object.assign(payment, dto);
    if (operatorId) {
      payment.operatorId = operatorId;
    }

    return this.paymentRepository.save(payment);
  }

  async payTuition(id: string, dto: PayTuitionDto, operatorId: string): Promise<TuitionPayment> {
    const payment = await this.findPaymentById(id);

    if (payment.status === TuitionStatus.PAID) {
      throw new BadRequestException('该缴费已完成');
    }

    const newPaidAmount = Number(payment.paidAmount) + dto.amount;
    const remainingAmount = Number(payment.totalAmount) - newPaidAmount;

    if (newPaidAmount > Number(payment.totalAmount)) {
      throw new BadRequestException('支付金额超出应缴金额');
    }

    payment.paidAmount = newPaidAmount;
    payment.paymentMethod = dto.paymentMethod;
    payment.transactionNo = dto.transactionNo;
    payment.operatorId = operatorId;

    if (remainingAmount <= 0) {
      payment.status = TuitionStatus.PAID;
      payment.paidAt = new Date();
      payment.arrearsAmount = 0;
    } else {
      payment.status = TuitionStatus.PARTIAL;
      payment.arrearsAmount = remainingAmount;
    }

    if (dto.remark) {
      payment.remark = dto.remark;
    }

    return this.paymentRepository.save(payment);
  }

  async deletePayment(id: string): Promise<void> {
    const payment = await this.findPaymentById(id);
    await this.paymentRepository.softRemove(payment);
  }

  // ===== TuitionArrears =====

  async findAllArrears(page: number = 1, limit: number = 10, studentId?: string) {
    const queryBuilder = this.arrearsRepository
      .createQueryBuilder('arrears')
      .leftJoinAndSelect('arrears.tuitionPayment', 'tuitionPayment')
      .leftJoinAndSelect('tuitionPayment.student', 'student')
      .where('arrears.deletedAt IS NULL');

    if (studentId) {
      queryBuilder.andWhere('arrears.studentId = :studentId', { studentId });
    }

    const [arrears, total] = await queryBuilder
      .orderBy('arrears.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { arrears, total };
  }

  async getTuitionStats(schoolId?: string): Promise<{
    totalStudents: number;
    paidCount: number;
    pendingCount: number;
    partialCount: number;
    overdueCount: number;
    totalAmount: number;
    paidAmount: number;
    arrearsAmount: number;
  }> {
    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.tuitionStandard', 'standard')
      .where('payment.deletedAt IS NULL');

    if (schoolId) {
      qb.andWhere('standard.schoolId = :schoolId', { schoolId });
    }

    const payments = await qb.getMany();

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.totalAmount), 0);
    const paidAmount = payments.reduce((sum, p) => sum + Number(p.paidAmount), 0);

    const paidCount = payments.filter((p) => p.status === TuitionStatus.PAID).length;
    const pendingCount = payments.filter((p) => p.status === TuitionStatus.PENDING).length;
    const partialCount = payments.filter((p) => p.status === TuitionStatus.PARTIAL).length;
    const overdueCount = payments.filter((p) => p.status === TuitionStatus.OVERDUE).length;

    return {
      totalStudents: payments.length,
      paidCount,
      pendingCount,
      partialCount,
      overdueCount,
      totalAmount,
      paidAmount,
      arrearsAmount: totalAmount - paidAmount,
    };
  }
}
