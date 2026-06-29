import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Meeting } from './meeting.entity';

export enum ParticipantRole {
  CHAIR = 'chair', // 主持
  REQUIRED = 'required', // 必需
  OPTIONAL = 'optional', // 可选
  OBSERVER = 'observer', // 观察员
}

export enum RsvpStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  TENTATIVE = 'tentative',
}

@Entity('meeting_participants')
export class MeetingParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'meeting_id', type: 'uuid' })
  meetingId: string;

  @ManyToOne(() => Meeting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'user_name', length: 100, nullable: true })
  userName: string;

  @Column({ name: 'user_role', length: 50, nullable: true })
  userRole: string;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    name: 'participant_role',
    default: ParticipantRole.REQUIRED,
  })
  participantRole: ParticipantRole;

  @Column({
    type: 'enum',
    enum: RsvpStatus,
    name: 'rsvp_status',
    default: RsvpStatus.PENDING,
  })
  rsvpStatus: RsvpStatus;

  @Column({ name: 'rsvp_at', type: 'timestamptz', nullable: true })
  rsvpAt: Date;

  @Column({ name: 'is_present', default: false })
  isPresent: boolean; // 是否出席

  @Column({ name: 'check_in_time', type: 'timestamptz', nullable: true })
  checkInTime: Date;

  @Column({ name: 'decline_reason', type: 'text', nullable: true })
  declineReason: string;

  @Column({ name: 'notification_sent', default: false })
  notificationSent: boolean;

  @Column({ name: 'notification_sent_at', type: 'timestamptz', nullable: true })
  notificationSentAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
