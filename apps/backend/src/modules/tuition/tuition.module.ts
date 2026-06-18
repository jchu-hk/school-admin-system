import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TuitionStandard } from './tuition-standard.entity';
import { TuitionPayment } from './tuition-payment.entity';
import { InstallmentPlan } from './installment-plan.entity';
import { InstallmentSchedule } from './installment-schedule.entity';
import { InstallmentPlanReview } from './installment-review.entity';
import { TuitionController } from './tuition.controller';
import { TuitionService } from './tuition.service';
import { InstallmentController, SubStatusController } from './installment.controller';
import { InstallmentService } from './installment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TuitionStandard,
      TuitionPayment,
      InstallmentPlan,
      InstallmentSchedule,
      InstallmentPlanReview,
    ]),
  ],
  controllers: [
    TuitionController,
    InstallmentController,
    SubStatusController,
  ],
  providers: [TuitionService, InstallmentService],
  exports: [TuitionService, InstallmentService],
})
export class TuitionModule {}
