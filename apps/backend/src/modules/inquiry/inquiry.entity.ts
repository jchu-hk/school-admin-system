import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Student, Parent, User } from '../user/user.entity';

export enum InquiryCategory {
  BUS_SCHEDULE = 'bus_schedule', // 校车相关
  TUITION_FEE = 'tuition_fee', // 学费相关
  ACADEMIC = 'academic', // 成绩相关
  LEAVE = 'leave', // 请假相关
  LUNCH = 'lunch', // 午膳相关
  GENERAL = 'general', // 一般行政
  COMPLAINT = 'complaint', // 投诉
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
  NORMAL = 'normal', // 普通（24小时回复）
  URGENT = 'urgent', // 紧急（2小时回复）
}

export enum InquiryStatus {
  PENDING = 'pending', // 待处理
  PROCESSING = 'processing', // 处理中
  REPLIED = 'replied', // 已回复
  CLOSED = 'closed', // 已关闭
}

@Entity('parent_inquiries')
export class ParentInquiry {
  @ApiProperty({ description: '查询ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '查询编号' })
  @Column({ unique: true, length: 20 })
  inquiryNo: string;

  @ApiProperty({ description: '学校ID' })
  @Column({ type: 'uuid' })
  schoolId: string;

  @ApiProperty({ description: '家长ID' })
  @Column({ type: 'uuid' })
  parentId: string;

  @ApiProperty({ description: '家长信息' })
  @ManyToOne(() => Parent)
  @JoinColumn({ name: 'parentId' })
  parent: Parent;

  @ApiProperty({ description: '关联学生ID' })
  @Column({ type: 'uuid', nullable: true })
  studentId: string;

  @ApiProperty({ description: '关联学生信息' })
  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @ApiProperty({ description: '查询类别', enum: InquiryCategory })
  @Column({
    type: 'enum',
    enum: InquiryCategory,
    default: InquiryCategory.GENERAL,
  })
  category: InquiryCategory;

  @ApiProperty({ description: '查询主题' })
  @Column({ length: 200, nullable: true })
  subject: string;

  @ApiProperty({ description: '查询内容' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '附件URL（图片/语音）', required: false })
  @Column({ type: 'text', nullable: true })
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

  @ApiProperty({ description: '分配给谁处理' })
  @Column({ type: 'uuid', nullable: true })
  assignedTo: string;

  @ApiProperty({ description: '处理人信息' })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedTo' })
  assignedOfficer: User;

  @ApiProperty({ description: 'AI分析结果-意图分类' })
  @Column({ length: 50, nullable: true })
  aiIntent: string;

  @ApiProperty({ description: 'AI分析结果-情感倾向' })
  @Column({ length: 20, nullable: true })
  aiSentiment: string;

  @ApiProperty({ description: 'AI分析结果-置信度' })
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  aiConfidence: number;

  @ApiProperty({ description: 'AI建议回复' })
  @Column({ type: 'text', nullable: true })
  aiSuggestedResponse: string;

  @ApiProperty({ description: '是否可自动回复' })
  @Column({ default: false })
  autoResponseEligible: boolean;

  @ApiProperty({ description: '是否升级处理' })
  @Column({ default: false })
  escalationRequired: boolean;

  @ApiProperty({ description: '家长提交时间' })
  @Column({ type: 'timestamp' })
  parentSubmittedAt: Date;

  @ApiProperty({ description: '首次回复时间' })
  @Column({ type: 'timestamp', nullable: true })
  firstResponseAt: Date;

  @ApiProperty({ description: '解决时间' })
  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @ApiProperty({ description: '满意度评分（1-5）' })
  @Column({ type: 'int', nullable: true })
  satisfactionRating: number;

  @ApiProperty({ description: '满意度评价内容' })
  @Column({ type: 'text', nullable: true })
  satisfactionComment: string;

  @ApiProperty({ description: '通话时长（分钟）' })
  @Column({ type: 'int', nullable: true })
  callDurationMinutes: number;

  @ApiProperty({ description: '通话结果' })
  @Column({ length: 30, nullable: true })
  callResult: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: '创建人ID' })
  @Column({ type: 'uuid', nullable: true })
  createdBy: string;
}
