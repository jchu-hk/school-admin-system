import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsDateString,
} from 'class-validator';
import { PermissionChangeType } from '../entities/permission-approval.entity';

export class CreatePermissionApprovalRequestDto {
  @ApiProperty({ description: 'Target user ID to change permissions for' })
  @IsUUID()
  targetUserId: string;

  @ApiProperty({
    enum: PermissionChangeType,
    description: 'Type of permission change',
  })
  @IsEnum(PermissionChangeType)
  changeType: PermissionChangeType;

  @ApiProperty({ description: 'Role ID to grant/revoke', required: false })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiProperty({
    description: 'List of permission IDs to grant/revoke',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds?: string[];

  @ApiProperty({ description: 'Reason for the permission change request' })
  @IsString()
  requestReason: string;

  @ApiProperty({
    description: 'Valid from date for temporary permissions',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiProperty({
    description: 'Valid until date for temporary permissions',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class ApprovePermissionRequestDto {
  @ApiProperty({ description: 'Approval comment', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RejectPermissionRequestDto {
  @ApiProperty({ description: 'Rejection reason' })
  @IsString()
  rejectionReason: string;
}

export class CancelPermissionRequestDto {
  @ApiProperty({ description: 'Cancellation reason', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
