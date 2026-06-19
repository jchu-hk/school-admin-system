import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LunchController } from './lunch.controller';
import { LunchService } from './lunch.service';
import { LunchReminderScheduler } from './lunch-reminder.service';
import { LunchOrder } from './lunch.entity';
import { LunchChange } from './lunch-change.entity';
import { LunchMenu } from './lunch-menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LunchOrder, LunchChange, LunchMenu])],
  controllers: [LunchController],
  providers: [LunchService, LunchReminderScheduler],
  exports: [LunchService],
})
export class LunchModule {}
