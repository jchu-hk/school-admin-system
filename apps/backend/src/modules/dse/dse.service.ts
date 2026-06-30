import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DseRelease } from './entities/dse-release.entity';
import { DseResult, DseResultStatus } from './entities/dse-result.entity';
import { DseReview, DseReviewStatus } from './entities/dse-review.entity';
import {
  DseOfferTracking,
  JupasStatus,
} from './entities/dse-offer-tracking.entity';
import {
  CreateDseReleaseDto,
  UpdateDseReleaseDto,
  QueryDseReleaseDto,
  ImportDseResultDto,
  BatchImportDseResultDto,
  QueryDseResultDto,
  UpdateDseResultDto,
  CreateDseReviewDto,
  ApproveDseReviewDto,
  UpdateDseReviewResultDto,
  QueryDseReviewDto,
  CreateDseOfferTrackingDto,
  UpdateDseOfferTrackingDto,
  QueryDseOfferTrackingDto,
  DseStatsResponseDto,
} from './dto/dse.dto';
import { User } from '../user/user.entity';

const LEVEL_SCORES: Record<string, number> = {
  '5++': 5,
  '5+': 5,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
  '1': 1,
  U: 0,
  Absent: 0,
  'Not Attended': 0,
};

// 最佳5科总分计算
function computeBestFive(result: Partial<DseResult>): number {
  const scores: number[] = [
    LEVEL_SCORES[result.chineseLevel] ?? 0,
    LEVEL_SCORES[result.englishLevel] ?? 0,
    LEVEL_SCORES[result.mathCompulsoryLevel] ?? 0,
    LEVEL_SCORES[result.liberalStudiesLevel] ?? 0,
    LEVEL_SCORES[result.mathExtendedLevel] ?? 0,
    LEVEL_SCORES[result.elective1Level] ?? 0,
    LEVEL_SCORES[result.elective2Level] ?? 0,
    LEVEL_SCORES[result.elective3Level] ?? 0,
  ];
  return scores
    .sort((a, b) => b - a)
    .slice(0, 5)
    .reduce((sum, s) => sum + s, 0);
}

@Injectable()
export class DseService {
  private readonly logger = new Logger(DseService.name);

