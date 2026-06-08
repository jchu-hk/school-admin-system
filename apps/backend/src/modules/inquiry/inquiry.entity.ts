import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum InquiryStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  CLOSED = 'closed',
}

export enum InquiryType {
  ACADEMIC = 'academic',
  ATTENDANCE = 'attendance',
  DISCIPLINE = 'discipline',
  HEALTH = 'health',
  FINANCE = 'finance',
  OTHER = 'other',
}

@Entity('inquiries')
export class Inquiry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'parent_id' })
  parentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @Column({ name: 'student_id', nullable: true })
  studentId: string;

  @Column({
    type: 'enum',
    enum: InquiryType,
    name: 'inquiry_type',
  })
  inquiryType: InquiryType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: InquiryStatus,
    default: InquiryStatus.PENDING,
  })
  status: InquiryStatus;

  @Column({ name: 'assigned_to', nullable: true })
  assignedTo: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignee: User;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ name: 'closed_by', nullable: true })
  closedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'closed_by' })
  closer: User;

  @Column({ name: 'rating', type: 'int', nullable: true })
  rating: number;

  @Column({ name: 'rating_comment', type: 'text', nullable: true })
  ratingComment: string;

  @OneToMany(() => InquiryReply, (reply) => reply.inquiry)
  replies: InquiryReply[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

@Entity('inquiry_replies')
export class InquiryReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inquiry_id' })
  inquiryId: string;

  @ManyToOne(() => Inquiry, (inquiry) => inquiry.replies)
  @JoinColumn({ name: 'inquiry_id' })
  inquiry: Inquiry;

  @Column({ name: 'replier_id' })
  replierId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'replier_id' })
  replier: User;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
