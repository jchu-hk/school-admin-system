import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GradesController } from './grades.controller'
import { GradesService } from './grades.service'
import { GradeRecordsService } from './grade-records.service'
import { GradeAlertsService } from './grade-alerts.service'
import { GradePdfService } from './grade-pdf.service'
import { Grade } from './grade.entity'
import { GradeRecord } from './grade-record.entity'
import { GradeReview } from './grade-review.entity'
import { GradeAuditAlert } from './grade-audit-alert.entity'
import { User } from '../user/user.entity'
import { Class } from '../user/class.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Grade,
      GradeRecord,
      GradeReview,
      GradeAuditAlert,
      User,
      Class,
    ]),
  ],
  controllers: [GradesController],
  providers: [
    GradesService,
    GradeRecordsService,
    GradeAlertsService,
    GradePdfService,
  ],
  exports: [
    GradesService,
    GradeRecordsService,
    GradeAlertsService,
    GradePdfService,
  ],
})
export class GradesModule {}