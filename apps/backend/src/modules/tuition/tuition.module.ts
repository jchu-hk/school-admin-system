import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TuitionController } from './tuition.controller';
import { TuitionService } from './tuition.service';
import { TuitionStandard, TuitionPayment, TuitionArrears } from './tuition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TuitionStandard, TuitionPayment, TuitionArrears])],
  controllers: [TuitionController],
  providers: [TuitionService],
  exports: [TuitionService],
})
export class TuitionModule {}
