import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeType } from './fee-type.entity';
import { FeeRecord } from './fee-record.entity';
import { FeeController } from './fee.controller';
import { FeeService } from './fee.service';

@Module({
  imports: [TypeOrmModule.forFeature([FeeType, FeeRecord])],
  controllers: [FeeController],
  providers: [FeeService],
  exports: [FeeService],
})
export class FeeModule {}
