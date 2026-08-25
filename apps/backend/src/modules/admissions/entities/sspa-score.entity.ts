import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../user/user.entity';
import { SspaApplication } from './sspa-application.entity';

/** SSPA 评分准则 */
export enum SspaCriterion {
  ACADEMIC = 'academic',
  INTERVIEW = 'interview',
  SIBLING = 'sibling',
  ALUMNI = 'alumni',
  ACHIEVEMENT = 'achievement',
  PRINCIPAL_DISCRETION = 'principal_discretion',
}

/** 各准则默认最高分：学业30/面试30/兄弟10/校友5/成就10/酌情15 */
export const DEFAULT_CRITERION_MAX: Record<SspaCriterion, number> = {
  [SspaCriterion.ACADEMIC]: 30,
  [SspaCriterion.INTERVIEW]: 30,
  [SspaCriterion.SIBLING]: 10,
  [SspaCriterion.ALUMNI]: 5,
  [SspaCriterion.ACHIEVEMENT]: 10,
  [SspaCriterion.PRINCIPAL_DISCRETION]: 15,
};

@Entity('sspa_scores')
@Unique(['applicationId', 'criterion'])
export class SspaScore {
  @ApiProperty({ description: '评分ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '申请ID' })
  @Column({ type: 'uuid', name: 'application_id' })
  applicationId: string;

  @ManyToOne(() => SspaApplication, (app) => app.scores, { eager: false })
  @JoinColumn({ name: 'application_id' })
  application: SspaApplication;

  @ApiProperty({ description: '评分准则', enum: SspaCriterion })
  @Column({ type: 'enum', enum: SspaCriterion })
  criterion: SspaCriterion;

  @ApiProperty({ description: '分项得分' })
  @Column({ type: 'numeric', precision: 5, scale: 2 })
  score: string;

  @ApiProperty({ description: '该准则最高分' })
  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'max_score' })
  maxScore: string;

  @ApiPropertyOptional({ description: '评分人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'scored_by' })
  scoredBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'scored_by' })
  scorer: User;

  @ApiPropertyOptional({ description: '备注（校长酌情权审批留痕）' })
  @Column({ type: 'text', nullable: true })
  note: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
