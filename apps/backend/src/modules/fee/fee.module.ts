import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeController } from './fee.controller';
import { FeeService } from './fee.service';
import { FeeItem, FeeCollection, FeeReduction } from './fee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeeItem, FeeCollection, FeeReduction])],
  controllers: [FeeController],
  providers: [FeeService],
  exports: [FeeService],
})
export class FeeModule {}
