import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReplyDto {
  @ApiProperty({ description: '回复内容' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  content: string;
}
