import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Permission } from './permission.entity';

/**
 * 权限模板实体
 * 预设的权限组合，方便快速分配给角色
 */
@Entity('permission_templates')
export class PermissionTemplate {
  @ApiProperty({ description: '模板ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '模板名称' })
  @Column({ length: 100, unique: true })
  name: string;

  @ApiProperty({ description: '模板编码' })
  @Column({ length: 100, unique: true })
  code: string;

  @ApiProperty({ description: '模板描述' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: '适用角色' })
  @Column({ name: 'targetRoles', type: 'simple-array', nullable: true })
  targetRoles: string[];

  @ApiProperty({ description: '是否系统预设' })
  @Column({ name: 'isSystem', default: false })
  isSystem: boolean;

  @ApiProperty({ description: '包含的权限列表' })
  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'permission_template_permissions',
    joinColumn: { name: 'templateId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
}