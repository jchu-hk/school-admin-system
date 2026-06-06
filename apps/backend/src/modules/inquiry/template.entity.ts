import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum TemplateCategory {
  BUS = 'bus',             // 校车
  LUNCH = 'lunch',         // 午膳
  FEE = 'fee',             // 收费
  LEAVE = 'leave',         // 请假
  GENERAL = 'general',     // 一般
}

@Entity('quick_reply_templates')
export class QuickReplyTemplate {
  @ApiProperty({ description: '模板ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '学校ID' })
  @Column({ type: 'uuid' })
  schoolId: string;

  @ApiProperty({ description: '模板标题' })
  @Column({ length: 100 })
  title: string;

  @ApiProperty({ description: '模板内容' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '模板分类', enum: TemplateCategory })
  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.GENERAL,
  })
  category: TemplateCategory;

  @ApiProperty({ description: '使用次数' })
  @Column({ default: 0 })
  usageCount: number;

  @ApiProperty({ description: '是否启用' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: '创建人ID' })
  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
}
