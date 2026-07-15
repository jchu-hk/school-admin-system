import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Student } from '../../student/student.entity';

export enum QrCodeStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
}

@Entity('qr_codes')
@Index(['studentId', 'generatedAt'])
@Index(['status', 'expiresAt'])
export class QrCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 学生档案ID */
  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  /** 随机一次性 nonce（防重放） */
  @Column({ name: 'nonce', length: 64, unique: true })
  nonce: string;

  /** 签名密钥版本号 */
  @Column({ name: 'key_version', type: 'int' })
  keyVersion: number;

  /** HMAC-SHA256 签名（前16字节hex） */
  @Column({ name: 'signature', length: 128 })
  signature: string;

  /** QR 码完整明文数据 */
  @Column({ name: 'qr_data', type: 'text', nullable: true })
  qrData: string;

  /** 生成时间 */
  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;

  /** 过期时间（generated_at + 30s） */
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  /** 状态: active / used / expired */
  @Column({ name: 'status', length: 20, default: 'active' })
  status: string;
}
