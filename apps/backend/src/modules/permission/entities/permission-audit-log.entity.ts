import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 权限审计日志实体
 * 记录每次 ABAC 权限检查的详细信息
 */
@Entity('permission_audit_logs')
@Index(['userId', 'createdAt'])
@Index(['decision', 'createdAt'])
@Index(['resource', 'action', 'createdAt'])
export class PermissionAuditLog {
  @ApiProperty({ description: '日志ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '用户ID' })
  @Column({ name: 'userId', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: '用户角色' })
  @Column({ name: 'userRole', length: 50 })
  userRole: string;

  @ApiProperty({ description: '操作类型' })
  @Column({ length: 20 })
  action: string;

  @ApiProperty({ description: '资源类型' })
  @Column({ length: 50 })
  resource: string;

  @ApiProperty({ description: '资源ID' })
  @Column({ name: 'resourceId', type: 'uuid', nullable: true })
  resourceId: string;

  @ApiProperty({ description: '决策结果', enum: ['allow', 'deny'] })
  @Column({ length: 10 })
  decision: 'allow' | 'deny';

  @ApiProperty({ description: '拒绝原因' })
  @Column({ type: 'text', nullable: true })
  reason: string;

  @ApiProperty({ description: '匹配的策略名称' })
  @Column({ name: 'matchedPolicy', length: 100, nullable: true })
  matchedPolicy: string;

  @ApiProperty({ description: '决策耗时(ms)' })
  @Column({ name: 'decisionTimeMs', type: 'int' })
  decisionTimeMs: number;

  @ApiProperty({ description: '请求上下文(JSON)' })
  @Column({ name: 'requestContext', type: 'json', nullable: true })
  requestContext: Record<string, any>;

  @ApiProperty({ description: '客户端IP' })
  @Column({ length: 50, nullable: true })
  ip: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
}