  constructor(
    @InjectRepository(DseRelease)
    private readonly releaseRepo: Repository<DseRelease>,
    @InjectRepository(DseResult)
    private readonly resultRepo: Repository<DseResult>,
    @InjectRepository(DseReview)
    private readonly reviewRepo: Repository<DseReview>,
    @InjectRepository(DseOfferTracking)
    private readonly offerRepo: Repository<DseOfferTracking>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ==================== DSE Release CRUD ====================

  async createRelease(dto: CreateDseReleaseDto): Promise<DseRelease> {
    const releaseYear = new Date(dto.releaseDate).getFullYear();
    const existing = await this.releaseRepo.findOne({
      where: { releaseYear, academicYear: dto.academicYear },
    });
    if (existing) {
      throw new BadRequestException(
        `学年 ${dto.academicYear} 的放榜记录已存在`,
      );
    }
    const release = this.releaseRepo.create({ ...dto, releaseYear });
    return this.releaseRepo.save(release);
  }

  async findAllReleases(query: QueryDseReleaseDto): Promise<DseRelease[]> {
    const where: any = {};
    if (query.releaseStatus) where.releaseStatus = query.releaseStatus;
    if (query.academicYear) where.academicYear = query.academicYear;
    if (query.releaseYear) where.releaseYear = query.releaseYear;
    return this.releaseRepo.find({ where, order: { releaseDate: 'DESC' } });
  }

  async findOneRelease(id: string): Promise<DseRelease> {
    const release = await this.releaseRepo.findOne({ where: { id } });
    if (!release) throw new NotFoundException(`放榜记录 #${id} 不存在`);
    return release;
  }

  async updateRelease(
    id: string,
    dto: UpdateDseReleaseDto,
  ): Promise<DseRelease> {
    const release = await this.findOneRelease(id);
    Object.assign(release, dto);
    return this.releaseRepo.save(release);
  }

  // ==================== DSE Result CRUD ====================

  async importResult(
    dto: ImportDseResultDto,
    _operatorId: string,
  ): Promise<DseResult> {
    const _release = await this.findOneRelease(dto.releaseId);
    const student = await this.userRepo.findOne({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException(`学生 #${dto.studentId} 不存在`);

    const existing = await this.resultRepo.findOne({
      where: { releaseId: dto.releaseId, studentId: dto.studentId },
    });
    if (existing) {
      throw new BadRequestException(
        `学生 ${student.name} 的成绩已在该学年录入`,
      );
    }

    const result = this.resultRepo.create({
      releaseId: dto.releaseId,
      studentId: dto.studentId,
      studentName: student.name,
      className: student.className ?? undefined,
      hkeaaCandidateNo: dto.hkeaaCandidateNo,
      chineseLevel: dto.chineseLevel,
      englishLevel: dto.englishLevel,
      mathCompulsoryLevel: dto.mathCompulsoryLevel,
      mathExtendedLevel: dto.mathExtendedLevel,
      liberalStudiesLevel: dto.liberalStudiesLevel,
      elective1Code: dto.elective1?.subjectCode,
      elective1Name: dto.elective1?.subjectName,
      elective1Level: dto.elective1?.level,
      elective2Code: dto.elective2?.subjectCode,
      elective2Name: dto.elective2?.subjectName,
      elective2Level: dto.elective2?.level,
      elective3Code: dto.elective3?.subjectCode,
      elective3Name: dto.elective3?.subjectName,
      elective3Level: dto.elective3?.level,
      resultStatus: DseResultStatus.IMPORTED,
      bestFiveTotal: 0,
      rawData: dto as any,
    });
    const saved = await this.resultRepo.save(result);
    saved.bestFiveTotal = computeBestFive(saved);
    return this.resultRepo.save(saved);
  }

  async batchImport(
    dto: BatchImportDseResultDto,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const _release = await this.findOneRelease(dto.releaseId);
    let success = 0,
      failed = 0;
    const errors: string[] = [];

    for (const item of dto.results) {
      try {
        await this.importResult({ ...item, releaseId: dto.releaseId }, '');
        success++;
      } catch (e: any) {
        failed++;
        errors.push(`${item.studentId}: ${e.message}`);
      }
    }
    return { success, failed, errors };
  }

  async findAllResults(query: QueryDseResultDto): Promise<DseResult[]> {
    const where: any = {};
    if (query.releaseId) where.releaseId = query.releaseId;
    if (query.studentId) where.studentId = query.studentId;
    if (query.className) where.className = query.className;
    if (query.resultStatus) where.resultStatus = query.resultStatus;
    return this.resultRepo.find({
      where,
      order: { className: 'ASC', studentName: 'ASC' },
    });
  }

  async findOneResult(id: string): Promise<DseResult> {
    const result = await this.resultRepo.findOne({ where: { id } });
    if (!result) throw new NotFoundException(`DSE成绩记录 #${id} 不存在`);
    return result;
  }

  async updateResult(id: string, dto: UpdateDseResultDto): Promise<DseResult> {
    const result = await this.findOneResult(id);
    Object.assign(result, dto);
    return this.resultRepo.save(result);
  }

  // ==================== DSE Review CRUD ====================

  async createReview(
    dto: CreateDseReviewDto,
    applicantId: string,
  ): Promise<DseReview> {
    const dseResult = await this.findOneResult(dto.dseResultId);
    const release = await this.findOneRelease(dseResult.releaseId);
    if (new Date() > new Date(release.reviewDeadline ?? release.releaseDate)) {
      throw new BadRequestException('已超过覆核申请截止日期');
    }
    const review = this.reviewRepo.create({ ...dto, applicantId });
    return this.reviewRepo.save(review);
  }

  async findAllReviews(query: QueryDseReviewDto): Promise<DseReview[]> {
    const where: any = {};
    if (query.dseResultId) where.dseResultId = query.dseResultId;
    if (query.status) where.status = query.status;
    if (query.reviewType) where.reviewType = query.reviewType;
    return this.reviewRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOneReview(id: string): Promise<DseReview> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException(`覆核申请 #${id} 不存在`);
    return review;
  }

  async approveReview(
    id: string,
    dto: ApproveDseReviewDto,
    approverId: string,
  ): Promise<DseReview> {
    const review = await this.findOneReview(id);
    if (review.status !== DseReviewStatus.PENDING) {
      throw new BadRequestException('当前状态不允许审批');
    }
    review.status = DseReviewStatus.APPROVED;
    review.approverId = approverId;
    review.approvalRemark = dto.approvalRemark;
    return this.reviewRepo.save(review);
  }

  async updateReviewResult(
    id: string,
    dto: UpdateDseReviewResultDto,
  ): Promise<DseReview> {
    const review = await this.findOneReview(id);
    review.hkeaaNewLevel = dto.hkeaaNewLevel;
    review.hkeaaResultRemark = dto.hkeaaResultRemark;
    review.status = DseReviewStatus.RESULT_UPDATED;

    // 自动更新DSE成绩
    const dseResult = await this.findOneResult(review.dseResultId);
    const fieldMap: Record<string, string> = {
      'Chinese Language': 'chineseLevel',
      'English Language': 'englishLevel',
      'Mathematics (Compulsory)': 'mathCompulsoryLevel',
      'Mathematics (Extended Part)': 'mathExtendedLevel',
      'Liberal Studies': 'liberalStudiesLevel',
    };
    const field = fieldMap[review.subjectName];
    if (field && dseResult[field as keyof DseResult] !== dto.hkeaaNewLevel) {
      (dseResult as any)[field] = dto.hkeaaNewLevel;
      dseResult.bestFiveTotal = computeBestFive(dseResult);
      await this.resultRepo.save(dseResult);
    }
    return this.reviewRepo.save(review);
  }

  // ==================== Offer Tracking CRUD ====================

  async createOfferTracking(
    dto: CreateDseOfferTrackingDto,
  ): Promise<DseOfferTracking> {
    const student = await this.userRepo.findOne({
      where: { id: dto.studentId },
    });
    const existing = await this.offerRepo.findOne({
      where: { dseResultId: dto.dseResultId },
    });
    if (existing) {
      throw new BadRequestException('该学生的升学去向记录已存在，请更新');
    }
    // 匿名化姓名
    const nameAnonymized = student
      ? student.name.replace(/^(.)(.*)(.)$/, '$1同学')
      : dto.studentId;
    const offer = this.offerRepo.create({
      ...dto,
      studentId: dto.studentId,
      studentNameAnonymized: nameAnonymized,
      className: student?.className ?? undefined,
    });
    return this.offerRepo.save(offer);
  }

  async findAllOffers(
    query: QueryDseOfferTrackingDto,
  ): Promise<DseOfferTracking[]> {
    const where: any = {};
    if (query.dseResultId) where.dseResultId = query.dseResultId;
    if (query.className) where.className = query.className;
    if (query.jupasStatus) where.jupasStatus = query.jupasStatus;
    return this.offerRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOneOffer(id: string): Promise<DseOfferTracking> {
    const offer = await this.offerRepo.findOne({ where: { id } });
    if (!offer) throw new NotFoundException(`升学去向记录 #${id} 不存在`);
    return offer;
  }

  async updateOffer(
    id: string,
    dto: UpdateDseOfferTrackingDto,
  ): Promise<DseOfferTracking> {
    const offer = await this.findOneOffer(id);
    Object.assign(offer, dto);
    return this.offerRepo.save(offer);
  }

  // ==================== Statistics ====================

  async getStats(releaseId: string): Promise<DseStatsResponseDto> {
    const release = await this.findOneRelease(releaseId);
    const results = await this.resultRepo.find({ where: { releaseId } });
    const reviews = await this.reviewRepo.find({
      where: { dseResultId: In(results.map((r) => r.id)) },
    });
    const offers = await this.offerRepo.find({
      where: { dseResultId: In(results.map((r) => r.id)) },
    });

    const publishedCount = results.filter((r) => r.publishedToParent).length;

    // 各科目统计
    const subjects = [
      'chineseLevel',
      'englishLevel',
      'mathCompulsoryLevel',
      'liberalStudiesLevel',
    ];
    const subjectNames: Record<string, string> = {
      chineseLevel: '中國語文',
      englishLevel: '英國語文',
      mathCompulsoryLevel: '數學必修',
      liberalStudiesLevel: '通識',
    };

    const bySubjectStats = subjects.map((field) => {
      const levels = results
        .map((r) => r[field as keyof DseResult] as string)
        .filter(Boolean);
      const passed = levels.filter(
        (l) => !['U', 'Absent', 'Not Attended'].includes(l),
      ).length;
      const level5Plus = levels.filter((l) =>
        ['5++', '5+', '5'].includes(l),
      ).length;
      const level4Plus = levels.filter((l) =>
        ['5++', '5+', '5', '4'].includes(l),
      ).length;
      return {
        subject: subjectNames[field] ?? field,
        candidates: levels.length,
        level5PlusPct: levels.length
          ? `${((level5Plus / levels.length) * 100).toFixed(1)}%`
          : '0%',
        level4PlusPct: levels.length
          ? `${((level4Plus / levels.length) * 100).toFixed(1)}%`
          : '0%',
        passRate: levels.length
          ? `${((passed / levels.length) * 100).toFixed(1)}%`
          : '0%',
        schoolAvg: levels.length
          ? (
              levels.reduce((s, l) => s + (LEVEL_SCORES[l] ?? 0), 0) /
              levels.length
            ).toFixed(2)
          : '0',
        hkeaaAvg: '待获取', // HKEAA参考数据需对接SDP
      };
    });

    // 班级统计
    const classMap: Record<string, { total: number; best5Sum: number }> = {};
    results.forEach((r) => {
      if (!r.className) return;
      if (!classMap[r.className])
        classMap[r.className] = { total: 0, best5Sum: 0 };
      classMap[r.className].total++;
      classMap[r.className].best5Sum += r.bestFiveTotal ?? 0;
    });
    const classStats: Record<string, { avgBest5: number; count: number }> = {};
    for (const [cls, data] of Object.entries(classMap)) {
      classStats[cls] = {
        avgBest5: Math.round(data.best5Sum / data.total),
        count: data.total,
      };
    }

    // JUPAS统计
    const jupasStats = {
      total: offers.length,
      applied: offers.filter((o) => o.jupasStatus !== JupasStatus.NOT_APPLIED)
        .length,
      offered: offers.filter((o) =>
        [
          JupasStatus.BAND_A_OFFERED,
          JupasStatus.BAND_B_OFFERED,
          JupasStatus.BAND_C_OFFERED,
          JupasStatus.CONFIRMED,
          JupasStatus.CONDITIONAL_OFFER,
        ].includes(o.jupasStatus),
      ).length,
      confirmed: offers.filter((o) => o.jupasStatus === JupasStatus.CONFIRMED)
        .length,
      notApplied: offers.filter(
        (o) => o.jupasStatus === JupasStatus.NOT_APPLIED,
      ).length,
    };

    // 覆核统计
    const reviewStats = {
      total: reviews.length,
      pending: reviews.filter((r) => r.status === DseReviewStatus.PENDING)
        .length,
      submitted: reviews.filter((r) =>
        [
          DseReviewStatus.SUBMITTED_TO_HKEAA,
          DseReviewStatus.HKEAA_REVIEWING,
        ].includes(r.status),
      ).length,
      completed: reviews.filter((r) =>
        [
          DseReviewStatus.HKEAA_COMPLETED,
          DseReviewStatus.RESULT_UPDATED,
        ].includes(r.status),
      ).length,
    };

    return {
      releaseId,
      academicYear: release.academicYear,
      releaseDate: release.releaseDate.toISOString().split('T')[0],
      totalStudents: results.length,
      resultsReceived: results.filter(
        (r) => r.resultStatus !== DseResultStatus.PENDING,
      ).length,
      resultsPending: results.filter(
        (r) => r.resultStatus === DseResultStatus.PENDING,
      ).length,
      publishedCount,
      bySubjectStats,
      classStats,
      jupasStats,
      reviewStats,
    };
  }
}
