import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SspaApplication,
  SspaApplicationStatus,
  SspaResult,
} from './entities/sspa-application.entity';
import { SspaBatch, SspaBatchStatus } from './entities/sspa-batch.entity';
import {
  SspaScore,
  SspaCriterion,
  DEFAULT_CRITERION_MAX,
} from './entities/sspa-score.entity';
import {
  CreateSspaApplicationDto,
  UpdateSspaApplicationDto,
  SspaApplicationQueryDto,
} from './dto/sspa-application.dto';
import { UpsertSspaScoresDto } from './dto/sspa-score.dto';
import { AuditService } from '../audit/audit.service';

/**
 * SSPA 申请服务 — 中一自行分配学位申请、计分定序、正取/备取、确认与注册（F-ADM-001）
 *
 * 状态机：
 *   applied → screened → scored → offered → confirmed → registered
 *        └──────────────► withdrawn（家长撤回）
 *   任一分级为 rejected 由 announce 统一标记
 *
 * 截止规则：申请仅可在批次 OPEN 且未过 announcement_date 前录入；
 * 超期录入拒绝（特殊审批绕过需显式参数）。
 */
@Injectable()
export class SspaApplicationService {
  constructor(
    @InjectRepository(SspaApplication)
    private readonly applicationRepo: Repository<SspaApplication>,
    @InjectRepository(SspaBatch)
    private readonly batchRepo: Repository<SspaBatch>,
    @InjectRepository(SspaScore)
    private readonly scoreRepo: Repository<SspaScore>,
    private readonly auditService: AuditService,
  ) {}

  // ============================================================
  // 申请 CRUD
  // ============================================================

  async create(
    dto: CreateSspaApplicationDto,
    operatorId?: string,
  ): Promise<SspaApplication> {
    const batch = await this.batchRepo.findOne({ where: { id: dto.batchId } });
    if (!batch) throw new NotFoundException(`SSPA 批次 ${dto.batchId} 不存在`);

    this.assertApplicationDeadline(batch);

    // 年度序列号生成：SSPA-YYYY-NNNN
    const yearCode = batch.year.split('-')[0];
    const serial = await this.nextSerial(yearCode);

    const app = this.applicationRepo.create({
      batchId: dto.batchId,
      applicationId: dto.applicationId,
      applicationNo: `SSPA-${yearCode}-${serial
        .toString()
        .padStart(4, '0')}`,
      studentNameZh: dto.studentNameZh,
      dateOfBirth: new Date(dto.dateOfBirth),
      hkId: dto.hkId,
      parentName: dto.parentName,
      parentPhone: dto.parentPhone,
      schoolOfOrigin: dto.schoolOfOrigin,
      siblingEnrolled: dto.siblingEnrolled ?? false,
      parentAlumni: dto.parentAlumni ?? false,
      otherAchievements: dto.otherAchievements,
      status: SspaApplicationStatus.APPLIED,
      createdBy: operatorId,
    });

    const saved = await this.applicationRepo.save(app);

    await this.auditService.log({
      action: 'sspa_application_created',
      userId: operatorId,
      resourceType: 'sspa_application',
      resourceId: saved.id,
      details: { applicationNo: saved.applicationNo },
      description: `录入 SSPA 申请 ${saved.applicationNo}`,
    });

    return saved;
  }

