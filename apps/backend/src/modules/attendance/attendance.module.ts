import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { QrAttendanceController } from './controllers/qr-attendance.controller';
import { QrGenerationService } from './services/qr-generation.service';
import { QrScanService } from './services/qr-scan.service';
import { QrScanPermissionGuard } from './guards/qr-permission.guard';
import { Attendance } from './attendance.entity';
import { QrCode } from './entities/qr-code.entity';
import { AttendanceQrLog } from './entities/attendance-qr-log.entity';
import { OfflineSyncBuffer } from './entities/offline-sync-buffer.entity';
import { AttendanceDailyReport } from './entities/attendance-daily-report.entity';
import { User } from '../user/user.entity';
import { Class } from '../user/class.entity';
import { Student } from '../student/student.entity';
import { NotificationModule } from '../notification/notification.module';
import { SyncService } from './services/sync.service';
import { DailyReportService } from './services/daily-report.service';
import { SyncController } from './controllers/sync.controller';
import { ReportController } from './controllers/report.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attendance,
      QrCode,
      AttendanceQrLog,
      OfflineSyncBuffer,
      AttendanceDailyReport,
      User,
      Class,
      Student,
    ]),
    NotificationModule,
  ],
  controllers: [
    AttendanceController,
    QrAttendanceController,
    SyncController,
    ReportController,
  ],
  providers: [
    AttendanceService,
    QrGenerationService,
    QrScanService,
    QrScanPermissionGuard,
    SyncService,
    DailyReportService,
  ],
  exports: [
    AttendanceService,
    QrGenerationService,
    QrScanService,
    SyncService,
    DailyReportService,
  ],
})
export class AttendanceModule {}
