import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { AuditLogService } from '../services/audit-log.service';
import { PortalAuditEventType } from '../entities/portal-audit-log.entity';

/**
 * 审计日志元数据键
 * 用于在 Controller/Handler 上声明审计事件信息
 */
export const AUDIT_LOG_KEY = 'portal:audit-log';

/**
 * Auditable 装饰器选项
 */
export interface AuditableOptions {
  eventType: PortalAuditEventType;
  action: string;
  targetType?: string;
  /** 从请求中提取 targetId 的函数签名 */
  targetIdExtractor?: (req: Request) => string | undefined;
  /** 从请求/响应中提取变更详情 */
  changesExtractor?: (req: Request, body?: any) => Record<string, any>;
}

/**
 * Auditable 装饰器
 * 标记一个路由处理器需要记录审计日志
 *
 * @example
 * ```ts
 * @Auditable({
 *   eventType: PortalAuditEventType.PROFILE_UPDATE,
 *   action: 'UPDATE',
 *   targetType: 'students',
 *   targetIdExtractor: (req) => req.params.studentId,
 * })
 * @Patch('/profile')
 * updateProfile() { ... }
 * ```
 */
export const Auditable = (
  options: AuditableOptions,
): MethodDecorator & ClassDecorator => {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    if (descriptor) {
      // Method decorator — attach metadata to the handler function
      Reflect.defineMetadata(AUDIT_LOG_KEY, options, descriptor.value);
    } else {
      // Class decorator
      Reflect.defineMetadata(AUDIT_LOG_KEY, options, target);
    }
  };
};

/**
 * 解析 Auditable 元数据
 */
function getAuditableMetadata(
  target: any,
): AuditableOptions | undefined {
  const reflector = new Reflector();
  // Check method-level metadata first, then class-level
  return (
    reflector.get<AuditableOptions>(AUDIT_LOG_KEY, target) ||
    reflector.get<AuditableOptions>(
      AUDIT_LOG_KEY,
      target?.constructor?.prototype,
    )
  );
}

