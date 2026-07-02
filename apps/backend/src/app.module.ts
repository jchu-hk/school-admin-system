import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CamelCaseNamingStrategy } from './database/camel-case.strategy';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './modules/health/health.module';
import { BackupModule } from './modules/backup/backup.module';
import { UserModule } from './modules/user/user.module';
import { User } from './modules/user/user.entity';
import { AuditModule } from './modules/audit/audit.module';
import { InquiryModule } from './modules/inquiry/inquiry.module';
import { LeaveModule } from './modules/leave/leave.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AbacModule } from './modules/abac/abac.module';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionApprovalModule } from './modules/permission-approval/permission-approval.module';
import { CourseModule } from './modules/course/course.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TuitionModule } from './modules/tuition/tuition.module';
import { FeeModule } from './modules/fee/fee.module';
import { ScholarshipModule } from './modules/scholarship/scholarship.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { LunchModule } from './modules/lunch/lunch.module';
import { GradesModule } from './modules/grades/grades.module';
import { AiModule } from './modules/ai/ai.module';
import { BusModule } from './modules/bus/bus.module';
import { StudentProfileModule } from './modules/student-profile/student-profile.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { DseModule } from './modules/dse/dse.module';
import { AssetModule } from './modules/asset/asset.module';
import { SchoolInfoModule } from './modules/school-info/school-info.module';
import { AddressBookModule } from './modules/address-book/address-book.module';
import { ExamModule } from './modules/exam/exam.module';
import { BudgetModule } from './modules/budget/budget.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { StudentModule } from './modules/student/student.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST') || 'localhost',
        port: parseInt(configService.get('DB_PORT') || '5432'),
        username: configService.get('DB_USER') || 'postgres',
        password: configService.get('DB_PASSWORD') || 'postgres',
        database: configService.get('DB_NAME') || 'school_admin',
        entities: [User],
        synchronize: false,
        autoLoadEntities: true,
        namingStrategy: new CamelCaseNamingStrategy(),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot({ cronJobs: true, intervals: true, timeouts: true }),
    HealthModule,
    BackupModule,
    UserModule,
    AuditModule,
    InquiryModule,
    LeaveModule,
    NotificationModule,
    AbacModule,
    AuthModule,
    PermissionModule,
    RoleModule,
    PermissionApprovalModule,
    CourseModule,
    SettingsModule,
    TuitionModule,
    FeeModule,
    ScholarshipModule,
    AttendanceModule,
    DashboardModule,
    LunchModule,
    GradesModule,
    AiModule,
    BusModule,
    StudentProfileModule,
    MetricsModule,
    DseModule,
    AssetModule,
    SchoolInfoModule,
    AddressBookModule,
    ExamModule,
    BudgetModule,
    RecruitmentModule,
    StudentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
