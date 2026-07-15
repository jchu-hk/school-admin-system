import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 当前用户装饰器
 * 从 JWT 请求中提取用户信息
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: PortalUser) { ... }
 *
 * @Get('profile')
 * getProfile(@CurrentUser('id') userId: string) { ... }
 * ```
 */
export interface PortalUser {
  id: string;
  username: string;
  role: string;
  permissions: string[];
  [key: string]: any;
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): PortalUser | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as PortalUser;
    return data ? user?.[data] : user;
  },
);
