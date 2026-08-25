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
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/user.entity';
import { JupasChoice } from './jupas-choice.entity';
import { JupasReferenceLetter } from './jupas-reference-letter.entity';
import { JupasAppeal } from './jupas-appeal.entity';

/** JUPAS 申请主状态机：collecting → draft → submitted → announced → archived */
export enum JupasApplicationStatus {
  COLLECTING = 'collecting', // 志愿收集阶段
  DRAFT = 'draft', // 草拟
  SUBMITTED = 'submitted', // 学校推荐提交
  ANNOUNCED = 'announced', // 放榜结果关联
  ARCHIVED = 'archived', // 归档
}

/** 学校推荐信提交状态（school_reference_status） */
export enum JupasRefStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
}

@Entity('jupas_applications')
export class JupasApplication {
  @ApiProperty({ description: '申请ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '记录编号（JUPAS-YYYY-S6-NNNNN）' })
  @Column({ length: 50, unique: true, name: 'jupas_id' })
  jupasId: string;

  @ApiProperty({ description: '学年（2025-2026）' })
  @Column({ length: 9, name: 'academic_year' })
  academicYear: string;

  @ApiProperty({ description: '学生ID' })
  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ApiProperty({ description: 'JUPAS 申请编号' })
  @Column({ length: 30, name: 'jupas_application_no' })
  jupasApplicationNo: string;

  @ApiProperty({ description: '志愿数' })
  @Column({ type: 'smallint', default: 0, name: 'choices_count' })
  choicesCount: number;

  @ApiProperty({ description: '学校推荐提交状态', enum: JupasRefStatus })
  @Column({
    type: 'enum',
    enum: JupasRefStatus,
    default: JupasRefStatus.PENDING,
    name: 'school_reference_status',
  })
  schoolReferenceStatus: JupasRefStatus;

  @ApiProperty({ description: '学校推荐提交截止' })
  @Column({ type: 'date', nullable: true, name: 'submission_deadline' })
  submissionDeadline: Date;

  @ApiProperty({ description: '申请状态', enum: JupasApplicationStatus })
  @Column({
    type: 'enum',
    enum: JupasApplicationStatus,
    default: JupasApplicationStatus.COLLECTING,
  })
  status: JupasApplicationStatus;

  @ApiProperty({ description: '创建人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  @ApiProperty({ description: '更新人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => JupasChoice, (c) => c.application, { eager: false })
  choices: JupasChoice[];

  @OneToMany(() => JupasReferenceLetter, (l) => l.application, { eager: false })
  letters: JupasReferenceLetter[];

  @OneToMany(() => JupasAppeal, (a) => a.application, { eager: false })
  appeals: JupasAppeal[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
