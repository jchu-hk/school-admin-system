import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/user.entity';

/**
 * SSPA 自行分配批次状态枚举
 * @see SPEC-SYSTEM-DESIGN §19.5 / DB-SCHEMA §19 `sspa_batch_status_enum`
 * draft → open → scoring → announced → registered → archived
 */
export enum SspaBatchStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  SCORING = 'scoring',
  ANNOUNCED = 'announced',
  REGISTERED = 'registered',
  ARCHIVED = 'archived',
}

/** 默认评分权重：学业30/面试30/兄弟10/校友5/成就10/酌情15 */
export const DEFAULT_SCORING_WEIGHTS: Record<string, number> = {
  academic: 30,
  interview: 30,
  sibling: 10,
  alumni: 5,
  achievement: 10,
  principal_discretion: 15,
};

@Entity('sspa_batches')
export class SspaBatch {
  @ApiProperty({ description: '批次ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '年度，如 2026-2027' })
  @Column({ length: 9, unique: true })
  year: string;

  @ApiProperty({ description: '批次名称' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: '评分权重（JSONB）', example: DEFAULT_SCORING_WEIGHTS })
  @Column({ type: 'jsonb', name: 'scoring_weights' })
  scoringWeights: Record<string, number>;

  @ApiProperty({ description: '学额' })
  @Column({ type: 'smallint' })
  seats: number;

  @ApiProperty({ description: '申请表开放日', required: false })
  @Column({ type: 'date', nullable: true, name: 'open_at' })
  openAt: Date;

  @ApiProperty({ description: '面试日', required: false })
  @Column({ type: 'date', nullable: true, name: 'interview_date' })
  interviewDate: Date;

  @ApiProperty({ description: '公布日期', required: false })
  @Column({ type: 'date', nullable: true, name: 'announcement_date' })
  announcementDate: Date;

  @ApiProperty({ description: '批次状态', enum: SspaBatchStatus })
  @Column({ type: 'enum', enum: SspaBatchStatus, default: SspaBatchStatus.DRAFT })
  status: SspaBatchStatus;

  @ApiProperty({ description: '创建人ID', required: false })
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
