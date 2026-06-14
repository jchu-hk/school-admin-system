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

  @Column()
  feeTypeId: string;

  @ManyToOne(() => FeeType)
  @JoinColumn({ name: 'feeTypeId' })
  feeType: FeeType;

  @Column()
  studentId: string;

  @Column({ length: 100 })
  studentName: string;

  @Column({ length: 50 })
  grade: string;

  @Column({ length: 50, nullable: true })
  className: string;

  @Column({ length: 100 })
  feeTypeName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'HKD' })
  currency: string;

  @Column({ type: 'timestamp', nullable: true })
  paymentDate: Date;

  @Column({ length: 50, nullable: true })
  paymentMethod: string;

  @Column({ length: 50, nullable: true })
  receiptNumber: string;

  @Column({
    type: 'enum',
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending',
  })
  status: 'paid' | 'pending' | 'overdue';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
