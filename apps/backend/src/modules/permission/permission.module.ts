import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionService } from './services/permission.service';
import { PermissionAuditService } from './services/permission-audit.service';
import { PermissionTemplatesService } from './services/permission-templates.service';
import { PermissionController } from './permission.controller';
import { Permission } from './entities/permission.entity';
import { PermissionAuditLog } from './entities/permission-audit-log.entity';
import { PermissionTemplate } from './entities/permission-template.entity';

@Module({
  imports: [
    forwardRef(() =>
      TypeOrmModule.forFeature([
        Permission,
        PermissionAuditLog,
        PermissionTemplate,
      ]),
    ),
  ],
  controllers: [PermissionController],
  providers: [
    PermissionService,
    PermissionAuditService,
    PermissionTemplatesService,
  ],
  exports: [
    PermissionService,
    PermissionAuditService,
    PermissionTemplatesService,
  ],
})
export class PermissionModule {}
