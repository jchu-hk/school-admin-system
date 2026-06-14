import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TuitionStandard } from './tuition-standard.entity';
import { TuitionPayment } from './tuition-payment.entity';
import { TuitionController } from './tuition.controller';
import { TuitionService } from './tuition.service';

@Module({
  imports: [TypeOrmModule.forFeature([TuitionStandard, TuitionPayment])],
  controllers: [TuitionController],
  providers: [TuitionService],
  exports: [TuitionService],
})
export class TuitionModule {}
