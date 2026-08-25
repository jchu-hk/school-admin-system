import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ExamPaper,
  ExamPaperRequest,
  ExamPaperDistribution,
} from './paper-management.entity';
import { PaperManagementController } from './paper-management.controller';
import { PaperManagementService } from './paper-management.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamPaper,
      ExamPaperRequest,
      ExamPaperDistribution,
    ]),
  ],
  controllers: [PaperManagementController],
  providers: [PaperManagementService],
  exports: [PaperManagementService],
})
export class PaperManagementModule {}
