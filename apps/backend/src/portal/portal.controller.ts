import {
  Controller,
  Get,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DataMaskingInterceptor } from './interceptors/data-masking.interceptor';
import { DataIsolationInterceptor } from './interceptors/data-isolation.interceptor';
import { PortalMenuService, MenuResponse } from './services/portal-menu.service';

/**
 * 门户控制器
 * 提供门户菜单等公共 API 端点
 */
@ApiTags('门户 (Portal)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(DataIsolationInterceptor, DataMaskingInterceptor)
@Controller('portal')
export class PortalController {
  constructor(private readonly menuService: PortalMenuService) {}

  /**
   * GET /portal/menus
   * 根据当前登录用户的角色获取门户菜单配置
   */
  @Get('menus')
  @ApiOperation({
    summary: '获取门户菜单',
    description: '根据当前用户角色和权限返回可访问的门户菜单列表',
  })
  getMenus(@Req() req: any): MenuResponse {
    const user = req.user;
    return this.menuService.getMenusForRole(
      user?.role,
      user?.permissions || [],
    );
  }
}
