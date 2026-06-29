import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionTemplate } from '../entities/permission-template.entity';
import { Permission } from '../entities/permission.entity';

/**
 * 权限模板服务
 * 管理预设权限组合，方便快速分配给角色
 */
@Injectable()
export class PermissionTemplatesService {
  constructor(
    @InjectRepository(PermissionTemplate)
    private readonly templateRepository: Repository<PermissionTemplate>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * 获取所有权限模板
   */
  async findAll(): Promise<PermissionTemplate[]> {
    return this.templateRepository.find({
      relations: ['permissions'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 根据角色获取推荐的权限模板
   */
  async findByRole(role: string): Promise<PermissionTemplate[]> {
    return this.templateRepository.find({
      where: { targetRoles: role },
      relations: ['permissions'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 获取单个权限模板
   */
  async findOne(id: string): Promise<PermissionTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!template) {
      throw new NotFoundException(`权限模板 ${id} 不存在`);
    }
    return template;
  }

  /**
   * 根据编码获取权限模板
   */
  async findByCode(code: string): Promise<PermissionTemplate | null> {
    return this.templateRepository.findOne({
      where: { code },
      relations: ['permissions'],
    });
  }

  /**
   * 创建权限模板
   */
  async create(
    name: string,
    code: string,
    description?: string,
    targetRoles?: string[],
    permissionIds?: string[],
    isSystem?: boolean,
  ): Promise<PermissionTemplate> {
    // 检查编码是否已存在
    const existing = await this.findByCode(code);
    if (existing) {
      throw new BadRequestException(`权限模板编码 ${code} 已存在`);
    }

    // 获取权限列表
    let permissions: Permission[] = [];
    if (permissionIds && permissionIds.length > 0) {
      permissions = await this.permissionRepository.findByIds(permissionIds);
      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException('部分权限ID不存在');
      }
    }

    const template = this.templateRepository.create({
      name,
      code,
      description,
      targetRoles: targetRoles || [],
      permissions,
      isSystem: isSystem || false,
    });

    return this.templateRepository.save(template);
  }

  /**
   * 更新权限模板
   */
  async update(
    id: string,
    name?: string,
    description?: string,
    targetRoles?: string[],
    permissionIds?: string[],
  ): Promise<PermissionTemplate> {
    const template = await this.findOne(id);

    // 系统预设模板不能修改核心属性
    if (template.isSystem && name) {
      throw new BadRequestException('系统预设模板不能修改名称');
    }

    if (name) template.name = name;
    if (description) template.description = description;
    if (targetRoles) template.targetRoles = targetRoles;

    if (permissionIds) {
      const permissions =
        await this.permissionRepository.findByIds(permissionIds);
      template.permissions = permissions;
    }

    return this.templateRepository.save(template);
  }

  /**
   * 删除权限模板
   */
  async delete(id: string): Promise<void> {
    const template = await this.findOne(id);

    if (template.isSystem) {
      throw new BadRequestException('系统预设模板不能删除');
    }

    await this.templateRepository.remove(template);
  }

  /**
   * 初始化系统预设权限模板
   */
  async initSystemTemplates(): Promise<void> {
    const existing = await this.findAll();
    if (existing.length > 0) {
      return; // 已存在，不重复初始化
    }

    // 获取所有权限
    await this.permissionRepository.find();

    // 创建系统预设模板
    const systemTemplates = [
      {
        name: '教师基础权限',
        code: 'teacher_basic',
        description:
          '教师的基础操作权限，包括查看本班学生数据、录入成绩、考勤等',
        targetRoles: ['TEACHER', 'CLASS_TEACHER'],
        isSystem: true,
      },
      {
        name: '家长基础权限',
        code: 'parent_basic',
        description: '家长的基础操作权限，包括查看关联学生数据、提交请假申请等',
        targetRoles: ['PARENT'],
        isSystem: true,
      },
      {
        name: '校务主任全权限',
        code: 'director_full',
        description: '校务主任的完整权限，包括所有数据的增删改查和导出打印',
        targetRoles: ['SCHOOL_DIRECTOR'],
        isSystem: true,
      },
      {
        name: '财务人员权限',
        code: 'finance_staff',
        description:
          '财务人员的权限，仅在工作时间有效，包括学费管理、奖学金管理等',
        targetRoles: ['FINANCE_STAFF'],
        isSystem: true,
      },
      {
        name: '系统管理员全权限',
        code: 'admin_full',
        description: '系统管理员的完整权限，包括所有模块的管理',
        targetRoles: ['SYSTEM_ADMIN'],
        isSystem: true,
      },
      {
        name: '校务处员工权限',
        code: 'officer_basic',
        description: '校务处员工的权限，包括学生管理、请假审批、通知发送等',
        targetRoles: ['OFFICER'],
        isSystem: true,
      },
    ];

    for (const templateData of systemTemplates) {
      await this.create(
        templateData.name,
        templateData.code,
        templateData.description,
        templateData.targetRoles,
        [], // 权限ID暂时为空，后续根据实际权限数据填充
        templateData.isSystem,
      );
    }
  }
}
