/**
 * ABAC Controller 单元测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AbacController } from './abac.controller';
import { AbacService } from './abac.service';
import { AbacInput } from './interfaces/abac.interfaces';

describe('AbacController', () => {
  let controller: AbacController;
  let abacService: AbacService;

  const mockAbacService = {
    healthCheck: jest.fn(),
    getRuleMetadata: jest.fn(),
    reloadPolicies: jest.fn(),
    evaluate: jest.fn(),
    getDecisionHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AbacController],
      providers: [{ provide: AbacService, useValue: mockAbacService }],
    }).compile();

    controller = module.get<AbacController>(AbacController);
    abacService = module.get<AbacService>(AbacService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('healthCheck', () => {
    it('返回健康状态', async () => {
      mockAbacService.healthCheck.mockResolvedValue({
        status: 'healthy',
        opaEnabled: false,
      });

      const result = await controller.healthCheck();
      expect(result.status).toBe('ok');
      expect(result.opaEnabled).toBe(false);
      expect(result.timestamp).toBeDefined();
    });

    it('OPA启用时返回健康状态', async () => {
      mockAbacService.healthCheck.mockResolvedValue({
        status: 'healthy',
        opaEnabled: true,
        version: '0.65.0',
      });

      const result = await controller.healthCheck();
      expect(result.status).toBe('ok');
      expect(result.opaEnabled).toBe(true);
    });
  });

  describe('getPolicies', () => {
    it('返回策略元数据', async () => {
      const metadata = {
        name: 'school.authz',
        description: 'ABAC权限规则',
        version: '1.0.0',
        lastUpdated: '2026-06-07T00:00:00Z',
      };
      mockAbacService.getRuleMetadata.mockReturnValue(metadata);

      const result = await controller.getPolicies();
      expect(result).toEqual(metadata);
      expect(mockAbacService.getRuleMetadata).toHaveBeenCalled();
    });
  });

  describe('reloadPolicies', () => {
    it('返回热更新结果', async () => {
      mockAbacService.reloadPolicies.mockResolvedValue({
        success: true,
        message: '缓存已清除',
      });

      const result = await controller.reloadPolicies();
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it('返回热更新失败结果', async () => {
      mockAbacService.reloadPolicies.mockResolvedValue({
        success: false,
        message: 'OPA服务器不可用',
      });

      const result = await controller.reloadPolicies();
      expect(result.success).toBe(false);
    });
  });

  describe('evaluate', () => {
    it('返回决策结果', async () => {
      const input: AbacInput = {
        role: 'TEACHER',
        action: 'read',
        resource: 'student',
        user: { id: 'teacher-001', classIds: ['1A'] },
        resourceData: { classId: '1A' },
      };

      const decision = {
        allow: true,
        matchedPolicy: 'school.authz.allow',
        decisionTimeMs: 2,
        evaluatedAt: new Date().toISOString(),
      };

      mockAbacService.evaluate.mockResolvedValue(decision);

      const result = await controller.evaluate({ input });
      expect(result).toEqual(decision);
      expect(mockAbacService.evaluate).toHaveBeenCalledWith({ input });
    });

    it('拒绝访问时返回决策结果', async () => {
      const input: AbacInput = {
        role: 'PARENT',
        action: 'read',
        resource: 'student',
        user: { id: 'parent-001', relatedStudentIds: ['stu-001'] },
        resourceData: { studentId: 'stu-999' },
      };

      const decision = {
        allow: false,
        reason: '家长只能查看自己关联的学生数据',
        decisionTimeMs: 1,
        evaluatedAt: new Date().toISOString(),
      };

      mockAbacService.evaluate.mockResolvedValue(decision);

      const result = await controller.evaluate({ input });
      expect(result.allow).toBe(false);
    });
  });

  describe('getAuditHistory', () => {
    it('返回决策历史记录', async () => {
      mockAbacService.getDecisionHistory.mockResolvedValue([
        {
          userId: 'user-001',
          userRole: 'TEACHER',
          action: 'read',
          resource: 'student',
          decision: 'allow' as const,
          decisionTimeMs: 2,
          createdAt: new Date(),
        },
      ]);

      const result = await controller.getAuditHistory('user-001', '50');
      expect(result.logs).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(mockAbacService.getDecisionHistory).toHaveBeenCalledWith(
        'user-001',
        50,
      );
    });

    it('不带参数查询历史', async () => {
      mockAbacService.getDecisionHistory.mockResolvedValue([]);

      const result = await controller.getAuditHistory(undefined, '100');
      expect(result.logs).toHaveLength(0);
      expect(mockAbacService.getDecisionHistory).toHaveBeenCalledWith(
        undefined,
        100,
      );
    });
  });

  describe('testDecision', () => {
    it('返回测试决策结果', async () => {
      const input: AbacInput = {
        role: 'SCHOOL_DIRECTOR',
        action: 'export',
        resource: 'student',
        user: { id: 'director-001' },
      };

      const decision = {
        allow: true,
        matchedPolicy: 'school.authz.allow',
        decisionTimeMs: 1,
        evaluatedAt: new Date().toISOString(),
      };

      mockAbacService.evaluate.mockResolvedValue(decision);

      const result = await controller.testDecision(input);
      expect(result.allow).toBe(true);
    });
  });
});
