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
import { Class } from '../user/class.entity';

export enum LeaveType {
  SICK_LEAVE = 'sick_leave',
  PERSONAL_LEAVE = 'personal_leave',
  MATERNITY_LEAVE = 'maternity_leave',
  PATERNITY_LEAVE = 'paternity_leave',
  MARRIAGE_LEAVE = 'marriage_leave',
  BEREAVEMENT_LEAVE = 'bereavement_leave',
  OTHER = 'other',
}

export enum LeaveStatus {
  PENDING = 'pending', // 待审批
  PENDING_DIRECTOR = 'pending_director', // 待校务主任审批（超过3天）
  APPROVED = 'approved', // 已批准
  REJECTED = 'rejected', // 已拒绝
  CANCELLED = 'cancelled', // 已取消（家长取消）
  CHECKED_IN = 'checked_in', // 已销假
}

export enum ApprovalLevel {
  CLASS_TEACHER = 'class_teacher', // 班主任审批
  SCHOOL_ADMIN = 'school_admin', // 校务处备案
  SCHOOL_DIRECTOR = 'school_director', // 校务主任审批（>3天）
}

@Entity('leaves')
export class LeaveApplication {
  @ApiProperty({ description: '请假申请ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '申请编号' })
  @Column({ unique: true, length: 20, name: 'application_no' })
  applicationNo: string;

  @ApiProperty({ description: '学校ID' })
  @Column({ type: 'uuid', nullable: true, name: 'school_id' })
  schoolId: string;

  @ApiProperty({ description: '学生ID' })
  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ApiProperty({ description: '学生信息' })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @ApiProperty({ description: '班级ID' })
  @Column({ type: 'uuid', name: 'class_id' })
  classId: string;

  @ApiProperty({ description: '班级信息' })
  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @ApiProperty({ description: '请假类型', enum: LeaveType })
  @Column({
    type: 'enum',
    enum: LeaveType,
    default: LeaveType.SICK_LEAVE,
    enumName: 'leaves_leave_type_enum',
    name: 'leave_type',
  })
  leaveType: LeaveType;

  @ApiProperty({ description: '开始日期' })
  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @ApiProperty({ description: '结束日期' })
  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @ApiProperty({ description: '请假总天数' })
  @Column({ type: 'decimal', precision: 4, scale: 1, name: 'total_days' })
  totalDays: number;

  @ApiProperty({ description: '请假原因' })
  @Column({ type: 'text', nullable: true })
  reason: string;

  @ApiProperty({ description: '证明材料URL' })
  @Column({ type: 'text', nullable: true, name: 'attachment_url' })
  documentUrl: string;

  @ApiProperty({ description: 'OCR识别状态' })
  @Column({ length: 30, nullable: true, name: 'ocr_status' })
  ocrStatus: string;

  @ApiProperty({ description: '医疗证明是否必需' })
  @Column({ default: false, name: 'medical_cert_required' })
  medicalCertRequired: boolean;

  @ApiProperty({ description: '申请状态', enum: LeaveStatus })
  @Column({
    type: 'enum',
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
    enumName: 'leaves_status_enum',
  })
  status: LeaveStatus;

  @ApiProperty({ description: '当前审批级别', enum: ApprovalLevel })
  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
    name: 'current_approval_level',
  })
  currentApprovalLevel: ApprovalLevel;

  @ApiProperty({ description: '家长提交时间' })
  @Column({ type: 'timestamp', nullable: true, name: 'parent_submitted_at' })
  parentSubmittedAt: Date;

  @ApiProperty({ description: '班主任审批人' })
  @Column({ type: 'uuid', nullable: true, name: 'substitute_teacher_id' })
  classTeacherApprovedBy: string;

  @ApiProperty({ description: '班主任审批时间' })
  @Column({ type: 'timestamp', nullable: true, name: 'substitute_teacher_class_hours' })
  classTeacherApprovedAt: Date;

  @ApiProperty({ description: '班主任审批意见' })
  @Column({ type: 'text', nullable: true, name: 'approval_comment' })
  classTeacherComment: string;

  @ApiProperty({ description: '校务主任审批人' })
  @Column({ type: 'uuid', nullable: true, name: 'approver_id' })
  directorApprovedBy: string;

  @ApiProperty({ description: '校务主任审批时间' })
  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  directorApprovedAt: Date;

  @ApiProperty({ description: '校务主任审批意见' })
  @Column({ type: 'text', nullable: true, name: 'director_comment' })
  directorComment: string;

  @ApiProperty({ description: '校务处备案人' })
  @Column({ type: 'uuid', nullable: true, name: 'admin_recorded_by' })
  adminRecordedBy: string;

  @ApiProperty({ description: '校务处备案时间' })
  @Column({ type: 'timestamp', nullable: true, name: 'admin_recorded_at' })
  adminRecordedAt: Date;

  @ApiProperty({ description: 'AI核验标记' })
  @Column({ default: false, name: 'ai_review_flagged' })
  aiReviewFlagged: boolean;

  @ApiProperty({ description: 'AI核验说明' })
  @Column({ type: 'text', nullable: true, name: 'ai_review_note' })
  aiReviewNote: string;

  @ApiProperty({ description: 'AI核验结果' })
  @Column({ length: 30, nullable: true, name: 'ai_verify_result' })
  aiVerifyResult: string;

  @ApiProperty({ description: '证明文件核验结果' })
  @Column({ length: 30, nullable: true, name: 'certificate_verify_result' })
  certificateVerifyResult: string;

  @ApiProperty({ description: '证明文件URL' })
  @Column({ type: 'text', nullable: true, name: 'certificate_url' })
  certificateUrl: string;

  @ApiProperty({ description: 'AI核验完成时间' })
  @Column({ type: 'timestamp', nullable: true, name: 'verified_at' })
  verifiedAt: Date;

  @ApiProperty({ description: '需跟进提醒日期' })
  @Column({ type: 'date', nullable: true, name: 'follow_up_date' })
  followUpDate: Date;

  @ApiProperty({ description: '跟进内容摘要' })
  @Column({ type: 'text', nullable: true, name: 'follow_up_content' })
  followUpContent: string;

  @ApiProperty({ description: '销假时间' })
  @Column({ type: 'timestamp', nullable: true, name: 'checked_in_at' })
  checkedInAt: Date;

  @ApiProperty({ description: '销假操作人' })
  @Column({ type: 'uuid', nullable: true, name: 'checked_in_by' })
  checkedInBy: string;

  @ApiProperty({ description: '通知已发送（家长）' })
  @Column({ default: false, name: 'parent_notified' })
  parentNotified: boolean;

  @ApiProperty({ description: '通知已发送（班主任）' })
  @Column({ default: false, name: 'class_teacher_notified' })
  classTeacherNotified: boolean;

  @ApiProperty({ description: '通知已发送（校车管理员）' })
  @Column({ default: false, name: 'bus_admin_notified' })
  busAdminNotified: boolean;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({ description: '创建人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;
}
