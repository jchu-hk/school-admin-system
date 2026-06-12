import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inquiry, InquiryReply, InquiryStatus, InquiryPriority } from './inquiry.entity';
import { InquiryEscalationHistory } from './inquiry-escalation-history.entity';
import { CreateInquiryDto, UpdateInquiryDto, CreateInquiryReplyDto } from './dto/inquiry.dto';
import { InquiryIntentService, IntentClassificationResult, IntentType } from './inquiry-intent.service';
import { InquiryEscalationService, EscalationResult } from './inquiry-escalation.service';

export interface CreateInquiryResult {
  inquiry: Inquiry;
  intent?: IntentClassificationResult;
  escalation?: EscalationResult;
}

@Injectable()
export class InquiryService {
  private readonly logger = new Logger(InquiryService.name);

  constructor(
    @InjectRepository(Inquiry)
    private inquiryRepository: Repository<Inquiry>,
    @InjectRepository(InquiryReply)
    private replyRepository: Repository<InquiryReply>,
    private readonly intentService: InquiryIntentService,
    private readonly escalationService: InquiryEscalationService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: InquiryStatus,
    inquiryType?: string,
    parentId?: string,
    priority?: InquiryPriority,
    isUrgent?: boolean,
  ): Promise<{ inquiries: Inquiry[]; total: number }> {
    const queryBuilder = this.inquiryRepository.createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.parent', 'parent')
      .leftJoinAndSelect('inquiry.assignee', 'assignee')
      .where('inquiry.deletedAt IS NULL');

    if (status) {
      queryBuilder.andWhere('inquiry.status = :status', { status });
    }

    if (inquiryType) {
      queryBuilder.andWhere('inquiry.inquiryType = :inquiryType', { inquiryType });
    }

    if (parentId) {
      queryBuilder.andWhere('inquiry.parentId = :parentId', { parentId });
    }

    if (priority) {
      queryBuilder.andWhere('inquiry.priority = :priority', { priority });
    }

    if (isUrgent !== undefined) {
      queryBuilder.andWhere('inquiry.isUrgent = :isUrgent', { isUrgent });
    }

    const [inquiries, total] = await queryBuilder
      .orderBy('inquiry.isUrgent', 'DESC')
      .addOrderBy('inquiry.priority', 'DESC')
      .addOrderBy('inquiry.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { inquiries, total };
  }

  async findOne(id: string): Promise<Inquiry> {
    const inquiry = await this.inquiryRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['parent', 'assignee', 'closer'],
    });

    if (!inquiry) {
      throw new NotFoundException('查询不存在');
    }

