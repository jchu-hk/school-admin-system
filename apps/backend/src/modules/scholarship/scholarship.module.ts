import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scholarship } from './scholarship.entity';
import { ScholarshipApplication } from './scholarship-application.entity';
import { ScholarshipController } from './scholarship.controller';
import { ScholarshipService } from './scholarship.service';

@Module({
  imports: [TypeOrmModule.forFeature([Scholarship, ScholarshipApplication])],
  controllers: [ScholarshipController],
  providers: [ScholarshipService],
  exports: [ScholarshipService],
})
export class ScholarshipModule {}
