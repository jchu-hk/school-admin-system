import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RecruitmentApplication,
  ApplicationStatus,
} from './recruitment-application.entity';
import {
  CreateApplicationDto,
  UpdateApplicationStatusDto,
  RejectApplicationDto,
  ApplicationQueryDto,
} from './dto/application.dto';
import { RecruitmentPositionService } from './recruitment-position.service';

@Injectable()
export class RecruitmentApplicationService {
  private applicationCounter = 0;

  constructor(
    @InjectRepository(RecruitmentApplication)
    private readonly appRepo: Repository<RecruitmentApplication>,
    private readonly positionService: RecruitmentPositionService,
  ) {}

  private generateApplicationNumber(): string {
    const year = new Date().getFullYear();
    this.applicationCounter++;
    return `APP-${year}-${String(this.applicationCounter).padStart(4, '0')}`;
  }

  async create(dto: CreateApplicationDto): Promise<RecruitmentApplication> {
    // Verify position exists and is published
    const position = await this.positionService.findOne(dto.positionId);

    if (position.status !== 'PUBLISHED') {
      throw new BadRequestException('职位未发布，无法申请');
    }

    const application = this.appRepo.create({
      positionId: dto.positionId,
      applicantName: dto.applicantName,
      email: dto.email,
      phone: dto.phone,
      cvUrl: dto.cvUrl || '',
      cvFilename: dto.cvFilename || '',
      coverLetter: dto.coverLetter || '',
      education: dto.education,
      experience: dto.experience || [],
      status: ApplicationStatus.NEW,
      applicationNumber: this.generateApplicationNumber(),
    });

    const saved = await this.appRepo.save(application);

    // Increment application count
    await this.positionService.incrementApplicationCount(dto.positionId);

    return saved;
  }

  async findAll(query: ApplicationQueryDto): Promise<{
    total: number;
    page: number;
    pageSize: number;
    items: RecruitmentApplication[];
  }> {
    const { positionId, status, keyword, page = 1, pageSize = 20 } = query;

    const qb = this.appRepo
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.position', 'position');

    if (positionId) {
      qb.andWhere('app.positionId = :positionId', { positionId });
    }
    if (status) {
      qb.andWhere('app.status = :status', { status });
    }
    if (keyword) {
      qb.andWhere(
        '(app.applicantName ILIKE :keyword OR app.email ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const total = await qb.getCount();

    qb.orderBy('app.submittedAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const items = await qb.getMany();

    return { total, page, pageSize, items };
  }

  async findOne(id: string): Promise<RecruitmentApplication> {
    const application = await this.appRepo.findOne({
      where: { id },
      relations: ['position'],
    });
    if (!application) {
      throw new NotFoundException('申请不存在');
    }
    return application;
  }

  async updateStatus(
    id: string,
    dto: UpdateApplicationStatusDto,
  ): Promise<RecruitmentApplication> {
    const application = await this.findOne(id);

    // Validate status transition
    const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      [ApplicationStatus.NEW]: [
        ApplicationStatus.SCREENING,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.SCREENING]: [
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.SHORTLISTED]: [
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.INTERVIEW]: [
        ApplicationStatus.OFFER,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.REJECTED]: [],
      [ApplicationStatus.OFFER]: [],
    };

    if (!validTransitions[application.status].includes(dto.status)) {
      throw new BadRequestException(
        `无法从 ${application.status} 状态变更为 ${dto.status}`,
      );
    }

    application.status = dto.status;
    if (dto.screeningNotes) {
      application.screeningNotes = dto.screeningNotes;
    }

    return this.appRepo.save(application);
  }

  async reject(
    id: string,
    dto: RejectApplicationDto,
    rejectedBy?: string,
  ): Promise<RecruitmentApplication> {
    const application = await this.findOne(id);

    if (application.status === ApplicationStatus.REJECTED) {
      throw new BadRequestException('申请已经是拒绝状态');
    }

    application.status = ApplicationStatus.REJECTED;
    application.rejectionReason = dto.rejectionReason || '';
    application.rejectedBy = rejectedBy;
    application.rejectedAt = new Date();

    return this.appRepo.save(application);
  }
}
