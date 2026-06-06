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
import { User } from '../user/user.entity';

export enum LeaveType {
  SICK = 'sick',             // 病假
  PERSONAL = 'personal',     // 事假
  COMPASSIONATE = 'compassionate', // 丧假
  OTHER = 'other',           // 其他
}

export enum LeaveStatus {
  PENDING = 'pending',             // 待审批
  PENDING_DIRECTOR = 'pending_director', // 待校务主任审批（超过3天）
  APPROVED = 'approved',           // 已批准
  REJECTED = 'rejected',           // 已拒绝
  CANCELLED = 'cancelled',        // 已取消（家长取消）
  CHECKED_IN = 'checked_in',       // 已销假
}

export enum ApprovalLevel {
  CLASS_TEACHER = 'class_teacher',     // 班主任审批
  SCHOOL_ADMIN = 'school_admin',        // 校务处备案
  SCHOOL_DIRECTOR = 'school_director',  // 校务主任审批（>3天）
}

@Entity('leave_applications')
export class LeaveApplication {
  @ApiProperty({ description: '请假申请ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '申请编号' })
  @Column({ unique: true, length: 20 })
  applicationNo: string;

  @ApiProperty({ description: '学校ID' })
  @Column({ type: 'uuid' })
  schoolId: string;

  @ApiProperty({ description: '学生ID' })
  @Column({ type: 'uuid' })
  studentId: string;

  @ApiProperty({ description: '学生信息' })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @ApiProperty({ description: '班级ID' })
  @Column({ type: 'uuid' })
  classId: string;

  @ApiProperty({ description: '班级信息' })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'classId' })
  class: User;

  @ApiProperty({ description: '请假类型', enum: LeaveType })
  @Column({
    type: 'enum',
    enum: LeaveType,
    default: LeaveType.SICK,
  })
  leaveType: LeaveType;

  @ApiProperty({ description: '开始日期' })
  @Column({ type: 'date' })
  startDate: Date;

  @ApiProperty({ description: '结束日期' })
  @Column({ type: 'date' })
  endDate: Date;

  @ApiProperty({ description: '请假总天数' })
  @Column({ type: 'decimal', precision: 4, scale: 1 })
  totalDays: number;

  @ApiProperty({ description: '请假原因' })
  @Column({ type: 'text', nullable: true })
  reason: string;

  @ApiProperty({ description: '证明材料URL' })
  @Column({ type: 'text', nullable: true })
  documentUrl: string;

  @ApiProperty({ description: 'OCR识别状态' })
  @Column({ length: 30, nullable: true })
  ocrStatus: string;

  @ApiProperty({ description: '医疗证明是否必需' })
  @Column({ default: false })
  medicalCertRequired: boolean;

  @ApiProperty({ description: '申请状态', enum: LeaveStatus })
  @Column({
    type: 'enum',
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
  })
  status: LeaveStatus;

  @ApiProperty({ description: '当前审批级别', enum: ApprovalLevel })
  @Column({
    type: 'enum',
    enum: ApprovalLevel,
    nullable: true,
  })
  currentApprovalLevel: ApprovalLevel;

  @ApiProperty({ description: '家长提交时间' })
  @Column({ type: 'timestamp', nullable: true })
  parentSubmittedAt: Date;

  @ApiProperty({ description: '班主任审批人' })
  @Column({ type: 'uuid', nullable: true })
  classTeacherApprovedBy: string;

  @ApiProperty({ description: '班主任审批时间' })
  @Column({ type: 'timestamp', nullable: true })
  classTeacherApprovedAt: Date;

  @ApiProperty({ description: '班主任审批意见' })
  @Column({ type: 'text', nullable: true })
  classTeacherComment: string;

  @ApiProperty({ description: '校务主任审批人' })
  @Column({ type: 'uuid', nullable: true })
  directorApprovedBy: string;

  @ApiProperty({ description: '校务主任审批时间' })
  @Column({ type: 'timestamp', nullable: true })
  directorApprovedAt: Date;

  @ApiProperty({ description: '校务主任审批意见' })
  @Column({ type: 'text', nullable: true })
  directorComment: string;

  @ApiProperty({ description: '校务处备案人' })
  @Column({ type: 'uuid', nullable: true })
  adminRecordedBy: string;

  @ApiProperty({ description: '校务处备案时间' })
  @Column({ type: 'timestamp', nullable: true })
  adminRecordedAt: Date;

  @ApiProperty({ description: 'AI核验标记' })
  @Column({ default: false })
  aiReviewFlagged: boolean;

  @ApiProperty({ description: 'AI核验说明' })
  @Column({ type: 'text', nullable: true })
  aiReviewNote: string;

  @ApiProperty({ description: '需跟进提醒日期' })
  @Column({ type: 'date', nullable: true })
  followUpDate: Date;

  @ApiProperty({ description: '跟进内容摘要' })
  @Column({ type: 'text', nullable: true })
  followUpContent: string;

  @ApiProperty({ description: '销假时间' })
  @Column({ type: 'timestamp', nullable: true })
  checkedInAt: Date;

  @ApiProperty({ description: '销假操作人' })
  @Column({ type: 'uuid', nullable: true })
  checkedInBy: string;

  @ApiProperty({ description: '通知已发送（家长）' })
  @Column({ default: false })
  parentNotified: boolean;

  @ApiProperty({ description: '通知已发送（班主任）' })
  @Column({ default: false })
  classTeacherNotified: boolean;

  @ApiProperty({ description: '通知已发送（校车管理员）' })
  @Column({ default: false })
  busAdminNotified: boolean;

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
