import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user/user.entity';

@Entity('address_book')
export class AddressBook {
  @ApiProperty({ description: '联系人ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '联系人姓名' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({
    description: '联系人类型',
    enum: ['teacher', 'staff', 'parent', 'student', 'other'],
  })
  @Column({
    type: 'enum',
    enum: ['teacher', 'staff', 'parent', 'student', 'other'],
    default: 'other',
    name: 'contact_type',
  })
  contactType: 'teacher' | 'staff' | 'parent' | 'student' | 'other';

  @ApiProperty({ description: '部门/班级' })
  @Column({ length: 100, nullable: true, name: 'department' })
  department: string;

  @ApiProperty({ description: '职位/角色' })
  @Column({ length: 100, nullable: true, name: 'position' })
  position: string;

  @ApiProperty({ description: '联系电话' })
  @Column({ length: 50, nullable: true, name: 'phone' })
  phone: string;

  @ApiProperty({ description: '手机号' })
  @Column({ length: 50, nullable: true, name: 'mobile' })
  mobile: string;

  @ApiProperty({ description: '邮箱' })
  @Column({ length: 100, nullable: true, name: 'email' })
  email: string;

  @ApiProperty({ description: 'WhatsApp号' })
  @Column({ length: 50, nullable: true, name: 'whatsapp' })
  whatsapp: string;

  @ApiProperty({ description: '家庭地址' })
  @Column({ length: 500, nullable: true, name: 'home_address' })
  homeAddress: string;

  @ApiProperty({ description: '紧急联系人姓名' })
  @Column({ length: 100, nullable: true, name: 'emergency_contact_name' })
  emergencyContactName: string;

  @ApiProperty({ description: '紧急联系人电话' })
  @Column({ length: 50, nullable: true, name: 'emergency_contact_phone' })
  emergencyContactPhone: string;

  @ApiProperty({ description: '与紧急联系人的关系' })
  @Column({ length: 50, nullable: true, name: 'emergency_contact_relation' })
  emergencyContactRelation: string;

  @ApiProperty({ description: '备注' })
  @Column({ type: 'text', nullable: true })
  remarks: string;

  @ApiProperty({ description: '是否收藏/星标' })
  @Column({ default: false, name: 'is_starred' })
  isStarred: boolean;

  @ApiProperty({ description: '是否启用' })
  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @ApiProperty({ description: '关联用户ID' })
  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string;

  @ApiProperty({ description: '关联用户' })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '所属学校ID' })
  @Column({ type: 'uuid', nullable: true, name: 'school_id' })
  schoolId: string;

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
