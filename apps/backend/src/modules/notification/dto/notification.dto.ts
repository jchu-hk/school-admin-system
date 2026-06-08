import { IsString, IsEnum, IsOptional, IsUUID, IsNotEmpty, IsArray } from 'class-validator';
import { NotificationType } from '../notification.entity';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsUUID()
  @IsOptional()
  senderId?: string;

  @IsUUID()
  @IsOptional()
  relatedId?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsNotEmpty()
  recipientIds: string[];
}

export class NotificationQueryDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsUUID()
  @IsOptional()
  senderId?: string;
}
