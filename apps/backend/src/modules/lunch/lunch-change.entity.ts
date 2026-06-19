import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum LunchChangeType {
  ADD = 'add',       // 加单
  CANCEL = 'cancel', // 取消
  MODIFY = 'modify', // 更改款式
}

export enum LunchChangeStatus {
  PENDING = 'pending',           // 待审核
  APPROVED = 'approved',         // 已批准
  REJECTED = 'rejected',         // 已拒绝
  AUTO_REJECTED = 'auto_rejected', // 超时自动拒绝
}

@Entity('lunch_changes')
export class LunchChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', nullable: true })
  orderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'order_id' })
  order: User;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({
    name: 'change_type',
    type: 'enum',
    enum: LunchChangeType,
  })
  changeType: LunchChangeType;

  @Column({ name: 'original_item', length: 200, nullable: true })
  originalItem: string;

  @Column({ name: 'new_item', length: 200, nullable: true })
  newItem: string;

  @Column({ name: 'new_quantity', type: 'int', nullable: true })
  newQuantity: number;

  @Column({ name: 'new_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  newPrice: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'cutoff_time', type: 'time', default: '14:00' })
  cutoffTime: string;

  @Column({
    type: 'enum',
    enum: LunchChangeStatus,
    default: LunchChangeStatus.PENDING,
  })
  status: LunchChangeStatus;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'reject_reason', length: 500, nullable: true })
  rejectReason: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
