import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../user/user.entity';
import { NotificationService } from '../notification/notification.service';
import {
  ParentInquiry,
  InquiryCategory,
  InquiryPriority,
  InquiryStatus,
  TimeoutWarningLevel,
  InquirySentiment,
  TransferStatus,
} from './inquiry.entity';
import { InquiryReply, ReplyAuthorType } from './reply.entity';
import { QuickReplyTemplate } from './template.entity';
import { InquiryFaqService } from './inquiry-faq.service';
import { InquiryEscalationService } from './inquiry-escalation.service';
import {
  CreateInquiryDto,
  UpdateInquiryDto,
  CreateReplyDto,
  SatisfactionDto,
  CreateTemplateDto,
  InquiryQueryDto,
  CallLogDto,
  TransferInquiryDto,
  QueueQueryDto,
  QueueResponseDto,
  QueueItemDto,
  TimeoutWarningsResponseDto,
  TimeoutWarningDto,
} from './dto/inquiry.dto';

@Injectable()
export class InquiryService {
  private readonly logger = new Logger(InquiryService.name);

  constructor(
    @InjectRepository(ParentInquiry)
    private inquiryRepository: Repository<ParentInquiry>,
    @InjectRepository(InquiryReply)
    private replyRepository: Repository<InquiryReply>,
    @InjectRepository(QuickReplyTemplate)
    private templateRepository: Repository<QuickReplyTemplate>,
    private readonly notificationService: NotificationService,
    private readonly inquiryFaqService: InquiryFaqService,
    private readonly escalationService: InquiryEscalationService,
  ) {}

