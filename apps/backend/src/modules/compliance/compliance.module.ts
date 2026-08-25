import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceCheck } from './entities/compliance-check.entity';
import { DataAccessRequest } from './entities/data-access-request.entity';
import { ConsentRecord } from './entities/consent-record.entity';
import { ComplianceController } from './controllers/compliance.controller';
import { DataAccessRequestController } from './controllers/dar.controller';
import { ConsentController } from './controllers/consent.controller';
import { ComplianceCheckService } from './services/compliance-check.service';
import { DataAccessRequestService } from './services/dar.service';
import { ConsentService } from './services/consent.service';
import { User } from '../user/user.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ComplianceCheck,
      DataAccessRequest,
      ConsentRecord,
      User,
    ]),
    AuditModule,
  ],
  controllers: [
    ComplianceController,
    DataAccessRequestController,
    ConsentController,
  ],
  providers: [
    ComplianceCheckService,
    DataAccessRequestService,
    ConsentService,
  ],
  exports: [
    ComplianceCheckService,
    DataAccessRequestService,
    ConsentService,
  ],
})
export class ComplianceModule {}
