import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../user/user.entity';
import { SspaBatch } from './sspa-batch.entity';
import { SspaScore } from './sspa-score.entity';

/** SSPA 结果枚举 */
export enum SspaResult {
  ACCEPTED = 'accepted',
  WAITLIST = 'waitlist',
  REJECTED = 'rejected',
}

/** SSPA EDB 结果枚举 */
export enum SspaEdbResult {
  OFFERED = 'offered',
  NOT_OFFERED = 'not_offered',
  PENDING = 'pending',
}

/** SSPA 申请状态机 */
export enum SspaApplicationStatus {
  APPLIED = 'applied',
  SCREENED = 'screened',
  SCORED = 'scored',
  OFFERED = 'offered',
  CONFIRMED = 'confirmed',
  REGISTERED = 'registered',
  WITHDRAWN = 'withdrawn',
}

@Entity('sspa_applications')
export class SspaApplication {
  @ApiProperty({ description: '申请ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '批次ID' })
  @Column({ type: 'uuid', name: 'batch_id' })
  batchId: string;

  @ManyToOne(() => SspaBatch, { eager: false })
  @JoinColumn({ name: 'batch_id' })
  batch: SspaBatch;

  @ApiProperty({ description: '申请编号（SSPA-YYYY-NNNN）' })
  @Column({ length: 30, unique: true, name: 'application_no' })
  applicationNo: string;

  @ApiPropertyOptional({ description: '关联新生申请ID（转正后回填）' })
  @Column({ type: 'uuid', nullable: true, name: 'application_id' })
  applicationId: string;

  @ApiProperty({ description: '学生姓名' })
  @Column({ length: 100, name: 'student_name_zh' })
  studentNameZh: string;

  @ApiProperty({ description: '出生日期' })
  @Column({ type: 'date', name: 'date_of_birth' })
  dateOfBirth: Date;

  @ApiPropertyOptional({ description: '学生身份证' })
  @Column({ length: 20, nullable: true, name: 'hk_id' })
  hkId: string;

  @ApiProperty({ description: '家长姓名' })
  @Column({ length: 100, name: 'parent_name' })
  parentName: string;

  @ApiProperty({ description: '联系电话' })
  @Column({ length: 20, name: 'parent_phone' })
  parentPhone: string;

  @ApiPropertyOptional({ description: '原学校' })
  @Column({ length: 100, nullable: true, name: 'school_of_origin' })
  schoolOfOrigin: string;

  @ApiPropertyOptional({ description: '兄弟姐妹在校' })
  @Column({ type: 'boolean', default: false, name: 'sibling_enrolled' })
  siblingEnrolled: boolean;

  @ApiPropertyOptional({ description: '家长校友' })
  @Column({ type: 'boolean', default: false, name: 'parent_alumni' })
  parentAlumni: boolean;

  @ApiPropertyOptional({ description: '其他成就说明' })
  @Column({ type: 'text', nullable: true, name: 'other_achievements' })
  otherAchievements: string;

  @ApiPropertyOptional({ description: '总分（自动汇总）' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true, name: 'total_score' })
  totalScore: string;

  @ApiPropertyOptional({ description: '排序名次' })
  @Column({ type: 'int', nullable: true })
  rank: number;

  @ApiPropertyOptional({ description: 'SSPA 结果', enum: SspaResult })
  @Column({ type: 'enum', enum: SspaResult, nullable: true })
  result: SspaResult;

  @ApiPropertyOptional({ description: 'EDB 结果', enum: SspaEdbResult })
  @Column({ type: 'enum', enum: SspaEdbResult, nullable: true, name: 'edb_result' })
  edbResult: SspaEdbResult;

  @ApiPropertyOptional({ description: '正取是否确认' })
  @Column({ type: 'boolean', default: false, name: 'offer_confirmed' })
  offerConfirmed: boolean;

  @ApiPropertyOptional({ description: '确认时间' })
  @Column({ type: 'timestamptz', nullable: true, name: 'confirmed_at' })
  confirmedAt: Date;

  @ApiProperty({ description: '申请状态', enum: SspaApplicationStatus })
  @Column({
    type: 'enum',
    enum: SspaApplicationStatus,
    default: SspaApplicationStatus.APPLIED,
  })
  status: SspaApplicationStatus;

  @ApiPropertyOptional({ description: '创建人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => SspaScore, (score) => score.application, { eager: false })
  scores: SspaScore[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
