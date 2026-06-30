import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
  ValidateNested,
  IsBoolean,
  IsUUID,
  IsNotEmpty,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  MeetingType,
  MeetingStatus,
  RecurringPattern,
} from '../entities/meeting.entity';
import { ParticipantRole } from '../entities/meeting-participant.entity';

// ============ 会议安排 DTOs ============

export class CreateParticipantDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  userName?: string;

  @IsEnum(ParticipantRole)
  @IsOptional()
  participantRole?: ParticipantRole;
}

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  meetingTitle: string;

  @IsEnum(MeetingType)
  meetingType: MeetingType;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  agenda?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  participants: CreateParticipantDto[];

  @IsEnum(RecurringPattern)
  @IsOptional()
  recurringPattern?: RecurringPattern;

  @IsDateString()
  @IsOptional()
  recurringEndDate?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  recurringCount?: number;
}

export class UpdateMeetingDto {
  @IsString()
  @IsOptional()
  meetingTitle?: string;

  @IsEnum(MeetingType)
  @IsOptional()
  meetingType?: MeetingType;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  agenda?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(MeetingStatus)
  @IsOptional()
  status?: MeetingStatus;

  @IsString()
  @IsOptional()
  cancellationReason?: string;
}

export class RsvpDto {
  @IsEnum(ParticipantRole)
  @IsOptional()
  participantRole?: ParticipantRole;

  @IsString()
  @IsOptional()
  declineReason?: string;
}

// ============ 会议记录 DTOs ============

export class DecisionDto {
  @IsString()
  decisionId: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsUUID()
  responsibleUserId: string;

  @IsString()
  @IsOptional()
  responsibleUserName?: string;

  @IsDateString()
  dueDate: string;
}

export class AttachmentDto {
  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsOptional()
  size?: number;

  @IsString()
  @IsOptional()
  mimeType?: string;
}

export class CreateMeetingRecordDto {
  @IsUUID()
  @IsNotEmpty()
  meetingId: string;

  @IsUUID()
  @IsOptional()
  recorderId?: string;

  @IsString()
  @IsOptional()
  recordType?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DecisionDto)
  decisions?: DecisionDto[];

  @IsArray()
  @IsOptional()
  keyPoints?: string[];

  @IsString()
  @IsOptional()
  nextMeetingDate?: string;

  @IsString()
  @IsOptional()
  nextMeetingLocation?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

export class UpdateMeetingRecordDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DecisionDto)
  decisions?: DecisionDto[];

  @IsArray()
  @IsOptional()
  keyPoints?: string[];

  @IsString()
  @IsOptional()
  revisionReason?: string;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class ApproveRecordDto {
  @IsBoolean()
  @IsOptional()
  approved?: boolean; // true = approve, false = reject
}

// ============ 任务分派 DTOs ============

export class CreateMeetingTaskDto {
  @IsUUID()
  @IsNotEmpty()
  meetingId: string;

  @IsUUID()
  @IsOptional()
  recordId?: string;

  @IsString()
  @IsOptional()
  decisionId?: string;

  @IsString()
  @IsNotEmpty()
  taskTitle: string;

  @IsString()
  @IsOptional()
  taskDescription?: string;

  @IsUUID()
  @IsNotEmpty()
  responsibleUserId: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsArray()
  @IsOptional()
  relatedStudents?: string[];
}

export class UpdateMeetingTaskDto {
  @IsString()
  @IsOptional()
  taskTitle?: string;

  @IsString()
  @IsOptional()
  taskDescription?: string;

  @IsUUID()
  @IsOptional()
  responsibleUserId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  completionNote?: string;

  @IsString()
  @IsOptional()
  deferReason?: string;

  @IsDateString()
  @IsOptional()
  deferNewDueDate?: string;
}

export class BulkCreateTaskDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMeetingTaskDto)
  tasks: CreateMeetingTaskDto[];
}
