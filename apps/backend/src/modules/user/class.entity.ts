import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 班级实体
 * 对应数据库中的 classes 表
 * 参考: DB-SCHEMA.md 4.3 节
 */
@Entity('classes')
export class Class {
  @ApiProperty({ description: '班级ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '学校ID' })
  @Column({ type: 'uuid' })
  schoolId: string;

  @ApiProperty({ description: '班级名称（如 1A班）' })
  @Column({ length: 50 })
  name: string;

  @ApiProperty({ description: '年级（如 P1, F.1, K2）' })
  @Column({ length: 20 })
  grade: string;

  @ApiProperty({ description: '班级编号（唯一）' })
  @Column({ length: 20, unique: true })
  classCode: string;

  @ApiProperty({ description: '学年ID' })
  @Column({ type: 'uuid', name: 'academic_year_id' })
  academicYearId: string;

  @ApiProperty({ description: '班主任ID' })
  @Column({ type: 'uuid', name: 'homeroom_teacher_id', nullable: true })
  homeroomTeacherId: string;

  @ApiProperty({ description: '教室位置' })
  @Column({ length: 50, nullable: true })
  room: string;

  @ApiProperty({ description: '班级容量' })
  @Column({ type: 'int', default: 30 })
  capacity: number;

  @ApiProperty({ description: '是否启用' })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ description: '备注' })
  @Column({ type: 'text', nullable: true })
  remark: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({ description: '创建人ID' })
  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string;
}
