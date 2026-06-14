import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export interface Role {
  id: string;
  name: string;
  isSystem: boolean;
  validUntil?: Date;
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;
}

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

  /**
   * Assign a role to a user with optional validity period
   */
  async assignRoleToUser(
    _userId: string,
    roleId: string,
    validUntil?: Date,
  ): Promise<void> {
    // Stub: In production, this would create user_role_assignment records
    console.log(
      `[RoleService] Assigning role ${roleId} to user ${_userId}${
        validUntil ? ` until ${validUntil.toISOString()}` : ''
      }`,
    );
  }

  /**
   * Remove a role from a user
   */
  async removeRoleFromUser(_userId: string, roleId: string): Promise<void> {
    // Stub: In production, this would delete user_role_assignment records
    console.log(`[RoleService] Removing role ${roleId} from user ${_userId}`);
  }

  /**
   * Check if a user has a specific role
   */
  async userHasRole(_userId: string, _roleName: string): Promise<boolean> {
    // Stub: In production, this would check the user_role_assignments table
    return false;
  }

  /**
   * Get all users with a specific role in a school
   */
  async getUsersByRole(_roleName: string, schoolId: string): Promise<string[]> {
    // Stub: In production, this would query user_role_assignments + users
    // For now, return empty array - real implementation would join tables
    console.log(
      `[RoleService] Getting users with role ${_roleName} in school ${schoolId}`,
    );
    return [];
  }
}
