import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum PortalRelationshipType {
  FATHER = 'father',
  MOTHER = 'mother',
  GUARDIAN = 'guardian',
  OTHER = 'other',
}

/**
 * 家长-学生关联表
 * 定义家长与学生之间的绑定关系，用于数据隔离层
 * 对应 DB-SCHEMA.md 中的 parent_student_links 表
 */
@Entity('parent_student_links')
export class ParentStudentLink {
  @ApiProperty({ description: '关联ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '家长用户ID' })
  @Column({ name: 'parent_user_id', type: 'uuid' })
  parentUserId: string;

  @ApiProperty({ description: '学生ID' })
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ApiProperty({
    description: '关系',
    enum: PortalRelationshipType,
  })
  @Column({
    type: 'enum',
    enum: PortalRelationshipType,
  })
  relationship: PortalRelationshipType;

  @ApiProperty({ description: '是否主要联系人' })
  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
