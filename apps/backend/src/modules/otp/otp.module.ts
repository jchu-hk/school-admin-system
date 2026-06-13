import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  OtpConfig,
  OtpSession,
  OtpTrustedSession,
} from './entities/otp.entity';
import { OtpService } from './services/otp.service';
import { OtpController } from './controllers/otp.controller';
import { OtpGuard } from './guards/otp.guard';
import { AuditModule } from '../audit/audit.module';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OtpConfig, OtpSession, OtpTrustedSession, User]),
    AuditModule,
  ],
  controllers: [OtpController],
  providers: [OtpService, OtpGuard],
  exports: [OtpService, OtpGuard],
})
export class OtpModule {}
