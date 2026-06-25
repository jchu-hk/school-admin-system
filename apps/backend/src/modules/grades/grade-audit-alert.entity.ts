import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { User } from '../user/user.entity'
import { GradeRecord } from './grade-record.entity'
import { GradeReview } from './grade-review.entity'

export enum AlertType {
  GRADE_REVOKED = 'grade_revoked',
  UNUSUAL_CHANGE = 'unusual_change',
  DEADLINE_APPROACHING = 'deadline_approaching',
  APPROVAL_DELAY = 'approval_delay',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('grade_audit_alerts')
export class GradeAuditAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'grade_record_id', nullable: true })
  gradeRecordId: string

  @ManyToOne(() => GradeRecord, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'grade_record_id' })
  gradeRecord: GradeRecord

  @Column({ name: 'grade_review_id', nullable: true })
  gradeReviewId: string

  @ManyToOne(() => GradeReview, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'grade_review_id' })
  gradeReview: GradeReview

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType

  @Column({ type: 'enum', enum: AlertSeverity, default: AlertSeverity.MEDIUM })
  severity: AlertSeverity

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.OPEN })
  status: AlertStatus

  @Column({ type: 'text' })
  message: string

  @Column({ name: 'teacher_id' })
  teacherId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User

  @Column({ name: 'notified_user_ids', type: 'jsonb', default: [] })
  notifiedUserIds: string[]

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>

  @Column({ name: 'acknowledged_by', nullable: true })
  acknowledgedBy: string

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'acknowledged_by' })
  acknowledgedByUser: User

  @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
  acknowledgedAt: Date

  @Column({ name: 'acknowledgement_comment', type: 'text', nullable: true })
  acknowledgementComment: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}