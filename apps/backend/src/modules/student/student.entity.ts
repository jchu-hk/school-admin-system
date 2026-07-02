import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

// ============ Enums ============

/** 性别枚举 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

/** 学生状态枚举 */
export enum StudentStatus {
  ACTIVE = 'active',
  GRADUATED = 'graduated',
  WITHDRAWN = 'withdrawn',
  TRANSFERRED = 'transferred',
}

/** 分配类型枚举 */
export enum AllocationType {
  MAIN = 'main',         // 主班（每生每学年仅一个）
  ELECTIVE = 'elective', // 选修
  TEMPORARY = 'temporary', // 临时
}

// ============ Entities ============

/** 学年 (academic_years) */
@Entity('academic_years')
export class AcademicYear {
  @ApiProperty({ description: '学年ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '学年，如 2026-2027' })
  @Column({ length: 9, unique: true, name: 'year' })
  year: string;

  @ApiProperty({ description: '学年开始日期' })
  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @ApiProperty({ description: '学年结束日期' })
  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @ApiProperty({ description: '是否当前学年' })
  @Column({ default: false, name: 'is_current' })
  isCurrent: boolean;

  @ApiProperty({ description: '状态' })
  @Column({ length: 20, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/** 学生档案表 (students) */
@Entity('students')
export class Student {
  @ApiProperty({ description: '学生档案唯一标识' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '学号（YYYYNNNN格式，自动生成' })
  @Column({ length: 10, unique: true, name: 'student_id' })
  studentId: string;

  @ApiProperty({ description: '中文姓名' })
  @Column({ length: 100, name: 'name_zh' })
  nameZh: string;

  @ApiProperty({ description: '英文姓名' })
  @Column({ length: 100, nullable: true, name: 'name_en' })
  nameEn: string;

  @ApiProperty({ description: '性别', enum: Gender })
  @Column({ type: 'enum', enum: Gender, name: 'gender' })
  gender: Gender;

  @ApiProperty({ description: '出生日期' })
  @Column({ type: 'date', name: 'birth_date' })
  birthDate: Date;

  @ApiProperty({ description: '家庭地址' })
  @Column({ type: 'text', nullable: true })
  address: string;

  @ApiProperty({ description: '联系电话' })
  @Column({ length: 20, nullable: true })
  phone: string;

  @ApiProperty({ description: '邮箱' })
  @Column({ length: 255, nullable: true })
  email: string;

  @ApiProperty({ description: '入学日期' })
  @Column({ type: 'date', name: 'admission_date' })
  admissionDate: Date;

  @ApiProperty({ description: '状态', enum: StudentStatus })
  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIVE })
  status: StudentStatus;

  @ApiProperty({ description: '监护人姓名' })
  @Column({ length: 100, nullable: true, name: 'guardian_name' })
  guardianName: string;

  @ApiProperty({ description: '监护人电话' })
  @Column({ length: 20, nullable: true, name: 'guardian_phone' })
  guardianPhone: string;

  @ApiProperty({ description: '监护人关系' })
  @Column({ length: 50, nullable: true, name: 'guardian_relationship' })
  guardianRelationship: string;

  @ApiProperty({ description: '紧急联系人' })
  @Column({ length: 100, nullable: true, name: 'emergency_contact' })
  emergencyContact: string;

  @ApiProperty({ description: '紧急联系电话' })
  @Column({ length: 20, nullable: true, name: 'emergency_phone' })
  emergencyPhone: string;

  @ApiProperty({ description: '香港身份证' })
  @Column({ length: 20, nullable: true, name: 'hk_id' })
  hkId: string;

  @ApiProperty({ description: '备注' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ApiProperty({ description: '创建人' })
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  @ApiProperty({ description: '更新人' })
  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy: string;
}

/** 学号序列表 (student_id_sequences) */
@Entity('student_id_sequences')
export class StudentIdSequence {
  @ApiProperty({ description: '序列ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '学年（如 2026-2027）' })
  @Column({ length: 9, unique: true, name: 'academic_year' })
  academicYear: string;

  @ApiProperty({ description: '上一个分配的序号' })
  @Column({ type: 'int', default: 0, name: 'last_sequence' })
  lastSequence: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/** 班级分配表 (class_allocations) */
@Entity('class_allocations')
export class ClassAllocation {
  @ApiProperty({ description: '分配ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '学生档案ID', type: () => Student })
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ApiProperty({ description: '班级ID', type: () => Class })
  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ type: 'uuid', name: 'class_id' })
  classId: string;

  @ApiProperty({ description: '学年ID', type: () => AcademicYear })
  @ManyToOne(() => AcademicYear, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ type: 'uuid', name: 'academic_year_id' })
  academicYearId: string;

  @ApiProperty({ description: '学年（如 2026-2027）' })
  @Column({ length: 9, name: 'academic_year' })
  academicYearStr: string;

  @ApiProperty({ description: '分配类型', enum: AllocationType })
  @Column({
    type: 'enum',
    enum: AllocationType,
    default: AllocationType.MAIN,
    name: 'allocation_type',
  })
  allocationType: AllocationType;

  @ApiProperty({ description: '生效日期' })
  @Column({ type: 'date', name: 'effective_date' })
  effectiveDate: Date;

  @ApiProperty({ description: '结束日期' })
  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// Import Class entity for ManyToOne
import { Class } from '../user/class.entity';
