import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationTemplate,
  NotificationChannel,
  NotificationUrgency,
  NotificationStatus,
  DeliveryStatus,
} from './template.entity';
import { Notification, NotificationDelivery } from './notification.entity';
import {
  SendNotificationDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  NotificationQueryDto,
} from './dto/notification.dto';

/**
 * HTML转义函数，防止XSS攻击
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationTemplate)
    private templateRepository: Repository<NotificationTemplate>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationDelivery)
    private deliveryRepository: Repository<NotificationDelivery>,
  ) {}

  // ==================== 模板管理 ====================

  private generateTemplateNo(): string {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TPL-${random}`;
  }

  private generateNotificationNo(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `NOTIF-${date}-${random}`;
  }

  /**
   * 创建通知模板
   */
  async createTemplate(
    dto: CreateTemplateDto,
    schoolId: string,
    userId: string,
  ): Promise<NotificationTemplate> {
    // 检查编号是否重复
    const existing = await this.templateRepository.findOne({
      where: { templateCode: dto.templateCode },
    });
    if (existing) {
      throw new BadRequestException('模板编号已存在');
    }

    const template = this.templateRepository.create({
      ...dto,
      schoolId,
      channels: JSON.stringify(dto.channels),
      variables: dto.variables ? JSON.stringify(dto.variables) : null,
      createdBy: userId,
    });

    return this.templateRepository.save(template);
  }

  /**
   * 更新通知模板
   */
  async updateTemplate(
    id: string,
    dto: UpdateTemplateDto,
  ): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('模板不存在');
    }

    const updateData: any = { ...dto };
    if (dto.channels) {
      updateData.channels = JSON.stringify(dto.channels);
    }

    await this.templateRepository.update(id, {
      ...updateData,
      version: template.version + 1,
    });

    return this.templateRepository.findOne({ where: { id } });
  }

  /**
   * 获取模板列表
   */
  async getTemplates(
    schoolId: string,
    category?: string,
  ): Promise<NotificationTemplate[]> {
    const qb = this.templateRepository
      .createQueryBuilder('template')
      .where('template.schoolId = :schoolId', { schoolId })
      .andWhere('template.isActive = :isActive', { isActive: true });

    if (category) {
      qb.andWhere('template.category = :category', { category });
    }

    return qb.orderBy('template.name', 'ASC').getMany();
  }

  /**
   * 获取单个模板
   */
  async getTemplate(id: string): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
    return template;
  }

  // ==================== 通知发送 ====================

  /**
   * 变量替换（带XSS防护）
   * 对所有用户输入进行HTML转义，防止XSS攻击
   */
  private replaceVariables(
    content: string,
    variables: Record<string, string>,
  ): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      // 对变量值进行HTML转义
      const escapedValue = escapeHtml(value);
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), escapedValue);
    }
    return result;
  }

  /**
   * 检查免打扰时间
   */
  private isInQuietHours(template: NotificationTemplate): boolean {
    if (!template.quietHoursStart || !template.quietHoursEnd) {
      return false;
    }
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return (
      currentTime >= template.quietHoursStart &&
      currentTime <= template.quietHoursEnd
    );
  }

  /**
   * 发送通知
   * 紧急通知自动启用短信备用渠道
   */
  async sendNotification(
    dto: SendNotificationDto,
    senderId: string,
    schoolId: string,
  ): Promise<Notification> {
    // 如果使用模板，先获取模板
    let template: NotificationTemplate | null = null;
    let content = dto.content;
    let title = dto.title || '学校通知';
    let channels = dto.channel ? [dto.channel] : [NotificationChannel.APP_PUSH];

    if (dto.templateId) {
      template = await this.getTemplate(dto.templateId);
      channels = JSON.parse(template.channels || '["app_push"]');

      // 替换变量（带XSS防护）
      if (template.appPushContent && dto.variables) {
        template.appPushContent = this.replaceVariables(
          template.appPushContent,
          dto.variables,
        );
      }
      if (template.smsContent && dto.variables) {
        template.smsContent = this.replaceVariables(
          template.smsContent,
          dto.variables,
        );
      }
      if (template.whatsappContent && dto.variables) {
        template.whatsappContent = this.replaceVariables(
          template.whatsappContent,
          dto.variables,
        );
      }
      if (template.emailBody && dto.variables) {
        template.emailBody = this.replaceVariables(
          template.emailBody,
          dto.variables,
        );
      }

      title = dto.title || template.appPushTitle || template.name;
      content = dto.content || template.appPushContent || template.name;
    }

    // 紧急通知自动启用短信备用渠道（SPEC F-AUTO-002要求）
    const urgency = dto.urgency || NotificationUrgency.NORMAL;
    if (
      urgency === NotificationUrgency.HIGH ||
      urgency === NotificationUrgency.CRITICAL
    ) {
      // 如果还没有SMS渠道，自动添加
      if (!channels.includes(NotificationChannel.SMS)) {
        channels.push(NotificationChannel.SMS);
      }
    }

    // 创建通知记录
    const notification = this.notificationRepository.create({
      notificationNo: this.generateNotificationNo(),
      schoolId,
      templateId: dto.templateId,
      title,
      content,
      channel: channels[0] as NotificationChannel,
      urgency: urgency,
      recipientType: JSON.stringify({
        type: dto.recipientType,
        ids: dto.recipientIds || [],
      }),
      recipientIds: dto.recipientIds ? JSON.stringify(dto.recipientIds) : null,
      senderId,
      relatedEntityType: dto.relatedEntityType,
      relatedEntityId: dto.relatedEntityId,
      status: NotificationStatus.PENDING,
      isBatch: !dto.recipientIds || dto.recipientIds.length > 1,
      batchTotal: dto.recipientIds?.length || 0,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
    });

    const saved = await this.notificationRepository.save(notification);

    // 如果有接收者，立即发送
    if (dto.recipientIds && dto.recipientIds.length > 0) {
      // 更新状态为发送中
      await this.notificationRepository.update(saved.id, {
        status: NotificationStatus.SENDING,
      });

      // 为每个接收者创建送达记录
      await this.createDeliveries(saved, dto.recipientIds, channels, template);

      // 模拟发送（实际应调用各渠道API）
      await this.processDeliveries(saved.id, template);
    }

    return this.findOneNotification(saved.id);
  }

  /**
   * 创建送达记录
   */
  private async createDeliveries(
    notification: Notification,
    recipientIds: string[],
    channels: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _template: NotificationTemplate | null,
  ): Promise<void> {
    const deliveries = recipientIds.flatMap((recipientId) =>
      channels.map((channel) =>
        this.deliveryRepository.create({
          notificationId: notification.id,
          recipientId,
          channel: channel as NotificationChannel,
          status: DeliveryStatus.PENDING,
          maxRetries: 3,
        }),
      ),
    );

    await this.deliveryRepository.save(deliveries);
  }

  /**
   * 处理送达记录（模拟各渠道发送）
   * 改为并行处理，提升批量发送性能
   */
  private async processDeliveries(
    notificationId: string,
    template: NotificationTemplate | null,
  ): Promise<void> {
    const deliveries = await this.deliveryRepository.find({
      where: { notificationId },
    });

    // 并行处理所有送达记录
    const results = await Promise.all(
      deliveries.map(async (delivery) => {
        try {
          const success = await this.simulateSend(delivery, template);

          if (success) {
            await this.deliveryRepository.update(delivery.id, {
              status: DeliveryStatus.SUCCESS,
              sentAt: new Date(),
              externalMessageId: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            });
            return { sent: 1, failed: 0 };
          } else {
            await this.handleDeliveryFailure(delivery, template);
            return { sent: 0, failed: 1 };
          }
        } catch (error) {
          await this.handleDeliveryFailure(delivery, template);
          return { sent: 0, failed: 1 };
        }
      }),
    );

    // 汇总结果
    const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

    // 更新通知汇总
    await this.notificationRepository.update(notificationId, {
      batchSent: totalSent,
      batchFailed: totalFailed,
      status:
        totalFailed === 0 ? NotificationStatus.SENT : NotificationStatus.SENT,
      sentAt: new Date(),
    });
  }

  /**
   * 模拟发送（实际应调用各渠道API）
   */
  private async simulateSend(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _delivery: NotificationDelivery,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _template: NotificationTemplate | null,
  ): Promise<boolean> {
    // 模拟95%成功率
    return Math.random() > 0.05;
  }

  /**
   * 处理送达失败（重试或降级）
   * 注意：template参数在当前实现中用于备用渠道降级，当前版本暂未使用
   */
  private async handleDeliveryFailure(
    delivery: NotificationDelivery,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    template: NotificationTemplate | null,
  ): Promise<void> {
    const newRetryCount = delivery.retryCount + 1;

    if (newRetryCount <= delivery.maxRetries) {
      // 重试
      await this.deliveryRepository.update(delivery.id, {
        status: DeliveryStatus.RETRYING,
        retryCount: newRetryCount,
      });
    } else {
      // 降级到备用渠道
      if (template?.fallbackChannel && !delivery.degradedToFallback) {
        await this.deliveryRepository.update(delivery.id, {
          status: DeliveryStatus.PENDING,
          degradedToFallback: true,
          degradedFromChannel: delivery.channel,
          channel: template.fallbackChannel as NotificationChannel,
          retryCount: 0,
        });
        // 递归处理降级发送
        const updated = await this.deliveryRepository.findOne({
          where: { id: delivery.id },
        });
        if (updated) {
          const success = await this.simulateSend(updated, template);
          if (success) {
            await this.deliveryRepository.update(delivery.id, {
              status: DeliveryStatus.SUCCESS,
              sentAt: new Date(),
            });
          } else {
            await this.deliveryRepository.update(delivery.id, {
              status: DeliveryStatus.FAILED,
              failureReason: '降级渠道发送失败，已达最大重试次数',
            });
          }
        }
      } else {
        await this.deliveryRepository.update(delivery.id, {
          status: DeliveryStatus.FAILED,
          failureReason: '已达最大重试次数，发送失败',
          retryCount: newRetryCount,
        });
      }
    }
  }

  /**
   * 获取通知详情
   */
  async findOneNotification(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException('通知不存在');
    }
    return notification;
  }

  /**
   * 获取通知列表
   */
  async findAllNotifications(
    query: NotificationQueryDto,
    schoolId: string,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.schoolId = :schoolId', { schoolId })
      .orderBy('notification.createdAt', 'DESC');

    if (query.channel) {
      qb.andWhere('notification.channel = :channel', {
        channel: query.channel,
      });
    }
    if (query.status) {
      qb.andWhere('notification.status = :status', { status: query.status });
    }
    if (query.startDate) {
      qb.andWhere('notification.createdAt >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }
    if (query.endDate) {
      qb.andWhere('notification.createdAt <= :endDate', {
        endDate: new Date(query.endDate + 'T23:59:59'),
      });
    }

    const [notifications, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { notifications, total };
  }

  /**
   * 获取送达记录列表
   */
  async findDeliveries(
    notificationId: string,
    status?: string,
  ): Promise<NotificationDelivery[]> {
    const qb = this.deliveryRepository
      .createQueryBuilder('delivery')
      .where('delivery.notificationId = :notificationId', { notificationId });

    if (status) {
      qb.andWhere('delivery.status = :status', { status });
    }

    return qb.orderBy('delivery.createdAt', 'ASC').getMany();
  }

  /**
   * 标记送达记录为已读
   * 添加归属校验：用户只能标记自己发送的或发给自己的通知
   */
  async markAsRead(
    notificationId: string,
    recipientId: string,
    userRole?: string,
  ): Promise<void> {
    // 获取通知详情
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    // 权限校验：用户只能标记自己发送的或发给自己的通知
    // SYSTEM_ADMIN 和 SCHOOL_DIRECTOR 可以标记任何通知
    const isSender = notification.senderId === recipientId;
    const isRecipient = this.isRecipientOfNotification(
      notification,
      recipientId,
    );
    const isPrivileged =
      userRole === 'system_admin' || userRole === 'school_director';

    if (!isSender && !isRecipient && !isPrivileged) {
      throw new BadRequestException('您无权标记此通知为已读');
    }

    await this.deliveryRepository.update(
      { notificationId, recipientId },
      {
        status: DeliveryStatus.SUCCESS,
        readAt: new Date(),
      },
    );
  }

  /**
   * 检查用户是否为通知的接收者
   */
  private isRecipientOfNotification(
    notification: Notification,
    recipientId: string,
  ): boolean {
    if (!notification.recipientIds) {
      return false;
    }

    try {
      const recipientIds = JSON.parse(notification.recipientIds);
      return recipientIds.includes(recipientId);
    } catch {
      return false;
    }
  }

  /**
   * 获取通知统计
   */
  async getStatistics(schoolId: string): Promise<any> {
    const results = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.status', 'status')
      .addSelect('notification.channel', 'channel')
      .addSelect('COUNT(*)', 'count')
      .where('notification.schoolId = :schoolId', { schoolId })
      .groupBy('notification.status')
      .addGroupBy('notification.channel')
      .getRawMany();

    const deliveryResults = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .innerJoin('delivery.notificationId', 'notification')
      .select('delivery.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('notification.schoolId = :schoolId', { schoolId })
      .groupBy('delivery.status')
      .getRawMany();

    return { byNotification: results, byDelivery: deliveryResults };
  }

  /**
   * 获取失败的送达记录（需重试）
   */
  async getFailedDeliveries(): Promise<NotificationDelivery[]> {
    return this.deliveryRepository.find({
      where: { status: DeliveryStatus.FAILED },
      relations: ['notificationId' as any],
      take: 100,
    });
  }

  /**
   * 重试失败的通知
   */
  async retryFailed(notificationId: string): Promise<void> {
    const failedDeliveries = await this.deliveryRepository.find({
      where: { notificationId, status: DeliveryStatus.FAILED },
    });

    for (const delivery of failedDeliveries) {
      await this.deliveryRepository.update(delivery.id, {
        status: DeliveryStatus.PENDING,
        retryCount: 0,
        failureReason: null,
      });
    }

    // 重新处理
    await this.findOneNotification(notificationId); // 验证通知存在
    await this.processDeliveries(notificationId, null);
  }
}
