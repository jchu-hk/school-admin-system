import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
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

@Entity('attendances')
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
