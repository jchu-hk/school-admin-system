import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './modules/health/health.module';
import { UserModule } from './modules/user/user.module';
import { User } from './modules/user/user.entity';
import { AuditModule } from './modules/audit/audit.module';
import { InquiryModule } from './modules/inquiry/inquiry.module';
import { LeaveModule } from './modules/leave/leave.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AbacModule } from './modules/abac/abac.module';
import { PermissionApprovalModule } from './modules/permission-approval/permission-approval.module';
import { CourseModule } from './modules/course/course.module';
import { SettingsModule } from './modules/settings/settings.module';

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
        synchronize: configService.get('NODE_ENV') !== 'production',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    UserModule,
    AuditModule,
    InquiryModule,
    LeaveModule,
    NotificationModule,
    AbacModule,
    PermissionApprovalModule,
    CourseModule,
    SettingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
