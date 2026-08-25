import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DseEnrollmentController } from './dse-enrollment.controller';
import { DseEnrollmentService } from './dse-enrollment.service';
import { DseExamBatch } from './entities/dse-exam-batch.entity';
import { DseSubject } from './entities/dse-subject.entity';
import { DseRegistration } from './entities/dse-registration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DseExamBatch,
      DseSubject,
      DseRegistration,
    ]),
  ],
  controllers: [DseEnrollmentController],
  providers: [DseEnrollmentService],
  exports: [DseEnrollmentService],
})
export class DseEnrollmentModule {}
