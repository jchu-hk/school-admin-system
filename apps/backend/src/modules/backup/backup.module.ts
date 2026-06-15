import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { BackupScheduler } from './backup.scheduler';
import { BackupRecord } from './backup.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BackupRecord]), ScheduleModule],
  controllers: [BackupController],
  providers: [BackupService, BackupScheduler],
  exports: [BackupService],
})
export class BackupModule {}
