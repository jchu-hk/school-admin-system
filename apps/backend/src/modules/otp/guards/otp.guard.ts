import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OtpService } from '../services/otp.service';
import { Request } from 'express';

export const OTP_REQUIRED_KEY = 'otpRequired';
export const OTP_OPERATION_TYPE_KEY = 'otpOperationType';

@Injectable()
export class OtpGuard implements CanActivate {
  constructor(
    private readonly otpService: OtpService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOtpRequired = this.reflector.getAllAndOverride<boolean>(
      OTP_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isOtpRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get trusted session ID from headers or cookies
    const trustedSessionId = request.headers['x-otp-trusted-session'] as string;

    if (trustedSessionId) {
      const isTrusted = await this.otpService.isTrustedSession(
        user.id,
        trustedSessionId,
      );
      if (isTrusted) {
        return true;
      }
    }

    // Check if user has any OTP method enabled
    const userOtpConfigs = await this.otpService.getUserOtpConfigs(user.id);
    const hasEnabledOtp = userOtpConfigs.some((config) => config.isEnabled);

    if (!hasEnabledOtp) {
      // If no OTP enabled, allow access (or enforce OTP setup based on your policy)
      return true;
    }

    // OTP verification required
    const availableTypes = userOtpConfigs.filter(c => c.isEnabled).map(c => c.otpType);
    throw new ForbiddenException({
      message: 'OTP verification is required for this operation',
      error: 'OTP_REQUIRED',
      availableOtpTypes: availableTypes,
    });
  }
}
