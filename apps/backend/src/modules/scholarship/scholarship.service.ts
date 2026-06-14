import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Scholarship } from './scholarship.entity';
import { ScholarshipApplication } from './scholarship-application.entity';
import {
  CreateScholarshipDto,
  UpdateScholarshipDto,
  ScholarshipQueryDto,
  ApplyScholarshipDto,
  ReviewScholarshipApplicationDto,
  ScholarshipApplicationQueryDto,
} from './dto/scholarship.dto';

@Injectable()
export class ScholarshipService {
  constructor(
    @InjectRepository(Scholarship)
    private readonly scholarshipRepository: Repository<Scholarship>,
    @InjectRepository(ScholarshipApplication)
    private readonly applicationRepository: Repository<ScholarshipApplication>,
  ) {}

  // ============ Scholarship Methods ============

  async create(createDto: CreateScholarshipDto): Promise<Scholarship> {
    const existing = await this.scholarshipRepository.findOne({
      where: { code: createDto.code },
    });

    if (existing) {
      throw new ConflictException(`奖学金代码 ${createDto.code} 已存在`);
    }

    const scholarship = this.scholarshipRepository.create({
      ...createDto,
      applicationDeadline: createDto.applicationDeadline
        ? new Date(createDto.applicationDeadline)
        : null,
    } as Scholarship);

    return this.scholarshipRepository.save(scholarship);
  }

  async findAll(
    query: ScholarshipQueryDto,
  ): Promise<{ data: Scholarship[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = 10, status, academicYear, keyword } = query;

    const where: FindOptionsWhere<Scholarship> = {};

    if (status) where.status = status;
    if (academicYear) where.academicYear = academicYear;
    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }

    const [data, total] = await this.scholarshipRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async findOne(id: string): Promise<Scholarship> {
    const scholarship = await this.scholarshipRepository.findOne({
      where: { id },
      relations: ['applications'],
    });

    if (!scholarship) {
      throw new NotFoundException(`奖学金 ID ${id} 不存在`);
    }

    return scholarship;
  }

  async update(id: string, updateDto: UpdateScholarshipDto): Promise<Scholarship> {
    const scholarship = await this.findOne(id);

    if (updateDto.code && updateDto.code !== scholarship.code) {
      const existing = await this.scholarshipRepository.findOne({
        where: { code: updateDto.code },
      });
      if (existing) {
        throw new ConflictException(`奖学金代码 ${updateDto.code} 已存在`);
      }
    }

    Object.assign(scholarship, updateDto);
    if (updateDto.applicationDeadline) {
      scholarship.applicationDeadline = new Date(updateDto.applicationDeadline);
    }
    return this.scholarshipRepository.save(scholarship);
  }

  async remove(id: string): Promise<void> {
    const scholarship = await this.findOne(id);
    await this.scholarshipRepository.remove(scholarship);
  }

  // ============ Scholarship Application Methods ============

  async apply(scholarshipId: string, applyDto: ApplyScholarshipDto): Promise<ScholarshipApplication> {
    const scholarship = await this.findOne(scholarshipId);

    if (scholarship.status !== 'open') {
      throw new BadRequestException('该奖学金当前不开放申请');
    }

    if (scholarship.applicationDeadline) {
      const now = new Date();
      if (now > new Date(scholarship.applicationDeadline)) {
        throw new BadRequestException('该奖学金申请已截止');
      }
    }

    const existing = await this.applicationRepository.findOne({
      where: { scholarshipId, studentId: applyDto.studentId },
    });

    if (existing) {
      throw new ConflictException('该学生已申请过此奖学金');
    }

    const application = this.applicationRepository.create({
      scholarshipId,
      ...applyDto,
    } as ScholarshipApplication);

    return this.applicationRepository.save(application);
  }

  async findAllApplications(
    query: ScholarshipApplicationQueryDto,
  ): Promise<{ data: ScholarshipApplication[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = 10, status, scholarshipId, keyword } = query;

    const where: FindOptionsWhere<ScholarshipApplication> = {};

    if (status) where.status = status;
    if (scholarshipId) where.scholarshipId = scholarshipId;

    const [data, total] = await this.applicationRepository.findAndCount({
      where,
      relations: ['scholarship'],
      order: { appliedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    let filtered = data;
    if (keyword) {
      filtered = data.filter((a) =>
        a.studentName.toLowerCase().includes(keyword.toLowerCase()),
      );
    }

    return { data: filtered, total, page, pageSize };
  }

  async findOneApplication(id: string): Promise<ScholarshipApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['scholarship'],
    });

    if (!application) {
      throw new NotFoundException(`申请记录 ID ${id} 不存在`);
    }

    return application;
  }

  async reviewApplication(
    id: string,
    reviewDto: ReviewScholarshipApplicationDto,
  ): Promise<ScholarshipApplication> {
    const application = await this.findOneApplication(id);

    if (application.status !== 'pending' && application.status !== 'reviewing') {
      throw new BadRequestException('该申请已审核，无法重复审核');
    }

    application.status = reviewDto.status;
    application.reviewedAt = new Date();

    if (reviewDto.reviewerComment) {
      application.reviewerComment = reviewDto.reviewerComment;
    }

    if (reviewDto.awardedAmount) {
      application.awardedAmount = reviewDto.awardedAmount;

      // Update scholarship used budget
      const scholarship = await this.findOne(application.scholarshipId);
      scholarship.usedBudget = Number(scholarship.usedBudget) + Number(reviewDto.awardedAmount);
      await this.scholarshipRepository.save(scholarship);
    }

    return this.applicationRepository.save(application);
  }
}
