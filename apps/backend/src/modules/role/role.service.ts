import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async assignRoleToUser(
    userId: string,
    roleId: string,
    validUntil?: Date,
  ): Promise<void> {
    console.log(
      `[RoleService] Assigning role ${roleId} to user ${userId}${
        validUntil ? ` until ${validUntil.toISOString()}` : ''
      }`,
    );
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    console.log(
      `[RoleService] Removing role ${roleId} from user ${userId}`,
    );
  }

  async userHasRole(userId: string, roleName: string): Promise<boolean> {
    return false;
  }

  async getUsersByRole(
    roleName: string,
    schoolId: string,
  ): Promise<string[]> {
    console.log(
      `[RoleService] Getting users with role ${roleName} in school ${schoolId}`,
    );
    return [];
  }
}