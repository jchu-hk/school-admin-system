import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

/**
 * 权限要求装饰器
 * 用于在 Controller 方法上标注所需权限
 *
 * @example
 * ```typescript
 * @RequirePermission('profile:view:self')
 * @Get('profile')
 * getProfile() { ... }
 * ```
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
