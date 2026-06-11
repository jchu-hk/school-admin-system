import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScholarshipController } from './scholarship.controller';
import { ScholarshipService } from './scholarship.service';
import {
  Scholarship,
  ScholarshipApplication,
  ScholarshipDisbursement,
} from './scholarship.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Scholarship, ScholarshipApplication, ScholarshipDisbursement]),
  ],
  controllers: [ScholarshipController],
  providers: [ScholarshipService],
  exports: [ScholarshipService],
})
export class ScholarshipModule {}
