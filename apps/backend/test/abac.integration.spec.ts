/**
 * ABAC 集成测试
 *
 * 测试完整的 ABAC 系统，包括:
 * - 权限决策流程
 * - 缓存机制
 * - 性能监控
 * - 与业务模块的集成
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AbacModule } from '../src/modules/abac/abac.module';
import { AbacService } from '../src/modules/abac/abac.service';
import { AbacCacheService } from '../src/modules/abac/abac-cache.service';
import { AbacInput, AbacDecisionResult } from '../src/modules/abac/interfaces/abac.interfaces';

describe('ABAC 集成测试', () => {
  let app: INestApplication;
  let abacService: AbacService;
  let cacheService: AbacCacheService<AbacDecisionResult>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AbacModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    abacService = app.get<AbacService>(AbacService);
    cacheService =
      app.get<AbacCacheService<AbacDecisionResult>>(AbacCacheService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // 每个测试前清除缓存
    await cacheService.clear();
  });

  // ============================================================
  // 健康检查测试
  // ============================================================

  describe('健康检查', () => {
    it('GET /abac/health - 应该返回健康状态', async () => {
      const response = await request(app.getHttpServer())
        .get('/abac/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('opaEnabled');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  // ============================================================
  // 权限决策测试
  // ============================================================

  describe('权限决策', () => {
    describe('校务主任全权限', () => {
      it('应该允许校务主任执行所有操作', async () => {
        const input: AbacInput = {
          role: 'SCHOOL_DIRECTOR',
          action: 'read',
          resource: 'student',
          user: { id: 'director-001' },
        };

        const result = await abacService.evaluate({ input });

        expect(result.allow).toBe(true);
        expect(result.decisionTimeMs).toBeLessThan(100); // 性能要求
        expect(result.matchedPolicy).toBe('school.authz.allow');
      });

      it('应该允许校务主任删除操作', async () => {
        const input: AbacInput = {
          role: 'SCHOOL_DIRECTOR',
          action: 'delete',
          resource: 'student',
          user: { id: 'director-001' },
        };

        const result = await abacService.evaluate({ input });
        expect(result.allow).toBe(true);
      });
    });

    describe('教师权限', () => {
      it('应该允许教师查看本班学生数据', async () => {
        const input: AbacInput = {
          role: 'TEACHER',
          action: 'read',
          resource: 'student',
          user: {
            id: 'teacher-001',
            classIds: ['class-001', 'class-002'],
          },
          resourceData: {
            classId: 'class-001',
          },
        };

        const result = await abacService.evaluate({ input });
        expect(result.allow).toBe(true);
      });

      it('应该拒绝教师查看其他班级学生数据', async () => {
        const input: AbacInput = {
          role: 'TEACHER',
          action: 'read',
          resource: 'student',
          user: {
            id: 'teacher-001',
            classIds: ['class-001'],
          },
          resourceData: {
            classId: 'class-002', // 不同班级
          },
        };

        const result = await abacService.evaluate({ input });
        expect(result.allow).toBe(false);
        expect(result.reason).toContain('内嵌规则拒绝');
      });

      it('应该允许教师为本班学生创建请假记录', async () => {
        const input: AbacInput = {
          role: 'TEACHER',
          action: 'create',
          resource: 'leave',
          user: {
            id: 'teacher-001',
            classIds: ['class-001'],
          },
          resourceData: {
            classId: 'class-001',
          },
        };

        const result = await abacService.evaluate({ input });
        expect(result.allow).toBe(true);
      });
    });

    describe('家长权限', () => {
      it('应该允许家长查看自己孩子的数据', async () => {
        const input: AbacInput = {
          role: 'PARENT',
          action: 'read',
          resource: 'student',
          user: {
            id: 'parent-001',
            relatedStudentIds: ['student-001', 'student-002'],
          },
          resourceData: {
            studentId: 'student-001',
          },
        };

        const result = await abacService.evaluate({ input });
        expect(result.allow).toBe(true);
      });

      it('应该拒绝家长查看其他孩子的数据', async () => {
        const input: AbacInput = {
          role: 'PARENT',
          action: 'read',
          resource: 'student',
          user: {
            id: 'parent-001',
            relatedStudentIds: ['student-001'],
          },
          resourceData: {
            studentId: 'student-002', // 不同孩子
          },
        };

        const result = await abacService.evaluate({ input });
        expect(result.allow).toBe(false);
      });
    });

    describe('财务人员权限', () => {
      it('应该允许财务人员在工作时间访问财务数据', async () => {
        const input: AbacInput = {
          role: 'FINANCE_STAFF',
          action: 'read',
          resource: 'finance',
          user: { id: 'finance-001' },
          currentTime: '10:00',
          weekday: 'Monday',
        };

        const result = await abacService.evaluate({ input });
        expect(result.allow).toBe(true);
      });

      it('应该拒绝财务人员在非工作时间访问', async () => {
        const input: AbacInput = {
          role: 'FINANCE_STAFF',
          action: 'read',
          resource: 'finance',
          user: { id: 'finance-001' },
          currentTime: '20:00', // 非工作时间
          weekday: 'Monday',
        };

        const result = await abacService.evaluate({ input });
        expect(result.allow).toBe(false);
      });

      it('应该允许有特殊授权的财务人员随时访问', async () => {
        const input: AbacInput = {
          role: 'FINANCE_STAFF',
          action: 'read',
          resource: 'finance',
          user: {
            id: 'finance-001',
            hasOverride: true,
          },
          currentTime: '20:00',
          weekday: 'Saturday',
        };

        const result = await abacService.evaluate({ input });
        expect(result.allow).toBe(true);
      });
    });

    describe('批量导出限制', () => {
      it('应该允许校务主任执行批量导出', async () => {
        const input: AbacInput = {
          role: 'SCHOOL_DIRECTOR',
          action: 'export',
          resource: 'student',
          user: { id: 'director-001' },
        };

        const result = await abacService.evaluate({ input });
        expect(result.allow).toBe(true);
      });

      it('应该拒绝教师执行批量导出', async () => {
        const input: AbacInput = {
          role: 'TEACHER',
          action: 'export',
          resource: 'student',
          user: { id: 'teacher-001' },
        };

        const result = await abacService.evaluate({ input });
        expect(result.allow).toBe(false);
      });

      it('应该拒绝家长执行批量导出', async () => {
        const input: AbacInput = {
          role: 'PARENT',
          action: 'export',
          resource: 'student',
          user: { id: 'parent-001' },
        };

        const result = await abacService.evaluate({ input });
        expect(result.allow).toBe(false);
      });
    });

    describe('系统管理员', () => {
      it('应该允许系统管理员所有操作', async () => {
        const input: AbacInput = {
          role: 'SYSTEM_ADMIN',
          action: 'delete',
          resource: 'any_resource',
          user: { id: 'admin-001' },
        };

        const result = await abacService.evaluate({ input });
        expect(result.allow).toBe(true);
      });
    });
  });

  // ============================================================
  // 缓存机制测试
  // ============================================================

  describe('缓存机制', () => {
    it('第一次请求应该缓存决策结果', async () => {
      const input: AbacInput = {
        role: 'TEACHER',
        action: 'read',
        resource: 'student',
        user: {
          id: 'teacher-001',
          classIds: ['class-001'],
        },
        resourceData: {
          classId: 'class-001',
        },
      };

      // 第一次请求
      const result1 = await abacService.evaluate({ input });
      expect(result1.allow).toBe(true);

      // 第二次请求（应该命中缓存）
      const result2 = await abacService.evaluate({ input });
      expect(result2.allow).toBe(true);

      // 验证缓存指标
      const metrics = abacService.getCacheMetrics();
      expect(metrics.hits).toBeGreaterThan(0);
      expect(metrics.hitRate).toBeGreaterThan(0.5); // 至少50%命中率
    });

    it('策略热更新后应该清除缓存', async () => {
      const input: AbacInput = {
        role: 'TEACHER',
        action: 'read',
        resource: 'student',
        user: {
          id: 'teacher-001',
          classIds: ['class-001'],
        },
        resourceData: {
          classId: 'class-001',
        },
      };

      // 第一次请求
      await abacService.evaluate({ input });

      // 获取缓存指标
      const metricsBefore = abacService.getCacheMetrics();
      expect(metricsBefore.sets).toBeGreaterThan(0);

      // 热更新策略
      const reloadResult = await abacService.reloadPolicies();
      expect(reloadResult.success).toBe(true);

      // 缓存应该被清除
      const metricsAfter = abacService.getCacheMetrics();
      expect(metricsAfter.currentSize).toBe(0);
    });
  });

  // ============================================================
  // 性能监控测试
  // ============================================================

  describe('性能监控', () => {
    it('应该收集缓存性能指标', async () => {
      const input: AbacInput = {
        role: 'TEACHER',
        action: 'read',
        resource: 'student',
        user: {
          id: 'teacher-001',
          classIds: ['class-001'],
        },
        resourceData: {
          classId: 'class-001',
        },
      };

      // 执行几次请求
      await abacService.evaluate({ input });
      await abacService.evaluate({ input });
      await abacService.evaluate({ input });

      // 获取指标
      const metrics = abacService.getCacheMetrics();

      expect(metrics).toHaveProperty('hits');
      expect(metrics).toHaveProperty('misses');
      expect(metrics).toHaveProperty('sets');
      expect(metrics).toHaveProperty('hitRate');
      expect(metrics).toHaveProperty('currentSize');
    });

    it('应该能够重置缓存统计', async () => {
      const input: AbacInput = {
        role: 'TEACHER',
        action: 'read',
        resource: 'student',
        user: {
          id: 'teacher-001',
          classIds: ['class-001'],
        },
        resourceData: {
          classId: 'class-001',
        },
      };

      // 执行请求
      await abacService.evaluate({ input });

      // 获取指标
      const metricsBefore = abacService.getCacheMetrics();
      expect(metricsBefore.hits + metricsBefore.misses).toBeGreaterThan(0);

      // 重置统计
      abacService.resetCacheMetrics();

      // 验证重置
      const metricsAfter = abacService.getCacheMetrics();
      expect(metricsAfter.hits).toBe(0);
      expect(metricsAfter.misses).toBe(0);
    });
  });

  // ============================================================
  // API 端点测试
  // ============================================================

  describe('API 端点', () => {
    it('POST /abac/evaluate - 应该返回评估结果', async () => {
      const response = await request(app.getHttpServer())
        .post('/abac/evaluate')
        .send({
          input: {
            role: 'TEACHER',
            action: 'read',
            resource: 'student',
            user: {
              id: 'teacher-001',
              classIds: ['class-001'],
            },
            resourceData: {
              classId: 'class-001',
            },
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('allow');
      expect(response.body).toHaveProperty('decisionTimeMs');
      expect(response.body).toHaveProperty('evaluatedAt');
    });

    it('POST /abac/test - 应该支持测试接口', async () => {
      const response = await request(app.getHttpServer())
        .post('/abac/test')
        .send({
          role: 'SYSTEM_ADMIN',
          action: 'delete',
          resource: 'any',
          user: { id: 'admin' },
        })
        .expect(200);

      expect(response.body.allow).toBe(true);
    });
  });

  // ============================================================
  // 性能测试
  // ============================================================

  describe('性能要求', () => {
    it('权限决策应该满足性能要求（< 50ms）', async () => {
      const input: AbacInput = {
        role: 'TEACHER',
        action: 'read',
        resource: 'student',
        user: {
          id: 'teacher-001',
          classIds: ['class-001'],
        },
        resourceData: {
          classId: 'class-001',
        },
      };

      // 执行多次请求测试性能
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const result = await abacService.evaluate({ input });
        times.push(result.decisionTimeMs);
      }

      // 计算平均时间
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      // 验证性能要求
      expect(avgTime).toBeLessThan(50); // 平均时间应该小于 50ms
      expect(Math.max(...times)).toBeLessThan(100); // 最大时间应该小于 100ms
    });

    it('缓存应该显著提升性能', async () => {
      const input: AbacInput = {
        role: 'TEACHER',
        action: 'read',
        resource: 'student',
        user: {
          id: 'teacher-001',
          classIds: ['class-001'],
        },
        resourceData: {
          classId: 'class-001',
        },
      };

      // 第一次请求（缓存未命中）
      const result1 = await abacService.evaluate({ input });
      const time1 = result1.decisionTimeMs;

      // 第二次请求（缓存命中）
      const result2 = await abacService.evaluate({ input });
      const time2 = result2.decisionTimeMs;

      // 缓存命中的时间应该显著更短
      expect(time2).toBeLessThan(time1);
    });
  });
});
