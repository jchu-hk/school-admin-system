import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService, LoginResult } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '登录成功或需要OTP验证',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIs...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIs...',
        user: {
          id: 'user-id',
          username: 'admin',
          name: '管理员',
          role: 'system_admin',
        },
        message: '登录成功',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '用户名或密码错误',
  })
  async login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
  ): Promise<LoginResult> {
    return this.authService.login(dto.username, dto.password, ipAddress);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证OTP码' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP验证成功',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIs...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIs...',
        user: {
          id: 'user-id',
          username: 'admin',
          name: '管理员',
          role: 'system_admin',
        },
        message: '登录成功',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'OTP验证失败',
  })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<LoginResult> {
    return this.authService.verifyOtp(
      dto.tempToken,
      dto.code,
      dto.sessionId,
      dto.otpType,
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新Access Token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token刷新成功',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIs...',
        message: 'Token刷新成功',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '刷新令牌无效或已过期',
  })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
  ): Promise<{ access_token: string; message: string }> {
    return this.authService.refreshToken(dto.refreshToken);
  }
}
