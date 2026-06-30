import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruitmentPosition } from './recruitment-position.entity';
import { RecruitmentPositionService } from './recruitment-position.service';
import { RecruitmentPositionController } from './recruitment-position.controller';
import { RecruitmentApplication } from './recruitment-application.entity';
import { RecruitmentApplicationService } from './recruitment-application.service';
import { RecruitmentApplicationController } from './recruitment-application.controller';
import { RecruitmentInterview } from './recruitment-interview.entity';
import { RecruitmentInterviewService } from './recruitment-interview.service';
import { RecruitmentInterviewController } from './recruitment-interview.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecruitmentPosition,
      RecruitmentApplication,
      RecruitmentInterview,
    ]),
  ],
  controllers: [
    RecruitmentPositionController,
    RecruitmentApplicationController,
    RecruitmentInterviewController,
  ],
  providers: [
    RecruitmentPositionService,
    RecruitmentApplicationService,
    RecruitmentInterviewService,
  ],
  exports: [
    RecruitmentPositionService,
    RecruitmentApplicationService,
    RecruitmentInterviewService,
  ],
})
export class RecruitmentModule {}
