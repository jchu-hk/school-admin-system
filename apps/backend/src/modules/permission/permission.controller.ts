/**
 * Permission Controller — 权限管理 API
 *
 * 提供以下管理端点:
 * - GET  /api/permissions/audit      — 权限审计日志查询
 * - GET  /api/permissions/audit/stats — 权限审计统计数据
 * - GET  /api/permissions/templates   — 权限模板列表
 * - POST /api/permissions/templates   — 创建权限模板
 * - GET  /api/permissions/templates/:id — 获取单个模板
 * - PUT  /api/permissions/templates/:id — 更新权限模板
 * - DELETE /api/permissions/templates/:id — 删除权限模板
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PermissionAuditService } from './services/permission-audit.service';
import { PermissionTemplatesService } from './services/permission-templates.service';
import { AbacGuard, AbacResource, AbacAction } from '../abac/abac.guard';

@ApiTags('权限管理')
@Controller('permissions')
@ApiBearerAuth()
export class PermissionController {
  private readonly logger = new Logger(PermissionController.name);

  constructor(
    private readonly auditService: PermissionAuditService,
    private readonly templatesService: PermissionTemplatesService,
  ) {}

  // ============================================================
  // 权限审计日志
  // ============================================================

  @Get('audit')
  @UseGuards(AbacGuard)
  @AbacResource('permission_audit')
  @AbacAction('read')
  @ApiOperation({ summary: '查询权限审计日志' })
  @ApiResponse({ status: 200, description: '审计日志列表' })
  @ApiQuery({ name: 'userId', required: false, description: '用户ID' })
  @ApiQuery({ name: 'userRole', required: false, description: '用户角色' })
  @ApiQuery({ name: 'action', required: false, description: '操作类型' })
  @ApiQuery({ name: 'resource', required: false, description: '资源类型' })
  @ApiQuery({ name: 'decision', required: false, enum: ['allow', 'deny'], description: '决策结果' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async queryAuditLogs(
    @Query('userId') userId?: string,
    @Query('userRole') userRole?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('decision') decision?: 'allow' | 'deny',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    this.logger.debug(`[Permission] 查询审计日志: userId=${userId}`);

    const query = {
      userId,
      userRole,
      action,
      resource,
      decision,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      pageSize: pageSize ? parseInt(String(pageSize), 10) : 20,
    };

    const result = await this.auditService.queryLogs(query);

    return {
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('audit/stats')
  @UseGuards(AbacGuard)
  @AbacResource('permission_audit')
  @AbacAction('read')
  @ApiOperation({ summary: '获取权限审计统计数据' })
  @ApiResponse({ status: 200, description: '审计统计' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
  async getAuditStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.debug(`[Permission] 获取审计统计`);

    const stats = await this.auditService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      ...stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('audit/user/:userId')
  @UseGuards(AbacGuard)
  @AbacResource('permission_audit')
  @AbacAction('read')
  @ApiOperation({ summary: '获取用户权限检查历史' })
  @ApiResponse({ status: 200, description: '用户权限历史' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiQuery({ name: 'limit', required: false, description: '限制数量' })
  async getUserPermissionHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    this.logger.debug(`[Permission] 查询用户 ${userId} 的权限历史`);

    const logs = await this.auditService.getUserPermissionHistory(
      userId,
      limit ? parseInt(String(limit), 10) : 50,
    );

    return {
      data: logs,
      count: logs.length,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================
  // 权限模板管理
  // ============================================================

  @Get('templates')
  @UseGuards(AbacGuard)
  @AbacResource('permission_template')
  @AbacAction('read')
  @ApiOperation({ summary: '获取权限模板列表' })
  @ApiResponse({ status: 200, description: '权限模板列表' })
  @ApiQuery({ name: 'role', required: false, description: '按角色筛选' })
  async getTemplates(@Query('role') role?: string) {
    this.logger.debug(`[Permission] 获取权限模板列表`);

    const templates = role
      ? await this.templatesService.findByRole(role)
      : await this.templatesService.findAll();

    return {
      data: templates,
      count: templates.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('templates/:id')
  @UseGuards(AbacGuard)
  @AbacResource('permission_template')
  @AbacAction('read')
  @ApiOperation({ summary: '获取单个权限模板' })
  @ApiResponse({ status: 200, description: '权限模板详情' })
  @ApiParam({ name: 'id', description: '模板ID' })
  async getTemplate(@Param('id') id: string) {
    this.logger.debug(`[Permission] 获取权限模板 ${id}`);
    return this.templatesService.findOne(id);
  }

  @Post('templates')
  @UseGuards(AbacGuard)
  @AbacResource('permission_template')
  @AbacAction('create')
  @ApiOperation({ summary: '创建权限模板' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createTemplate(
    @Body()
    body: {
      name: string;
      code: string;
      description?: string;
      targetRoles?: string[];
      permissionIds?: string[];
    },
  ) {
    this.logger.debug(`[Permission] 创建权限模板: ${body.code}`);

    const template = await this.templatesService.create(
      body.name,
      body.code,
      body.description,
      body.targetRoles,
      body.permissionIds,
    );

    return {
      data: template,
      message: '权限模板创建成功',
      timestamp: new Date().toISOString(),
    };
  }

  @Put('templates/:id')
  @UseGuards(AbacGuard)
  @AbacResource('permission_template')
  @AbacAction('update')
  @ApiOperation({ summary: '更新权限模板' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiParam({ name: 'id', description: '模板ID' })
  async updateTemplate(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      targetRoles?: string[];
      permissionIds?: string[];
    },
  ) {
    this.logger.debug(`[Permission] 更新权限模板 ${id}`);

    const template = await this.templatesService.update(
      id,
      body.name,
      body.description,
      body.targetRoles,
      body.permissionIds,
    );

    return {
      data: template,
      message: '权限模板更新成功',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('templates/:id')
  @UseGuards(AbacGuard)
  @AbacResource('permission_template')
  @AbacAction('delete')
  @ApiOperation({ summary: '删除权限模板' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiParam({ name: 'id', description: '模板ID' })
  async deleteTemplate(@Param('id') id: string) {
    this.logger.debug(`[Permission] 删除权限模板 ${id}`);

    await this.templatesService.delete(id);

    return {
      message: '权限模板删除成功',
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================
  // 权限模板初始化
  // ============================================================

  @Post('templates/init')
  @UseGuards(AbacGuard)
  @AbacResource('permission_template')
  @AbacAction('create')
  @ApiOperation({ summary: '初始化系统预设权限模板' })
  @ApiResponse({ status: 200, description: '初始化成功' })
  async initSystemTemplates() {
    this.logger.debug(`[Permission] 初始化系统预设权限模板`);

    await this.templatesService.initSystemTemplates();

    return {
      message: '系统预设权限模板初始化完成',
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================
  // 权限配置管理
  // ============================================================

  @Get('config')
  @UseGuards(AbacGuard)
  @AbacResource('permission_config')
  @AbacAction('read')
  @ApiOperation({ summary: '获取权限配置信息' })
  @ApiResponse({ status: 200, description: '权限配置' })
  async getPermissionConfig() {
    this.logger.debug(`[Permission] 获取权限配置`);

    // 返回当前系统的权限配置概览
    const templates = await this.templatesService.findAll();

    return {
      templates,
      timestamp: new Date().toISOString(),
    };
  }
}