import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
} from 'typeorm';
import { ScholarshipApplication } from './scholarship-application.entity';

@Entity('scholarships')
@Index(['status'])
@Index(['scholarshipType'])
export class Scholarship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /** 奖学金类型: merit(学业), need-based(困难补助), book(书簿津贴), transport(车船津贴), boarding(寄宿津贴) */
  @Column({ name: 'scholarship_type', length: 50 })
  scholarshipType: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  /** 名额总数 */
  @Column({ name: 'total_quota', type: 'int', nullable: true })
  totalQuota: number;

  @Column({ name: 'application_start_date', type: 'date' })
  applicationStartDate: Date;

  @Column({ name: 'application_end_date', type: 'date' })
  applicationEndDate: Date;

  @Column({ name: 'disbursement_start_date', type: 'date', nullable: true })
  disbursementStartDate: Date;

  @Column({ name: 'disbursement_end_date', type: 'date', nullable: true })
  disbursementEndDate: Date;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'closed'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'closed';

  @Column({ name: 'eligible_grades', type: 'text', nullable: true })
  eligibleGrades: string;

  @Column({ name: 'eligible_classes', type: 'text', nullable: true })
  eligibleClasses: string;

  @Column({ type: 'text', nullable: true })
  requirements: string;

  @Column({
    name: 'attachment_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  attachmentUrl: string;

  @Column({ name: 'created_by', length: 100 })
  createdBy: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'updated_by', length: 100, nullable: true })
  updatedBy: string;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'now()' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @OneToMany(() => ScholarshipApplication, (app) => app.scholarship)
  applications: ScholarshipApplication[];
}
