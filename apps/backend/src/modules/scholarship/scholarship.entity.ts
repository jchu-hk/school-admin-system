import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ScholarshipApplication } from './scholarship-application.entity';

@Entity('scholarships')
@Index(['code'], { unique: true })
@Index(['status'])
export class Scholarship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50 })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'HKD' })
  currency: string;

  @Column({ length: 20 })
  academicYear: string;

  @Column({ type: 'timestamp', nullable: true })
  applicationDeadline: Date;

  @Column({ type: 'text', nullable: true })
  eligibilityCriteria: string;

  @Column({
    type: 'enum',
    enum: ['open', 'closed', 'pending', 'awarded'],
    default: 'open',
  })
  status: 'open' | 'closed' | 'pending' | 'awarded';

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalBudget: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  usedBudget: number;

  @Column({ nullable: true })
  schoolId: string;

  @OneToMany(() => ScholarshipApplication, (app) => app.scholarship)
  applications: ScholarshipApplication[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
