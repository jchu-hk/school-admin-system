import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum DseReleaseStatus {
  PENDING = 'pending',       // 放榜前，尚未导入
  IMPORTING = 'importing',   // 正在导入中
  IMPORTED = 'imported',     // 已导入
  REVIEWED = 'reviewed',     // 已复核
  PUBLISHED = 'published',   // 已向家长/学生公布
}

export enum GradeLevel {
  S6 = 'S6',
  S5 = 'S5',
  S4 = 'S4',
}

@Entity('dse_releases')
export class DseRelease {
  @ApiProperty({ description: '放榜记录ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '学年', example: '2025-2026' })
  @Column({ length: 20, name: 'academic_year' })
  academicYear: string;

  @ApiProperty({ description: 'DSE放榜日期' })
  @Column({ type: 'date', name: 'release_date' })
  releaseDate: Date;

  @ApiProperty({ description: '放榜状态', enum: DseReleaseStatus })
  @Column({
    type: 'enum',
    enum: DseReleaseStatus,
    default: DseReleaseStatus.PENDING,
    name: 'release_status',
  })
  releaseStatus: DseReleaseStatus;

  @ApiProperty({ description: '放榜年份', example: 2026 })
  @Column({ type: 'int', name: 'release_year' })
  releaseYear: number;

  @ApiProperty({ description: '导入HKEAA数据的截止日期' })
  @Column({ type: 'date', nullable: true, name: 'import_deadline' })
  importDeadline: Date;

  @ApiProperty({ description: '成绩覆核申请截止日期' })
  @Column({ type: 'date', nullable: true, name: 'review_deadline' })
  reviewDeadline: Date;

  @ApiProperty({ description: '备注' })
  @Column({ type: 'text', nullable: true })
  remark: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
