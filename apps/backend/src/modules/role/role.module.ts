import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './role.controller';
import { RoleService } from './services/role.service';
import { Role } from './entities/role.entity';

@Module({
  imports: [forwardRef(() => TypeOrmModule.forFeature([Role]))],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
