import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LunchController } from './lunch.controller';
import { LunchService } from './lunch.service';
import { LunchOrder } from './lunch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LunchOrder])],
  controllers: [LunchController],
  providers: [LunchService],
  exports: [LunchService],
})
export class LunchModule {}
