import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { SspaBatch } from './entities/sspa-batch.entity';
import { SspaApplication } from './entities/sspa-application.entity';
import { SspaScore } from './entities/sspa-score.entity';
import { JupasApplication } from './entities/jupas-application.entity';
import { JupasChoice } from './entities/jupas-choice.entity';
import { JupasReferenceLetter } from './entities/jupas-reference-letter.entity';
import { JupasAppeal } from './entities/jupas-appeal.entity';
import { SspaBatchService } from './sspa-batch.service';
import { SspaApplicationService } from './sspa-application.service';
import { JupasService } from './jupas.service';
import { SspaController } from './sspa.controller';
import { JupasController } from './jupas.controller';

/**
 * 收生管理 - SSPA 中一自行分配学位（F-ADM-001）+ JUPAS 大学联招管理（F-ADM-002）
 * 学生入学收生（admissions）域，独立于教师招聘（recruitment），两者不相交。
 * @see SPEC-SYSTEM-DESIGN §19.5 / §19.6 / API-DESIGN §10.4 / §10.5 / DB-SCHEMA §19
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SspaBatch,
      SspaApplication,
      SspaScore,
      JupasApplication,
      JupasChoice,
      JupasReferenceLetter,
      JupasAppeal,
    ]),
    AuditModule,
  ],
  controllers: [SspaController, JupasController],
  providers: [SspaBatchService, SspaApplicationService, JupasService],
  exports: [SspaBatchService, SspaApplicationService, JupasService],
})
export class AdmissionsModule {}
