import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';

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
    userId: string,
    permissionIds: string[],
  ): Promise<void> {
    console.log(
      `[PermissionService] Assigning permissions ${permissionIds} to user ${userId}`,
    );
  }

  async removePermissionsFromUser(
    userId: string,
    permissionIds: string[],
  ): Promise<void> {
    console.log(
      `[PermissionService] Removing permissions ${permissionIds} from user ${userId}`,
    );
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    return [];
  }
}
