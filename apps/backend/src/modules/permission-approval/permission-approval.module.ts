import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionApprovalController } from './permission-approval.controller';
import { PermissionApprovalService } from './services/permission-approval.service';
import {
  PermissionApprovalRequest,
  ApprovalStep,
} from './entities/permission-approval.entity';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';
import { PermissionModule } from '../permission/permission.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PermissionApprovalRequest, ApprovalStep]),
    AuditModule,
    NotificationModule,
    PermissionModule,
    RoleModule,
  ],
  controllers: [PermissionApprovalController],
  providers: [PermissionApprovalService],
  exports: [PermissionApprovalService],
})
export class PermissionApprovalModule {}
