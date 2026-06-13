import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Scholarship,
  ScholarshipApplication,
  ScholarshipDisbursement,
  ApplicationStatus,
  DisbursementStatus,
  ScholarshipStatus,
} from './scholarship.entity';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';

@Injectable()
export class ScholarshipService {
  constructor(
    @InjectRepository(Scholarship)
    private scholarshipRepo: Repository<Scholarship>,
    @InjectRepository(ScholarshipApplication)
    private applicationRepo: Repository<ScholarshipApplication>,
    @InjectRepository(ScholarshipDisbursement)
    private disbursementRepo: Repository<ScholarshipDisbursement>,
  ) {}

  // ====== Scholarship CRUD ======

  async createScholarship(dto: CreateScholarshipDto): Promise<Scholarship> {
    const scholarship = this.scholarshipRepo.create({
      ...dto,
      applicationStartDate: new Date(dto.applicationStartDate),
      applicationEndDate: new Date(dto.applicationEndDate),
      disbursementStartDate: dto.disbursementStartDate
        ? new Date(dto.disbursementStartDate)
        : null,
      disbursementEndDate: dto.disbursementEndDate
        ? new Date(dto.disbursementEndDate)
        : null,
    });
    return this.scholarshipRepo.save(scholarship);
  }

  async findAllScholarships(
    page: number = 1,
    limit: number = 10,
    status?: ScholarshipStatus,
  ): Promise<{ scholarships: Scholarship[]; total: number }> {
    const queryBuilder = this.scholarshipRepo.createQueryBuilder('s');
    if (status) {
      queryBuilder.where('s.status = :status', { status });
    }
    const [scholarships, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('s.createdAt', 'DESC')
      .getManyAndCount();
    return { scholarships, total };
  }

  async findOneScholarship(id: string): Promise<Scholarship> {
    const scholarship = await this.scholarshipRepo.findOne({ where: { id } });
    if (!scholarship) throw new NotFoundException('奖学金项目不存在');
    return scholarship;
  }

  async updateScholarship(
    id: string,
    dto: UpdateScholarshipDto,
  ): Promise<Scholarship> {
    const scholarship = await this.findOneScholarship(id);
    Object.assign(scholarship, dto);
    return this.scholarshipRepo.save(scholarship);
  }

  async removeScholarship(id: string): Promise<void> {
    await this.findOneScholarship(id);
    await this.scholarshipRepo.softDelete(id);
  }

  // ====== Application CRUD ======

  async createApplication(
    dto: CreateApplicationDto,
  ): Promise<ScholarshipApplication> {
    const scholarship = await this.findOneScholarship(dto.scholarshipId);
    if (scholarship.status !== ScholarshipStatus.ACTIVE) {
      throw new BadRequestException('该项目当前不可申请');
    }
    const application = this.applicationRepo.create(dto);
    return this.applicationRepo.save(application);
  }

  async findAllApplications(
    page: number = 1,
    limit: number = 10,
    filters: {
      scholarshipId?: string;
      studentId?: string;
      status?: ApplicationStatus;
    } = {},
  ): Promise<{ applications: ScholarshipApplication[]; total: number }> {
    const queryBuilder = this.applicationRepo
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.scholarship', 'scholarship')
      .leftJoinAndSelect('app.student', 'student')
      .leftJoinAndSelect('app.reviewer', 'reviewer');

    if (filters.scholarshipId) {
      queryBuilder.andWhere('app.scholarshipId = :scholarshipId', {
        scholarshipId: filters.scholarshipId,
      });
    }
    if (filters.studentId) {
      queryBuilder.andWhere('app.studentId = :studentId', {
        studentId: filters.studentId,
      });
    }
    if (filters.status) {
      queryBuilder.andWhere('app.status = :status', { status: filters.status });
    }

    const [applications, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('app.createdAt', 'DESC')
      .getManyAndCount();
    return { applications, total };
  }

  async findOneApplication(id: string): Promise<ScholarshipApplication> {
    const app = await this.applicationRepo.findOne({
      where: { id },
      relations: ['scholarship', 'student', 'reviewer'],
    });
    if (!app) throw new NotFoundException('申请记录不存在');
    return app;
  }

  async reviewApplication(
    id: string,
    dto: ReviewApplicationDto,
  ): Promise<ScholarshipApplication> {
    const app = await this.findOneApplication(id);
    if (
      app.status !== ApplicationStatus.SUBMITTED &&
      app.status !== ApplicationStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('只有提交或审核中的申请可以审批');
    }
    app.status = dto.status;
    app.reviewerId = dto.reviewerId;
    app.reviewedAt = new Date();
    app.reviewComment = dto.reviewComment;
    if (dto.approvedAmount !== undefined) {
      app.approvedAmount = dto.approvedAmount;
    }
    return this.applicationRepo.save(app);
  }

  async removeApplication(id: string): Promise<void> {
    await this.findOneApplication(id);
    await this.applicationRepo.softDelete(id);
  }

  // ====== Disbursement ======

  async createDisbursement(
    applicationId: string,
    amount: number,
    processedBy: string,
    bankAccount?: string,
    bankName?: string,
    recipientName?: string,
  ): Promise<ScholarshipDisbursement> {
    const app = await this.findOneApplication(applicationId);
    if (app.status !== ApplicationStatus.APPROVED) {
      throw new BadRequestException('只有已批准的申请才能发放');
    }
    const disbursement = this.disbursementRepo.create({
      applicationId,
      amount,
      processedBy,
      bankAccount,
      bankName,
      recipientName,
      status: DisbursementStatus.PENDING,
    });
    return this.disbursementRepo.save(disbursement);
  }

  async findAllDisbursements(
    page: number = 1,
    limit: number = 10,
    filters: { applicationId?: string; status?: DisbursementStatus } = {},
  ): Promise<{ disbursements: ScholarshipDisbursement[]; total: number }> {
    const queryBuilder = this.disbursementRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.application', 'application');

    if (filters.applicationId) {
      queryBuilder.andWhere('d.applicationId = :applicationId', {
        applicationId: filters.applicationId,
      });
    }
    if (filters.status) {
      queryBuilder.andWhere('d.status = :status', { status: filters.status });
    }

    const [disbursements, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('d.createdAt', 'DESC')
      .getManyAndCount();
    return { disbursements, total };
  }

  async markDisbursementSuccess(
    id: string,
    transactionId: string,
  ): Promise<ScholarshipDisbursement> {
    const d = await this.disbursementRepo.findOne({ where: { id } });
    if (!d) throw new NotFoundException('发放记录不存在');
    d.status = DisbursementStatus.DISBURSED;
    d.transactionId = transactionId;
    d.disbursedAt = new Date();
    return this.disbursementRepo.save(d);
  }

  async markDisbursementFailed(
    id: string,
    failureReason: string,
  ): Promise<ScholarshipDisbursement> {
    const d = await this.disbursementRepo.findOne({ where: { id } });
    if (!d) throw new NotFoundException('发放记录不存在');
    d.status = DisbursementStatus.FAILED;
    d.failureReason = failureReason;
    return this.disbursementRepo.save(d);
  }

  // ====== Stats ======

  async getStats(scholarshipId?: string): Promise<{
    totalApplications: number;
    approved: number;
    rejected: number;
    pending: number;
    totalDisbursed: number;
  }> {
    const queryBuilder = this.applicationRepo
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.scholarship', 'scholarship');

    if (scholarshipId) {
      queryBuilder.andWhere('app.scholarshipId = :scholarshipId', {
        scholarshipId,
      });
    }

    const apps = await queryBuilder.getMany();
    const totalApplications = apps.length;
    const approved = apps.filter(
      (a) => a.status === ApplicationStatus.APPROVED,
    ).length;
    const rejected = apps.filter(
      (a) => a.status === ApplicationStatus.REJECTED,
    ).length;
    const pending = apps.filter(
      (a) =>
        a.status === ApplicationStatus.SUBMITTED ||
        a.status === ApplicationStatus.UNDER_REVIEW,
    ).length;

    const disbQueryBuilder = this.disbursementRepo
      .createQueryBuilder('d')
      .select('SUM(d.amount)', 'total');
    if (scholarshipId) {
      disbQueryBuilder
        .leftJoin('d.application', 'app')
        .andWhere('app.scholarshipId = :scholarshipId', { scholarshipId });
    }
    const totalDisbursed = (await disbQueryBuilder.getRawOne())?.total || 0;

    return { totalApplications, approved, rejected, pending, totalDisbursed };
  }
}
