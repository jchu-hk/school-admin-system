import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/user.entity';

/**
 * 数据分级（data_class）
 * 对应 DB-SCHEMA §17 compliance_checks / SPEC-COMPLETE F-COMP-001 数据分类：
 *   P1 高度敏感（健康资料、身份证号、家庭状况）
 *   P2 中度敏感（成绩、奖惩记录、联络方式）
 *   P3 一般资料（姓名、班别、出席率）
 */
export enum DataClass {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

/** 合规判定结果（check_decision） */
export enum CheckDecision {
  ALLOW = 'allow',
  DENY = 'deny',
}

/** 风险等级（risk_level） */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/** 使用目的（purpose）—— 合法目的集合（PDPO 目的限制原则） */
export enum Purpose {
  EDUCATION_ADMINISTRATION = 'education_administration',
  HEALTHCARE = 'healthcare',
  EMERGENCY = 'emergency',
  COMMUNICATION = 'communication',
  REPORTING = 'reporting',
  PUBLIC = 'public',
  SYNC_PUSH = 'sync_push',
}

/** 常见拒绝原因（reason） */
export enum DenyReason {
  PURPOSE_VIOLATION = 'purpose_violation',
  EXCESSIVE_FIELD = 'excessive_field',
  ACCESS_DENIED = 'access_denied',
  RETENTION_EXPIRED = 'retention_expired',
}

/**
 * 合规检查记录（compliance_checks）
 * F-COMP-001：记录每次 PDPO 合规判定的输入、决策与理由，供合规追溯与留存（保留 7 年）。
 */
@Entity('compliance_checks')
export class ComplianceCheck {
  @ApiProperty({ description: '检查记录ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '操作类型（view/export/print/update/sync_push 等）' })
  @Column({ length: 50 })
  action: string;

  @ApiProperty({ enum: DataClass, description: '数据级别 P1/P2/P3' })
  @Column({ type: 'enum', enum: DataClass, name: 'data_class' })
  dataClass: DataClass;

  @ApiProperty({ enum: Purpose, description: '使用目的' })
  @Column({ length: 50 })
  purpose: Purpose;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @ApiProperty({ description: '请求用户角色' })
  @Column({ length: 50, name: 'user_role', nullable: true })
  userRole: string;

  @ApiProperty({ description: '资源类型（student_record/health/financial 等）' })
  @Column({ length: 50, name: 'resource_type', nullable: true })
  resourceType: string;

  @ApiProperty({ description: '目标资源ID' })
  @Column({ length: 100, name: 'resource_id', nullable: true })
  resourceId: string;

  @ApiProperty({ description: '请求字段列表' })
  @Column({ type: 'jsonb', name: 'requested_fields', default: () => "'[]'" })
  requestedFields: string[];

  @ApiProperty({ enum: CheckDecision, description: 'allow/deny' })
  @Column({ type: 'enum', enum: CheckDecision })
  decision: CheckDecision;

  @ApiProperty({ description: '拒绝/放行原因（purpose_violation 等）' })
  @Column({ length: 200, nullable: true })
  reason: string;

  @ApiProperty({
    description: '各子检查项结果[{name, passed, detail}]',
  })
  @Column({ type: 'jsonb', name: 'check_items', default: () => "'[]'" })
  checkItems: Array<{
    name: string;
    passed: boolean;
    detail?: string;
  }>;

  @ApiProperty({ enum: RiskLevel, description: '风险等级（low/medium/high）' })
  @Column({ type: 'enum', enum: RiskLevel, name: 'risk_level', default: RiskLevel.LOW })
  riskLevel: RiskLevel;

  @ApiProperty({ description: '请求IP' })
  @Column({ length: 50, nullable: true })
  ip: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
