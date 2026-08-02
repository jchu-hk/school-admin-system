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
import { User } from '../../user/user.entity';

/** 门户端请假类型枚举 */
export enum PortalLeaveType {
  SICK = 'sick',
  PERSONAL = 'personal',
  FAMILY = 'family',
  OTHER = 'other',
}

/** 门户端请假状态枚举 */
export enum PortalLeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

/** 提交人角色 */
export enum SubmitterRole {
  STUDENT = 'student',
  PARENT = 'parent',
}

@Entity('leave_requests')
export class LeaveRequest {
  @ApiProperty({ description: '请假ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '请假学生ID（users表）' })
  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ApiProperty({ description: '学生信息' })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @ApiProperty({ description: '申请人ID（users表，实际提交操作的人）' })
  @Column({ type: 'uuid', name: 'applicant_id' })
  applicantId: string;

  @ApiProperty({ description: '申请人信息' })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'applicant_id' })
  applicant: User;

  @ApiProperty({ description: '请假类型', enum: PortalLeaveType })
  @Column({
    type: 'enum',
    enum: PortalLeaveType,
    name: 'leave_type',
  })
  leaveType: PortalLeaveType;

  @ApiProperty({ description: '请假开始日期' })
  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @ApiProperty({ description: '请假结束日期' })
  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @ApiProperty({ description: '请假天数' })
  @Column({ type: 'int', name: 'total_days' })
  totalDays: number;

  @ApiProperty({ description: '请假原因' })
  @Column({ type: 'text' })
  reason: string;

  @ApiProperty({ description: '附件URL' })
  @Column({ type: 'text', nullable: true, name: 'attachment_url' })
  attachmentUrl: string;

  @ApiProperty({ description: '提交人角色', enum: SubmitterRole })
  @Column({
    type: 'enum',
    enum: SubmitterRole,
    name: 'submitter_role',
  })
  submitterRole: SubmitterRole;

  @ApiProperty({ description: '请假状态', enum: PortalLeaveStatus })
  @Column({
    type: 'enum',
    enum: PortalLeaveStatus,
    default: PortalLeaveStatus.PENDING,
  })
  status: PortalLeaveStatus;

  @ApiProperty({ description: '审批人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'approved_by' })
  approvedBy: string;

  @ApiProperty({ description: '审批人信息' })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approver: User;

  @ApiProperty({ description: '审批时间' })
  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt: Date;

  @ApiProperty({ description: '审批意见' })
  @Column({ type: 'text', nullable: true, name: 'approval_comment' })
  approvalComment: string;

  @ApiProperty({ description: '请假期间联系方式' })
  @Column({ length: 20, nullable: true, name: 'contact_phone' })
  contactPhone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