/**
 * 门户审计日志拦截器
 *
 * 拦截规则：
 * 1. 默认拦截所有 /api/portal/** 请求
 * 2. 如果 Handler 上标注了 @Auditable()，按照标注配置记录
 * 3. 如果响应状态码 >= 400，记录为失败
 * 4. 403 响应自动记录为 DENIED 事件
 * 5. 401 响应记录为 LOGIN 失败事件
 *
 * 自动提取的字段：
 * - actorId / actorRole: 从 request.user 中提取
 * - ipAddress: 从请求头 X-Forwarded-For 或 socket 中提取
 * - userAgent: 从请求头 User-Agent 中提取
 * - targetType/targetId: 从 @Auditable() 元数据或 URL 路径中提取
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    @Inject(AuditLogService)
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    // 仅拦截 /api/portal/** 路径
    const path = request.path || request.url;
    if (!path.startsWith('/api/portal')) {
      return next.handle();
    }

    // 获取用户信息
    const user = (request as any).user as
      | { id: string; role: string }
      | undefined;

    const actorId = user?.id || 'anonymous';
    const actorRole = user?.role || 'anonymous';

    // 获取 IP 地址
    const ipAddress =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.socket?.remoteAddress ||
      '';

    // 获取 User Agent
    const userAgent = (request.headers['user-agent'] as string) || '';

    // 获取 Auditable 元数据
    const auditableMeta = getAuditableMetadata(context.getHandler());

    // 自动推断 eventType 和 action
    const inferredEventType = this.inferEventType(request, response);
    const eventType =
      auditableMeta?.eventType || inferredEventType || PortalAuditEventType.LOGIN;

    const action = auditableMeta?.action || request.method;

    const targetType =
      auditableMeta?.targetType || this.inferTargetType(path);
    const targetId = auditableMeta?.targetIdExtractor
      ? auditableMeta.targetIdExtractor(request)
      : (request.params?.id as string | undefined) ||
        (request.params?.studentId as string | undefined);

    return next.handle().pipe(
      tap({
        next: async (responseBody: any) => {
          try {
            const statusCode = response.statusCode;

            if (statusCode >= 400) {
              await this.handleErrorResponse(
                request,
                response,
                actorId,
                actorRole,
                ipAddress,
                userAgent,
                eventType,
                action,
                targetType,
                targetId,
                statusCode,
              );
              return;
            }

            // 正常响应记录审计日志
            const changes = auditableMeta?.changesExtractor
              ? auditableMeta.changesExtractor(request, responseBody)
              : undefined;

            await this.auditLogService.log({
              eventType,
              actorId,
              actorRole,
              targetId,
              targetType,
              action,
              changes,
              ipAddress,
              userAgent,
              result: 'SUCCESS',
            });
          } catch (err) {
            // 审计日志自身不应影响业务流程
            console.error('[AuditLogInterceptor] Failed to write audit log:', err);
          }
        },
        error: async (error: any) => {
          try {
            const statusCode =
              error?.status || error?.response?.statusCode || 500;

            if (statusCode === 403 || statusCode === 401) {
              await this.auditLogService.logDenied({
                actorId,
                actorRole,
                targetType,
                targetId,
                action,
                ipAddress,
                userAgent,
              });
            } else {
              await this.auditLogService.log({
                eventType,
                actorId,
                actorRole,
                targetId,
                targetType,
                action,
                changes: {
                  error: error?.message || 'Unknown error',
                  statusCode,
                },
                ipAddress,
                userAgent,
                result: 'FAILURE',
              });
            }
          } catch (err) {
            console.error(
              '[AuditLogInterceptor] Failed to write error audit log:',
              err,
            );
          }
        },
      }),
    );
  }

  /**
   * 处理错误响应（4xx/5xx）
   */
  private async handleErrorResponse(
    request: Request,
    response: Response,
    actorId: string,
    actorRole: string,
    ipAddress: string,
    userAgent: string,
    eventType: PortalAuditEventType,
    action: string,
    targetType?: string,
    targetId?: string,
    statusCode?: number,
  ): Promise<void> {
    const path = request.path || request.url;

    if (statusCode === 403) {
      // 403 DENIED 事件 — 记录请求路径 + 尝试的资源
      await this.auditLogService.logDenied({
        actorId,
        actorRole,
        targetType,
        targetId: targetId || request.params?.id,
        action,
        ipAddress,
        userAgent,
      });
    } else if (statusCode === 401) {
      await this.auditLogService.log({
        eventType: PortalAuditEventType.LOGIN,
        actorId,
        actorRole,
        targetType: 'auth',
        action: 'LOGIN_ATTEMPT',
        changes: {
          path,
          statusCode,
          reason: 'Authentication failed',
        },
        ipAddress,
        userAgent,
        result: 'FAILURE',
      });
    } else {
      await this.auditLogService.log({
        eventType,
        actorId,
        actorRole,
        targetId,
        targetType,
        action,
        changes: {
          path,
          statusCode,
        },
        ipAddress,
        userAgent,
        result: 'FAILURE',
      });
    }
  }

  /**
   * 根据 HTTP 方法和路径推断事件类型
   */
  private inferEventType(
    request: Request,
    response: Response,
  ): PortalAuditEventType | undefined {
    const path = request.path || request.url;

    if (path.includes('/auth/login')) {
      return PortalAuditEventType.LOGIN;
    }
    if (path.includes('/profile')) {
      if (request.method === 'GET') {
        return PortalAuditEventType.PROFILE_VIEW;
      }
      if (request.method === 'PATCH' || request.method === 'PUT') {
        return PortalAuditEventType.PROFILE_UPDATE;
      }
    }
    if (path.includes('/leaves') || path.includes('/leave')) {
      if (request.method === 'POST') {
        return PortalAuditEventType.LEAVE_CREATE;
      }
      if (response.statusCode === 403) {
        return PortalAuditEventType.UNAUTHORIZED_ACCESS;
      }
    }
    if (path.includes('/grades') || path.includes('/grade')) {
      return PortalAuditEventType.GRADE_VIEW;
    }
    if (path.includes('/attendance')) {
      return PortalAuditEventType.ATTENDANCE_VIEW;
    }
    if (path.includes('/payments') || path.includes('/payment')) {
      return PortalAuditEventType.PAYMENT_OPERATE;
    }
    if (path.includes('/notices') || path.includes('/notice')) {
      return PortalAuditEventType.NOTICE_VIEW;
    }

    return undefined;
  }

  /**
   * 从路径中推断目标资源类型
   */
  private inferTargetType(path: string): string | undefined {
    // /api/portal/students/xxx → students
    // /api/portal/leaves/xxx → leaves
    // /api/portal/profile → students
    // /api/portal/auth/login → auth

    // 移除 /api/portal/ 前缀
    const normalized = path.replace(/^\/api\/portal\//, '');
    const segments = normalized.split('/');

    if (segments.length > 0) {
      const resource = segments[0];
      // 映射到规范化的 targetType
      const typeMap: Record<string, string> = {
        profile: 'students',
        students: 'students',
        leaves: 'leaves',
        auth: 'auth',
        grades: 'grades',
        attendance: 'attendance',
        qr: 'qr_codes',
        payments: 'payments',
        notices: 'notices',
        timetable: 'timetable',
      };
      return typeMap[resource] || resource;
    }

    return undefined;
  }
}
