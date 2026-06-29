import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user/user.entity';

export enum EnrollmentStatus {
  ACTIVE = 'active',
  GRADUATED = 'graduated',
  TRANSFERRED = 'transferred',
  SUSPENDED = 'suspended',
  WITHDRAWN = 'withdrawn',
}

export enum HealthRecordType {
  ALLERGY = 'allergy',
  MEDICATION = 'medication',
  CHRONIC = 'chronic',
  DISABILITY = 'disability',
  EMERGENCY_CONTACT = 'emergency_contact',
  VACCINATION = 'vaccination',
  MEDICAL_NOTE = 'medical_note',
  OTHER = 'other',
}

@Entity('student_profiles')
export class StudentProfile {
  @ApiProperty({ description: '档案ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '学生用户ID' })
  @Column({ name: 'student_id', unique: true })
  studentId: string;

  @ApiProperty({ description: '学生用户', type: () => User })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  // ====== 学籍记录 (Enrollment Records) ======
  @ApiProperty({ description: '入学日期' })
  @Column({ type: 'date', nullable: true, name: 'enrollment_date' })
  enrollmentDate: Date;

  @ApiProperty({ description: '学籍状态', enum: EnrollmentStatus })
  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ACTIVE,
    name: 'enrollment_status',
  })
  enrollmentStatus: EnrollmentStatus;

  @ApiProperty({ description: '原就读学校' })
  @Column({ length: 200, nullable: true, name: 'previous_school' })
  previousSchool: string;

  @ApiProperty({ description: '入学年级' })
  @Column({ length: 20, nullable: true, name: 'admission_grade' })
  admissionGrade: string;

  @ApiProperty({ description: '在学年级' })
  @Column({ length: 20, nullable: true, name: 'current_grade' })
  currentGrade: string;

  @ApiProperty({ description: '毕业日期' })
  @Column({ type: 'date', nullable: true, name: 'graduation_date' })
  graduationDate: Date;

  @ApiProperty({ description: '在学证明编号' })
  @Column({ length: 50, nullable: true, name: 'enrollment_cert_no' })
  enrollmentCertNo: string;

  // ====== 健康记录摘要 (Health Summary) ======
  @ApiProperty({ description: '是否有过敏史' })
  @Column({ default: false, name: 'has_allergy' })
  hasAllergy: boolean;

  @ApiProperty({ description: '过敏原列表（JSON数组）' })
  @Column({ type: 'text', nullable: true, name: 'allergens' })
  allergens: string;

  @ApiProperty({ description: '是否有长期用药' })
  @Column({ default: false, name: 'has_long_term_medication' })
  hasLongTermMedication: boolean;

  @ApiProperty({ description: '长期用药说明' })
  @Column({ type: 'text', nullable: true, name: 'long_term_medication_notes' })
  longTermMedicationNotes: string;

  @ApiProperty({ description: '是否有特殊健康需求（SEN）' })
  @Column({ default: false, name: 'has_sen' })
  hasSen: boolean;

  @ApiProperty({ description: 'SEN类型' })
  @Column({ length: 200, nullable: true, name: 'sen_type' })
  senType: string;

  @ApiProperty({ description: '紧急联系人姓名' })
  @Column({ length: 100, nullable: true, name: 'emergency_contact_name' })
  emergencyContactName: string;

  @ApiProperty({ description: '紧急联系人电话' })
  @Column({ length: 20, nullable: true, name: 'emergency_contact_phone' })
  emergencyContactPhone: string;

  @ApiProperty({ description: '紧急联系人关系' })
  @Column({ length: 50, nullable: true, name: 'emergency_contact_relation' })
  emergencyContactRelation: string;

  // ====== 成绩摘要 (Grade Summary) ======
  @ApiProperty({ description: '最近一个学期的平均分' })
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'latest_avg_score',
  })
  latestAvgScore: number;

  @ApiProperty({ description: '成绩记录总数' })
  @Column({ default: 0, name: 'total_grade_records' })
  totalGradeRecords: number;

  // ====== 档案状态 ======
  @ApiProperty({ description: '档案是否归档' })
  @Column({ default: false, name: 'is_archived' })
  isArchived: boolean;

  @ApiProperty({ description: '归档日期' })
  @Column({ type: 'timestamp', nullable: true, name: 'archived_at' })
  archivedAt: Date;

  @ApiProperty({ description: '归档原因' })
  @Column({ length: 200, nullable: true, name: 'archive_reason' })
  archiveReason: string;

  // ====== 元数据 ======
  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @ApiProperty({ description: '创建人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  @ApiProperty({ description: '更新人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy: string;
}
