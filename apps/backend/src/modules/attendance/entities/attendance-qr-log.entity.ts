import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { QrCode } from './qr-code.entity';
import { Student } from '../../student/student.entity';
import { User } from '../../user/user.entity';

@Entity('attendance_qr_logs')
@Index(['studentId', 'scannedAt'])
@Index(['staffUserId', 'scannedAt'])
@Index(['result'])
export class AttendanceQrLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 关联QR码ID */
  @Column({ name: 'qr_code_id', nullable: true })
  qrCodeId: string;

  @ManyToOne(() => QrCode)
  @JoinColumn({ name: 'qr_code_id' })
  qrCode: QrCode;

  /** 签到学生 */
  @Column({ name: 'student_id', nullable: true })
  studentId?: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  /** 扫码教职工 */
  @Column({ name: 'staff_user_id' })
  staffUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'staff_user_id' })
  staffUser: User;

  /** 扫码时间 */
  @CreateDateColumn({ name: 'scanned_at' })
  scannedAt: Date;

  /** 来源: online / offline_sync */
  @Column({ name: 'source', length: 20, default: 'online' })
  source: string;

  /** 扫码设备标识 */
  @Column({ name: 'device_id', length: 128, nullable: true })
  deviceId: string;

  /** 请求IP */
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  /** 结果: success / expired / duplicate / forged */
  @Column({ name: 'result', length: 20 })
  result: string;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
