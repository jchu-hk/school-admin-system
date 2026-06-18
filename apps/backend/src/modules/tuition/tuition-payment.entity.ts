import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { TuitionStandard } from './tuition-standard.entity';
import { InstallmentPlan } from './installment-plan.entity';

@Entity('tuition_payments')
@Index(['studentId', 'academicYear'])
@Index(['status'])
export class TuitionPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tuition_standard_id' })
  standardId: string;

  @ManyToOne(() => TuitionStandard, (standard) => standard.payments)
  @JoinColumn({ name: 'tuition_standard_id' })
  standard: TuitionStandard;

  @Column()
  studentId: string;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @Column({ length: 100 })
  studentName: string;

  @Column({ length: 50 })
  grade: string;

  @Column({ length: 50, nullable: true })
  className: string;

  @Column({ length: 20 })
  academicYear: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  paymentDate: Date;

  @Column({ length: 50, nullable: true })
  paymentMethod: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'partial', 'overdue'],
    default: 'pending',
  })
  status: 'pending' | 'paid' | 'partial' | 'overdue';

  // ============ Installment Fields (Issue #98) ============
  @Column({
    name: 'sub_status',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  subStatus: string;

  @Column({ name: 'installment_plan_id', type: 'uuid', nullable: true })
  installmentPlanId: string;

  @OneToOne(() => InstallmentPlan, (plan) => plan.tuitionPayment)
  @JoinColumn({ name: 'installment_plan_id' })
  installmentPlan: InstallmentPlan;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
