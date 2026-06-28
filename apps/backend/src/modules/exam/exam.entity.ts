import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ExamStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

export enum ExamType {
  MIDTERM = 'midterm',
  FINAL = 'final',
  QUIZ = 'quiz',
  TEST = 'test',
  ORAL = 'oral',
  PRACTICAL = 'practical',
  OTHER = 'other',
}

@Entity('exams')
@Index(['examDate'])
@Index(['classId'])
@Index(['subject'])
@Index(['status'])
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50 })
  subject: string;

  @Column({ type: 'date', name: 'exam_date' })
  examDate: Date;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ length: 100 })
  classroom: string;

  @Column({ name: 'class_id', type: 'uuid', nullable: true })
  classId: string;

  @Column({ name: 'class_name', length: 100, nullable: true })
  className: string;

  @Column({
    type: 'enum',
    enum: ExamType,
    name: 'exam_type',
    default: ExamType.TEST,
  })
  examType: ExamType;

  @Column({
    type: 'enum',
    enum: ExamStatus,
    default: ExamStatus.SCHEDULED,
  })
  status: ExamStatus;

  @Column({ length: 200, nullable: true })
  invigilator: string;

  @Column({ type: 'int', default: 100, name: 'total_marks' })
  totalMarks: number;

  @Column({ type: 'int', nullable: true, name: 'passing_marks' })
  passingMarks: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'uuid', nullable: true, name: 'school_id' })
  schoolId: string;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
