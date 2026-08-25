import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../user/user.entity';
import { JupasApplication } from './jupas-application.entity';

/** JUPAS 上诉状态机：received → under_review → resolved | dismissed */
export enum JupasAppealStatus {
  RECEIVED = 'received',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('jupas_appeals')
export class JupasAppeal {
  @ApiProperty({ description: '上诉ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '所属申请ID' })
  @Column({ type: 'uuid', name: 'application_id' })
  applicationId: string;

  @ManyToOne(() => JupasApplication, (app) => app.appeals, { eager: false })
  @JoinColumn({ name: 'application_id' })
  application: JupasApplication;

  @ApiProperty({ description: '上诉理由' })
  @Column({ type: 'text' })
  reason: string;

  @ApiPropertyOptional({
    description: '证据文件引用数组',
    type: 'array',
    default: [],
  })
  @Column({ type: 'jsonb', default: '[]' })
  evidence: any;

  @ApiProperty({ description: '上诉状态', enum: JupasAppealStatus })
  @Column({ type: 'enum', enum: JupasAppealStatus, default: JupasAppealStatus.RECEIVED })
  status: JupasAppealStatus;

  @ApiPropertyOptional({ description: '复核人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'reviewed_by' })
  reviewedBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User;

  @ApiPropertyOptional({ description: '处理结果' })
  @Column({ type: 'text', nullable: true })
  resolution: string;

  @ApiPropertyOptional({ description: '处理时间' })
  @Column({ type: 'timestamptz', nullable: true, name: 'resolved_at' })
  resolvedAt: Date;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
