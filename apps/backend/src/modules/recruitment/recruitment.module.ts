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
import { RecruitmentActivityLog } from './recruitment-activity-log.entity';
import { RecruitmentWorkflowService } from './recruitment-workflow.service';
import { RecruitmentWorkflowController } from './recruitment-workflow.controller';
import { RecruitmentAnalyticsService } from './recruitment-analytics.service';
import { RecruitmentAnalyticsController } from './recruitment-analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecruitmentPosition,
      RecruitmentApplication,
      RecruitmentInterview,
      RecruitmentActivityLog,
    ]),
  ],
  controllers: [
    RecruitmentPositionController,
    RecruitmentApplicationController,
    RecruitmentInterviewController,
    RecruitmentWorkflowController,
    RecruitmentAnalyticsController,
  ],
  providers: [
    RecruitmentPositionService,
    RecruitmentApplicationService,
    RecruitmentInterviewService,
    RecruitmentWorkflowService,
    RecruitmentAnalyticsService,
  ],
  exports: [
    RecruitmentPositionService,
    RecruitmentApplicationService,
    RecruitmentInterviewService,
    RecruitmentWorkflowService,
    RecruitmentAnalyticsService,
  ],
})
export class RecruitmentModule {}
