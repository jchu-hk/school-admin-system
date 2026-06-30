import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum PositionStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
}

@Entity('recruitment_positions')
export class RecruitmentPosition {
  @ApiProperty({ description: '职位ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '职位名称' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ description: '教授学科' })
  @Column({ length: 100 })
  subject: string;

  @ApiProperty({ description: '雇佣类型' })
  @Column({
    type: 'enum',
    enum: EmploymentType,
    default: EmploymentType.FULL_TIME,
    name: 'employment_type',
  })
  employmentType: EmploymentType;

  @ApiProperty({ description: '最低薪资' })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'salary_min' })
  salaryMin: number;

  @ApiProperty({ description: '最高薪资' })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'salary_max' })
  salaryMax: number;

  @ApiProperty({ description: '薪资货币' })
  @Column({ length: 10, default: 'HKD', name: 'salary_currency' })
  salaryCurrency: string;

  @ApiProperty({ description: '工作地点' })
  @Column({ length: 500 })
  location: string;

  @ApiProperty({ description: '任职要求（JSON数组）' })
  @Column({ type: 'jsonb', default: [] })
  requirements: string[];

  @ApiProperty({ description: '工作职责（JSON数组）' })
  @Column({ type: 'jsonb', default: [] })
  responsibilities: string[];

  @ApiProperty({ description: '福利待遇（JSON数组）' })
  @Column({ type: 'jsonb', default: [] })
  benefits: string[];

  @ApiProperty({ description: '申请截止日期' })
  @Column({ type: 'date', name: 'application_deadline' })
  applicationDeadline: Date;

  @ApiProperty({ description: '职位状态' })
  @Column({
    type: 'enum',
    enum: PositionStatus,
    default: PositionStatus.DRAFT,
  })
  status: PositionStatus;

  @ApiProperty({ description: '申请数量' })
  @Column({ default: 0, name: 'application_count' })
  applicationCount: number;

  @ApiProperty({ description: '发布时间' })
  @Column({ type: 'timestamp', nullable: true, name: 'published_at' })
  publishedAt: Date;

  @ApiProperty({ description: '暂停时间' })
  @Column({ type: 'timestamp', nullable: true, name: 'paused_at' })
  pausedAt: Date;

  @ApiProperty({ description: '关闭时间' })
  @Column({ type: 'timestamp', nullable: true, name: 'closed_at' })
  closedAt: Date;

  @ApiProperty({ description: '学校ID' })
  @Column({ type: 'uuid', nullable: true, name: 'school_id' })
  schoolId: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
