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
import { User } from '../../user/user.entity';

/**
 * 资料当事人权利申请类型（data subject right）
 * 对应 PDPO 用户权利要求：查询（access）、更正（rectification/correction）、删除（erasure）。
 */
export enum DataAccessRequestType {
  ACCESS = 'access', // 资料查询（数据访问申请 DAR）
  CORRECTION = 'correction', // 资料更正
  ERASURE = 'erasure', // 资料删除（被遗忘权）
}

/** 处理状态机（dar_status） */
export enum DataAccessRequestStatus {
  SUBMITTED = 'submitted', // 已提交
  UNDER_REVIEW = 'under_review', // 审批中
  APPROVED = 'approved', // 已批准（可执行）
  COMPLETED = 'completed', // 已完成（响应/更正/删除已执行）
  REJECTED = 'rejected', // 已拒绝
  WITHDRAWN = 'withdrawn', // 申请人撤回
}

/** 数据范围类型（决定访问/删除的范围） */
export enum DataScopeType {
  ALL = 'all', // 全部个人资料
  STUDENT_PROFILE = 'student_profile', // 学生档案
  HEALTH = 'health', // 健康资料
  FINANCIAL = 'financial', // 财务资料
  ATTENDANCE = 'attendance', // 考勤
  RESULT = 'result', // 成绩
  MESSAGE = 'message', // 沟通消息
  OTHER = 'other', // 其他
}

/**
 * 资料当事人权利申请（data_access_requests）
 * F-COMP-001：数据访问/更正/删除申请，含完整状态机与双人批准归口。
 */
@Entity('data_access_requests')
export class DataAccessRequest {
  @ApiProperty({ description: '申请ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: DataAccessRequestType, description: '申请类型' })
  @Column({ type: 'enum', enum: DataAccessRequestType, name: 'request_type' })
  requestType: DataAccessRequestType;

  @ApiProperty({ enum: DataScopeType, description: '数据范围类型' })
  @Column({ type: 'enum', enum: DataScopeType, name: 'data_scope' })
  dataScope: DataScopeType;

  /** 资料当事人（subject）—— 只读引用既有 User */
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'subject_id', referencedColumnName: 'id' })
  subject: User;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @ApiProperty({ description: '申请理由/说明' })
  @Column({ type: 'text', nullable: true })
  justification: string;

  /** 申请提交人（默认 = 当事人本人，或父母/代申请人） */
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({ name: 'requester_id', type: 'uuid', nullable: true })
  requesterId: string;

  @ApiProperty({ enum: DataAccessRequestStatus, description: '状态机状态' })
  @Column({
    type: 'enum',
    enum: DataAccessRequestStatus,
    default: DataAccessRequestStatus.SUBMITTED,
  })
  status: DataAccessRequestStatus;

  /** 审批人（校务主任/系统管理员） */
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ name: 'reviewer_id', type: 'uuid', nullable: true })
  reviewerId: string;

  @ApiProperty({ description: '审批意见/拒绝原因' })
  @Column({ length: 500, name: 'review_note', nullable: true })
  reviewNote: string;

  @ApiProperty({ description: '响应内容（access 返回的数据摘录、correction 的更正结果、erasure 的执行结果）' })
  @Column({ type: 'text', name: 'response_payload', nullable: true })
  responsePayload: string;

  @ApiProperty({ description: '完成时间（批准执行后）' })
  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt: Date;

  @ApiProperty({ description: '截止日期（PDPO 要求 40 天内响应，留白则按配置）' })
  @Column({ type: 'timestamptz', name: 'response_due_at', nullable: true })
  responseDueAt: Date;

  @ApiProperty({ description: '所属学校' })
  @Column({ length: 100, name: 'school_id' })
  schoolId: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
