import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RecruitmentInterview,
  InterviewStatus,
  InterviewScore,
  ScoreItem,
} from './recruitment-interview.entity';
import { ApplicationStatus } from './recruitment-application.entity';
import {
  CreateInterviewDto,
  UpdateInterviewDto,
  CancelInterviewDto,
  SubmitScoreDto,
  CompleteInterviewDto,
  InterviewQueryDto,
} from './dto/interview.dto';
import { RecruitmentApplicationService } from './recruitment-application.service';

@Injectable()
export class RecruitmentInterviewService {
  constructor(
    @InjectRepository(RecruitmentInterview)
    private readonly interviewRepo: Repository<RecruitmentInterview>,
    private readonly applicationService: RecruitmentApplicationService,
  ) {}

  async create(dto: CreateInterviewDto): Promise<RecruitmentInterview> {
    // Verify application exists
    const application = await this.applicationService.findOne(dto.applicationId);

    // Validate application is in correct status
    if (
      application.status !== 'SHORTLISTED' &&
      application.status !== 'INTERVIEW'
    ) {
      throw new BadRequestException('申请状态必须为候选或面试中才能安排面试');
    }

    // Validate interview date is in future
    if (new Date(dto.interviewDate) <= new Date()) {
      throw new BadRequestException('面试时间必须为未来时间');
    }

    // Validate location/meeting link
    if (
      dto.interviewType === 'ONSITE' &&
      (!dto.location || dto.location.trim() === '')
    ) {
      throw new BadRequestException('线下面试必须填写面试地点');
    }
    if (
      dto.interviewType === 'ONLINE' &&
      (!dto.meetingLink || dto.meetingLink.trim() === '')
    ) {
      throw new BadRequestException('线上面试必须填写会议链接');
    }

    if (dto.interviewers.length === 0) {
      throw new BadRequestException('至少需要选择一名面试官');
    }

    const interview = this.interviewRepo.create({
      applicationId: dto.applicationId,
      interviewDate: new Date(dto.interviewDate),
      durationMinutes: dto.durationMinutes,
      interviewType: dto.interviewType,
      interviewers: dto.interviewers,
      location: dto.location || '',
      meetingLink: dto.meetingLink || '',
      notes: dto.notes || '',
      status: InterviewStatus.SCHEDULED,
      scores: [],
    });

    const saved = await this.interviewRepo.save(interview);

    // Update application status to INTERVIEW
    try {
      await this.applicationService.updateStatus(dto.applicationId, {
        status: ApplicationStatus.INTERVIEW,
      } as any);
    } catch (e) {
      // Ignore if already in INTERVIEW status
    }

    return saved;
  }

  async findAll(query: InterviewQueryDto): Promise<{
    total: number;
    page: number;
    pageSize: number;
    items: RecruitmentInterview[];
  }> {
    const {
      applicationId,
      status,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = query;

    const qb = this.interviewRepo
      .createQueryBuilder('interview')
      .leftJoinAndSelect('interview.application', 'application');

    if (applicationId) {
      qb.andWhere('interview.applicationId = :applicationId', {
        applicationId,
      });
    }
    if (status) {
      qb.andWhere('interview.status = :status', { status });
    }
    if (startDate) {
      qb.andWhere('interview.interviewDate >= :startDate', {
        startDate: new Date(startDate),
      });
    }
    if (endDate) {
      qb.andWhere('interview.interviewDate <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    const total = await qb.getCount();

    qb.orderBy('interview.interviewDate', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const items = await qb.getMany();

    return { total, page, pageSize, items };
  }

  async findOne(id: string): Promise<RecruitmentInterview> {
    const interview = await this.interviewRepo.findOne({
      where: { id },
      relations: ['application'],
    });
    if (!interview) {
      throw new NotFoundException('面试记录不存在');
    }
    return interview;
  }

  async update(
    id: string,
    dto: UpdateInterviewDto,
  ): Promise<RecruitmentInterview> {
    const interview = await this.findOne(id);

    if (interview.status !== InterviewStatus.SCHEDULED) {
      throw new BadRequestException('只有已安排的面试可以编辑');
    }

    if (dto.interviewDate && new Date(dto.interviewDate) <= new Date()) {
      throw new BadRequestException('面试时间必须为未来时间');
    }

    Object.assign(interview, {
      ...(dto.interviewDate && { interviewDate: new Date(dto.interviewDate) }),
      ...(dto.durationMinutes && { durationMinutes: dto.durationMinutes }),
      ...(dto.interviewType && { interviewType: dto.interviewType }),
      ...(dto.interviewers && { interviewers: dto.interviewers }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.meetingLink !== undefined && { meetingLink: dto.meetingLink }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });

    return this.interviewRepo.save(interview);
  }

  async cancel(
    id: string,
    dto: CancelInterviewDto,
    cancelledBy?: string,
  ): Promise<RecruitmentInterview> {
    const interview = await this.findOne(id);

    if (interview.status === InterviewStatus.CANCELLED) {
      throw new BadRequestException('面试已经是取消状态');
    }
    if (interview.status === InterviewStatus.COMPLETED) {
      throw new BadRequestException('已完成的面试不能取消');
    }

    interview.status = InterviewStatus.CANCELLED;
    interview.cancellationReason = dto.cancellationReason || '';
    interview.cancelledBy = cancelledBy;
    interview.cancelledAt = new Date();

    return this.interviewRepo.save(interview);
  }

  async submitScore(
    id: string,
    dto: SubmitScoreDto,
  ): Promise<RecruitmentInterview> {
    const interview = await this.findOne(id);

    if (interview.status !== InterviewStatus.SCHEDULED) {
      throw new BadRequestException('只有已安排的面试可以提交评分');
    }

    // Remove existing score from same interviewer if any
    const existingScores = interview.scores.filter(
      (s) => s.interviewerId !== dto.interviewerId,
    );

    const newScore: InterviewScore = {
      interviewerId: dto.interviewerId,
      scores: dto.scores.map((s) => ({
        criterion: s.criterion,
        score: s.score,
        comment: s.comment,
      })),
      submittedAt: new Date(),
    };

    interview.scores = [...existingScores, newScore];

    return this.interviewRepo.save(interview);
  }

  async complete(
    id: string,
    dto: CompleteInterviewDto,
    completedBy?: string,
  ): Promise<RecruitmentInterview> {
    const interview = await this.findOne(id);

    if (interview.status === InterviewStatus.CANCELLED) {
      throw new BadRequestException('已取消的面试不能完成');
    }
    if (interview.status === InterviewStatus.COMPLETED) {
      throw new BadRequestException('面试已经是完成状态');
    }

    interview.status = InterviewStatus.COMPLETED;
    interview.overallRecommendation = dto.overallRecommendation;
    interview.finalNotes = dto.finalNotes || '';
    interview.completedAt = new Date();
    interview.completedBy = completedBy;

    await this.interviewRepo.save(interview);

    // Update application status directly via repo
    const newAppStatus = dto.overallRecommendation === 'NOT_RECOMMEND' 
      ? 'REJECTED' 
      : 'OFFER';
    await this.applicationService.updateStatus(interview.applicationId, {
      status: newAppStatus as any,
      screeningNotes: `最终建议: ${dto.overallRecommendation}`,
    } as any);

    return interview;
  }
}
