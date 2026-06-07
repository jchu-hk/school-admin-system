import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionService } from './services/permission.service';

@Module({
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
