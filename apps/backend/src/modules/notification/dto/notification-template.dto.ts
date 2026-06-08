import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateNotificationTemplateDto {
  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];

  @IsString()
  @IsOptional()
  description?: string;
}
