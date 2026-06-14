import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { TuitionStandard } from './tuition-standard.entity';
import { TuitionPayment } from './tuition-payment.entity';
import {
  CreateTuitionStandardDto,
  UpdateTuitionStandardDto,
  TuitionStandardQueryDto,
  CreateTuitionPaymentDto,
  UpdateTuitionPaymentDto,
  TuitionPaymentQueryDto,
} from './dto/tuition.dto';

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

    const standard = this.standardRepository.create(createDto);
    return this.standardRepository.save(standard);
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
      order: { academicYear: 'DESC', createdAt: 'DESC' },
    });
  }
}
