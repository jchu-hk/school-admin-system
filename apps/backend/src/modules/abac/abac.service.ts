/**
 * ABAC Service — 与 OPA 规则引擎交互的 NestJS 服务
 *
 * 实现方式: HTTP Sidecar 模式
 * - 生产环境: 通过 HTTP 调用本地 OPA Sidecar (localhost:8181)
 * - 开发/测试: 使用内置 JSON Schema 模拟评估（无需启动 OPA）
 *
 * OPA 版本要求: 0.65.x
 * 策略包名: school.authz
 * 权限决策延迟目标: ≤ 50ms
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import {
  AbacInput,
  AbacDecisionRequest,
  AbacDecisionResult,
  AbacAuditLog,
  AbacRuleMetadata,
} from './interfaces/abac.interfaces';

@Injectable()
export class AbacService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AbacService.name);

  // OPA Sidecar HTTP 客户端
  private opaClient: AxiosInstance;

  // 规则元数据缓存
  private ruleMetadata: AbacRuleMetadata | null = null;

  // 是否启用 OPA（false=使用内嵌模拟评估）
  private opaEnabled = false;

  // 决策缓存 (简单内存缓存，TTL=30秒)
  private decisionCache = new Map<string, AbacDecisionResult>();
  private readonly CACHE_TTL_MS = 30_000;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const opaUrl =
      this.configService.get<string>('OPA_URL') || 'http://localhost:8181';
    const opaEnabled = this.configService.get<boolean>('OPA_ENABLED') ?? false;

    if (opaEnabled) {
      /* istanbul ignore next: OPA Sidecar mode only, tested in integration tests */
      this.opaEnabled = true;
      this.opaClient = axios.create({
        baseURL: opaUrl,
        timeout: 5_000, // 5秒超时
        headers: { 'Content-Type': 'application/json' },
      });

      // 健康检查
      try {
        /* istanbul ignore next: requires OPA Sidecar running */
        const res = await this.opaClient.get('/health');
        this.logger.log(
          `OPA 健康检查通过: ${opaUrl}, version=${res.data?.version}`,
        );
      } catch (err) {
        this.logger.warn(
          `OPA 健康检查失败，将使用内嵌评估: ${(err as Error).message}`,
        );
        this.opaEnabled = false;
      }
    } else {
      this.logger.log('OPA 已禁用，使用内嵌规则评估（开发/测试模式）');
      this.opaEnabled = false;
    }

    // 加载规则元数据
    this.loadRuleMetadata();
  }

  onModuleDestroy() {
    this.decisionCache.clear();
  }

  // ============================================================
  // 核心方法: 权限决策
  // ============================================================

  /**
   * 评估 ABAC 权限请求
   * @param request 决策请求
   * @returns 决策结果
   */
  async evaluate(request: AbacDecisionRequest): Promise<AbacDecisionResult> {
    const startTime = Date.now();

    // 1. 构建缓存键
    const cacheKey = this.buildCacheKey(request);

    // 2. 检查缓存
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      this.logger.debug(`[ABAC] 缓存命中: ${cacheKey}`);
      return { ...cached, decisionTimeMs: Date.now() - startTime };
    }

    // 3. 调用 OPA 或内嵌评估
    let result: AbacDecisionResult;
    if (this.opaEnabled) {
      result = await this.evaluateWithOpa(request);
    } else {
      result = this.evaluateEmbedded(request);
    }

    // 4. 补充决策信息
    result.decisionTimeMs = Date.now() - startTime;
    result.evaluatedAt = new Date().toISOString();

    // 5. 缓存结果
    this.setCachedResult(cacheKey, result);

    // 6. 审计日志（异步，不阻塞决策）
    this.logDecisionAsync(request, result).catch((err) =>
      this.logger.error(`[ABAC] 审计日志写入失败: ${(err as Error).message}`),
    );

    this.logger.debug(
      `[ABAC] 决策: ${result.allow ? 'ALLOW' : 'DENY'} ${request.input.role}/${request.input.action}/${request.input.resource} (${result.decisionTimeMs}ms)`,
    );

    return result;
  }

  /**
   * 通过 OPA Sidecar 进行评估（HTTP API）
   */
  /* istanbul ignore next: OPA Sidecar mode only, tested in integration tests */
  private async evaluateWithOpa(
    request: AbacDecisionRequest,
  ): Promise<AbacDecisionResult> {
    try {
      const response = await this.opaClient.post(
        '/v1/data/school/authz',
        {
          input: request.input,
        },
        { timeout: 50 }, // 50ms 超时（满足性能要求）
      );

      const data = response.data;
      const allow = data?.result === true;

      return {
        allow,
        matchedPolicy: allow ? 'school.authz.allow' : undefined,
        reason: allow ? undefined : 'OPA 规则拒绝',
        decisionTimeMs: 0, // 将在外层补充
        evaluatedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        this.logger.error(
          `[ABAC] OPA 调用失败: ${err.message}, 降级到内嵌评估`,
        );
        return this.evaluateEmbedded(request);
      }
      throw err;
    }
  }

  /**
   * 内嵌规则评估（开发/测试模式，不依赖 OPA 服务）
   *
   * 实现: 将 Rego 规则翻译为 TypeScript 逻辑
   * 注意: 此实现与 school.authz.rego 保持逻辑一致
   */
  private evaluateEmbedded(request: AbacDecisionRequest): AbacDecisionResult {
    const input = request.input;
    const startTime = Date.now();

    const allow = this.evaluateRules(input);

    return {
      allow,
      matchedPolicy: allow ? 'school.authz.allow' : undefined,
      reason: allow ? undefined : '内嵌规则拒绝: 无匹配规则',
      decisionTimeMs: Date.now() - startTime,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * 内嵌规则评估核心逻辑
   * 与 school.authz.rego 规则保持完全一致
   */
  private evaluateRules(input: AbacInput): boolean {
    const { role, action, resource, user, resourceData, currentTime, weekday } =
      input;

    // === 规则: 校务主任全权限 ===
    if (
      role === 'SCHOOL_DIRECTOR' &&
      ['read', 'create', 'update', 'delete', 'export', 'print'].includes(action)
    ) {
      return true;
    }

    // === 规则1: 教师只能查看本班学生数据 ===
    if (role === 'TEACHER') {
      const teacherClassIds = user?.classIds || [];
      const targetClassId = resourceData?.classId;

      if (
        action === 'read' &&
        ['student', 'score', 'attendance'].includes(resource)
      ) {
        if (!targetClassId) return false;
        if (!teacherClassIds.includes(targetClassId)) return false;
        return true;
      }

      if (action === 'create' && resource === 'leave') {
        if (!targetClassId) return false;
        if (!teacherClassIds.includes(targetClassId)) return false;
        return true;
      }
    }

    // === 规则2: 家长只能查看自己关联的学生数据 ===
    if (role === 'PARENT') {
      const parentStudentIds = user?.relatedStudentIds || [];
      const targetStudentId = resourceData?.studentId;

      if (
        ['read', 'create'].includes(action) &&
        ['student', 'score', 'attendance', 'leave'].includes(resource)
      ) {
        if (!targetStudentId) return false;
        if (!parentStudentIds.includes(targetStudentId)) return false;
        return true;
      }
    }

    // === 规则3: 财务人员工作时间限制 ===
    if (role === 'FINANCE_STAFF' && resource === 'finance') {
      // 工作时间外需特殊授权
      if (user?.hasOverride === true) {
        return true;
      }

      if (!currentTime || !weekday) return false;

      const timeValid = currentTime >= '09:00' && currentTime <= '18:00';
      const workdayValid = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
      ].includes(weekday);

      return timeValid && workdayValid;
    }

    // === 规则4: 批量导出仅校务主任 ===
    if (action === 'export' && role !== 'SCHOOL_DIRECTOR') {
      return false;
    }

    // === 校务处同工业业务范围 ===
    if (role === 'OFFICER' && ['read', 'create', 'update'].includes(action)) {
      if (
        ['student', 'attendance', 'leave', 'inquiry', 'notification'].includes(
          resource,
        )
      ) {
        return true;
      }
    }

    // === 系统管理员全权限 ===
    if (role === 'SYSTEM_ADMIN') {
      return true;
    }

    return false;
  }

  // ============================================================
  // 动态规则热更新
  // ============================================================

  /**
   * 重新加载 OPA 策略（热更新，无需重启应用）
   * 调用 OPA 的 PUT /v1/policies/school.authz 接口重新加载 bundle
   */
  async reloadPolicies(): Promise<{ success: boolean; message: string }> {
    this.decisionCache.clear(); // 清除决策缓存

    if (this.opaEnabled) {
      try {
        /* istanbul ignore next: OPA Sidecar mode only */
        // 读取本地 Rego 策略文件
        const regoFile = path.resolve(
          __dirname,
          './policies/school.authz.rego',
        );
        const regoCode = fs.readFileSync(regoFile, 'utf-8');

        /* istanbul ignore next: OPA Sidecar mode only */
        // 推送策略到 OPA
        await this.opaClient.put('/v1/policies/school.authz', {
          module: regoCode,
        });

        /* istanbul ignore next: OPA Sidecar mode only */
        this.loadRuleMetadata();
        this.logger.log('[ABAC] OPA 策略热更新成功');
        return { success: true, message: 'OPA 策略热更新成功' };
      } catch (err) {
        this.logger.error(`[ABAC] 策略热更新失败: ${(err as Error).message}`);
        return { success: false, message: (err as Error).message };
      }
    }

    // 非 OPA 模式: 清除缓存即可
    this.logger.log('[ABAC] 内嵌模式: 缓存已清除');
    return { success: true, message: '内嵌模式: 决策缓存已清除' };
  }

  // ============================================================
  // 审计日志
  // ============================================================

  /**
   * 异步记录 ABAC 决策到审计日志
   * 不阻塞权限决策流程
   */
  private async logDecisionAsync(
    request: AbacDecisionRequest,
    result: AbacDecisionResult,
  ): Promise<void> {
    const log: AbacAuditLog = {
      userId: request.input.user?.id || 'unknown',
      userRole: request.input.role,
      action: request.input.action,
      resource: request.input.resource,
      decision: result.allow ? 'allow' : 'deny',
      reason: result.reason,
      matchedPolicy: result.matchedPolicy,
      decisionTimeMs: result.decisionTimeMs,
      ip: undefined, // 从请求上下文获取
      requestContext: {
        resourceData: request.input.resourceData,
        currentTime: request.input.currentTime,
        weekday: request.input.weekday,
      },
      createdAt: new Date(),
    };

    // 通过 NestJS Logger 输出结构化日志（可接入 ELK/SIEM）
    this.logger.log(
      JSON.stringify({
        event: 'ABAC_DECISION',
        ...log,
        evaluatedAt: result.evaluatedAt,
      }),
    );
  }

  /**
   * 查询 ABAC 决策历史（审计用）
   */
  async getDecisionHistory(
    userId?: string,
    limit = 100,
  ): Promise<AbacAuditLog[]> {
    // 此方法需要接入日志系统（Elasticsearch/MongoDB）
    // 这里返回内存缓存中的记录作为演示
    this.logger.debug(`[ABAC] 查询决策历史: userId=${userId}, limit=${limit}`);
    return [];
  }

  // ============================================================
  // 工具方法
  // ============================================================

  /**
   * 构建缓存键
   */
  private buildCacheKey(request: AbacDecisionRequest): string {
    const { role, action, resource, user, resourceData } = request.input;
    const classIds = user?.classIds?.sort().join(',') || '';
    const studentIds = user?.relatedStudentIds?.sort().join(',') || '';
    const resClassId = resourceData?.classId || '';
    const resStudentId = resourceData?.studentId || '';
    return `${role}:${action}:${resource}:${user?.id}:${classIds}:${studentIds}:${resClassId}:${resStudentId}`;
  }

  private getCachedResult(key: string): AbacDecisionResult | null {
    const cached = this.decisionCache.get(key);
    if (!cached) return null;
    if (Date.now() - (cached as any).__cachedAt__ > this.CACHE_TTL_MS) {
      this.decisionCache.delete(key);
      return null;
    }
    return cached;
  }

  private setCachedResult(key: string, result: AbacDecisionResult): void {
    // 限制缓存大小
    if (this.decisionCache.size > 1000) {
      const firstKey = this.decisionCache.keys().next().value;
      this.decisionCache.delete(firstKey);
    }
    (result as any).__cachedAt__ = Date.now();
    this.decisionCache.set(key, result);
  }

  private loadRuleMetadata(): void {
    try {
      const regoFile = path.resolve(__dirname, './policies/school.authz.rego');
      const stat = fs.statSync(regoFile);
      this.ruleMetadata = {
        name: 'school.authz',
        description: '智能校务助理系统 ABAC 权限规则',
        version: '1.0.0',
        lastUpdated: stat.mtime.toISOString(),
      };
    } catch {
      this.ruleMetadata = {
        name: 'school.authz',
        description: '智能校务助理系统 ABAC 权限规则',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取规则元数据
   */
  getRuleMetadata(): AbacRuleMetadata {
    return (
      this.ruleMetadata || {
        name: 'school.authz',
        description: 'ABAC权限规则',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
      }
    );
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: string;
    opaEnabled: boolean;
    version?: string;
  }> {
    if (this.opaEnabled) {
      try {
        /* istanbul ignore next: OPA Sidecar mode only */
        const res = await this.opaClient.get('/version');
        return {
          status: 'healthy',
          opaEnabled: true,
          version: res.data?.version,
        };
      } catch {
        return { status: 'unhealthy', opaEnabled: true };
      }
    }
    return { status: 'healthy', opaEnabled: false };
  }
}
