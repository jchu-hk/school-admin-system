import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  LEAVE_EARLY = 'leave_early',
  ABSENT_WITH_LEAVE = 'absent_with_leave',
  SICK_LEAVE = 'sick_leave',
  PERSONAL_LEAVE = 'personal_leave',
}

export enum AttendanceType {
  CHECK_IN = 'check_in',
  CHECK_OUT = 'check_out',
  MANUAL = 'manual',
}

/** 数据来源（按 F-ATT-001 spec）*/
export enum SyncSource {
  ECLASS = 'eClass',
  MANUAL = 'manual',
  BIOMETRIC = 'biometric',
}

/** 同步状态（按 F-ATT-001 spec: 独立显示各数据源状态）*/
export enum SyncStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
  PENDING = 'pending',
  OFFLINE = 'offline',
}

@Entity('attendances')
@Index(['classId', 'attendanceDate'])
@Index(['studentId', 'attendanceDate'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id', nullable: true })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'teacher_id', nullable: true })
  teacherId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ name: 'class_id', nullable: true })
  classId: string;

  @Column({ type: 'date', name: 'attendance_date' })
  attendanceDate: Date;

  @Column({ type: 'time', name: 'check_in_time', nullable: true })
  checkInTime: string;

  @Column({ type: 'time', name: 'check_out_time', nullable: true })
  checkOutTime: string;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    name: 'status',
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;

  @Column({
    type: 'enum',
    enum: AttendanceType,
    name: 'attendance_type',
    default: AttendanceType.CHECK_IN,
  })
  attendanceType: AttendanceType;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark: string;

  @Column({ name: 'approver_id', nullable: true })
  approverId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approver_id' })
  approver: User;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'reminder_sent', type: 'boolean', default: false })
  reminderSent: boolean;

  @Column({ name: 'reminder_sent_at', type: 'timestamp', nullable: true })
  reminderSentAt: Date;

  /** 数据来源（eClass / manual / biometric）*/
  @Column({
    type: 'enum',
    enum: SyncSource,
    name: 'sync_source',
    default: SyncSource.MANUAL,
  })
  syncSource: SyncSource;

  /** 同步状态（success / failed / partial / pending / offline）*/
  @Column({
    type: 'enum',
    enum: SyncStatus,
    name: 'sync_status',
    default: SyncStatus.SUCCESS,
    nullable: true,
  })
  syncStatus: SyncStatus;

  /** 设备名称（如"人脸识别闸机-RFID-003"）*/
  @Column({ name: 'device_id', type: 'varchar', length: 100, nullable: true })
  deviceId: string;

  /** 设备名称（友好显示名）*/
  @Column({ name: 'device_name', type: 'varchar', length: 200, nullable: true })
  deviceName: string;

  /** 批量操作批次ID（用于批量撤销）*/
  @Column({ name: 'batch_id', type: 'uuid', nullable: true })
  batchId: string;

  /** 可撤销截止时间（批量录入后15分钟内）*/
  @Column({ name: 'can_revoke_until', type: 'timestamp', nullable: true })
  canRevokeUntil: Date;

  /** 录入人ID（用于判断撤销权限）*/
  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
