import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notification.entity';
import { Inquiry, InquiryPriority } from './inquiry.entity';
import { User, UserRole, UserStatus } from '../user/user.entity';

/**
 * 紧急查询升级配置
 */
export interface EscalationConfig {
  keywords: string[];
  category: string;
  priority: InquiryPriority;
  notificationTemplate: string;
}

export interface EscalationResult {
  isEscalated: boolean;
  reason: string;
  category?: string;
  priority?: InquiryPriority;
  notifiedAdmins?: string[];
}

/**
 * 紧急查询升级服务
 * 关键词触发自动升级并通知管理员
 */
@Injectable()
export class InquiryEscalationService implements OnModuleInit {
  private readonly logger = new Logger(InquiryEscalationService.name);

  // 紧急升级关键词配置
  private readonly escalationConfigs: EscalationConfig[] = [
    {
      keywords: [
        '安全', '危险', '受伤', '受伤了', '流血', '摔', '撞',
        'safety', 'danger', 'injury', 'hurt', 'bleeding', 'accident',
      ],
      category: '安全问题',
      priority: InquiryPriority.URGENT,
      notificationTemplate: '学生安全问题，请立即处理',
    },
    {
      keywords: [
        '紧急', '立刻', '马上', '救命', '报警', '救护车',
        'urgent', 'emergency', 'immediately', 'now',
      ],
      category: '紧急事件',
      priority: InquiryPriority.URGENT,
      notificationTemplate: '紧急查询，请立即响应',
    },
    {
      keywords: [
        '投诉', '举报', '不满', '严重', '恶劣', '恶劣行为',
        'complaint', 'report', 'serious', 'severe', 'abuse',
      ],
      category: '投诉举报',
      priority: InquiryPriority.HIGH,
      notificationTemplate: '收到投诉举报，请及时跟进',
    },
    {
      keywords: [
        '霸凌', '欺凌', '被打', '被欺负', '被骂',
        'bullying', 'bullied', 'hit', 'harassment',
      ],
      category: '霸凌事件',
      priority: InquiryPriority.HIGH,
      notificationTemplate: '涉及霸凌，请立即调查处理',
    },
    {
      keywords: [
        '虐待', '体罚', '性侵', '性骚扰',
        'abuse', 'molestation', 'assault', 'punishment',
      ],
      category: '虐待举报',
      priority: InquiryPriority.URGENT,
      notificationTemplate: '严重举报，请立即上报处理',
    },
    {
      keywords: [
        '食物中毒', '食物安全', '吃坏', '拉肚子',
        'food poisoning', 'food safety', 'illness',
      ],
      category: '食品安全',
      priority: InquiryPriority.HIGH,
      notificationTemplate: '食品安全问题，请立即关注',
    },
    {
      keywords: [
        '自杀', '自残', '抑郁', '心理问题',
        'suicide', 'self-harm', 'depression', 'mental',
      ],
      category: '心理健康危机',
      priority: InquiryPriority.URGENT,
      notificationTemplate: '心理健康危机，请立即联系心理老师',
    },
  ];

  constructor(
    @InjectRepository(Inquiry)
    private inquiryRepository: Repository<Inquiry>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  onModuleInit() {
    this.logger.log('InquiryEscalationService initialized');
  }

  /**
   * 检查文本是否包含紧急关键词，并触发升级
   */
  async checkAndEscalate(
    inquiryId: string,
    content: string,
    title?: string,
  ): Promise<EscalationResult> {
    const fullText = `${title || ''} ${content || ''}`.toLowerCase().trim();

    if (!fullText) {
      return { isEscalated: false, reason: '文本为空，跳过检查' };
    }

    // 匹配最紧急的关键词
    for (const config of this.escalationConfigs) {
      const matchedKeywords = config.keywords.filter((kw) =>
        fullText.includes(kw.toLowerCase()),
      );

      if (matchedKeywords.length > 0) {
        this.logger.warn(
          `[Escalation] Inquiry ${inquiryId} triggered escalation: ${config.category} (matched: ${matchedKeywords.join(', ')})`,
        );

        // 更新查询优先级
        await this.markAsEscalated(inquiryId, config);

        // 通知管理员
        const notifiedAdmins = await this.notifyAdmins(
          inquiryId,
          config,
          matchedKeywords,
        );

        return {
          isEscalated: true,
          reason: `匹配到紧急关键词: ${matchedKeywords.join(', ')}`,
          category: config.category,
          priority: config.priority,
          notifiedAdmins,
        };
      }
    }

    return { isEscalated: false, reason: '未检测到紧急关键词' };
  }

  /**
   * 将查询标记为紧急/高优先级
   */
  async markAsEscalated(
    inquiryId: string,
    config: EscalationConfig,
  ): Promise<void> {
    await this.inquiryRepository.update(inquiryId, {
      isUrgent: true,
      priority: config.priority,
    });

    this.logger.log(
      `[Escalation] Inquiry ${inquiryId} marked as ${config.priority} priority (${config.category})`,
    );
  }

  /**
   * 通知所有管理员关于紧急查询
   */
  async notifyAdmins(
    inquiryId: string,
    config: EscalationConfig,
    matchedKeywords: string[],
  ): Promise<string[]> {
    // 查询管理员角色用户
    const adminRoles = [UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR];
    const admins = await this.userRepository.find({
      where: {
        role: In(adminRoles),
        status: UserStatus.ACTIVE,
      },
      select: ['id', 'name', 'email'],
    });

    if (admins.length === 0) {
      this.logger.warn('[Escalation] No active admins found to notify');
      return [];
    }

    const adminIds = admins.map((a) => a.id);
    const notificationTitle = `🚨 紧急查询通知 - ${config.category}`;
    const notificationContent = `${config.notificationTemplate}\n\n查询ID: ${inquiryId}\n匹配关键词: ${matchedKeywords.join(', ')}\n请立即登录系统查看并处理。`;

    try {
      // 批量发送通知
      await this.notificationService.sendBulkNotification(
        adminIds,
        notificationTitle,
        notificationContent,
        undefined, // 系统发送
      );

      this.logger.log(
        `[Escalation] Notified ${admins.length} admins about inquiry ${inquiryId}`,
      );
    } catch (error) {
      this.logger.error(
        `[Escalation] Failed to notify admins: ${error.message}`,
      );
    }

    return adminIds;
  }

  /**
   * 批量检查多个查询是否需要升级
   */
  async checkBatch(
    items: Array<{ id: string; content: string; title?: string }>,
  ): Promise<Map<string, EscalationResult>> {
    const results = new Map<string, EscalationResult>();

    for (const item of items) {
      const result = await this.checkAndEscalate(
        item.id,
        item.content,
        item.title,
      );
      results.set(item.id, result);
    }

    return results;
  }

  /**
   * 获取所有紧急查询
   */
  async getUrgentInquiries(): Promise<Inquiry[]> {
    return this.inquiryRepository.find({
      where: { isUrgent: true },
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * 获取升级统计
   */
  async getEscalationStats(): Promise<{
    totalUrgent: number;
    byCategory: Record<string, number>;
  }> {
    const urgentInquiries = await this.inquiryRepository.find({
      where: { isUrgent: true },
      select: ['id', 'priority', 'inquiryType', 'createdAt'],
    });

    return {
      totalUrgent: urgentInquiries.length,
      byCategory: {},
    };
  }
}
