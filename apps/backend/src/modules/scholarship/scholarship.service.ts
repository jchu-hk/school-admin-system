import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, IsNull } from 'typeorm';
import { Scholarship } from './scholarship.entity';
import { ScholarshipApplication } from './scholarship-application.entity';
import { User } from '../user/user.entity';
import {
  CreateScholarshipDto,
  UpdateScholarshipDto,
  ScholarshipQueryDto,
  ApplyScholarshipDto,
  ReviewScholarshipApplicationDto,
  ScholarshipApplicationQueryDto,
  APPLICATION_STATUSES,
} from './dto/scholarship.dto';

@Injectable()
export class ScholarshipService {
  constructor(
    @InjectRepository(Scholarship)
    private readonly scholarshipRepository: Repository<Scholarship>,
    @InjectRepository(ScholarshipApplication)
    private readonly applicationRepository: Repository<ScholarshipApplication>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ============ Scholarship Methods ============

  async create(createDto: CreateScholarshipDto, userId: string): Promise<Scholarship> {
    const scholarship = this.scholarshipRepository.create({
      ...createDto,
      applicationStartDate: new Date(createDto.applicationStartDate),
      applicationEndDate: new Date(createDto.applicationEndDate),
      disbursementStartDate: createDto.disbursementStartDate
        ? new Date(createDto.disbursementStartDate)
        : null,
      disbursementEndDate: createDto.disbursementEndDate
        ? new Date(createDto.disbursementEndDate)
        : null,
      createdBy: userId,
    } as Scholarship);

    return this.scholarshipRepository.save(scholarship);
  }

  async findAll(query: ScholarshipQueryDto): Promise<{
    data: Scholarship[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 10, status, scholarshipType, keyword } = query;

    const where: FindOptionsWhere<Scholarship> = {
      deletedAt: IsNull(),
    };

    if (status) where.status = status;
    if (scholarshipType) where.scholarshipType = scholarshipType;
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
      where: { id, deletedAt: IsNull() },
      relations: ['applications'],
    });

    if (!scholarship) {
      throw new NotFoundException(`奖学金 ID ${id} 不存在`);
    }

    return scholarship;
  }

  async update(
    id: string,
    updateDto: UpdateScholarshipDto,
    userId: string,
  ): Promise<Scholarship> {
    const scholarship = await this.findOne(id);

    Object.assign(scholarship, updateDto);
    if (updateDto.applicationStartDate) {
      scholarship.applicationStartDate = new Date(updateDto.applicationStartDate);
    }
    if (updateDto.applicationEndDate) {
      scholarship.applicationEndDate = new Date(updateDto.applicationEndDate);
    }
    if (updateDto.disbursementStartDate) {
      scholarship.disbursementStartDate = new Date(updateDto.disbursementStartDate);
    }
    if (updateDto.disbursementEndDate) {
      scholarship.disbursementEndDate = new Date(updateDto.disbursementEndDate);
    }
    scholarship.updatedBy = userId;

    return this.scholarshipRepository.save(scholarship);
  }

  async remove(id: string): Promise<void> {
    const scholarship = await this.findOne(id);
    scholarship.deletedAt = new Date();
    await this.scholarshipRepository.save(scholarship);
  }

  // ============ Scholarship Application Methods ============

  async apply(
    scholarshipId: string,
    applyDto: ApplyScholarshipDto,
    studentId: string,
  ): Promise<ScholarshipApplication> {
    const scholarship = await this.findOne(scholarshipId);

    if (scholarship.status !== 'active') {
      throw new BadRequestException('该奖学金当前不开放申请');
    }

    const now = new Date();
    const startDate = new Date(scholarship.applicationStartDate);
    const endDate = new Date(scholarship.applicationEndDate);

    if (now < startDate) {
      throw new BadRequestException('该奖学金申请尚未开始');
    }
    if (now > endDate) {
      throw new BadRequestException('该奖学金申请已截止');
    }

    const existing = await this.applicationRepository.findOne({
      where: { scholarshipId, studentId, deletedAt: IsNull() },
    });

    if (existing) {
      throw new BadRequestException('该学生已申请过此奖学金');
    }

    const application = this.applicationRepository.create({
      scholarshipId,
      studentId,
      status: 'pending',
      applicationReason: applyDto.applicationReason,
      attachmentUrl: applyDto.attachmentUrl,
      createdBy: studentId,
    } as ScholarshipApplication);

    return this.applicationRepository.save(application);
  }

  async findAllApplications(query: ScholarshipApplicationQueryDto): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 10, status, scholarshipId, keyword } = query;

    const where: FindOptionsWhere<ScholarshipApplication> = {
      deletedAt: IsNull(),
    };

    if (status) where.status = status;
    if (scholarshipId) where.scholarshipId = scholarshipId;

    const [data, total] = await this.applicationRepository.findAndCount({
      where,
      relations: ['scholarship'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Enrich with student info
    const studentIds = [...new Set(data.map((a) => a.studentId))];
    const students = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids: studentIds })
      .getMany();

    const studentMap = new Map(students.map((s) => [s.id, s]));

    const enriched = data.map((app) => ({
      ...app,
      studentName: studentMap.get(app.studentId)?.name || '未知',
      studentUsername: studentMap.get(app.studentId)?.username || '',
      scholarshipName: app.scholarship?.name || '',
      scholarshipType: app.scholarship?.scholarshipType || '',
      scholarshipAmount: app.scholarship?.amount || 0,
    }));

    let filtered = enriched;
    if (keyword) {
      filtered = enriched.filter(
        (a) =>
          a.studentName.toLowerCase().includes(keyword.toLowerCase()) ||
          (a.studentUsername && a.studentUsername.toLowerCase().includes(keyword.toLowerCase())),
      );
    }

    return { data: filtered, total, page, pageSize };
  }

  async findOneApplication(id: string): Promise<any> {
    const application = await this.applicationRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['scholarship'],
    });

    if (!application) {
      throw new NotFoundException(`申请记录 ID ${id} 不存在`);
    }

    const student = await this.userRepository.findOne({
      where: { id: application.studentId },
    });

    return {
      ...application,
      studentName: student?.name || '未知',
      studentUsername: student?.username || '',
      scholarshipName: application.scholarship?.name || '',
      scholarshipType: application.scholarship?.scholarshipType || '',
      scholarshipAmount: application.scholarship?.amount || 0,
    };
  }

  async reviewApplication(
    id: string,
    reviewDto: ReviewScholarshipApplicationDto,
    reviewerId: string,
  ): Promise<ScholarshipApplication> {
    const application = await this.findOneApplication(id);

    const validStatuses: any[] = ['pending', 'under_review'];
    if (!validStatuses.includes(application.status)) {
      throw new BadRequestException('该申请已审核，无法重复审核');
    }

    application.status = reviewDto.status;
    application.reviewedAt = new Date();
    application.reviewerId = reviewerId;
    application.updatedBy = reviewerId;

    if (reviewDto.reviewComment) {
      application.reviewComment = reviewDto.reviewComment;
    }

    if (reviewDto.approvedAmount !== undefined && reviewDto.approvedAmount !== null) {
      application.approvedAmount = reviewDto.approvedAmount;
    }

    return this.applicationRepository.save(application);
  }
}
