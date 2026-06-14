import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Scholarship } from './scholarship.entity';

@Entity('scholarship_applications')
@Index(['scholarshipId', 'studentId'])
@Index(['status'])
export class ScholarshipApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  scholarshipId: string;

  @ManyToOne(() => Scholarship, (s) => s.applications)
  @JoinColumn({ name: 'scholarshipId' })
  scholarship: Scholarship;

  @Column()
  studentId: string;

  @Column({ length: 100 })
  studentName: string;

  @Column({ length: 50 })
  grade: string;

  @Column({ length: 50, nullable: true })
  className: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  appliedAt: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'reviewing', 'approved', 'rejected', 'awarded'],
    default: 'pending',
  })
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'awarded';

  @Column({ type: 'text', nullable: true })
  reviewerComment: string;

  @Column({ length: 100, nullable: true })
  reviewerName: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  awardedAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
