import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../user/user.entity';
import { JupasApplication } from './jupas-application.entity';

/** 推荐信类型 */
export enum JupasLetterType {
  TEACHER = 'teacher',
  PRINCIPAL = 'principal',
  SCHOOL = 'school',
}

/** 推荐信状态机：draft → in_review → submitted → returned */
export enum JupasLetterStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  SUBMITTED = 'submitted',
  RETURNED = 'returned',
}

@Entity('jupas_reference_letters')
export class JupasReferenceLetter {
  @ApiProperty({ description: '推荐信ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '所属申请ID' })
  @Column({ type: 'uuid', name: 'application_id' })
  applicationId: string;

  @ManyToOne(() => JupasApplication, (app) => app.letters, { eager: false })
  @JoinColumn({ name: 'application_id' })
  application: JupasApplication;

  @ApiProperty({ description: '推荐信类型', enum: JupasLetterType })
  @Column({ type: 'enum', enum: JupasLetterType, name: 'letter_type' })
  letterType: JupasLetterType;

  @ApiProperty({ description: '撰写教师/校长ID' })
  @Column({ type: 'uuid', name: 'teacher_id' })
  teacherId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @ApiPropertyOptional({ description: '任教科目（教师信）' })
  @Column({ length: 50, nullable: true })
  subject: string;

  @ApiPropertyOptional({ description: '推荐信正文' })
  @Column({ type: 'text', nullable: true })
  content: string;

  @ApiPropertyOptional({ description: '字数' })
  @Column({ type: 'int', nullable: true, name: 'word_count' })
  wordCount: number;

  @ApiProperty({ description: '推荐信状态', enum: JupasLetterStatus })
  @Column({
    type: 'enum',
    enum: JupasLetterStatus,
    default: JupasLetterStatus.DRAFT,
  })
  status: JupasLetterStatus;

  @ApiPropertyOptional({
    description: 'AI 写作大纲建议（三段，脱敏参考）',
    type: 'object',
  })
  @Column({ type: 'jsonb', nullable: true, name: 'ai_suggestion' })
  aiSuggestion: any;

  @ApiPropertyOptional({
    description: '字数/最低字数提示/术语一致性结果',
    type: 'object',
  })
  @Column({ type: 'jsonb', nullable: true, name: 'letter_stats' })
  letterStats: any;

  @ApiPropertyOptional({ description: '截止日期' })
  @Column({ type: 'date', nullable: true })
  deadline: Date;

  @ApiPropertyOptional({ description: '提交时间' })
  @Column({ type: 'timestamptz', nullable: true, name: 'submitted_at' })
  submittedAt: Date;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
