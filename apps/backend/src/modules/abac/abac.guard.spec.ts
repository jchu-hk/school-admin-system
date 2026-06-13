/**
 * ABAC Guard 单元测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbacGuard } from './abac.guard';
import { AbacService } from './abac.service';
import { AbacInput } from './interfaces/abac.interfaces';

describe('AbacGuard', () => {
  let guard: AbacGuard;
  let _reflector: Reflector;

  // 模拟 AbacService
  const mockAbacService = {
    evaluate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbacGuard,
        Reflector,
        { provide: AbacService, useValue: mockAbacService },
      ],
    }).compile();

    guard = module.get<AbacGuard>(AbacGuard);
    _reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 创建模拟 ExecutionContext
   * 通过 reflector.defineMetadata 直接设置元数据，不依赖实现细节
   */
  function createMockContext(overrides: {
    user?: any;
    params?: any;
    query?: any;
    body?: any;
    method?: string;
    resourceMeta?: string;
    actionMeta?: AbacInput['action'];
    skipAbac?: boolean;
  }): ExecutionContext {
    const {
      user = { id: 'user-001', role: 'TEACHER', classIds: ['1A'] },
      params = { classId: '1A', studentId: 'stu-001' },
      query = {},
      body = {},
      method = 'GET',
      resourceMeta,
      actionMeta,
      skipAbac,
    } = overrides;

    const mockHandler = jest.fn();
    if (resourceMeta !== undefined)
      Reflect.defineMetadata('abac_resource', resourceMeta, mockHandler);
    if (actionMeta !== undefined)
      Reflect.defineMetadata('abac_action', actionMeta, mockHandler);
    if (skipAbac !== undefined)
      Reflect.defineMetadata('abac_skip', skipAbac, mockHandler);

    const mockRequest: any = { user, params, query, body, method };

    const ctx = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getHandler: jest.fn().mockReturnValue(mockHandler),
      getClass: jest.fn().mockReturnValue({}),
    };

    return ctx as unknown as ExecutionContext;
  }

  describe('基础权限校验', () => {
    it('有用户信息且授权时允许访问', async () => {
      mockAbacService.evaluate.mockResolvedValue({
        allow: true,
        decisionTimeMs: 2,
        evaluatedAt: new Date().toISOString(),
      });

      const ctx = createMockContext({
        resourceMeta: 'student',
        actionMeta: 'read',
      });
      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(mockAbacService.evaluate).toHaveBeenCalled();
    });

    it('无用户信息时抛出 UnauthorizedException', async () => {
      const ctx = createMockContext({ user: null });

      await expect(guard.canActivate(ctx)).rejects.toThrow('用户未认证');
    });

    it('ABAC 拒绝时抛出 ForbiddenException', async () => {
      mockAbacService.evaluate.mockResolvedValue({
        allow: false,
        reason: '无匹配规则',
        decisionTimeMs: 1,
        evaluatedAt: new Date().toISOString(),
      });

      const ctx = createMockContext({
        resourceMeta: 'student',
        actionMeta: 'read',
      });
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('@AbacSkip 装饰器', () => {
    it('设置了 @AbacSkip 时跳过校验', async () => {
      const ctx = createMockContext({ skipAbac: true });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
      expect(mockAbacService.evaluate).not.toHaveBeenCalled();
    });
  });

  describe('资源数据提取', () => {
    it('从请求参数提取 classId 和 studentId', async () => {
      mockAbacService.evaluate.mockResolvedValue({
        allow: true,
        decisionTimeMs: 1,
        evaluatedAt: new Date().toISOString(),
      });

      const ctx = createMockContext({
        resourceMeta: 'student',
        actionMeta: 'read',
        params: { classId: '1A', studentId: 'stu-001' },
      });

      await guard.canActivate(ctx);

      expect(mockAbacService.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            resource: 'student',
            action: 'read',
            resourceData: expect.objectContaining({
              classId: '1A',
              studentId: 'stu-001',
            }),
          }),
        }),
      );
    });
  });

  describe('HTTP 方法推断操作类型', () => {
    const testCases: Array<{ method: string; expectedAction: string }> = [
      { method: 'GET', expectedAction: 'read' },
      { method: 'POST', expectedAction: 'create' },
      { method: 'PUT', expectedAction: 'update' },
      { method: 'PATCH', expectedAction: 'update' },
      { method: 'DELETE', expectedAction: 'delete' },
    ];

    testCases.forEach(({ method, expectedAction }) => {
      it(`HTTP ${method} 推断为 action="${expectedAction}"`, async () => {
        mockAbacService.evaluate.mockResolvedValue({
          allow: true,
          decisionTimeMs: 1,
          evaluatedAt: new Date().toISOString(),
        });

        const ctx = createMockContext({
          method,
          resourceMeta: 'student',
        });

        await guard.canActivate(ctx);

        expect(mockAbacService.evaluate).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              action: expectedAction,
            }),
          }),
        );
      });
    });
  });

  describe('决策结果附加到请求', () => {
    it('允许的决策结果附加到 request.abacDecision', async () => {
      const decision = {
        allow: true,
        decisionTimeMs: 2,
        evaluatedAt: new Date().toISOString(),
      };
      mockAbacService.evaluate.mockResolvedValue(decision);

      const mockRequest: any = {
        user: { id: 'user-001', role: 'TEACHER', classIds: ['1A'] },
      };
      const mockHandler = jest.fn();
      Reflect.defineMetadata('abac_skip', false, mockHandler);
      Reflect.defineMetadata('abac_resource', 'student', mockHandler);
      Reflect.defineMetadata('abac_action', 'read', mockHandler);

      const ctx = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn().mockReturnValue(mockHandler),
        getClass: jest.fn().mockReturnValue({}),
      } as unknown as ExecutionContext;

      await guard.canActivate(ctx);
      expect(mockRequest.abacDecision).toEqual(decision);
    });
  });

  describe('错误详情', () => {
    it('拒绝时 ForbiddenException 包含正确详情', async () => {
      mockAbacService.evaluate.mockResolvedValue({
        allow: false,
        reason: '教师不能查看非所教班级学生',
        decisionTimeMs: 1,
        evaluatedAt: new Date().toISOString(),
      });

      const ctx = createMockContext({
        resourceMeta: 'student',
        actionMeta: 'read',
      });

      try {
        await guard.canActivate(ctx);
        fail('Expected ForbiddenException');
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenException);
        const response = (err as any).getResponse();
        expect(response.detail.reason).toBe('教师不能查看非所教班级学生');
        expect(response.detail.decisionTimeMs).toBe(1);
      }
    });
  });
});
