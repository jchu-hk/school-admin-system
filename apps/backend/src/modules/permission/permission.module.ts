import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionService } from './services/permission.service';
import { Permission } from './entities/permission.entity';

@Module({
  imports: [forwardRef(() => TypeOrmModule.forFeature([Permission]))],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
