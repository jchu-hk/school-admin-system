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
import { FeeType } from './fee-type.entity';

@Entity('fee_records')
@Index(['studentId', 'feeTypeId'])
@Index(['status'])
export class FeeRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fee_type_id' })
  feeTypeId: string;

  @ManyToOne(() => FeeType)
  @JoinColumn({ name: 'fee_type_id' })
  feeType: FeeType;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'student_name', length: 100 })
  studentName: string;

  @Column({ length: 50 })
  grade: string;

  @Column({ name: 'class_name', length: 50, nullable: true })
  className: string;

  @Column({ name: 'fee_type_name', length: 100 })
  feeTypeName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'HKD' })
  currency: string;

  @Column({ name: 'payment_date', type: 'timestamp', nullable: true })
  paymentDate: Date;

  @Column({ name: 'payment_method', length: 50, nullable: true })
  paymentMethod: string;

  @Column({ name: 'receipt_number', length: 50, nullable: true })
  receiptNumber: string;

  @Column({
    type: 'enum',
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending',
  })
  status: 'paid' | 'pending' | 'overdue';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
