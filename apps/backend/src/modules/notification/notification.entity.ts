import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  SYSTEM = 'system',
  LEAVE = 'leave',
  INQUIRY = 'inquiry',
  ANNOUNCEMENT = 'announcement',
  REMINDER = 'reminder',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('notifications')
export class Notification {
  @ApiProperty({ description: '通知ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '通知标题' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ description: '通知内容' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '通知类型', enum: NotificationType })
  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @ApiProperty({ description: '发送人ID' })
  @Column({ type: 'uuid', nullable: true })
  senderId: string;

  @ApiProperty({ description: '关联记录ID' })
  @Column({ type: 'uuid', nullable: true })
  relatedId: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('notification_recipients')
@Index(['notificationId', 'recipientId'], { unique: true })
export class NotificationRecipient {
  @ApiProperty({ description: '记录ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '通知ID' })
  @Column({ type: 'uuid' })
  notificationId: string;

  @ApiProperty({ description: '接收人ID' })
  @Column({ type: 'uuid' })
  recipientId: string;

  @ApiProperty({ description: '状态', enum: NotificationStatus })
  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @ApiProperty({ description: '发送时间' })
  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @ApiProperty({ description: '阅读时间' })
  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
}
