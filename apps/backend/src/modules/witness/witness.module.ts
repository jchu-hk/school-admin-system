import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WitnessVerification,
  WitnessStep,
} from './entities/witness.entity';
import { WitnessController } from './controllers/witness.controller';
import { WitnessService } from './services/witness.service';
import { User } from '../user/user.entity';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WitnessVerification, WitnessStep, User]),
    AuditModule,
    NotificationModule,
    OtpModule,
  ],
  controllers: [WitnessController],
  providers: [WitnessService],
  exports: [WitnessService],
})
export class WitnessModule {}
