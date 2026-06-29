import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DseResult } from './dse-result.entity';
import { User } from '../../user/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum DseReviewStatus {
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 已批准（提交HKEAA）
  REJECTED = 'rejected', // 已拒绝
  SUBMITTED_TO_HKEAA = 'submitted_to_hkeaa', // 已提交HKEAA
  HKEAA_REVIEWING = 'hkeaa_reviewing', // HKEAA处理中
  HKEAA_COMPLETED = 'hkeaa_completed', // HKEAA处理完成
  RESULT_UPDATED = 'result_updated', // 成绩已更正
  CANCELLED = 'cancelled', // 已取消
}

export enum DseReviewType {
  MARK_RECHECK = 'mark_recheck', // 成绩覆核（重阅答卷）
  SCRUTINY = 'scrutiny', // 成绩覆核（检查分数相加）
}

@Entity('dse_reviews')
export class DseReview {
  @ApiProperty({ description: '覆核申请ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '关联的DSE成绩记录ID' })
  @Column({ type: 'uuid', name: 'dse_result_id' })
  dseResultId: string;

  @ManyToOne(() => DseResult)
  @JoinColumn({ name: 'dse_result_id' })
  dseResult: DseResult;

  @ApiProperty({ description: '申请人ID（教师/教务）' })
  @Column({ type: 'uuid', name: 'applicant_id' })
  applicantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'applicant_id' })
  applicant: User;

  @ApiProperty({ description: '覆核类型', enum: DseReviewType })
  @Column({
    type: 'enum',
    enum: DseReviewType,
    name: 'review_type',
  })
  reviewType: DseReviewType;

  @ApiProperty({ description: '申请科目' })
  @Column({ length: 100, name: 'subject_name' })
  subjectName: string;

  @ApiProperty({ description: '申请理由' })
  @Column({ type: 'text', name: 'reason' })
  reason: string;

  @ApiProperty({ description: '覆核状态', enum: DseReviewStatus })
  @Column({
    type: 'enum',
    enum: DseReviewStatus,
    default: DseReviewStatus.PENDING,
  })
  status: DseReviewStatus;

  @ApiProperty({ description: 'HKEAA覆核费用（HKD）' })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'hkeaa_fee',
  })
  hkeaaFee: number;

  @ApiProperty({ description: 'HKEAA覆核结果' })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'hkeaa_new_level',
  })
  hkeaaNewLevel: string;

  @ApiProperty({ description: 'HKEAA结果说明' })
  @Column({ type: 'text', nullable: true, name: 'hkeaa_result_remark' })
  hkeaaResultRemark: string;

  @ApiProperty({ description: '审批人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'approver_id' })
  approverId: string;

  @ApiProperty({ description: '审批备注' })
  @Column({ type: 'text', nullable: true, name: 'approval_remark' })
  approvalRemark: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
