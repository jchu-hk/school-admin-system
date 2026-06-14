import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findOne(id: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({ where: { id } });
  }

  async findByCodes(codes: string[]): Promise<Permission[]> {
    return this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.code IN (:...codes)', { codes })
      .getMany();
  }

  async assignPermissionsToUser(
    _userId: string,
    permissionIds: string[],
  ): Promise<void> {
    // Stub: In production, this would create user_permission records
    // This is a placeholder for the permission-approval module integration
    console.log(
      `[PermissionService] Assigning permissions ${permissionIds} to user ${_userId}`,
    );
  }

  async removePermissionsFromUser(
    _userId: string,
    permissionIds: string[],
  ): Promise<void> {
    // Stub: In production, this would remove user_permission records
    console.log(
      `[PermissionService] Removing permissions ${permissionIds} from user ${_userId}`,
    );
  }

  async getUserPermissions(_userId: string): Promise<Permission[]> {
    // Stub: In production, this would query the user_permissions join table
    return [];
  }
}
