import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OtpService } from '../services/otp.service';
import {
  BindOtpDto,
  VerifyOtpDto,
  ConfirmBindOtpDto,
  UnbindOtpDto,
  GenerateOtpDto,
} from '../dto/otp.dto';
import { Request as ExpressRequest } from 'express';

@ApiTags('OTP')
@Controller('v1/otp')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate OTP for an operation' })
  @ApiResponse({ status: 200, description: 'OTP generated successfully' })
  async generateOtp(
    @Request() req: ExpressRequest,
    @Body() generateOtpDto: GenerateOtpDto,
  ) {
    const user = req.user as any;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    return this.otpService.generateOtp(
      user,
      generateOtpDto,
      ipAddress,
      userAgent,
    );
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOtp(
    @Request() req: ExpressRequest,
    @Body() verifyOtpDto: VerifyOtpDto,
  ) {
    const user = req.user as any;
    const sessionId = req.headers['x-session-id'] as string;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    return this.otpService.verifyOtp(
      user,
      verifyOtpDto,
      sessionId,
      ipAddress,
      userAgent,
    );
  }

  @Post('bind')
  @ApiOperation({ summary: 'Initiate OTP binding' })
  @ApiResponse({ status: 200, description: 'OTP binding initiated' })
  async bindOtp(
    @Request() req: ExpressRequest,
    @Body() bindOtpDto: BindOtpDto,
  ) {
    const user = req.user as any;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    return this.otpService.bindOtp(user, bindOtpDto, ipAddress, userAgent);
  }

  @Post('bind/confirm')
  @ApiOperation({ summary: 'Confirm OTP binding' })
  @ApiResponse({ status: 200, description: 'OTP bound successfully' })
  async confirmBindOtp(
    @Request() req: ExpressRequest,
    @Body() confirmBindOtpDto: ConfirmBindOtpDto,
  ) {
    const user = req.user as any;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    return this.otpService.confirmBindOtp(
      user,
      confirmBindOtpDto,
      ipAddress,
      userAgent,
    );
  }

  @Delete('unbind')
  @ApiOperation({ summary: 'Unbind OTP type' })
  @ApiResponse({ status: 200, description: 'OTP unbound successfully' })
  async unbindOtp(
    @Request() req: ExpressRequest,
    @Body() unbindOtpDto: UnbindOtpDto,
  ) {
    const user = req.user as any;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    return this.otpService.unbindOtp(user, unbindOtpDto, ipAddress, userAgent);
  }

  @Get('configs')
  @ApiOperation({ summary: 'Get user OTP configurations' })
  @ApiResponse({
    status: 200,
    description: 'OTP configurations retrieved successfully',
  })
  async getOtpConfigs(@Request() req: ExpressRequest) {
    const user = req.user as any;
    return this.otpService.getUserOtpConfigs(user.id);
  }
}
