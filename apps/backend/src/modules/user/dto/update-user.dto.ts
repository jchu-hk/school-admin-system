import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsEnum, IsUUID, IsDate } from 'class-validator';
import { UserStatus } from '../user.entity';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: '用户状态', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ description: '更新人ID' })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;

  @ApiProperty({ description: '密码过期时间' })
  @IsOptional()
  @IsDate()
  passwordExpiresAt?: Date;
}
