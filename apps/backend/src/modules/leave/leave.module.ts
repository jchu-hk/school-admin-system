import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { LeaveApplication } from './leave.entity';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';
import { User } from '../user/user.entity';
import { Class } from '../user/class.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveApplication, User, Class]),
    AuditModule,
    NotificationModule,
    UserModule,
  ],
  controllers: [LeaveController],
  providers: [LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}
