import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../attendance/attendance.entity';
import { LeaveApplication } from '../leave/leave.entity';
import { AiSuggestionController } from './ai-suggestion.controller';
import { AiSuggestionService } from './ai-suggestion.service';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, LeaveApplication])],
  controllers: [AiSuggestionController],
  providers: [AiSuggestionService],
  exports: [AiSuggestionService],
})
export class AiModule {}
