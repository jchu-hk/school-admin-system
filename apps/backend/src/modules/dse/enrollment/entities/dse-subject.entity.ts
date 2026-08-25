import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 科目分类枚举（dse_subject_category_enum）
 * A_core（核心）/ A_elective（选修）/ B（应用学习）/ C（其他语言）
 */
export enum DseSubjectCategory {
  A_CORE = 'A_core',
  A_ELECTIVE = 'A_elective',
  B = 'B',
  C = 'C',
}

@Entity('dse_subjects')
@Index(['category'])
@Index(['isCore'])
export class DseSubject {
  @ApiProperty({ description: '科目ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '科目代码', example: 'CN' })
  @Column({ length: 20, unique: true, name: 'subject_code' })
  subjectCode: string;

  @ApiProperty({ description: '中文名称', example: '中國語文' })
  @Column({ length: 100, name: 'subject_name_zh' })
  subjectNameZh: string;

  @ApiProperty({ description: '英文名称', example: 'Chinese Language' })
  @Column({ length: 100, name: 'subject_name_en' })
  subjectNameEn: string;

  @ApiProperty({ description: '科目分类', enum: DseSubjectCategory })
  @Column({
    type: 'enum',
    enum: DseSubjectCategory,
    name: 'category',
  })
  category: DseSubjectCategory;

  @ApiProperty({ description: '是否核心科目', default: false })
  @Column({ type: 'boolean', default: false, name: 'is_core' })
  isCore: boolean;

  @ApiProperty({ description: '试卷语言（中文/英文）' })
  @Column({ length: 10, nullable: true })
  language: string;

  @ApiProperty({ description: '是否可用', default: true })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
