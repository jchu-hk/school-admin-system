import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Class } from '../../user/class.entity';

/** 日报生成状态 */
export enum DailyReportStatus {
  PENDING = 'pending',
  GENERATED = 'generated',
  FAILED = 'failed',
}

/**
 * 签到日报表实体
 *
 * 每日自动生成每个班级的签到统计日报。
 * 由定时任务 @Cron 在工作日 18:00 触发。
 *
 * 表名: attendance_daily_reports
 *
 * 参考:
 * - F-ATTQR-003 日报表推送
 * - FSD-QR-ATT-001 §3 F-ATTQR-003 | AC-01
 */
@Entity('attendance_daily_reports')
@Index(['classId', 'reportDate'], { unique: true })
@Index(['reportDate'])
@Index(['classId'])
export class AttendanceDailyReport {
  @ApiProperty({ description: '日报ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '学校ID' })
  @Column({ type: 'uuid', name: 'school_id' })
  schoolId: string;

  @ApiProperty({ description: '班级ID' })
  @Column({ type: 'uuid', name: 'class_id' })
  classId: string;

  @ApiProperty({ description: '班级信息' })
  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @ApiProperty({ description: '日报日期' })
  @Column({ type: 'date', name: 'report_date' })
  reportDate: Date;

  @ApiProperty({ description: '班级名称（冗余，便于查询）' })
  @Column({ length: 50, name: 'class_name', nullable: true })
  className: string;

  @ApiProperty({ description: '年级' })
  @Column({ length: 20, name: 'grade', nullable: true })
  grade: string;

  // ============ 统计字段 ============

  @ApiProperty({ description: '应签人数' })
  @Column({ type: 'int', name: 'total_students', default: 0 })
  totalStudents: number;

  @ApiProperty({ description: '已签到人数' })
  @Column({ type: 'int', name: 'checked_in', default: 0 })
  checkedIn: number;

  @ApiProperty({ description: '迟到人数' })
  @Column({ type: 'int', name: 'late_count', default: 0 })
  lateCount: number;

  @ApiProperty({ description: '缺勤人数' })
  @Column({ type: 'int', name: 'absent_count', default: 0 })
  absentCount: number;

  @ApiProperty({ description: '已请假人数' })
  @Column({ type: 'int', name: 'leave_approved', default: 0 })
  leaveApproved: number;

  @ApiProperty({ description: '未签到学生名单（含状态）' })
  @Column({ name: 'unchecked_students', type: 'jsonb', nullable: true })
  uncheckedStudents: Array<{
    studentId: string;
    studentName: string;
    status: 'absent' | 'late' | 'pending';
  }>;

  @ApiProperty({ description: '签到学生名单' })
  @Column({ name: 'checked_in_students', type: 'jsonb', nullable: true })
  checkedInStudents: Array<{
    studentId: string;
    studentName: string;
    checkInTime: string;
    status: 'on_time' | 'late';
  }>;

  @ApiProperty({ description: '请假学生名单' })
  @Column({ name: 'leave_students', type: 'jsonb', nullable: true })
  leaveStudents: Array<{
    studentId: string;
    studentName: string;
    leaveType: string;
  }>;

  // ============ 推送状态 ============

  @ApiProperty({ description: '生成状态', enum: DailyReportStatus })
  @Column({
    type: 'enum',
    enum: DailyReportStatus,
    name: 'status',
    default: DailyReportStatus.PENDING,
  })
  status: DailyReportStatus;

  @ApiProperty({ description: '是否已推送通知给班主任' })
  @Column({ name: 'notification_sent', default: false })
  notificationSent: boolean;

  @ApiProperty({ description: '通知发送时间' })
  @Column({ name: 'notification_sent_at', type: 'timestamptz', nullable: true })
  notificationSentAt: Date;

  @ApiProperty({ description: '班主任ID列表（推送目标）' })
  @Column({ name: 'teacher_ids', type: 'jsonb', nullable: true })
  teacherIds: string[];

  @ApiProperty({ description: '通知ID列表' })
  @Column({ name: 'notification_ids', type: 'jsonb', nullable: true })
  notificationIds: string[];

  @ApiProperty({ description: '失败原因' })
  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
