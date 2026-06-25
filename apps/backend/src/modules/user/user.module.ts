import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';
import { UserLifecycleService } from './user-lifecycle.service';
import { UserLifecycleScheduler } from './user-lifecycle.scheduler';
import { ParentStudentLink } from '../auth/entities/parent-student-link.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ParentStudentLink]),
    AuditModule,
    NotificationModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [UserController],
  providers: [UserService, UserLifecycleService, UserLifecycleScheduler],
  exports: [UserService, TypeOrmModule, UserLifecycleService],
})
export class UserModule {}