  async findAll(query: SspaApplicationQueryDto): Promise<{
    total: number;
    page: number;
    pageSize: number;
    items: SspaApplication[];
  }> {
    const {
      batchId,
      status,
      result,
      search,
      page = 1,
      pageSize = 20,
    } = query;
    const qb = this.applicationRepo.createQueryBuilder('app');

    if (batchId) qb.andWhere('app.batchId = :batchId', { batchId });
    if (status) qb.andWhere('app.status = :status', { status });
    if (result) qb.andWhere('app.result = :result', { result });
    if (search) {
      qb.andWhere('app.studentNameZh ILIKE :search', {
        search: `%${search}%`,
      });
    }

    qb.orderBy('app.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { total, page, pageSize, items };
  }

  async findOne(id: string): Promise<SspaApplication> {
    const app = await this.applicationRepo.findOne({
      where: { id },
      relations: { batch: true, creator: true, scores: true },
    });
    if (!app) throw new NotFoundException(`SSPA 申请 ${id} 不存在`);
    return app;
  }

  async update(
    id: string,
    dto: UpdateSspaApplicationDto,
    operatorId?: string,
  ): Promise<SspaApplication> {
    const app = await this.findOne(id);

    if (app.status === SspaApplicationStatus.WITHDRAWN) {
      throw new BadRequestException('已撤回申请不可修改');
    }
    if (app.status === SspaApplicationStatus.REGISTERED) {
      throw new BadRequestException('已注册申请不可修改');
    }

    const edbResult = dto.edbResult;
    Object.assign(app, {
      ...(dto.studentNameZh !== undefined && { studentNameZh: dto.studentNameZh }),
      ...(dto.dateOfBirth !== undefined && { dateOfBirth: new Date(dto.dateOfBirth) }),
      ...(dto.hkId !== undefined && { hkId: dto.hkId }),
      ...(dto.parentName !== undefined && { parentName: dto.parentName }),
      ...(dto.parentPhone !== undefined && { parentPhone: dto.parentPhone }),
      ...(dto.schoolOfOrigin !== undefined && { schoolOfOrigin: dto.schoolOfOrigin }),
      ...(dto.siblingEnrolled !== undefined && { siblingEnrolled: dto.siblingEnrolled }),
      ...(dto.parentAlumni !== undefined && { parentAlumni: dto.parentAlumni }),
      ...(dto.otherAchievements !== undefined && { otherAchievements: dto.otherAchievements }),
      ...(edbResult !== undefined && { edbResult }),
    });

    const saved = await this.applicationRepo.save(app);

    await this.auditService.log({
      action: 'sspa_application_updated',
      userId: operatorId,
      resourceType: 'sspa_application',
      resourceId: saved.id,
      description: `更新 SSPA 申请 ${saved.applicationNo}`,
    });

    return saved;
  }

  // ============================================================
  // 计分
  // ============================================================

  /**
   * 录入/更新分项评分，自动汇总 total_score 并推进到 scored。
   * 校长酌情权（principal_discretion）需在 note 中留审批痕迹。
   */
  async upsertScores(
    applicationId: string,
    dto: UpsertSspaScoresDto,
    operatorId?: string,
  ): Promise<{ id: string; totalScore: number; status: string }> {
    const app = await this.findOne(applicationId);
    if (app.status === SspaApplicationStatus.WITHDRAWN) {
      throw new BadRequestException('已撤回申请不可评分');
    }

    const batch = app.batch;
    const weights = batch.scoringWeights ?? {};

    let total = 0;
    for (const item of dto.scores) {
      const max = weights[item.criterion] ?? DEFAULT_CRITERION_MAX[item.criterion];
      if (max === undefined) {
        throw new BadRequestException(`未知评分准则 ${item.criterion}`);
      }
      if (item.score > max) {
        throw new BadRequestException(
          `准则 ${item.criterion} 得分 ${item.score} 超过最高分 ${max}`,
        );
      }

      if (item.criterion === SspaCriterion.PRINCIPAL_DISCRETION && !item.note) {
        throw new BadRequestException('校长酌情权评分必须填写审批备注');
      }

      // upsert (unique application_id + criterion)
      const existing = await this.scoreRepo.findOne({
        where: { applicationId, criterion: item.criterion },
      });
      if (existing) {
        existing.score = item.score.toFixed(2);
        existing.note = item.note ?? existing.note;
        if (operatorId) existing.scoredBy = operatorId;
        await this.scoreRepo.save(existing);
      } else {
        await this.scoreRepo.save(
          this.scoreRepo.create({
            applicationId,
            criterion: item.criterion,
            score: item.score.toFixed(2),
            maxScore: max.toFixed(2),
            scoredBy: operatorId,
            note: item.note,
          }),
        );
      }
      total += item.score;
    }

    // 重新汇总全部得分（防部分覆盖）
    const scores = await this.scoreRepo.find({ where: { applicationId } });
    total = scores.reduce((sum, s) => sum + Number(s.score), 0);

    app.totalScore = total.toFixed(2);
    if (app.status === SspaApplicationStatus.APPLIED || app.status === SspaApplicationStatus.SCREENED) {
      app.status = SspaApplicationStatus.SCORED;
    }
    await this.applicationRepo.save(app);

    await this.auditService.log({
      action: 'sspa_score_added',
      userId: operatorId,
      resourceType: 'sspa_application',
      resourceId: app.id,
      details: { totalScore: total },
      description: `为 SSPA 申请 ${app.applicationNo} 录入评分`,
    });

    return { id: app.id, totalScore: Number(total.toFixed(2)), status: app.status };
  }

  async getTotalScore(applicationId: string): Promise<{
    id: string;
    totalScore: number;
    rank: number | null;
    scores: SspaScore[];
  }> {
    const app = await this.findOne(applicationId);
    const scores = await this.scoreRepo.find({ where: { applicationId } });
    const total = scores.reduce((sum, s) => sum + Number(s.score), 0);
    return {
      id: app.id,
      totalScore: Number(total.toFixed(2)),
      rank: app.rank,
      scores,
    };
  }

  // ============================================================
  // 公布 / 确认 / 注册
  // ============================================================

  /**
   * 公布正取/备取结果：按批次学额计分定序，accepted 名单正取、waitlist 备取、其余 rejected。
   * 批次状态 → announced；每申请 status → offered（正取/备取）或 withdrawn 之外保持。
   */
  async announce(
    batchId: string,
    acceptedIds: string[],
    waitlistIds: string[],
    operatorId?: string,
  ): Promise<{ id: string; batchStatus: string; counts: Record<string, number> }> {
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) throw new NotFoundException(`SSPA 批次 ${batchId} 不存在`);
    if (batch.status === SspaBatchStatus.ARCHIVED) {
      throw new BadRequestException('已归档批次不可公布');
    }

    const acceptedSet = new Set(acceptedIds);
    const waitlistSet = new Set(waitlistIds);
    if (acceptedSet.size !== acceptedIds.length || waitlistSet.size !== waitlistIds.length) {
      throw new BadRequestException('正取/备取名单中存在重复申请ID');
    }
    if (acceptedIds.length > batch.seats) {
      throw new BadRequestException(
        `正取人数 ${acceptedIds.length} 超过学额 ${batch.seats}`,
      );
    }
    for (const id of acceptedIds) if (waitlistSet.has(id)) {
      throw new BadRequestException('同一申请不能同时为正取与备取');
    }

    const applications = await this.applicationRepo.find({ where: { batchId } });
    const byId = new Map(applications.map((a) => [a.id, a]));

    // 对所有申请人按总分定序（rank）
    const ordered = [...applications].sort(
      (a, b) => Number(b.totalScore ?? 0) - Number(a.totalScore ?? 0),
    );
    ordered.forEach((a, idx) => {
      a.rank = idx + 1;
      if (acceptedSet.has(a.id)) {
        a.result = SspaResult.ACCEPTED;
        a.status = SspaApplicationStatus.OFFERED;
      } else if (waitlistSet.has(a.id)) {
        a.result = SspaResult.WAITLIST;
        a.status = SspaApplicationStatus.OFFERED;
      } else {
        a.result = SspaResult.REJECTED;
      }
      if (!acceptedSet.has(a.id) && !waitlistSet.has(a.id)) {
        // 未入选但已注册/确认者不降级
        if (![SspaApplicationStatus.CONFIRMED, SspaApplicationStatus.REGISTERED].includes(a.status)) {
          a.result = SspaResult.REJECTED;
        }
      }
      byId.set(a.id, a);
    });

    await this.applicationRepo.save(ordered);
    batch.status = SspaBatchStatus.ANNOUNCED;
    await this.batchRepo.save(batch);

    await this.auditService.log({
      action: 'sspa_result_announced',
      userId: operatorId,
      resourceType: 'sspa_batch',
      resourceId: batchId,
      details: {
        accepted: acceptedIds.length,
        waitlist: waitlistIds.length,
        rejected: ordered.filter((a) => a.result === SspaResult.REJECTED).length,
      },
      description: `公布 SSPA 批次 ${batch.name} 结果`,
    });

    return {
      id: batchId,
      batchStatus: batch.status,
      counts: {
        accepted: acceptedIds.length,
        waitlist: waitlistIds.length,
        rejected: ordered.filter((a) => a.result === SspaResult.REJECTED).length,
      },
    };
  }

