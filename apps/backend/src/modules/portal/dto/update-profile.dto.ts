import { IsString, IsOptional, IsEmail, Length, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '联系电话', example: '91234567' })
  @IsString()
  @IsOptional()
  @Length(8, 20)
  @Matches(/^[0-9]+$/, { message: 'phone must contain only digits' })
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱', example: 'student@school.edu.hk' })
  @IsString()
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({ description: '紧急联系人姓名', example: '陳大文' })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  emergencyContact?: string;

  @ApiPropertyOptional({ description: '紧急联系电话', example: '98765432' })
  @IsString()
  @IsOptional()
  @Length(8, 20)
  @Matches(/^[0-9]+$/, { message: 'emergencyPhone must contain only digits' })
  emergencyPhone?: string;

  @ApiPropertyOptional({ description: '家庭地址', example: '香港仔田灣大樓A座12樓' })
  @IsString()
  @IsOptional()
  @Length(1, 200)
  address?: string;

  @ApiPropertyOptional({ description: '监护人电话', example: '91234568' })
  @IsString()
  @IsOptional()
  @Length(8, 20)
  @Matches(/^[0-9]+$/, { message: 'guardianPhone must contain only digits' })
  guardianPhone?: string;
}
