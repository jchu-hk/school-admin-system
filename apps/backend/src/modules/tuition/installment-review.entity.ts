import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';
import { InstallmentPlan } from './installment-plan.entity';

export enum InstallmentReviewAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

@Entity('installment_plan_reviews')
@Index(['planId'])
export class InstallmentPlanReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => InstallmentPlan, (plan) => plan.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: InstallmentPlan;

  @Column({ name: 'reviewer_id', type: 'uuid' })
  reviewerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({
    type: 'enum',
    enum: InstallmentReviewAction,
  })
  action: InstallmentReviewAction;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'attachment_urls', type: 'text', array: true, nullable: true })
  attachmentUrls: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
