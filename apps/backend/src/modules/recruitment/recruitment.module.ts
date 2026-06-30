import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruitmentPosition } from './recruitment-position.entity';
import { RecruitmentPositionService } from './recruitment-position.service';
import { RecruitmentPositionController } from './recruitment-position.controller';
import { RecruitmentApplication } from './recruitment-application.entity';
import { RecruitmentApplicationService } from './recruitment-application.service';
import { RecruitmentApplicationController } from './recruitment-application.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecruitmentPosition, RecruitmentApplication]),
  ],
  controllers: [
    RecruitmentPositionController,
    RecruitmentApplicationController,
  ],
  providers: [
    RecruitmentPositionService,
    RecruitmentApplicationService,
  ],
  exports: [
    RecruitmentPositionService,
    RecruitmentApplicationService,
  ],
})
export class RecruitmentModule {}
