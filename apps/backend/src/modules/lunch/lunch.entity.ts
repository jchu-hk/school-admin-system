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

export enum LunchOrderStatus {
  PENDING = 'pending',     // 待确认
  CONFIRMED = 'confirmed', // 已确认
  CANCELLED = 'cancelled', // 已取消
  COMPLETED = 'completed', // 已完成（已取餐）
}

@Entity('lunch_orders')
export class LunchOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'ordered_by' })
  orderedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ordered_by' })
  orderer: User;

  @Column({ name: 'order_date', type: 'date' })
  orderDate: Date;

  @Column({ name: 'menu_name', length: 200 })
  menuName: string;

  @Column({ name: 'menu_price', type: 'decimal', precision: 10, scale: 2 })
  menuPrice: number;

  @Column({ type: 'int', name: 'quantity', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: LunchOrderStatus,
    default: LunchOrderStatus.PENDING,
  })
  status: LunchOrderStatus;

  @Column({ name: 'confirmed_by', nullable: true })
  confirmedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'confirmed_by' })
  confirmer: User;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

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
