import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TuitionStandard } from './tuition-standard.entity';

@Entity('tuition_payments')
@Index(['studentId', 'academicYear'])
@Index(['status'])
export class TuitionPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  standardId: string;

  @ManyToOne(() => TuitionStandard, (standard) => standard.payments)
  @JoinColumn({ name: 'standardId' })
  standard: TuitionStandard;

  @Column()
  studentId: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