  /** 正取学生确认学位：仅 accepted（offered）可确认，状态 → confirmed */
  async confirmOffer(id: string, operatorId?: string): Promise<SspaApplication> {
    const app = await this.findOne(id);
    if (app.result !== SspaResult.ACCEPTED) {
      throw new BadRequestException('仅正取（accepted）可确认学位');
    }
    if (app.status === SspaApplicationStatus.CONFIRMED || app.status === SspaApplicationStatus.REGISTERED) {
      throw new BadRequestException('该申请已确认/注册');
    }

    app.offerConfirmed = true;
    app.confirmedAt = new Date();
    app.status = SspaApplicationStatus.CONFIRMED;
    const saved = await this.applicationRepo.save(app);

    await this.auditService.log({
      action: 'sspa_offer_confirmed',
      userId: operatorId,
      resourceType: 'sspa_application',
      resourceId: app.id,
      description: `正取学生确认学位 ${app.applicationNo}`,
    });

    return saved;
  }

  /** 确认后进入新生注册流：状态 → registered，回填关联新生申请ID（F-ENRL-001） */
  async register(
    id: string,
    applicationId?: string,
    operatorId?: string,
  ): Promise<SspaApplication> {
    const app = await this.findOne(id);
    if (!app.offerConfirmed || app.status !== SspaApplicationStatus.CONFIRMED) {
      throw new BadRequestException('仅已确认学位（confirmed）可登记入新生注册流');
    }

    app.applicationId = applicationId ?? app.applicationId;
    if (app.applicationId === undefined || app.applicationId === null) {
      throw new BadRequestException(
        '请提供关联新生申请ID（student_application）以进入注册流',
      );
    }
    app.status = SspaApplicationStatus.REGISTERED;
    const saved = await this.applicationRepo.save(app);

    await this.auditService.log({
      action: 'sspa_offer_confirmed',
      userId: operatorId,
      resourceType: 'sspa_application',
      resourceId: app.id,
      details: { registered: true },
      description: `SSPA 申请 ${app.applicationNo} 进入新生注册流`,
    });

    return saved;
  }

