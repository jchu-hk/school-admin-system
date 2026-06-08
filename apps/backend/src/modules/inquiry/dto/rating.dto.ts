import { IsNotEmpty, IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RatingDto {
  @ApiProperty({ description: '评分 (1-5)', minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: '评价备注', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