  /**
   * 生成查询编号
   */
  private generateInquiryNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INQ-${dateStr}-${random}`;
  }

  /**
   * 根据查询类别自动分配处理人
   */
  private autoAssignOfficer(category: InquiryCategory): string | null {
    // 根据类别返回对应的处理队列
    const categoryMap: Record<InquiryCategory, string | null> = {
      [InquiryCategory.ACADEMIC]: 'academic_team',
      [InquiryCategory.ATTENDANCE]: 'attendance_team',
      [InquiryCategory.DISCIPLINE]: 'discipline_team',
      [InquiryCategory.HEALTH]: 'health_team',
      [InquiryCategory.FINANCE]: 'finance_team',
      [InquiryCategory.GENERAL]: 'general_team',
      [InquiryCategory.OTHER]: 'general_team',
    };
    // 实际应从用户表查询，这里返回标识符
    return categoryMap[category] || null;
  }

  /**
   * 创建家长查询
   */
  async create(
    dto: CreateInquiryDto,
    userId: string,
    schoolId: string,
  ): Promise<ParentInquiry> {
    // 如果dto中没有parentId，使用当前用户ID
    const parentId = dto.parentId || userId;

    const inquiry = this.inquiryRepository.create({
      ...dto,
      parentId,
      inquiryNo: this.generateInquiryNo(),
      schoolId,
      parentSubmittedAt: new Date(),
      status: InquiryStatus.PENDING,
      assignedTo: this.autoAssignOfficer(dto.category),
    });

    const saved = await this.inquiryRepository.save(inquiry);

    // AI分析（模拟，实际应调用AI服务）
    await this.performAIAnalysis(saved);

    // 【新增】FAQ自动回复匹配
    const autoReply = await this.performAutoReply(saved);

    // 自动通知校务人员：有新的家长查询
    await this.sendInquirySubmissionNotification(saved);

    const result = await this.findOne(saved.id);
    // 附加自动回复建议
    (result as any).autoReplySuggestion = autoReply;
    return result;
  }

  /**
   * FAQ自动回复匹配（新增）
   * 根据查询内容匹配FAQ，返回自动回复建议
   */
  private async performAutoReply(
    inquiry: ParentInquiry,
  ): Promise<{ suggestedReply: string; faqId: string; score: number } | null> {
    try {
      const matchResult = await this.inquiryFaqService.matchFaq(
        inquiry.content,
        inquiry.category,
        inquiry.schoolId,
      );

      if (!matchResult) {
        return null;
      }

      // 记录匹配到的FAQ
      await this.inquiryRepository.update(inquiry.id, {
        aiSuggestedResponse: matchResult.faq.answer,
        autoResponseEligible: !matchResult.isHumanRequired,
      });

      // 增加FAQ使用次数
      await this.inquiryFaqService.incrementUsageCount(matchResult.faq.id);

      // 构建自动回复
      const suggestedReply = this.inquiryFaqService.buildAutoReply(
        matchResult,
        inquiry.content,
      );

      return {
        suggestedReply,
        faqId: matchResult.faq.id,
        score: matchResult.score,
      };
    } catch (error) {
      this.logger.warn(`[Inquiry] FAQ auto-reply failed: ${error.message}`);
      return null;
    }
  }

  /**
   * 发送家长查询提交通知给校务人员（实际应调用Coze/OpenAI）
   */
  private async sendInquirySubmissionNotification(
    inquiry: ParentInquiry,
  ): Promise<void> {
    try {
      // 通知学校管理员/officer有新咨询
      await this.notificationService.sendNotification(
        {
          recipientIds: [inquiry.assignedTo].filter(Boolean),
          title: '📩 新家长查询通知',
          content: `收到新的${inquiry.category}类查询，请及时处理。\n查询编号: ${inquiry.inquiryNo}`,
          recipientType: 'system',
        },
        undefined,
        undefined,
      );
    } catch (error) {
      console.warn('[Inquiry] Failed to send submission notification:', error);
    }
  }

  private async performAIAnalysis(inquiry: ParentInquiry): Promise<void> {
    // 意图分类映射
    const intentMap: Record<InquiryCategory, string[]> = {
      [InquiryCategory.ACADEMIC]: [
        'grade_inquiry',
        'homework',
        'exam_schedule',
        'academic',
      ],
      [InquiryCategory.ATTENDANCE]: [
        'bus_time_inquiry',
        'bus_route_inquiry',
        'bus_delay',
        'leave_application',
        'leave_status',
        'attendance',
      ],
      [InquiryCategory.DISCIPLINE]: [
        'discipline',
        'behavior',
        'rule_violation',
      ],
      [InquiryCategory.HEALTH]: ['health', 'sick', 'medical', 'health_check'],
      [InquiryCategory.FINANCE]: [
        'fee_inquiry',
        'payment_method',
        'outstanding_fee',
        'tuition',
        'finance',
      ],
      [InquiryCategory.GENERAL]: [
        'general_info',
        'contact_info',
        'school_calendar',
        'lunch_menu',
        'lunch_change',
      ],
      [InquiryCategory.OTHER]: ['complaint', 'feedback', 'other_inquiry'],
    };

    // 简单的关键词检测
    const content = inquiry.content.toLowerCase();
    let sentiment = 'neutral';
    if (
      content.includes('緊急') ||
      content.includes('urgent') ||
      content.includes('很急')
    ) {
      sentiment = 'negative';
    } else if (content.includes('謝謝') || content.includes('thank')) {
      sentiment = 'positive';
    }

    const intents = intentMap[inquiry.category] || ['other_inquiry'];
    const confidence = 0.7 + Math.random() * 0.25; // 0.70-0.95

    // 检查是否适合自动回复（FAQ匹配）
    const autoEligible = this.checkAutoResponseEligible(inquiry.content);

    await this.inquiryRepository.update(inquiry.id, {
      aiIntent: intents[0],
      aiSentiment: sentiment,
      aiConfidence: confidence,
      autoResponseEligible: autoEligible,
    });
  }

  /**
   * 检查是否适合自动回复
   */
  private checkAutoResponseEligible(content: string): boolean {
    const faqPatterns = [
      '校車時間',
      '校車路線',
      '午膳',
      '餐單',
      '學費',
      '繳費',
      '上課時間',
      '放學時間',
      '聯絡電話',
      '地址',
    ];
    return faqPatterns.some((pattern) => content.includes(pattern));
  }

  /**
   * 获取查询列表
   * 按角色过滤：家长只能看到自己关联的查询
   */
  async findAll(
    query: InquiryQueryDto,
    userId: string,
    userRole: UserRole = UserRole.SCHOOL_STAFF,
  ): Promise<{ inquiries: ParentInquiry[]; total: number }> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const qb = this.inquiryRepository
      .createQueryBuilder('inquiry')

      .orderBy('inquiry.parentSubmittedAt', 'DESC');

    // 按角色过滤
    if (userRole === UserRole.PARENT) {
      // 家长只能看到自己提交的查询
      qb.andWhere('inquiry.parentId = :userId', { userId });
    }

    if (query.category) {
      qb.andWhere('inquiry.category = :category', { category: query.category });
    }
    if (query.status) {
      qb.andWhere('inquiry.status = :status', { status: query.status });
    }
    if (query.priority) {
      qb.andWhere('inquiry.priority = :priority', { priority: query.priority });
    }
    if (query.assignedTo) {
      qb.andWhere('inquiry.assignedTo = :assignedTo', {
        assignedTo: query.assignedTo,
      });
    }
    if (query.startDate) {
      qb.andWhere('inquiry.parentSubmittedAt >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }
    if (query.endDate) {
      qb.andWhere('inquiry.parentSubmittedAt <= :endDate', {
        endDate: new Date(query.endDate + 'T23:59:59'),
      });
    }

    const [inquiries, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { inquiries, total };
  }

  /**
   * 获取单个查询
   */
  async findOne(id: string): Promise<ParentInquiry> {
    const inquiry = await this.inquiryRepository.findOne({
      where: { id },
      relations: [],
    });

    if (!inquiry) {
      throw new NotFoundException('查询记录不存在');
    }

    return inquiry;
  }

  /**
   * 更新查询
   */
  async update(id: string, dto: UpdateInquiryDto): Promise<ParentInquiry> {
    const inquiry = await this.findOne(id);

    // 状态变更逻辑
    if (dto.status === InquiryStatus.PROCESSING && !inquiry.firstResponseAt) {
      dto = { ...dto, firstResponseAt: new Date() } as any;
    }
    if (dto.status === InquiryStatus.REPLIED && !inquiry.firstResponseAt) {
      dto = { ...dto, firstResponseAt: new Date() } as any;
    }
    if (dto.status === InquiryStatus.CLOSED) {
      dto = { ...dto, resolvedAt: new Date() } as any;
    }

    await this.inquiryRepository.update(id, dto as any);
    return this.findOne(id);
  }

  /**
   * 添加回复
   */
  async addReply(
    inquiryId: string,
    dto: CreateReplyDto,
    authorId: string,
    authorType: ReplyAuthorType,
  ): Promise<InquiryReply> {
    const inquiry = await this.findOne(inquiryId);

    const reply = this.replyRepository.create({
      ...dto,
      inquiryId,
      authorId,
      authorType,
    });

    const saved = await this.replyRepository.save(reply);

    // 更新查询状态为已回复（如果是第一次回复）
    if (!inquiry.firstResponseAt) {
      await this.inquiryRepository.update(inquiryId, {
        status: InquiryStatus.REPLIED,
        firstResponseAt: new Date(),
      });
    } else {
      await this.inquiryRepository.update(inquiryId, {
        status: InquiryStatus.PROCESSING,
      });
    }

    // 自动通知家长：校务人员已回复
    await this.sendReplyNotification(saved, inquiry);

    return saved;
  }

  /**
   * 发送回复通知给家长
   */
  private async sendReplyNotification(
    reply: InquiryReply,
    inquiry: ParentInquiry,
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification(
        {
          recipientIds: [],
          title: '您的查询已有新回复',
          content: `您关于"${inquiry.subject || '查询'}"的查询已收到回复，请查看。`,
          recipientType: 'system',
        },
        undefined,
        undefined,
      );
    } catch (error) {
      console.warn('[Inquiry] Failed to send reply notification:', error);
    }
  }

  /**
   * 获取查询的回复列表
   */
  async getReplies(inquiryId: string): Promise<InquiryReply[]> {
    return this.replyRepository.find({
      where: { inquiryId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 标记家长已查看回复
   */
  async markReplyViewed(replyId: string): Promise<void> {
    await this.replyRepository.update(replyId, {
      parentViewed: true,
      parentViewedAt: new Date(),
    });
  }

  /**
   * 提交满意度评价
   */
  async submitSatisfaction(
    id: string,
    dto: SatisfactionDto,
  ): Promise<ParentInquiry> {
    await this.findOne(id); // 验证查询是否存在

    await this.inquiryRepository.update(id, {
      satisfactionRating: dto.rating,
      satisfactionComment: dto.comment,
    });

    return this.findOne(id);
  }

  /**
   * 分配查询
   */
  async assign(id: string, assignedTo: string): Promise<ParentInquiry> {
    await this.inquiryRepository.update(id, {
      assignedTo,
      status: InquiryStatus.PROCESSING,
    });
    return this.findOne(id);
  }

  /**
   * 获取快速回复模板列表
   */
  async getTemplates(
    schoolId: string,
    category?: string,
  ): Promise<QuickReplyTemplate[]> {
    const qb = this.templateRepository
      .createQueryBuilder('template')
      .where('template.schoolId = :schoolId', { schoolId })
      .andWhere('template.isActive = :isActive', { isActive: true });

    if (category) {
      qb.andWhere('template.category = :category', { category });
    }

    return qb.orderBy('template.usageCount', 'DESC').getMany();
  }

  /**
   * 创建快速回复模板
   */
  async createTemplate(
    dto: CreateTemplateDto,
    schoolId: string,
    userId: string,
  ): Promise<QuickReplyTemplate> {
    const template = this.templateRepository.create({
      ...dto,
      schoolId,
      createdBy: userId,
      category: (dto.category || 'general') as any,
    });
    return this.templateRepository.save(template);
  }

  /**
   * 获取待处理查询统计
   */
  async getStatistics(schoolId: string): Promise<any> {
    const stats = await this.inquiryRepository
      .createQueryBuilder('inquiry')
      .select('inquiry.status', 'status')
      .addSelect('inquiry.category', 'category')
      .addSelect('inquiry.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('inquiry.schoolId = :schoolId', { schoolId })
      .groupBy('inquiry.status')
      .addGroupBy('inquiry.category')
      .addGroupBy('inquiry.priority')
      .getRawMany();

    const total = stats.reduce((sum, s) => sum + parseInt(s.count), 0);
    const pending = stats
      .filter((s) => s.status === InquiryStatus.PENDING)
      .reduce((sum, s) => sum + parseInt(s.count), 0);

    return { total, pending, stats };
  }

  /**
   * SLA检查：超时未回复的查询
   * 同时检查 normal(24h) 和 urgent(2h) 两种SLA
   */
  async checkSLAViolations(
    schoolId: string,
  ): Promise<{ normal: ParentInquiry[]; urgent: ParentInquiry[] }> {
    const now = new Date();

    // Normal SLA: 24小时
    const normalThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Urgent SLA: 2小时
    const urgentThreshold = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // 查询Normal级别超时
    const normalViolations = await this.inquiryRepository
      .createQueryBuilder('inquiry')
      .where('inquiry.schoolId = :schoolId', { schoolId })
      .andWhere('inquiry.status IN (:...statuses)', {
        statuses: [InquiryStatus.PENDING, InquiryStatus.PROCESSING],
      })
      .andWhere('inquiry.firstResponseAt IS NULL')
      .andWhere('inquiry.parentSubmittedAt < :threshold', {
        threshold: normalThreshold,
      })
      .andWhere('inquiry.priority = :priority', {
        priority: InquiryPriority.NORMAL,
      })
      .getMany();

    // 查询Urgent级别超时（2小时内未处理）
    const urgentViolations = await this.inquiryRepository
      .createQueryBuilder('inquiry')
      .where('inquiry.schoolId = :schoolId', { schoolId })
      .andWhere('inquiry.status IN (:...statuses)', {
        statuses: [InquiryStatus.PENDING, InquiryStatus.PROCESSING],
      })
      .andWhere('inquiry.firstResponseAt IS NULL')
      .andWhere('inquiry.parentSubmittedAt < :threshold', {
        threshold: urgentThreshold,
      })
      .andWhere('inquiry.priority = :priority', {
        priority: InquiryPriority.URGENT,
      })
      .getMany();

    return { normal: normalViolations, urgent: urgentViolations };
  }

  // ==========================================
  // 队列管理功能 (AC-04, AC-05, AC-06)
  // ==========================================

  /**
   * AC-04: 检查超时警告 (>10分钟未处理标记warning)
   * 每5分钟执行一次，更新所有待处理查询的超时警告级别
   */
  async checkTimeoutWarnings(
    schoolId: string,
  ): Promise<TimeoutWarningsResponseDto> {
    const now = new Date();
    const WARNING_THRESHOLD_MS = 10 * 60 * 1000; // 10分钟
    const CRITICAL_THRESHOLD_MS = 30 * 60 * 1000; // 30分钟

    // 获取所有未关闭且未首次回复的待处理查询
    const pendingInquiries = await this.inquiryRepository
      .createQueryBuilder('inquiry')

      .where('inquiry.schoolId = :schoolId', { schoolId })
      .andWhere('inquiry.status IN (:...statuses)', {
        statuses: [
          InquiryStatus.PENDING,
          InquiryStatus.PROCESSING,
          InquiryStatus.AUTO_REPLIED,
          InquiryStatus.ESCALATED,
        ],
      })
      .andWhere('inquiry.firstResponseAt IS NULL')
      .getMany();

    const warnings: TimeoutWarningDto[] = [];
    let warningCount = 0;
    let criticalCount = 0;

    for (const inquiry of pendingInquiries) {
      const waitingMs =
        now.getTime() - new Date(inquiry.parentSubmittedAt).getTime();
      const waitingMinutes = Math.floor(waitingMs / 60000);

      let warningLevel = TimeoutWarningLevel.NONE;

      if (waitingMs >= CRITICAL_THRESHOLD_MS) {
        warningLevel = TimeoutWarningLevel.CRITICAL;
        criticalCount++;
      } else if (waitingMs >= WARNING_THRESHOLD_MS) {
        warningLevel = TimeoutWarningLevel.WARNING;
        warningCount++;
      }

      // 更新数据库中的警告级别
      if (inquiry.timeoutWarning !== warningLevel) {
        await this.inquiryRepository.update(inquiry.id, {
          timeoutWarning: warningLevel,
        });
      }

      if (warningLevel !== TimeoutWarningLevel.NONE) {
        warnings.push({
          inquiryId: inquiry.id,
          inquiryNo: inquiry.inquiryNo,
          parentName: (inquiry as any).parent?.name || '未知',
          category: inquiry.category,
          waitingMinutes,
          warningLevel,
        });
      }
    }

    // 按等待时长降序排列
    warnings.sort((a, b) => b.waitingMinutes - a.waitingMinutes);

    return {
      warningCounts: {
        total: warningCount + criticalCount,
        warning: warningCount,
        critical: criticalCount,
      },
      warnings,
    };
  }

  /**
   * AC-04: 获取队列视图（包含超时警告信息）
   */
  async getQueue(
    query: QueueQueryDto,
    schoolId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<QueueResponseDto> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    const qb = this.inquiryRepository.createQueryBuilder('inquiry');

    // 只看校务人员/主任
    if (
      userRole === UserRole.SCHOOL_STAFF ||
      userRole === UserRole.SCHOOL_DIRECTOR
    ) {
      // 可以看所有
    }

    // 只有当schoolId有效时才添加过滤条件
    if (schoolId) {
      qb.where('inquiry.schoolId = :schoolId', { schoolId });
    } else {
      // 测试环境：如果没有schoolId，显示所有查询
      qb.where('inquiry.id IS NOT NULL');
    }

    // 过滤条件
    if (query.assignedTo) {
      qb.andWhere('inquiry.assignedTo = :assignedTo', {
        assignedTo: query.assignedTo,
      });
    }

    if (query.timeoutOnly) {
      qb.andWhere('inquiry.timeoutWarning IN (:...levels)', {
        levels: [TimeoutWarningLevel.WARNING, TimeoutWarningLevel.CRITICAL],
      });
    }

    if (query.escalatedOnly) {
      qb.andWhere('inquiry.escalationRequired = :escalated', {
        escalated: true,
      });
    }

    // 只看未关闭的
    qb.andWhere('inquiry.status NOT IN (:...closedStatuses)', {
      closedStatuses: [InquiryStatus.CLOSED],
    });

    // 排序
    const sortBy = query.sortBy || 'submittedAt';
    if (sortBy === 'waitingMinutes') {
      // 按等待时长降序（最久的在前）
      qb.orderBy('inquiry.parentSubmittedAt', 'ASC');
    } else if (sortBy === 'priority') {
      // 紧急优先
      qb.orderBy('inquiry.priority', 'ASC').addOrderBy(
        'inquiry.parentSubmittedAt',
        'ASC',
      );
    } else {
      // 默认按提交时间降序（最新的在前）
      qb.orderBy('inquiry.parentSubmittedAt', 'DESC');
    }

    const [inquiries, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const now = new Date();

    // 统计数据
    const statsQb = this.inquiryRepository
      .createQueryBuilder('inquiry')
      .select('inquiry.status', 'status')
      .addSelect('COUNT(*)', 'count');

    if (schoolId) {
      statsQb.where('inquiry.schoolId = :schoolId', { schoolId });
    } else {
      statsQb.where('inquiry.id IS NOT NULL');
    }

    statsQb
      .andWhere('inquiry.status NOT IN (:...closedStatuses)', {
        closedStatuses: [InquiryStatus.CLOSED],
      })
      .groupBy('inquiry.status');

    const statsRaw = await statsQb.getRawMany();
    const statsMap: Record<string, number> = {};
    statsRaw.forEach((s) => {
      statsMap[s.status] = parseInt(s.count);
    });

    const timeoutQb = this.inquiryRepository
      .createQueryBuilder('inquiry')
      .select('inquiry.timeoutWarning', 'warning')
      .addSelect('COUNT(*)', 'count');

    if (schoolId) {
      timeoutQb.where('inquiry.schoolId = :schoolId', { schoolId });
    } else {
      timeoutQb.where('inquiry.id IS NOT NULL');
    }

    timeoutQb
      .andWhere('inquiry.timeoutWarning IN (:...levels)', {
        levels: [TimeoutWarningLevel.WARNING, TimeoutWarningLevel.CRITICAL],
      })
      .andWhere('inquiry.status NOT IN (:...closedStatuses)', {
        closedStatuses: [InquiryStatus.CLOSED],
      })
      .groupBy('inquiry.timeoutWarning');

    const timeoutRaw = await timeoutQb.getRawMany();
    const timeoutMap: Record<string, number> = {};
    timeoutRaw.forEach((s) => {
      timeoutMap[s.warning] = parseInt(s.count);
    });

    const items: QueueItemDto[] = inquiries.map((inquiry) => {
      const waitingMs =
        now.getTime() - new Date(inquiry.parentSubmittedAt).getTime();
      const waitingMinutes = Math.floor(waitingMs / 60000);

      return {
        id: inquiry.id,
        inquiryNo: inquiry.inquiryNo,
        parentName: (inquiry as any).parent?.name || '未知',
        category: inquiry.category,
        channel: inquiry.channel,
        priority: inquiry.priority,
        status: inquiry.status,
        aiIntent: inquiry.aiIntent || '未分类',
        sentiment: inquiry.sentiment || InquirySentiment.NEUTRAL,
        waitingMinutes,
        timeoutWarning: inquiry.timeoutWarning,
        escalationRequired: inquiry.escalationRequired,
        autoResponseEligible: inquiry.autoResponseEligible,
        aiSuggestedResponse: inquiry.aiSuggestedResponse || '',
        assignedToName: inquiry.assignedTo || '待分配',
        submittedAt: inquiry.parentSubmittedAt,
      };
    });

    return {
      stats: {
        total: total,
        pending: statsMap[InquiryStatus.PENDING] || 0,
        processing: statsMap[InquiryStatus.PROCESSING] || 0,
        autoReplied: statsMap[InquiryStatus.AUTO_REPLIED] || 0,
        escalated: statsMap[InquiryStatus.ESCALATED] || 0,
        timeoutWarning: timeoutMap[TimeoutWarningLevel.WARNING] || 0,
        timeoutCritical: timeoutMap[TimeoutWarningLevel.CRITICAL] || 0,
      },
      items,
      total,
    };
  }

  /**
   * AC-05: 一键快速回复（使用模板或AI建议）
   */
  async quickReply(
    inquiryId: string,
    content: string,
    authorId: string,
    authorType: ReplyAuthorType = ReplyAuthorType.OFFICER,
  ): Promise<InquiryReply> {
    const inquiry = await this.findOne(inquiryId);

    const reply = this.replyRepository.create({
      inquiryId,
      authorId,
      authorType,
      content,
    });

    const saved = await this.replyRepository.save(reply);

    // 更新状态（标记为已回复）
    if (!inquiry.firstResponseAt) {
      await this.inquiryRepository.update(inquiryId, {
        status: InquiryStatus.REPLIED,
        firstResponseAt: new Date(),
      });
    }

    // 通知家长
    await this.sendReplyNotification(saved, inquiry);

    return saved;
  }

  /**
   * AC-05: 自动回复（AI识别常见查询自动回复）
   */
  async autoReply(
    inquiryId: string,
    _schoolId: string,
  ): Promise<{ success: boolean; replyId?: string }> {
    const inquiry = await this.findOne(inquiryId);

    // 只有符合条件的才能自动回复
    if (!inquiry.autoResponseEligible || !inquiry.aiSuggestedResponse) {
      return { success: false };
    }

    // 创建AI回复
    const reply = this.replyRepository.create({
      inquiryId,
      authorId: 'ai_system',
      authorType: ReplyAuthorType.AI,
      content: inquiry.aiSuggestedResponse,
      isAiGenerated: true,
    });

    const saved = await this.replyRepository.save(reply);

    // 更新状态为自动回复
    await this.inquiryRepository.update(inquiryId, {
      status: InquiryStatus.AUTO_REPLIED,
      firstResponseAt: new Date(),
    });

    // 通知家长
    await this.sendReplyNotification(saved, inquiry);

    this.logger.log(
      `[AutoReply] Inquiry ${inquiryId} auto-replied successfully`,
    );

    return { success: true, replyId: saved.id };
  }

  /**
   * AC-06: 转交查询给其他部门同事
   */
  async transferInquiry(
    inquiryId: string,
    dto: TransferInquiryDto,
    transferredBy: string,
  ): Promise<ParentInquiry> {
    const inquiry = await this.findOne(inquiryId);

    const updates: any = {
      transferTo: dto.transferTo,
      transferStatus: TransferStatus.PENDING,
      transferReason: dto.reason,
      transferredBy,
      // 如果原状态是待处理，保持待处理（等待新处理人接收）
      // 如果已经有人处理，可以改为PROCESSING让新处理人继续
      status: InquiryStatus.PROCESSING,
    };

    await this.inquiryRepository.update(inquiryId, updates);

    // 发送通知给转交目标
    await this.notificationService.sendNotification(
      {
        recipientIds: [dto.transferTo],
        title: '🔄 收到转交查询',
        content: `有一条来自 ${(inquiry as any).parent?.name || '家长'} 的查询已转交给您处理。\n原因：${dto.reason}\n查询编号：${inquiry.inquiryNo}`,
        recipientType: 'system',
      },
      undefined,
      undefined,
    );

    this.logger.log(
      `[Transfer] Inquiry ${inquiryId} transferred to ${dto.transferTo} by ${transferredBy}`,
    );

    return this.findOne(inquiryId);
  }

  /**
   * AC-06: 接受或拒绝转交
   */
  async handleTransfer(
    inquiryId: string,
    accept: boolean,
    userId: string,
  ): Promise<ParentInquiry> {
    const inquiry = await this.findOne(inquiryId);

    if (inquiry.transferTo !== userId) {
      throw new Error('此查询未转交给您');
    }

    const updates: any = {
      transferStatus: accept
        ? TransferStatus.ACCEPTED
        : TransferStatus.REJECTED,
    };

    if (accept) {
      updates.assignedTo = userId;
      updates.status = InquiryStatus.PROCESSING;
    }

    await this.inquiryRepository.update(inquiryId, updates);

    return this.findOne(inquiryId);
  }

  /**
   * AC-01: 记录来电通话信息（仅记录元数据，不含敏感内容）
   */
  async recordCallLog(
    inquiryId: string,
    dto: CallLogDto,
    _userId: string,
  ): Promise<ParentInquiry> {
    const inquiry = await this.findOne(inquiryId);

    const updates: any = {
      callDurationMinutes: dto.callDurationMinutes,
      callResult: dto.callResult,
      sentiment: dto.sentiment,
      // AC-08: 情绪激动 → 自动升级至校务主任处理 (AC-03)
      escalationRequired:
        dto.sentiment === InquirySentiment.ANGRY
          ? true
          : inquiry.escalationRequired,
    };

    // 如果情绪激动，自动升级
    if (
      dto.sentiment === InquirySentiment.ANGRY &&
      !inquiry.escalationRequired
    ) {
      updates.escalationRequired = true;
      updates.status = InquiryStatus.ESCALATED;

      // 触发升级通知
      await this.escalationService.checkAndEscalate(
        inquiryId,
        inquiry.content,
        inquiry.subject,
      );

      await this.notificationService.sendNotification(
        {
          recipientIds: [],
          title: '🚨 情绪激动查询 - 需升级处理',
          content: `家长情绪激动，请校务主任及时处理此查询：${inquiry.inquiryNo}`,
          recipientType: 'system',
        },
        undefined,
        undefined,
      );
    }

    // 如果这是第一次回复，更新状态
    if (!inquiry.firstResponseAt) {
      updates.firstResponseAt = new Date();
      updates.status = InquiryStatus.PROCESSING;
    }

    await this.inquiryRepository.update(inquiryId, updates);

    this.logger.log(
      `[CallLog] Recorded call log for ${inquiryId}: duration=${dto.callDurationMinutes}min, sentiment=${dto.sentiment}`,
    );

    return this.findOne(inquiryId);
  }
}
