import { Injectable, Logger } from '@nestjs/common';
import { PORTAL_MENUS, PortalMenuItem } from '../enums/portal-permissions.constants';

export interface MenuResponse {
  menus: PortalMenuItem[];
}

/**
 * 门户菜单服务
 * 根据用户角色返回可访问的菜单配置
 */
@Injectable()
export class PortalMenuService {
  private readonly logger = new Logger(PortalMenuService.name);

  /**
   * 根据用户角色和权限获取可用菜单
   *
   * @param role 用户角色 (student/parent)
   * @param permissions 用户拥有的权限列表
   * @returns 过滤后的菜单列表
   */
  getMenusForRole(role: string, permissions: string[]): MenuResponse {
    if (!permissions || permissions.length === 0) {
      return { menus: [] };
    }

    const permissionSet = new Set(permissions);

    const filteredMenus = PORTAL_MENUS.filter((menu) =>
      menu.requiredPermissions.some((perm) => permissionSet.has(perm)),
    );

    // 去重（同一 key 只保留一次）
    const seen = new Set<string>();
    const uniqueMenus = filteredMenus.filter((menu) => {
      if (seen.has(menu.key)) return false;
      seen.add(menu.key);
      return true;
    });

    return { menus: uniqueMenus };
  }
}
