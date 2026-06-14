import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleService, Role } from './services/role.service';

@Module({
  imports: [forwardRef(() => TypeOrmModule.forFeature([Role]))],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