    return inquiry;
  }

  async findOneWithReplies(id: string): Promise<{ inquiry: Inquiry; replies: InquiryReply[] }> {
    const inquiry = await this.findOne(id);
    
    const replies = await this.replyRepository.find({
      where: { inquiryId: id, deletedAt: null },
      relations: ['replier'],
      order: { createdAt: 'ASC' },
    });

    return { inquiry, replies };
  }

  async create(createDto: CreateInquiryDto): Promise<Inquiry> {
    // AI意图分类
    const intentResult = this.intentService.classify(
      `${createDto.title} ${createDto.content}`,
    );
    this.logger.debug(
      `[AI Intent] ${createDto.title}: ${intentResult.primaryIntent.intent} (${intentResult.primaryIntent.confidence})`,
    );

    // 自动升级检查
    const escalationResult = await this.escalationService.checkAndEscalate(
      '', // 新建时尚无ID，先生成，后续更新
      createDto.content,
      createDto.title,
    );

    // 构建查询数据（包含AI意图标签）
    const inquiryData: Partial<Inquiry> = {
      ...createDto,
      status: InquiryStatus.PENDING,
      isUrgent: escalationResult.isEscalated,
      priority: escalationResult.priority || InquiryPriority.NORMAL,
      intentType: intentResult.primaryIntent.intent,
      intentConfidence: intentResult.primaryIntent.confidence,
      intentKeywords: intentResult.primaryIntent.matchedKeywords.join(','),
    };

    const inquiry = this.inquiryRepository.create(inquiryData);
    return this.inquiryRepository.save(inquiry);
  }

  /**
   * 创建查询并返回AI分析结果
   */
  async createWithAnalysis(createDto: CreateInquiryDto): Promise<CreateInquiryResult> {
    // AI意图分类
    const intentResult = this.intentService.classify(
      `${createDto.title} ${createDto.content}`,
    );
    this.logger.debug(
      `[AI Intent] "${createDto.title}": ${intentResult.primaryIntent.intent} (${intentResult.primaryIntent.confidence})`,
    );

    // 自动升级检查（先用占位符，后续更新ID）
    const escalationResult = await this.escalationService.checkAndEscalate(
      'pending',
      createDto.content,
      createDto.title,
    );

    const inquiryData: Partial<Inquiry> = {
      ...createDto,
      status: InquiryStatus.PENDING,
      isUrgent: escalationResult.isEscalated,
      priority: escalationResult.priority || InquiryPriority.NORMAL,
      intentType: intentResult.primaryIntent.intent,
      intentConfidence: intentResult.primaryIntent.confidence,
      intentKeywords: intentResult.primaryIntent.matchedKeywords.join(','),
    };

    const inquiry = this.inquiryRepository.create(inquiryData);
    const savedInquiry = await this.inquiryRepository.save(inquiry);

    // 紧急查询：更新通知中的查询ID
    if (escalationResult.isEscalated) {
      await this.escalationService.notifyAdmins(
        savedInquiry.id,
        {
          keywords: [],
          category: escalationResult.category || '紧急',
          priority: escalationResult.priority || InquiryPriority.HIGH,
          notificationTemplate: `紧急查询 [${savedInquiry.id}] 请立即处理`,
        },
        [],
      );
    }

    return {
      inquiry: savedInquiry,
      intent: intentResult,
      escalation: escalationResult,
    };
  }

  /**
   * AI意图分类分析（仅分析，不创建记录）
   */
  analyzeIntent(text: string, title?: string): IntentClassificationResult {
    return this.intentService.classify(`${title || ''} ${text}`.trim());
  }

  async update(id: string, updateDto: UpdateInquiryDto, updatedBy?: string): Promise<Inquiry> {
    const inquiry = await this.findOne(id);

    // 如果分配了处理人，更新状态为处理中
    if (updateDto.assignedTo && inquiry.status === InquiryStatus.PENDING) {
      updateDto.status = InquiryStatus.PROCESSING;
    }

    // 如果状态变为已关闭，设置关闭时间和关闭人
    if (updateDto.status === InquiryStatus.CLOSED && inquiry.status !== InquiryStatus.CLOSED) {
      inquiry.closedAt = new Date();
      inquiry.closedBy = updatedBy;
    }

    Object.assign(inquiry, updateDto);
    return this.inquiryRepository.save(inquiry);
  }

  async remove(id: string): Promise<void> {
    const inquiry = await this.findOne(id);
    await this.inquiryRepository.softRemove(inquiry);
  }

  async findReplies(inquiryId: string): Promise<InquiryReply[]> {
    return this.replyRepository.find({
      where: { inquiryId, deletedAt: null },
      relations: ['replier'],
      order: { createdAt: 'ASC' },
    });
  }

  async createReply(createDto: CreateInquiryReplyDto, replierId: string): Promise<InquiryReply> {
    const inquiry = await this.findOne(createDto.inquiryId);

    if (inquiry.status === InquiryStatus.CLOSED) {
      throw new BadRequestException('该查询已关闭，无法回复');
    }

    // 更新查询状态为处理中
    if (inquiry.status === InquiryStatus.PENDING) {
      await this.inquiryRepository.update(createDto.inquiryId, {
        status: InquiryStatus.PROCESSING,
        assignedTo: replierId,
      });
    }

    const reply = this.replyRepository.create({
      inquiryId: createDto.inquiryId,
      replierId,
      content: createDto.content,
    });

    return this.replyRepository.save(reply);
  }

  async close(inquiryId: string, closedBy: string): Promise<Inquiry> {
    const inquiry = await this.findOne(inquiryId);

    if (inquiry.status === InquiryStatus.CLOSED) {
      throw new BadRequestException('该查询已经是关闭状态');
    }

    await this.inquiryRepository.update(inquiryId, {
      status: InquiryStatus.CLOSED,
      closedBy,
      closedAt: new Date(),
    });

    return this.findOne(inquiryId);
  }

  async addRating(
    inquiryId: string,
    parentId: string,
    rating: number,
    comment?: string,
  ): Promise<Inquiry> {
    const inquiry = await this.findOne(inquiryId);

    if (inquiry.parentId !== parentId) {
      throw new BadRequestException('只有查询提交者可以评价');
    }

    if (inquiry.status !== InquiryStatus.CLOSED) {
      throw new BadRequestException('查询未关闭，无法评价');
    }

    if (inquiry.rating !== null && inquiry.rating !== undefined) {
      throw new BadRequestException('已经评价过了');
    }

    await this.inquiryRepository.update(inquiryId, {
      rating,
      ratingComment: comment,
    });

    return this.findOne(inquiryId);
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    closed: number;
    averageRating: number;
  }> {
    const total = await this.inquiryRepository.count({ where: { deletedAt: null } });
    const pending = await this.inquiryRepository.count({ 
      where: { status: InquiryStatus.PENDING, deletedAt: null } 
    });
    const processing = await this.inquiryRepository.count({ 
      where: { status: InquiryStatus.PROCESSING, deletedAt: null } 
    });
    const closed = await this.inquiryRepository.count({ 
      where: { status: InquiryStatus.CLOSED, deletedAt: null } 
    });

    const ratingResult = await this.inquiryRepository
      .createQueryBuilder('inquiry')
      .select('AVG(inquiry.rating)', 'averageRating')
      .where('inquiry.rating IS NOT NULL')
      .andWhere('inquiry.deletedAt IS NULL')
      .getRawOne();

    return {
      total,
      pending,
      processing,
      closed,
      averageRating: ratingResult?.averageRating ? parseFloat(ratingResult.averageRating) : 0,
    };
  }

  async getUrgentInquiries(): Promise<Inquiry[]> {
    return this.inquiryRepository.find({
      where: { isUrgent: true, deletedAt: null },
      relations: ['parent', 'assignee'],
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * F-INQ-001 #71: AI意图分类
   * 识别家长查询意图（出勤/成绩/通知/其他），自动打标签，智能推荐回复
   */
  classifyIntent(content: string): IntentClassificationResult {
    return this.intentService.classify(content);
  }

  /**
   * F-INQ-001 #72: 紧急升级
   * 识别紧急关键字，自动升级到高优先级队列，发送通知，记录升级历史
   */
  async urgentUpgrade(
    inquiryId: string,
    reason: string,
    triggeredBy: string,
  ): Promise<EscalationResult> {
    return this.escalationService.manualEscalate(inquiryId, reason, triggeredBy);
  }

  /**
   * 获取查询的升级历史
   */
  async getEscalationHistory(inquiryId: string): Promise<InquiryEscalationHistory[]> {
    return this.escalationService.getEscalationHistory(inquiryId);
  }
}
