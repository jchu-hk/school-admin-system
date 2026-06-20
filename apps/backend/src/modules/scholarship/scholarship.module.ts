import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scholarship } from './scholarship.entity';
import { ScholarshipApplication } from './scholarship-application.entity';
import { ScholarshipController } from './scholarship.controller';
import { ScholarshipService } from './scholarship.service';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Scholarship, ScholarshipApplication, User])],
  controllers: [ScholarshipController],
  providers: [ScholarshipService],
  exports: [ScholarshipService],
})
export class ScholarshipModule {}
