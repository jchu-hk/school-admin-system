import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';

export enum RelationshipType {
  FATHER = 'father',
  MOTHER = 'mother',
  GUARDIAN = 'guardian',
  OTHER = 'other',
}

@Entity('parent_student_links')
export class ParentStudentLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @Column({ name: 'parent_id' })
  parentId: string;

  @Column({ name: 'student_id', length: 50 })
  studentId: string;

  @Column({
    type: 'enum',
    enum: RelationshipType,
    length: 20,
  })
  relationship: RelationshipType;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'verified_at', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
