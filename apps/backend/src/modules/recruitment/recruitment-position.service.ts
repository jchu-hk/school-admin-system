import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RecruitmentPosition,
  PositionStatus,
} from './recruitment-position.entity';
import {
  CreatePositionDto,
  UpdatePositionDto,
  PositionQueryDto,
} from './dto/position.dto';

@Injectable()
export class RecruitmentPositionService {
  constructor(
    @InjectRepository(RecruitmentPosition)
    private readonly positionRepo: Repository<RecruitmentPosition>,
  ) {}

  async create(dto: CreatePositionDto): Promise<RecruitmentPosition> {
    // Validate salary range
    if (dto.salaryMin > dto.salaryMax) {
      throw new BadRequestException('最低薪资不能大于最高薪资');
    }

    const position = this.positionRepo.create({
      title: dto.title,
      subject: dto.subject,
      employmentType: dto.employmentType,
      salaryMin: dto.salaryMin,
      salaryMax: dto.salaryMax,
      salaryCurrency: dto.salaryCurrency || 'HKD',
      location: dto.location,
      requirements: dto.requirements,
      responsibilities: dto.responsibilities,
      benefits: dto.benefits || [],
      applicationDeadline: new Date(dto.applicationDeadline),
      status: PositionStatus.DRAFT,
    });

    return this.positionRepo.save(position);
  }

  async findAll(query: PositionQueryDto): Promise<{
    total: number;
    page: number;
    pageSize: number;
    items: RecruitmentPosition[];
  }> {
    const { status, subject, employmentType, page = 1, pageSize = 20 } = query;

    const qb = this.positionRepo.createQueryBuilder('position');

    if (status) {
      qb.andWhere('position.status = :status', { status });
    }
    if (subject) {
      qb.andWhere('position.subject = :subject', { subject });
    }
    if (employmentType) {
      qb.andWhere('position.employmentType = :employmentType', {
        employmentType,
      });
    }

    const total = await qb.getCount();

    qb.orderBy('position.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const items = await qb.getMany();

    return { total, page, pageSize, items };
  }

  async findOne(id: string): Promise<RecruitmentPosition> {
    const position = await this.positionRepo.findOne({ where: { id } });
    if (!position) {
      throw new NotFoundException('职位不存在');
    }
    return position;
  }

  async update(
    id: string,
    dto: UpdatePositionDto,
  ): Promise<RecruitmentPosition> {
    const position = await this.findOne(id);

    // Validate salary range if both provided
    const salaryMin = dto.salaryMin ?? position.salaryMin;
    const salaryMax = dto.salaryMax ?? position.salaryMax;
    if (salaryMin > salaryMax) {
      throw new BadRequestException('最低薪资不能大于最高薪资');
    }

    // Cannot edit closed positions
    if (position.status === PositionStatus.CLOSED) {
      throw new BadRequestException('已关闭的职位不能编辑');
    }

    Object.assign(position, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.subject !== undefined && { subject: dto.subject }),
      ...(dto.employmentType !== undefined && {
        employmentType: dto.employmentType,
      }),
      ...(dto.salaryMin !== undefined && { salaryMin: dto.salaryMin }),
      ...(dto.salaryMax !== undefined && { salaryMax: dto.salaryMax }),
      ...(dto.salaryCurrency !== undefined && {
        salaryCurrency: dto.salaryCurrency,
      }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.requirements !== undefined && {
        requirements: dto.requirements,
      }),
      ...(dto.responsibilities !== undefined && {
        responsibilities: dto.responsibilities,
      }),
      ...(dto.benefits !== undefined && { benefits: dto.benefits }),
      ...(dto.applicationDeadline !== undefined && {
        applicationDeadline: new Date(dto.applicationDeadline),
      }),
    });

    return this.positionRepo.save(position);
  }

  async publish(id: string): Promise<RecruitmentPosition> {
    const position = await this.findOne(id);

    if (
      position.status !== PositionStatus.DRAFT &&
      position.status !== PositionStatus.PAUSED
    ) {
      throw new BadRequestException('只有草稿或已暂停的职位可以发布');
    }

    if (new Date(position.applicationDeadline) < new Date()) {
      throw new BadRequestException('申请截止日期已过，无法发布');
    }

    position.status = PositionStatus.PUBLISHED;
    position.publishedAt = new Date();

    return this.positionRepo.save(position);
  }

  async pause(id: string): Promise<RecruitmentPosition> {
    const position = await this.findOne(id);

    if (position.status !== PositionStatus.PUBLISHED) {
      throw new BadRequestException('只有已发布的职位可以暂停');
    }

    position.status = PositionStatus.PAUSED;
    position.pausedAt = new Date();

    return this.positionRepo.save(position);
  }

  async resume(id: string): Promise<RecruitmentPosition> {
    const position = await this.findOne(id);

    if (position.status !== PositionStatus.PAUSED) {
      throw new BadRequestException('只有已暂停的职位可以重新发布');
    }

    if (new Date(position.applicationDeadline) < new Date()) {
      throw new BadRequestException('申请截止日期已过，无法重新发布');
    }

    position.status = PositionStatus.PUBLISHED;
    position.publishedAt = new Date();

    return this.positionRepo.save(position);
  }

  async close(id: string): Promise<RecruitmentPosition> {
    const position = await this.findOne(id);

    if (position.status === PositionStatus.CLOSED) {
      throw new BadRequestException('职位已经是关闭状态');
    }

    position.status = PositionStatus.CLOSED;
    position.closedAt = new Date();

    return this.positionRepo.save(position);
  }

  async incrementApplicationCount(id: string): Promise<void> {
    await this.positionRepo
      .createQueryBuilder()
      .update(RecruitmentPosition)
      .set({ applicationCount: () => 'application_count + 1' })
      .where('id = :id', { id })
      .execute();
  }
}
