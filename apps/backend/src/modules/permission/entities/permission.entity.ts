import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('permissions')
export class Permission {
  @ApiProperty({ description: '权限ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '权限名称' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: '权限编码' })
  @Column({ length: 100, unique: true })
  code: string;

  @ApiProperty({ description: '权限描述' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
}
