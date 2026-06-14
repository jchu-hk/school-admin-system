import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionApprovalController } from './controllers/permission-approval.controller';
import { PermissionApprovalService } from './services/permission-approval.service';
import {
  PermissionApprovalRequest,
  ApprovalStep,
} from './entities/permission-approval.entity';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';
import { PermissionService } from '../permission/permission.service';
import { Permission } from '../permission/entities/permission.entity';
import { RoleService } from '../role/role.service';
import { Role } from '../role/entities/role.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [
    AuditModule,
    NotificationModule,
    TypeOrmModule.forFeature([
      PermissionApprovalRequest,
      ApprovalStep,
      Permission,
      Role,
      User,
    ]),
  ],
  controllers: [PermissionApprovalController],
  providers: [PermissionApprovalService, PermissionService, RoleService],
  exports: [PermissionApprovalService],
})
export class PermissionApprovalModule {}
