import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TuitionStandard,
  TuitionPayment,
  TuitionArrears,
} from './tuition.entity';
import { InstallmentPlan } from './installment-plan.entity';
import { InstallmentSchedule } from './installment-schedule.entity';
import { InstallmentPlanReview } from './installment-review.entity';
import { TuitionController } from './tuition.controller';
import { TuitionService } from './tuition.service';
import {
  InstallmentController,
  SubStatusController,
} from './installment.controller';
import { InstallmentService } from './installment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TuitionStandard,
      TuitionPayment,
      TuitionArrears,
      InstallmentPlan,
      InstallmentSchedule,
      InstallmentPlanReview,
    ]),
  ],
  controllers: [SubStatusController, TuitionController, InstallmentController],
  providers: [TuitionService, InstallmentService],
  exports: [TuitionService, InstallmentService],
})
export class TuitionModule {}
