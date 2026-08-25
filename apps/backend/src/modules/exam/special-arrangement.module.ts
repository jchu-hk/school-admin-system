import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SpecialExamArrangement,
  SpecialArrangementApproval,
} from './special-arrangement.entity';
import { SpecialArrangementController } from './special-arrangement.controller';
import { SpecialArrangementService } from './special-arrangement.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SpecialExamArrangement,
      SpecialArrangementApproval,
    ]),
  ],
  controllers: [SpecialArrangementController],
  providers: [SpecialArrangementService],
  exports: [SpecialArrangementService],
})
export class SpecialArrangementModule {}
