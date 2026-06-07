import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../user/user.entity';
import { NotificationService } from '../notification/notification.service';
import {
  ParentInquiry,
  InquiryCategory,
  InquiryPriority,
  InquiryStatus,
} from './inquiry.entity';
import { InquiryReply, ReplyAuthorType } from './reply.entity';
import { QuickReplyTemplate } from './template.entity';
import {
  CreateInquiryDto,
  UpdateInquiryDto,
  CreateReplyDto,
  SatisfactionDto,
  CreateTemplateDto,
  InquiryQueryDto,
} from './dto/inquiry.dto';

@Injectable()
export class InquiryService {
  constructor(
    @InjectRepository(ParentInquiry)
    private inquiryRepository: Repository<ParentInquiry>,
    @InjectRepository(InquiryReply)
    private replyRepository: Repository<InquiryReply>,
    @InjectRepository(QuickReplyTemplate)
    private templateRepository: Repository<QuickReplyTemplate>,
    private readonly notificationService: NotificationService,
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
      [InquiryCategory.BUS_SCHEDULE]: 'bus_team',
      [InquiryCategory.TUITION_FEE]: 'finance_team',
      [InquiryCategory.ACADEMIC]: 'academic_team',
      [InquiryCategory.LEAVE]: 'leave_team',
      [InquiryCategory.LUNCH]: 'lunch_team',
      [InquiryCategory.GENERAL]: 'general_team',
      [InquiryCategory.COMPLAINT]: 'director_queue',
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
    const inquiry = this.inquiryRepository.create({
      ...dto,
      inquiryNo: this.generateInquiryNo(),
      schoolId,
      parentSubmittedAt: new Date(),
      status: InquiryStatus.PENDING,
      assignedTo: this.autoAssignOfficer(dto.category),
    });

    const saved = await this.inquiryRepository.save(inquiry);

    // AI分析（模拟，实际应调用AI服务）
    await this.performAIAnalysis(saved);

    // 自动通知校务人员：有新的家长查询
    await this.sendInquirySubmissionNotification(saved);

    return this.findOne(saved.id);
  }

  /**
   * 发送家长查询提交通知给校务人员（实际应调用Coze/OpenAI）
   */
  private async performAIAnalysis(inquiry: ParentInquiry): Promise<void> {
    // 意图分类映射
    const intentMap: Record<InquiryCategory, string[]> = {
      [InquiryCategory.BUS_SCHEDULE]: [
        'bus_time_inquiry',
        'bus_route_inquiry',
        'bus_delay',
      ],
      [InquiryCategory.TUITION_FEE]: [
        'fee_inquiry',
        'payment_method',
        'outstanding_fee',
      ],
      [InquiryCategory.ACADEMIC]: [
        'grade_inquiry',
        'homework',
        'exam_schedule',
      ],
      [InquiryCategory.LEAVE]: ['leave_application', 'leave_status'],
      [InquiryCategory.LUNCH]: ['lunch_menu', 'lunch_change'],
      [InquiryCategory.GENERAL]: [
        'general_info',
        'contact_info',
        'school_calendar',
      ],
      [InquiryCategory.COMPLAINT]: ['complaint', 'feedback'],
      [InquiryCategory.OTHER]: ['other_inquiry'],
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
      .leftJoinAndSelect('inquiry.parent', 'parent')
      .leftJoinAndSelect('inquiry.student', 'student')
      .leftJoinAndSelect('inquiry.assignedOfficer', 'assignedOfficer')
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
      relations: ['parent', 'student', 'assignedOfficer'],
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
      await this.notificationService.sendNotification({
        recipientIds: [inquiry.parentId],
        title: '您的查询已有新回复',
        content: `您关于"${inquiry.title}"的查询已收到回复，请查看。`,
        type: 'system',
        priority: 'normal',
        relatedEntityType: 'parent_inquiry',
        relatedEntityId: inquiry.id,
        senderId: reply.authorId,
        schoolId: inquiry.schoolId,
      });
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
}
