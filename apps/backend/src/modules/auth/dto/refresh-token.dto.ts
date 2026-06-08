import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新令牌', example: 'refresh-token-xxx' })
  @IsString()
  @IsNotEmpty({ message: '刷新令牌不能为空' })
  refreshToken: string;
}
