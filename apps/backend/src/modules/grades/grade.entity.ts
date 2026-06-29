import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum GradeType {
  QUIZ = 'quiz',
  EXAM = 'exam',
  ASSIGNMENT = 'assignment',
  PROJECT = 'project',
}

export enum GradeScale {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  F = 'F',
}

@Entity('grades')
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'course_id' })
  courseId: string;

  @Column({ name: 'term' })
  term: string;

  @Column({ type: 'enum', enum: GradeType })
  type: GradeType;

  @Column({ name: 'title' })
  title: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxScore: number;

  @Column({ type: 'enum', enum: GradeScale, nullable: true })
  grade: GradeScale;

  @Column({ name: 'teacher_id' })
  teacherId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ name: 'remarks', type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'graded_at', type: 'timestamp', nullable: true })
  gradedAt: Date;
}
