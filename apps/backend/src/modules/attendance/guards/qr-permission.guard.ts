import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../user/user.entity';

/** 扫码权限角色 */
const SCAN_PERMITTED_ROLES = [
  UserRole.TEACHER,
  UserRole.SCHOOL_STAFF,
  UserRole.SCHOOL_DIRECTOR,
  UserRole.SYSTEM_ADMIN,
];

@Injectable()
export class QrScanPermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('未登录');
    }

    if (!SCAN_PERMITTED_ROLES.includes(user.role)) {
      throw new ForbiddenException('无扫码签到权限，仅教职工可操作');
    }

    return true;
  }
}
