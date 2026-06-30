import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('school_info')
export class SchoolInfo {
  @ApiProperty({ description: '学校ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '学校名称' })
  @Column({ length: 200 })
  name: string;

  @ApiProperty({ description: '学校英文名称' })
  @Column({ length: 200, nullable: true, name: 'name_en' })
  nameEn: string;

  @ApiProperty({ description: '学校地址' })
  @Column({ length: 500, nullable: true })
  address: string;

  @ApiProperty({ description: '联系电话' })
  @Column({ length: 50, nullable: true, name: 'phone' })
  phone: string;

  @ApiProperty({ description: '传真号码' })
  @Column({ length: 50, nullable: true, name: 'fax' })
  fax: string;

  @ApiProperty({ description: '邮箱' })
  @Column({ length: 100, nullable: true, name: 'email' })
  email: string;

  @ApiProperty({ description: '学校网址' })
  @Column({ length: 200, nullable: true, name: 'website' })
  website: string;

  @ApiProperty({ description: '学校类型' })
  @Column({
    type: 'enum',
    enum: ['primary', 'secondary', 'kindergarten', 'international'],
    default: 'primary',
    name: 'school_type',
  })
  schoolType: 'primary' | 'secondary' | 'kindergarten' | 'international';

  @ApiProperty({ description: '学校代码' })
  @Column({ length: 20, nullable: true, name: 'school_code' })
  schoolCode: string;

  @ApiProperty({ description: '办学许可证号' })
  @Column({ length: 50, nullable: true, name: 'license_no' })
  licenseNo: string;

  @ApiProperty({ description: '成立日期' })
  @Column({ type: 'date', nullable: true, name: 'established_date' })
  establishedDate: Date;

  @ApiProperty({ description: '校长姓名' })
  @Column({ length: 100, nullable: true, name: 'principal_name' })
  principalName: string;

  @ApiProperty({ description: '副校长姓名' })
  @Column({ length: 100, nullable: true, name: 'vice_principal_name' })
  vicePrincipalName: string;

  @ApiProperty({ description: '学校简介' })
  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  @ApiProperty({ description: '办学理念' })
  @Column({ type: 'text', nullable: true, name: 'mission' })
  mission: string;

  @ApiProperty({ description: '校徽URL' })
  @Column({ length: 500, nullable: true, name: 'logo_url' })
  logoUrl: string;

  @ApiProperty({ description: '学校照片URL' })
  @Column({ length: 500, nullable: true, name: 'photo_url' })
  photoUrl: string;

  @ApiProperty({ description: '是否启用' })
  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @ApiProperty({ description: '备注' })
  @Column({ type: 'text', nullable: true, name: 'remarks' })
  remarks: string;

  @ApiProperty({ description: '创建人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  @ApiProperty({ description: '更新人ID' })
  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
