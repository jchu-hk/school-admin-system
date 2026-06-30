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
import { RecruitmentPosition } from './recruitment-position.entity';

export enum ApplicationStatus {
  NEW = 'NEW',
  SCREENING = 'SCREENING',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  REJECTED = 'REJECTED',
  OFFER = 'OFFER',
}

@Entity('recruitment_applications')
export class RecruitmentApplication {
  @ApiProperty({ description: '申请ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '申请编号' })
  @Column({ unique: true, length: 50, name: 'application_number' })
  applicationNumber: string;

  @ApiProperty({ description: '职位ID' })
  @Column({ type: 'uuid', name: 'position_id' })
  positionId: string;

  @ApiProperty({ description: '职位信息' })
  @ManyToOne(() => RecruitmentPosition)
  @JoinColumn({ name: 'position_id' })
  position: RecruitmentPosition;

  @ApiProperty({ description: '申请人姓名' })
  @Column({ length: 100, name: 'applicant_name' })
  applicantName: string;

  @ApiProperty({ description: '邮箱' })
  @Column({ length: 255 })
  email: string;

  @ApiProperty({ description: '电话' })
  @Column({ length: 20 })
  phone: string;

  @ApiProperty({ description: '简历文件URL' })
  @Column({ length: 500, name: 'cv_url', nullable: true })
  cvUrl: string;

  @ApiProperty({ description: '简历文件名' })
  @Column({ length: 255, name: 'cv_filename', nullable: true })
  cvFilename: string;

  @ApiProperty({ description: '求职信' })
  @Column({ type: 'text', nullable: true, name: 'cover_letter' })
  coverLetter: string;

  @ApiProperty({ description: '教育背景' })
  @Column({ type: 'jsonb', default: [] })
  education: EducationItem[];

  @ApiProperty({ description: '工作经历' })
  @Column({ type: 'jsonb', default: [] })
  experience: ExperienceItem[];

  @ApiProperty({ description: '申请状态' })
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.NEW,
  })
  status: ApplicationStatus;

  @ApiProperty({ description: '筛选备注' })
  @Column({ type: 'text', nullable: true, name: 'screening_notes' })
  screeningNotes: string;

  @ApiProperty({ description: '拒绝原因' })
  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string;

  @ApiProperty({ description: '拒绝人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'rejected_by' })
  rejectedBy: string;

  @ApiProperty({ description: '拒绝时间' })
  @Column({ type: 'timestamp', nullable: true, name: 'rejected_at' })
  rejectedAt: Date;

  @ApiProperty({ description: '学校ID' })
  @Column({ type: 'uuid', nullable: true, name: 'school_id' })
  schoolId: string;

  @ApiProperty({ description: '提交时间' })
  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export interface EducationItem {
  degree: string;
  school: string;
  major: string;
  year: string;
}

export interface ExperienceItem {
  company: string;
  position: string;
  duration: string;
  description: string;
}
