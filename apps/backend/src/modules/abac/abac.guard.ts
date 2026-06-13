/**
 * ABAC Guard — NestJS 守卫，拦截请求并调用 OPA 进行权限判断
 *
 * 功能:
 * 1. 从请求上下文提取用户信息和资源数据
 * 2. 构建 ABAC 输入上下文（包含角色、用户属性、操作类型、资源）
 * 3. 调用 AbacService.evaluate() 进行权限决策
 * 4. 决策结果: allow=继续处理, deny=返回 403 Forbidden
 *
 * 与 RBAC 的集成:
 * - 先 RBAC 守卫初筛（角色级别权限）
 * - 再 ABAC 守卫细筛（属性级别权限）
 * - 两层都通过才允许访问
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbacService } from './abac.service';
import { AbacInput } from './interfaces/abac.interfaces';

// ============================================================
// 自定义装饰器元数据键
// ============================================================

export const ABAC_RESOURCE_KEY = 'abac_resource';
export const ABAC_ACTION_KEY = 'abac_action';
export const ABAC_SKIP_KEY = 'abac_skip';
export const ABAC_RESOURCE_DATA_KEY = 'abac_resource_data';

/**
 * 设置 ABAC 资源类型
 * 用法: @AbacResource('student')
 */
export const AbacResource = (resource: string) => {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      Reflect.defineMetadata(ABAC_RESOURCE_KEY, resource, descriptor.value);
    } else if (propertyKey) {
      Reflect.defineMetadata(ABAC_RESOURCE_KEY, resource, target);
    }
  };
};

/**
 * 设置 ABAC 操作类型
 * 用法: @AbacAction('read')
 */
export const AbacAction = (action: AbacInput['action']) => {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      Reflect.defineMetadata(ABAC_ACTION_KEY, action, descriptor.value);
    } else if (propertyKey) {
      Reflect.defineMetadata(ABAC_ACTION_KEY, action, target);
    }
  };
};

/**
 * 跳过 ABAC 校验（用于公开接口）
 * 用法: @AbacSkip()
 */
export const AbacSkip = () => {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      Reflect.defineMetadata(ABAC_SKIP_KEY, true, descriptor.value);
    } else if (propertyKey) {
      Reflect.defineMetadata(ABAC_SKIP_KEY, true, target);
    }
  };
};

/**
 * 传递资源数据（可选）
 * 用法: @AbacResourceData('classId', 'params.classId')
 */
export const AbacResourceData = (resourceData: Record<string, string>) => {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      Reflect.defineMetadata(
        ABAC_RESOURCE_DATA_KEY,
        resourceData,
        descriptor.value,
      );
    }
  };
};

// ============================================================
// Abac Guard 实现
// ============================================================

@Injectable()
export class AbacGuard implements CanActivate {
  private readonly logger = new Logger(AbacGuard.name);

  constructor(
    private readonly abacService: AbacService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 检查是否跳过 ABAC 校验
    const skipAbac = this.reflector.getAllAndOverride<boolean>(ABAC_SKIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipAbac) {
      return true;
    }

    // 2. 获取请求上下文
    const request = context.switchToHttp().getRequest();

    // 3. 从请求中提取用户信息（假设已通过 Auth Guard）
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('用户未认证，无法进行权限判断');
    }

    // 4. 构建 ABAC 输入
    const resource =
      this.reflector.get<string>(ABAC_RESOURCE_KEY, context.getHandler()) ||
      request.params?.resource ||
      'unknown';

    const action =
      this.reflector.get<AbacInput['action']>(
        ABAC_ACTION_KEY,
        context.getHandler(),
      ) || this.inferAction(context);

    // 5. 构建资源数据（从请求参数中提取）
    const resourceData = this.extractResourceData(request, context);

    // 6. 构建 ABAC 输入上下文
    const abacInput: AbacInput = {
      role: user.role || user.userType || 'UNKNOWN',
      user: {
        id: user.id || user.userId,
        classIds: user.classIds,
        relatedStudentIds: user.relatedStudentIds,
        department: user.department,
        hasOverride: user.hasOverride,
      },
      action,
      resource,
      resourceData,
      currentTime: this.getCurrentTime(),
      weekday: this.getCurrentWeekday(),
    };

    // 7. 调用 OPA 进行权限决策
    const decision = await this.abacService.evaluate({
      input: abacInput,
    });

    // 8. 决策处理
    if (!decision.allow) {
      this.logger.warn(
        `[ABAC] 权限拒绝: user=${user.id}, role=${abacInput.role}, ` +
          `action=${action}, resource=${resource}, reason=${decision.reason}`,
      );
      throw new ForbiddenException({
        statusCode: 403,
        message: '您没有权限执行此操作',
        error: 'Forbidden',
        detail: {
          requiredPermission: `${action}:${resource}`,
          reason: decision.reason,
          decisionTimeMs: decision.decisionTimeMs,
        },
      });
    }

    // 9. 将决策结果附加到请求（供控制器使用）
    request.abacDecision = decision;

    this.logger.debug(
      `[ABAC] 权限允许: user=${user.id}, role=${abacInput.role}, ` +
        `action=${action}, resource=${resource} (${decision.decisionTimeMs}ms)`,
    );

    return true;
  }

  /**
   * 从请求中提取资源数据
   */
  private extractResourceData(
    request: any,
    context: ExecutionContext,
  ): AbacInput['resourceData'] {
    const resourceDataMetadata = this.reflector.get<Record<string, string>>(
      ABAC_RESOURCE_DATA_KEY,
      context.getHandler(),
    );

    const resourceData: AbacInput['resourceData'] = {};

    if (resourceDataMetadata) {
      for (const [key, path] of Object.entries(resourceDataMetadata)) {
        const value = this.getValueByPath(request, path);
        if (value !== undefined) {
          (resourceData as any)[key] = value;
        }
      }
    }

    // 自动从标准路径提取
    resourceData.classId =
      resourceData.classId || request.params?.classId || request.query?.classId;
    resourceData.studentId =
      resourceData.studentId ||
      request.params?.studentId ||
      request.query?.studentId;

    return resourceData;
  }

  /**
   * 根据 HTTP 方法推断操作类型
   */
  private inferAction(context: ExecutionContext): AbacInput['action'] {
    const method = context.getHandler().name.toLowerCase();
    const httpMethod = context.switchToHttp().getRequest().method.toUpperCase();

    if (httpMethod === 'GET') return 'read';
    if (httpMethod === 'POST') return 'create';
    if (httpMethod === 'PUT' || httpMethod === 'PATCH') return 'update';
    if (httpMethod === 'DELETE') return 'delete';

    // 根据方法名推断
    if (method.includes('export')) return 'export';
    if (method.includes('print')) return 'print';

    return 'read';
  }

  /**
   * 获取当前时间（HH:MM 格式）
   */
  private getCurrentTime(): string {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  /**
   * 获取当前星期几（英文）
   */
  private getCurrentWeekday(): string {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[new Date().getDay()];
  }

  /**
   * 根据路径从对象中获取值
   * 支持: 'params.id', 'body.student.classId', 'query.classId'
   */
  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
