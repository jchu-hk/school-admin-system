import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('courses')
@Index(['code'], { unique: true })
@Index(['grade', 'subject'])
@Index(['status'])
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50 })
  grade: string;

  @Column({ length: 50 })
  subject: string;

  @Column({ length: 100 })
  teacher: string;

  @Column({ length: 50 })
  classroom: string;

  @Column({ length: 200 })
  schedule: string;

  @Column({ type: 'int', default: 30 })
  capacity: number;

  @Column({ type: 'int', default: 0 })
  enrolled: number;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: 'active' | 'inactive';

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  schoolId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
