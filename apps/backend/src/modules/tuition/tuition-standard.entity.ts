import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { TuitionPayment } from './tuition-payment.entity';

// Subsidy/Exemption types
export enum SubsidyType {
  NONE = 'none',
  FULL = 'full',         // 全额资助
  PARTIAL = 'partial',    // 部分资助
  EXEMPTED = 'exempted',  // 豁免
}

@Entity('tuition_standards')
@Index(['schoolId', 'grade', 'academicYear'], { unique: true })
export class TuitionStandard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  schoolId: string;

  @Column({ length: 50 })
  grade: string;

  @Column({ length: 20 })
  academicYear: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'HKD' })
  currency: string;

  @Column({ type: 'timestamp', nullable: true })
  paymentDeadline: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // ============ AC-01: Subsidy/Exemption Fields ============
  @Column({
    type: 'enum',
    enum: SubsidyType,
    default: SubsidyType.NONE,
    name: 'subsidy_type'
  })
  subsidyType: SubsidyType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'subsidy_amount'
  })
  subsidyAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'exempted_amount'
  })
  exemptedAmount: number;

  @Column({ type: 'text', nullable: true, name: 'subsidy_remark' })
  subsidyRemark: string;

  // Default subsidy amount for full subsidy (HK$550)
  static readonly DEFAULT_FULL_SUBSIDY = 550;

  @OneToMany(() => TuitionPayment, (payment) => payment.standard)
  payments: TuitionPayment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
