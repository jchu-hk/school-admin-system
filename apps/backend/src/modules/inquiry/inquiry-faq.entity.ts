import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { InquiryCategory } from './inquiry.entity';

export enum FaqMatchType {
  KEYWORD = 'keyword', // 关键词匹配
  CATEGORY = 'category', // 类别匹配
  INTENT = 'intent', // 意图匹配
}

@Entity('inquiry_faqs')
export class InquiryFaq {
  @ApiProperty({ description: 'FAQ ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '学校ID' })
  @Column({ type: 'uuid' })
  schoolId: string;

  @ApiProperty({ description: 'FAQ标题/问题' })
  @Column({ length: 500 })
  question: string;

  @ApiProperty({ description: 'FAQ答案/回复内容' })
  @Column({ type: 'text' })
  answer: string;

  @ApiProperty({ description: '关联类别', enum: InquiryCategory })
  @Column({
    type: 'enum',
    enum: InquiryCategory,
    nullable: true,
  })
  category: InquiryCategory;

  @ApiProperty({ description: '关键词列表（逗号分隔）' })
  @Column({ type: 'text', nullable: true })
  keywords: string;

  @ApiProperty({ description: '匹配类型', enum: FaqMatchType })
  @Column({
    type: 'enum',
    enum: FaqMatchType,
    default: FaqMatchType.KEYWORD,
  })
  matchType: FaqMatchType;

  @ApiProperty({ description: '匹配优先级（数字越小优先级越高）' })
  @Column({ type: 'int', default: 100 })
  priority: number;

  @ApiProperty({ description: '是否需要人工处理（复杂问题）' })
  @Column({ default: false })
  requiresHuman: boolean;

  @ApiProperty({ description: '是否激活' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: '使用次数' })
  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @ApiProperty({ description: '使用场景/标签' })
  @Column({ length: 200, nullable: true })
  tags: string;

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
