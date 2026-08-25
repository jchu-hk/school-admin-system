import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PettyCashConfig,
  PettyCashReimbursement,
  PettyCashTransaction,
} from './entities/petty-cash.entity';
import { PettyCashController } from './petty-cash.controller';
import { PettyCashService } from './petty-cash.service';
import { WitnessModule } from '../witness/witness.module';
import { AuditModule } from '../audit/audit.module';
import { User } from '../user/user.entity';
import { AcademicYear } from '../student/student.entity';

/**
 * 零用现金报销模块（F-FIN-002）
 * 复用 WitnessService（双人见证）与 AuditService（审计）
 * @see SPEC-SYSTEM-DESIGN §20.3 / §17.5
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PettyCashConfig,
      PettyCashReimbursement,
      PettyCashTransaction,
      User,
      AcademicYear,
    ]),
    WitnessModule,
    AuditModule,
  ],
  controllers: [PettyCashController],
  providers: [PettyCashService],
  exports: [PettyCashService],
})
export class PettyCashModule {}
