import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user/user.entity';

export enum InquiryCategory {
  ACADEMIC = 'academic', // 成绩相关
  ATTENDANCE = 'attendance', // 出勤相关
  DISCIPLINE = 'discipline', // 纪律相关
  HEALTH = 'health', // 健康相关
  FINANCE = 'finance', // 财务相关
  GENERAL = 'general', // 一般行政
  OTHER = 'other', // 其他
}

export enum InquiryChannel {
  PHONE = 'phone', // 电话
  EMAIL = 'email', // 邮件
  WHATSAPP = 'whatsapp', // WhatsApp
  IN_PERSON = 'in_person', // 亲自到访
  APP = 'app', // APP/微信
}

export enum InquiryPriority {
  NORMAL = 'normal', // 普通
  URGENT = 'urgent', // 紧急
}

export enum InquiryStatus {
  PENDING = 'pending', // 待处理
  PROCESSING = 'processing', // 处理中
  REPLIED = 'replied', // 已回复
  AUTO_REPLIED = 'auto_replied', // AI自动回复
  ESCALATED = 'escalated', // 已升级
  CLOSED = 'closed', // 已关闭
}

// AC-04: 超时警告级别
export enum TimeoutWarningLevel {
  NONE = 'none', // 正常
  WARNING = 'warning', // 超时警告 (>10分钟未处理)
  CRITICAL = 'critical', // 严重超时 (>30分钟)
}

// 查询情绪分类 (AC-08)
export enum InquirySentiment {
  NEUTRAL = 'neutral', // 中性
  POSITIVE = 'positive', // 正面/感谢
  NEGATIVE = 'negative', // 负面/不满
  ANGRY = 'angry', // 愤怒 (AC-03 情绪激动)
}

// 转交状态
export enum TransferStatus {
  NOT_TRANSFERRED = 'not_transferred',
  PENDING = 'pending', // 待接收
  ACCEPTED = 'accepted', // 已接收
  REJECTED = 'rejected', // 已拒绝
}

