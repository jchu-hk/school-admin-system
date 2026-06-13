/**
 * ABAC Controller — 权限规则管理 API
 *
 * 提供以下管理端点:
 * - GET  /abac/health       — OPA 健康检查
 * - GET  /abac/policies     — 获取策略元数据
 * - POST /abac/policies/reload — 热更新策略
 * - POST /abac/evaluate      — 手动触发权限评估（调试用）
 * - GET  /abac/audit        — 查询决策历史
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AbacService } from './abac.service';
import { AbacGuard, AbacResource, AbacAction } from './abac.guard';
import {
  AbacInput,
  AbacDecisionRequest,
  AbacDecisionResult,
  AbacRuleMetadata,
} from './interfaces/abac.interfaces';

@ApiTags('ABAC 权限管理')
@Controller('abac')
@ApiBearerAuth()
export class AbacController {
  private readonly logger = new Logger(AbacController.name);

  constructor(private readonly abacService: AbacService) {}

  // ============================================================
  // 健康检查
  // ============================================================

  @Get('health')
  @ApiOperation({ summary: 'OPA 健康检查' })
  @ApiResponse({ status: 200, description: '健康状态' })
  async healthCheck() {
    const result = await this.abacService.healthCheck();
    return {
      status: 'ok',
      opaEnabled: result.opaEnabled,
      version: result.version,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================
  // 策略管理
  // ============================================================

  @Get('policies')
  @UseGuards(AbacGuard)
  @AbacResource('abac_policy')
  @AbacAction('read')
  @ApiOperation({ summary: '获取策略元数据' })
  @ApiResponse({ status: 200, description: '策略元数据' })
  async getPolicies(): Promise<AbacRuleMetadata> {
    return this.abacService.getRuleMetadata();
  }

  @Post('policies/reload')
  @UseGuards(AbacGuard)
  @AbacResource('abac_policy')
  @AbacAction('update')
  @ApiOperation({ summary: '热更新策略（无需重启应用）' })
  @ApiResponse({ status: 200, description: '更新结果' })
  async reloadPolicies() {
    const result = await this.abacService.reloadPolicies();
    return {
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================
  // 手动评估（调试/测试用）
  // ============================================================

  @Post('evaluate')
  @ApiOperation({ summary: '手动触发权限评估（调试用）' })
  @ApiResponse({ status: 200, description: '决策结果' })
  async evaluate(
    @Body() request: AbacDecisionRequest,
  ): Promise<AbacDecisionResult> {
    this.logger.debug(`[ABAC] 手动评估请求: ${JSON.stringify(request.input)}`);
    return this.abacService.evaluate(request);
  }

  // ============================================================
  // 审计日志查询
  // ============================================================

  @Get('audit')
  @UseGuards(AbacGuard)
  @AbacResource('abac_audit')
  @AbacAction('read')
  @ApiOperation({ summary: '查询 ABAC 决策历史' })
  @ApiResponse({ status: 200, description: '决策历史记录' })
  async getAuditHistory(
    @Query('userId') userId?: string,
    @Query('limit') limit = '100',
  ) {
    const logs = await this.abacService.getDecisionHistory(
      userId,
      parseInt(limit, 10),
    );
    return {
      logs,
      count: logs.length,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================
  // 决策测试接口（仅开发环境）
  // ============================================================

  @Post('test')
  @ApiOperation({ summary: 'ABAC 决策测试（开发环境）' })
  @ApiResponse({ status: 200, description: '测试决策结果' })
  async testDecision(@Body() input: AbacInput): Promise<AbacDecisionResult> {
    this.logger.debug(`[ABAC] 测试评估: ${JSON.stringify(input)}`);
    return this.abacService.evaluate({ input });
  }
}
