import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalController } from './portal.controller';
import { ParentStudentLink } from './entities/parent-student-link.entity';
import { PortalAuditLog } from './entities/portal-audit-log.entity';
import { StudentRoleGuard } from './guards/student-role.guard';
import { ParentRoleGuard } from './guards/parent-role.guard';
import { DataIsolationInterceptor } from './interceptors/data-isolation.interceptor';
import { DataMaskingInterceptor } from './interceptors/data-masking.interceptor';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { PortalAuditService } from './services/portal-audit.service';
import { AuditLogService } from './services/audit-log.service';
import { DataMaskingService } from './services/data-masking.service';
import { PortalMenuService } from './services/portal-menu.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ParentStudentLink, PortalAuditLog]),
  ],
  controllers: [PortalController],
  providers: [
    // Guards
    StudentRoleGuard,
    ParentRoleGuard,
    // Interceptors
    DataIsolationInterceptor,
    DataMaskingInterceptor,
    AuditLogInterceptor,
    // Services
    PortalAuditService,
    AuditLogService,
    DataMaskingService,
    PortalMenuService,
  ],
  exports: [
    // Guards for use by other modules
    StudentRoleGuard,
    ParentRoleGuard,
    // Interceptors for use by other modules
    DataIsolationInterceptor,
    DataMaskingInterceptor,
    AuditLogInterceptor,
    // Services
    PortalAuditService,
    AuditLogService,
    DataMaskingService,
    PortalMenuService,
  ],
})
export class PortalModule {}
