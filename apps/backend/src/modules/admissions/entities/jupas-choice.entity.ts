import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { JupasApplication } from './jupas-application.entity';

/** JUPAS 志愿选择状态机：draft → confirmed → applied → offered → declined */
export enum JupasChoiceStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  APPLIED = 'applied',
  OFFERED = 'offered',
  DECLINED = 'declined',
}

@Entity('jupas_choices')
export class JupasChoice {
  @ApiProperty({ description: '志愿ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '所属申请ID' })
  @Column({ type: 'uuid', name: 'application_id' })
  applicationId: string;

  @ManyToOne(() => JupasApplication, (app) => app.choices, { eager: false })
  @JoinColumn({ name: 'application_id' })
  application: JupasApplication;

  @ApiProperty({ description: '志愿优先级（1 最高）' })
  @Column({ type: 'smallint' })
  priority: number;

  @ApiProperty({ description: '院校（香港大學…）' })
  @Column({ length: 100 })
  institution: string;

  @ApiProperty({ description: '课程名称' })
  @Column({ length: 150 })
  program: string;

  @ApiProperty({ description: '课程代码（JS4013…）' })
  @Column({ length: 30, name: 'program_code' })
  programCode: string;

  @ApiProperty({ description: '志愿状态', enum: JupasChoiceStatus })
  @Column({
    type: 'enum',
    enum: JupasChoiceStatus,
    default: JupasChoiceStatus.DRAFT,
  })
  status: JupasChoiceStatus;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
