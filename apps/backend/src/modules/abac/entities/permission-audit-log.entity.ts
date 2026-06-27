import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('permission_audit_logs')
export class PermissionAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'operator_id' })
  operatorId: string;

  @Column({ type: 'uuid', name: 'target_user_id' })
  targetUserId: string;

  @Column({ type: 'jsonb', name: 'old_permissions' })
  oldPermissions: Record<string, any>;

  @Column({ type: 'jsonb', name: 'new_permissions' })
  newPermissions: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
