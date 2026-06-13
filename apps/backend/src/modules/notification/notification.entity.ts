import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationUrgency,
  DeliveryStatus,
} from './template.entity';

export enum RecipientType {
  STUDENT = 'student',
  PARENT = 'parent',
  TEACHER = 'teacher',
  STAFF = 'staff',
  CLASS = 'class',
  GRADE = 'grade',
  ALL = 'all',
}

@Entity('notifications')
export class Notification {
  @ApiProperty({ description: '通知ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '通知编号' })
  @Column({ unique: true, length: 30 })
  notificationNo: string;

  @ApiProperty({ description: '学校ID' })
  @Column({ type: 'uuid' })
  schoolId: string;

  @ApiProperty({ description: '关联模板ID' })
  @Column({ type: 'uuid', nullable: true })
  templateId: string;

  @ApiProperty({ description: '通知标题' })
  @Column({ length: 200, nullable: true })
  title: string;

  @ApiProperty({ description: '通知内容' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '通知渠道', enum: NotificationChannel })
  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.APP_PUSH,
  })
  channel: NotificationChannel;

  @ApiProperty({ description: '优先级', enum: NotificationUrgency })
  @Column({
    type: 'enum',
    enum: NotificationUrgency,
    default: NotificationUrgency.NORMAL,
  })
  urgency: NotificationUrgency;

  @ApiProperty({ description: '接收者类型', enum: RecipientType })
  @Column({ type: 'text' })
  recipientType: string; // JSON: { type: 'class', ids: ['uuid1', 'uuid2'] }

  @ApiProperty({ description: '接收者ID列表' })
  @Column({ type: 'text', nullable: true })
  recipientIds: string; // JSON array of user IDs

  @ApiProperty({ description: '发送者ID' })
  @Column({ type: 'uuid', nullable: true })
  senderId: string;

  @ApiProperty({ description: '关联业务类型' })
  @Column({ length: 50, nullable: true })
  relatedEntityType: string;

  @ApiProperty({ description: '关联业务ID' })
  @Column({ type: 'uuid', nullable: true })
  relatedEntityId: string;

  @ApiProperty({ description: '通知状态', enum: NotificationStatus })
  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @ApiProperty({ description: '是否批量通知' })
  @Column({ default: false })
  isBatch: boolean;

  @ApiProperty({ description: '批量总数' })
  @Column({ type: 'int', default: 0 })
  batchTotal: number;

  @ApiProperty({ description: '批量已发送数' })
  @Column({ type: 'int', default: 0 })
  batchSent: number;

  @ApiProperty({ description: '批量送达数' })
  @Column({ type: 'int', default: 0 })
  batchDelivered: number;

  @ApiProperty({ description: '批量失败数' })
  @Column({ type: 'int', default: 0 })
  batchFailed: number;

  @ApiProperty({ description: '计划发送时间' })
  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @ApiProperty({ description: '实际发送时间' })
  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('notification_deliveries')
export class NotificationDelivery {
  @ApiProperty({ description: '送达记录ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '通知ID' })
  @Column({ type: 'uuid' })
  notificationId: string;

  @ApiProperty({ description: '接收者用户ID' })
  @Column({ type: 'uuid' })
  recipientId: string;

  @ApiProperty({ description: '接收者名称' })
  @Column({ length: 100, nullable: true })
  recipientName: string;

  @ApiProperty({ description: '通知渠道', enum: NotificationChannel })
  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.APP_PUSH,
  })
  channel: NotificationChannel;

  @ApiProperty({ description: '外部消息ID（如微信消息ID）' })
  @Column({ length: 100, nullable: true })
  externalMessageId: string;

  @ApiProperty({ description: '送达状态', enum: DeliveryStatus })
  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @ApiProperty({ description: '发送时间' })
  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @ApiProperty({ description: '送达时间' })
  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @ApiProperty({ description: '已读时间' })
  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @ApiProperty({ description: '失败原因' })
  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @ApiProperty({ description: '重试次数' })
  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @ApiProperty({ description: '最大重试次数' })
  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  @ApiProperty({ description: '是否已降级发送' })
  @Column({ default: false })
  degradedToFallback: boolean;

  @ApiProperty({ description: '降级前的渠道' })
  @Column({ nullable: true })
  degradedFromChannel: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
}
