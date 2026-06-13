import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationChannel {
  APP_PUSH = 'app_push', // APP推送
  SMS = 'sms', // 短信
  EMAIL = 'email', // 邮件
  WHATSAPP = 'whatsapp', // WhatsApp
  FEISHU = 'feishu', // 飞书
}

export enum NotificationUrgency {
  INFO = 'info', // 普通
  NORMAL = 'normal', // 一般
  HIGH = 'high', // 紧急
  CRITICAL = 'critical', // 关键
}

export enum NotificationCategory {
  BUS = 'bus', // 校车通知
  ATTENDANCE = 'attendance', // 出勤通知
  ACADEMIC = 'academic', // 成绩通知
  FEE = 'fee', // 缴费通知
  ACTIVITY = 'activity', // 活动通知
  EMERGENCY = 'emergency', // 紧急通知
  DAILY = 'daily', // 日常通知
}

export enum NotificationStatus {
  PENDING = 'pending', // 待发送
  SENDING = 'sending', // 发送中
  SENT = 'sent', // 已发送
  DELIVERED = 'delivered', // 已送达
  READ = 'read', // 已读
  FAILED = 'failed', // 发送失败
  CANCELLED = 'cancelled', // 已取消
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

@Entity('notification_templates')
export class NotificationTemplate {
  @ApiProperty({ description: '模板ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '学校ID' })
  @Column({ type: 'uuid' })
  schoolId: string;

  @ApiProperty({ description: '模板编号' })
  @Column({ unique: true, length: 30 })
  templateCode: string;

  @ApiProperty({ description: '模板名称' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: '通知类别', enum: NotificationCategory })
  @Column({
    type: 'enum',
    enum: NotificationCategory,
    default: NotificationCategory.DAILY,
  })
  category: NotificationCategory;

  @ApiProperty({ description: '优先级', enum: NotificationUrgency })
  @Column({
    type: 'enum',
    enum: NotificationUrgency,
    default: NotificationUrgency.NORMAL,
  })
  urgency: NotificationUrgency;

  @ApiProperty({ description: '支持的渠道' })
  @Column({ type: 'text' })
  channels: string; // JSON: ["app_push", "sms", "email"]

  @ApiProperty({ description: '备用渠道（主渠道失败时）' })
  @Column({ nullable: true })
  fallbackChannel: string;

  @ApiProperty({ description: '微信模板ID' })
  @Column({ length: 100, nullable: true })
  wechatTemplateId: string;

  @ApiProperty({ description: 'APP推送标题' })
  @Column({ length: 200, nullable: true })
  appPushTitle: string;

  @ApiProperty({ description: 'APP推送内容' })
  @Column({ type: 'text', nullable: true })
  appPushContent: string;

  @ApiProperty({ description: '短信内容' })
  @Column({ type: 'text', nullable: true })
  smsContent: string;

  @ApiProperty({ description: '邮件标题' })
  @Column({ length: 200, nullable: true })
  emailSubject: string;

  @ApiProperty({ description: '邮件正文' })
  @Column({ type: 'text', nullable: true })
  emailBody: string;

  @ApiProperty({ description: 'WhatsApp内容' })
  @Column({ type: 'text', nullable: true })
  whatsappContent: string;

  @ApiProperty({ description: '变量列表（JSON数组）' })
  @Column({ type: 'text', nullable: true })
  variables: string;

  @ApiProperty({ description: '最小发送间隔（分钟）' })
  @Column({ type: 'int', default: 30 })
  minIntervalMinutes: number;

  @ApiProperty({ description: '每个家长每天最大发送次数' })
  @Column({ type: 'int', default: 5 })
  maxDailyPerParent: number;

  @ApiProperty({ description: '免打扰开始时间' })
  @Column({ length: 5, nullable: true })
  quietHoursStart: string;

  @ApiProperty({ description: '免打扰结束时间' })
  @Column({ length: 5, nullable: true })
  quietHoursEnd: string;

  @ApiProperty({ description: '版本号' })
  @Column({ type: 'int', default: 1 })
  version: number;

  @ApiProperty({ description: '是否启用' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: '创建人ID' })
  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
}
