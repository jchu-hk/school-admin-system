import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationRecipient,
  NotificationStatus,
  NotificationType,
} from './notification.entity';
import { CreateNotificationDto } from './dto/notification.dto';

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
  variables?: string[];
  description?: string;
  createdAt: Date;
}

@Injectable()
export class NotificationService {
  private templates: NotificationTemplate[] = [];

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationRecipient)
    private recipientRepository: Repository<NotificationRecipient>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    type?: NotificationType,
    senderId?: string,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const queryBuilder = this.notificationRepository.createQueryBuilder('notification');

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    if (senderId) {
      queryBuilder.andWhere('notification.senderId = :senderId', { senderId });
    }

    const [notifications, total] = await queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { notifications, total };
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`通知不存在: ${id}`);
    }

    return notification;
  }

  async findRecipients(notificationId: string): Promise<NotificationRecipient[]> {
    const notification = await this.findOne(notificationId);
    return this.recipientRepository.find({
      where: { notificationId: notification.id },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      title: createDto.title,
      content: createDto.content,
      type: createDto.type || NotificationType.SYSTEM,
      senderId: createDto.senderId,
      relatedId: createDto.relatedId,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Create recipients
    if (createDto.recipientIds && createDto.recipientIds.length > 0) {
      const recipients = createDto.recipientIds.map((recipientId) =>
        this.recipientRepository.create({
          notificationId: savedNotification.id,
          recipientId,
          status: NotificationStatus.PENDING,
        }),
      );
      await this.recipientRepository.save(recipients);
    }

    return savedNotification;
  }

  async sendNotification(
    recipientId: string,
    title: string,
    content: string,
    senderId?: string,
  ): Promise<void> {
    const notification = this.notificationRepository.create({
      title,
      content,
      type: NotificationType.SYSTEM,
      senderId,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    const recipient = this.recipientRepository.create({
      notificationId: savedNotification.id,
      recipientId,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });

    await this.recipientRepository.save(recipient);

    console.log(
      `[NotificationService] Sending notification to ${recipientId}: ${title}`,
    );
  }

  async sendBulkNotification(
    recipientIds: string[],
    title: string,
    content: string,
    senderId?: string,
  ): Promise<void> {
    const notification = this.notificationRepository.create({
      title,
      content,
      type: NotificationType.SYSTEM,
      senderId,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    const recipients = recipientIds.map((recipientId) =>
      this.recipientRepository.create({
        notificationId: savedNotification.id,
        recipientId,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      }),
    );

    await this.recipientRepository.save(recipients);

    console.log(
      `[NotificationService] Sending bulk notification to ${recipientIds.length} recipients: ${title}`,
    );
  }

  // Template methods
  findAllTemplates(
    page: number = 1,
    limit: number = 10,
  ): { templates: NotificationTemplate[]; total: number } {
    const start = (page - 1) * limit;
    const templates = this.templates.slice(start, start + limit);
    return { templates, total: this.templates.length };
  }

  createTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt'>): NotificationTemplate {
    const template: NotificationTemplate = {
      id: `template_${Date.now()}`,
      ...templateData,
      createdAt: new Date(),
    };
    this.templates.push(template);
    return template;
  }
}
