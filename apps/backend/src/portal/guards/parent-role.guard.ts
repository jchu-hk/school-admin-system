import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { ROLE_PERMISSION_MAP } from '../enums/portal-permissions.constants';
import { PortalAuditLog, PortalAuditEventType } from '../entities/portal-audit-log.entity';

/**
 * 家长角色守卫
 * 校验请求用户是否拥有 @RequirePermission 指定的权限
 *
 * 校验流程:
 * 1. 从 JWT 请求中获取用户 ID + 角色
 * 2. 获取方法上 @RequirePermission 标注的权限列表
 * 3. 根据角色从 ROLE_PERMISSION_MAP 检查是否有对应权限
 * 4. 允许/拒绝 + 审计日志记录
 *
 * 与 role_permissions 表集成: 优先查数据库实际权限配置,
 * 无数据库配置时 fallback 到 ROLE_PERMISSION_MAP 静态配置
 */
@Injectable()
export class ParentRoleGuard implements CanActivate {
  private readonly logger = new Logger(ParentRoleGuard.name);

  constructor(
    private reflector: Reflector,
    @InjectRepository(PortalAuditLog)
    private auditLogRepo: Repository<PortalAuditLog>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 没有标注权限要求 → 放行
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 未认证 → 拒绝
    if (!user || !user.role) {
      throw new ForbiddenException('未认证用户');
    }

    const userRole = user.role as string;

    // 非 parent 角色 → 拒绝
    if (userRole !== 'parent') {
      await this.logUnauthorizedAccess(user, request, requiredPermissions);
      throw new ForbiddenException('仅允许家长角色访问');
    }

    // 获取该角色拥有的所有权限（静态映射 + 数据库配置）
    const rolePermissions = this.getRolePermissions(userRole, user.permissions);

    // 检查是否拥有所有要求的权限
    const hasAllPermissions = requiredPermissions.every((perm) =>
      rolePermissions.includes(perm),
    );

    if (!hasAllPermissions) {
      await this.logUnauthorizedAccess(user, request, requiredPermissions);
      throw new ForbiddenException('权限不足');
    }

    return true;
  }

  /**
   * 获取角色拥有的权限列表
   * 优先使用 JWT payload 中的 permissions（从 role_permissions 表加载）
   * fallback 到静态 ROLE_PERMISSION_MAP
   */
  private getRolePermissions(
    role: string,
    jwtPermissions?: string[],
  ): string[] {
    if (jwtPermissions && jwtPermissions.length > 0) {
      return jwtPermissions;
    }
    return ROLE_PERMISSION_MAP[role] || [];
  }

  /**
   * 记录未授权访问审计日志
   */
  private async logUnauthorizedAccess(
    user: any,
    request: any,
    requiredPermissions: string[],
  ): Promise<void> {
    try {
      const auditLog = this.auditLogRepo.create({
        eventType: PortalAuditEventType.UNAUTHORIZED_ACCESS,
        actorId: user?.id,
        actorRole: user?.role || 'unknown',
        targetType: 'permission',
        action: 'ACCESS_DENIED',
        changes: {
          requiredPermissions,
          userPermissions: user?.permissions || [],
          method: request.method,
          path: request.url,
        },
        ipAddress: request.ip,
        userAgent: request.headers?.['user-agent'],
        result: 'DENIED',
      });
      await this.auditLogRepo.save(auditLog);
    } catch (err) {
      // 审计日志失败不影响主流程
      this.logger.warn('审计日志写入失败', err?.message);
    }
  }
}
