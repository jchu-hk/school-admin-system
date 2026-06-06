import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ParentInquiry } from './inquiry.entity';

export enum ReplyAuthorType {
  OFFICER = 'officer',   // 校务处员工
  AI = 'ai',             // AI自动回复
  PARENT = 'parent',     // 家长补充
}

@Entity('inquiry_replies')
export class InquiryReply {
  @ApiProperty({ description: '回复ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '查询ID' })
  @Column({ type: 'uuid' })
  inquiryId: string;

  @ApiProperty({ description: '查询信息' })
  @ManyToOne(() => ParentInquiry)
  @JoinColumn({ name: 'inquiryId' })
  inquiry: ParentInquiry;

  @ApiProperty({ description: '回复作者ID' })
  @Column({ type: 'uuid' })
  authorId: string;

  @ApiProperty({ description: '回复作者类型', enum: ReplyAuthorType })
  @Column({
    type: 'enum',
    enum: ReplyAuthorType,
    default: ReplyAuthorType.OFFICER,
  })
  authorType: ReplyAuthorType;

  @ApiProperty({ description: '回复内容' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '是否为AI生成' })
  @Column({ default: false })
  isAiGenerated: boolean;

  @ApiProperty({ description: '家长是否已查看' })
  @Column({ default: false })
  parentViewed: boolean;

  @ApiProperty({ description: '家长查看时间' })
  @Column({ type: 'timestamp', nullable: true })
  parentViewedAt: Date;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;
}
