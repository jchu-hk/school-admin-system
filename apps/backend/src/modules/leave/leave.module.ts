import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { LeaveController } from './leave.controller';
import { LeaveAiVerificationController } from './leave-ai-verification.controller';
import { LeaveService } from './leave.service';
import { LeaveAiVerificationService } from './leave-ai-verification.service';
import { Leave } from './leave.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Leave]),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [LeaveController, LeaveAiVerificationController],
  providers: [LeaveService, LeaveAiVerificationService],
  exports: [LeaveService, LeaveAiVerificationService],
})
export class LeaveModule {}