@Entity('inquiries')
export class ParentInquiry {
  @ApiProperty({ description: '查询ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '查询编号' })
  @Column({ name: 'inquiry_no', unique: true, length: 20 })
  inquiryNo: string;

  @ApiProperty({ description: '学校ID' })
  @Column({ name: 'school_id', type: 'character varying' })
  schoolId: string;

  @ApiProperty({ description: '家长ID' })
  @Column({ name: 'parent_id', type: 'character varying' })
  parentId: string;

  @ApiProperty({ description: '关联学生ID' })
  @Column({ name: 'student_id', type: 'character varying', nullable: true })
  studentId: string;

  @ApiProperty({ description: '查询类别', enum: InquiryCategory })
  @Column({
    type: 'enum',
    enum: InquiryCategory,
    default: InquiryCategory.GENERAL,
    name: 'inquiry_type',
  })
  category: InquiryCategory;

  @ApiProperty({ description: '查询主题' })
  @Column({ length: 200, nullable: true, name: 'title' })
  subject: string;

  @ApiProperty({ description: '查询内容' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '附件URL（图片/语音）', required: false })
  @Column({ name: 'attachment_url', type: 'text', nullable: true })
  attachmentUrl: string;

  @ApiProperty({ description: '提交渠道', enum: InquiryChannel })
  @Column({
    type: 'enum',
    enum: InquiryChannel,
    default: InquiryChannel.APP,
  })
  channel: InquiryChannel;

  @ApiProperty({ description: '优先级', enum: InquiryPriority })
  @Column({
    type: 'enum',
    enum: InquiryPriority,
    default: InquiryPriority.NORMAL,
  })
  priority: InquiryPriority;

  @ApiProperty({ description: '处理状态', enum: InquiryStatus })
  @Column({
    type: 'enum',
    enum: InquiryStatus,
    default: InquiryStatus.PENDING,
  })
  status: InquiryStatus;

  @ApiProperty({ description: '分配给谁处理（可以是用户UUID或团队名称）' })
  @Column({ type: 'character varying', nullable: true, name: 'assigned_to' })
  assignedTo: string;

  // 注意：assigned_to 存储团队名称（如 director_queue）而非用户UUID，不再使用 @ManyToOne
  aiIntent: string;

  @ApiProperty({ description: 'AI分析结果-情感倾向' })
  @Column({ name: 'ai_sentiment', length: 20, nullable: true })
  aiSentiment: string;

  @ApiProperty({ description: 'AI分析结果-置信度' })
  @Column({ name: 'ai_confidence', type: 'decimal', precision: 3, scale: 2, nullable: true })
  aiConfidence: number;

  @ApiProperty({ description: 'AI建议回复' })
  @Column({ name: 'ai_suggested_response', type: 'text', nullable: true })
  aiSuggestedResponse: string;

  @ApiProperty({ description: '是否可自动回复' })
  @Column({ name: 'auto_response_eligible', default: false })
  autoResponseEligible: boolean;

  @ApiProperty({ description: '是否升级处理' })
  @Column({ name: 'escalation_required', default: false })
  escalationRequired: boolean;

  @ApiProperty({ description: '家长提交时间' })
  @Column({ name: 'parent_submitted_at', type: 'timestamp' })
  parentSubmittedAt: Date;

  @ApiProperty({ description: '首次回复时间' })
  @Column({ name: 'first_response_at', type: 'timestamp', nullable: true })
  firstResponseAt: Date;

  @ApiProperty({ description: '解决时间' })
  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @ApiProperty({ description: '满意度评分（1-5）' })
  @Column({ name: 'satisfaction_rating', type: 'int', nullable: true })
  satisfactionRating: number;

  @ApiProperty({ description: '满意度评价内容' })
  @Column({ name: 'satisfaction_comment', type: 'text', nullable: true })
  satisfactionComment: string;

  @ApiProperty({ description: '通话时长（分钟）' })
  @Column({ name: 'call_duration_minutes', type: 'int', nullable: true })
  callDurationMinutes: number;

  @ApiProperty({ description: '通话结果' })
  @Column({ name: 'call_result', length: 30, nullable: true })
  callResult: string;

  // AC-08: 情绪分类（不记录敏感内容）
  @ApiProperty({ description: '家长情绪', enum: InquirySentiment })
  @Column({
    type: 'enum',
    enum: InquirySentiment,
    nullable: true,
  })
  sentiment: InquirySentiment;

  // AC-04: 超时警告级别
  @ApiProperty({ description: '超时警告级别', enum: TimeoutWarningLevel })
  @Column({ name: 'timeout_warning',
    type: 'enum',
    enum: TimeoutWarningLevel,
    default: TimeoutWarningLevel.NONE,
  })
  timeoutWarning: TimeoutWarningLevel;

  // AC-06: 转交给谁
  @ApiProperty({ description: '转交目标部门/人员' })
  @Column({ name: 'transfer_to', type: 'character varying', nullable: true })
  transferTo: string;

  // transferredOfficer removed: transfer_to is now varchar, not uuid

  // AC-06: 转交状态
  @ApiProperty({ description: '转交状态', enum: TransferStatus })
  @Column({ name: 'transfer_status',
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.NOT_TRANSFERRED,
  })
  transferStatus: TransferStatus;

  // AC-06: 转交原因
  @ApiProperty({ description: '转交原因' })
  @Column({ name: 'transfer_reason', type: 'text', nullable: true })
  transferReason: string;

  // AC-06: 转交发起人
  @ApiProperty({ description: '转交发起人' })
  @Column({ name: 'transferred_by', type: 'character varying', nullable: true })
  transferredBy: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: '创建人ID' })
  @Column({ name: 'created_by', type: 'character varying', nullable: true })
  createdBy: string;
}