  /** 家长撤回申请 */
  async withdraw(id: string, operatorId?: string): Promise<SspaApplication> {
    const app = await this.findOne(id);
    if (
      app.status === SspaApplicationStatus.REGISTERED ||
      app.status === SspaApplicationStatus.WITHDRAWN
    ) {
      throw new BadRequestException('已注册或已撤回的申请不可撤回');
    }
    app.status = SspaApplicationStatus.WITHDRAWN;
    const saved = await this.applicationRepo.save(app);
    await this.auditService.log({
      action: 'sspa_offer_confirmed',
      userId: operatorId,
      resourceType: 'sspa_application',
      resourceId: app.id,
      description: `撤回 SSPA 申请 ${app.applicationNo}`,
    });
    return saved;
  }

  // ============================================================
  // 内部工具
  // ============================================================

  /**
   * 截止校验：批次需为 OPEN，且未过公布日（announcement_date）。
   * 超期录入拒绝；`allowOverride` 用于特殊审批绕过（需自行留痕）。
   */
  private assertApplicationDeadline(
    batch: SspaBatch,
    allowOverride = false,
  ): void {
    if (allowOverride) return;
    if (batch.status !== SspaBatchStatus.OPEN) {
      throw new BadRequestException(
        `批次 ${batch.name} 未处于申请开放状态（当前 ${batch.status}）`,
      );
    }
    if (batch.announcementDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadline = new Date(batch.announcementDate);
      deadline.setHours(0, 0, 0, 0);
      if (today > deadline) {
        throw new BadRequestException(
          `已过公布日（${batch.announcementDate.toISOString().slice(0, 10)}），申请已截止；如属特殊审批请经校务主任处理`,
        );
      }
    }
  }

  /** 生成批次年度内申请序号 */
  private async nextSerial(yearCode: string): Promise<number> {
    const apps = await this.applicationRepo
      .createQueryBuilder('app')
      .where('app.applicationNo LIKE :prefix', {
        prefix: `SSPA-${yearCode}-%`,
      })
      .orderBy('app.applicationNo', 'DESC')
      .getMany();
    let max = 0;
    for (const a of apps) {
      const m = a.applicationNo.match(/-(\d{4})$/);
      if (m) max = Math.max(max, Number(m[1]));
    }
    return max + 1;
  }
}
