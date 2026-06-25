import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { User } from '../user/user.entity'
import { Class } from '../user/class.entity'

export enum RecordStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('grade_records')
export class GradeRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'student_id' })
  studentId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User

  @Column({ name: 'teacher_id' })
  teacherId: string

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User

  @Column({ name: 'class_id' })
  classId: string

  @ManyToOne(() => Class, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_id' })
  class: Class

  @Column({ name: 'academic_year' })
  academicYear: string

  @Column({ name: 'term' })
  term: string

  @Column({ name: 'exam_name' })
  examName: string

  @Column({ type: 'jsonb', default: [] })
  subjects: Array<{
    subject: string
    score: number
    grade: string
    classRank: number
    classAvg: number
    teacherComment?: string
    weight?: number
  }>

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overallScore: number

  @Column({ name: 'class_rank' })
  classRank: number

  @Column({ name: 'grade_rank' })
  gradeRank: number

  @Column({ name: 'conduct_grade' })
  conductGrade: string

  @Column({ name: 'attendance_rate' })
  attendanceRate: string

  @Column({ type: 'enum', enum: RecordStatus, default: RecordStatus.DRAFT })
  status: RecordStatus

  @Column({ name: 'approval_level', type: 'integer', default: 0 })
  approvalLevel: number

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approver: User

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date

  @Column({ name: 'approval_comment', type: 'text', nullable: true })
  approvalComment: string

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date

  @Column({ name: 'can_revoke_until', type: 'timestamp', nullable: true })
  canRevokeUntil: Date

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date

  @Column({ name: 'revoked_by', nullable: true })
  revokedBy: string

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'revoked_by' })
  revoker: User

  @Column({ name: 'revoked_reason', type: 'text', nullable: true })
  revokedReason: string

  @Column({ name: 'report_batch', nullable: true })
  reportBatch: string

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    websamsImported?: boolean
    eclassImported?: boolean
    importBatchId?: string
    pdfGenerated?: boolean
    pdfUrl?: string
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}