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

  @OneToMany(() => TuitionPayment, (payment) => payment.standard)
  payments: TuitionPayment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
