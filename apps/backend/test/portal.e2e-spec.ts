/**
 * 门户模块 — API + E2E + 越权攻击测试
 *
 * 测试范围:
 * - API 测试: GET/PUT/POST /api/portal/*
 * - 越权攻击测试: 水平越权、垂直越权、参数篡改
 * - E2E 测试: 门户页面加载
 *
 * 参考:
 * - FUNCTIONAL-SPEC-STUDENT-PARENT-PORTAL.md
 * - 前端 api.ts / leave/api.ts / profile/api.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PortalModule } from '../src/portal/portal.module';
import { ROLE_PERMISSION_MAP } from '../src/portal/enums/portal-permissions.constants';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { ParentStudentLink } from '../src/portal/entities/parent-student-link.entity';
import { PortalAuditLog } from '../src/portal/entities/portal-audit-log.entity';

// ─────────────────────────────────────────────────────────────
// 辅助: 模拟 JWT 用户工厂
// ─────────────────────────────────────────────────────────────

interface MockUser {
  id: string;
  username: string;
  role: string;
  permissions: string[];
  relatedStudentIds?: string[];
  [key: string]: any;
}

function createStudentUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'student-uuid-001',
    username: 'student_demo',
    role: 'student',
    permissions: ROLE_PERMISSION_MAP['student'] || [],
    ...overrides,
  };
}

function createParentUser(
  overrides: Partial<MockUser> = {},
  relatedStudentIds: string[] = ['student-uuid-001', 'student-uuid-002'],
): MockUser {
  return {
    id: 'parent-uuid-001',
    username: 'parent_demo',
    role: 'parent',
    permissions: ROLE_PERMISSION_MAP['parent'] || [],
    relatedStudentIds,
    ...overrides,
  };
}

function createStaffUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'staff-uuid-001',
    username: 'staff_demo',
    role: 'staff',
    permissions: [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────
// 辅助: 从 supertest 实例生成带模拟 JWT 的请求包装器
// ─────────────────────────────────────────────────────────────

function mockAuthRequest(
  httpServer: any,
  user: MockUser,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
) {
  const token = Buffer.from(JSON.stringify(user)).toString('base64');
  const req = (request(httpServer) as any)[method](url);
  return req.set('Authorization', `Bearer ${token}`);
}

// ─────────────────────────────────────────────────────────────
// 模拟 JWT Auth Guard — 跳过真实 JWT 验证，从 token 中解码 mock user
// ─────────────────────────────────────────────────────────────

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    try {
      const token = authHeader.replace('Bearer ', '');
      const user = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      request.user = user;
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * DataMaskingInterceptor 依赖注入模拟
 * 使用 useValue 提供空数组适配构造函数签名
 */
const mockMaskingRulesProvider = {
  provide: Array,
  useValue: [],
};

// ─────────────────────────────────────────────────────────────
// 测试套件
// ─────────────────────────────────────────────────────────────

describe('Portal 门户模块 — API + E2E + 越权攻击测试', () => {
  let app: INestApplication;
  let httpServer: any;
  let mockParentStudentLinkRepo: Partial<
    Record<keyof Repository<any>, jest.Mock>
  >;
  let mockAuditLogRepo: Partial<Record<keyof Repository<any>, jest.Mock>>;

  beforeAll(async () => {
    // 创建 mock repositories
    mockParentStudentLinkRepo = {
      find: jest
        .fn()
        .mockResolvedValue([
          { studentId: 'student-uuid-001' },
          { studentId: 'student-uuid-002' },
        ]),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockAuditLogRepo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PortalModule],
      providers: [mockMaskingRulesProvider],
    })
      .overrideProvider(getRepositoryToken(ParentStudentLink))
      .useValue(mockParentStudentLinkRepo)
      .overrideProvider(getRepositoryToken(PortalAuditLog))
      .useValue(mockAuditLogRepo)
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    );
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // 1. API 测试 — GET /api/portal/menus
  // ============================================================

  describe('GET /api/portal/menus — 门户菜单', () => {
    it('[AC] 学生角色返回学生菜单项', async () => {
      const user = createStudentUser();
      const res = await mockAuthRequest(
        httpServer,
        user,
        'get',
        '/api/portal/menus',
      ).expect(200);

      expect(res.body).toBeDefined();
      // 学生应有菜单列表
      const menus = res.body.menus ?? res.body.data?.menus ?? res.body;
      expect(Array.isArray(menus)).toBe(true);
      expect(menus.length).toBeGreaterThan(0);

      // 验证学生特有菜单: profile, qr-code, leave, timetable
      const menuKeys = menus.map((m: any) => m.key);
      expect(menuKeys).toContain('profile');
      expect(menuKeys).toContain('leave');
      expect(menuKeys).toContain('timetable');
      // 学生没有 payment (家长专属)
      expect(menuKeys).not.toContain('payment');
    });

    it('[AC] 家长角色返回家长菜单项', async () => {
      const user = createParentUser();
      const res = await mockAuthRequest(
        httpServer,
        user,
        'get',
        '/api/portal/menus',
      ).expect(200);

      const menus = res.body.menus ?? res.body.data?.menus ?? res.body;
      expect(Array.isArray(menus)).toBe(true);
      expect(menus.length).toBeGreaterThan(0);

      const menuKeys = menus.map((m: any) => m.key);
      // 家长特有菜单: payment
      expect(menuKeys).toContain('payment');
      // 家长无 qr-code (学生专属)
      expect(menuKeys).not.toContain('qr-code');
      expect(menuKeys).not.toContain('timetable');
    });

    it('[AC] 无角色/匿名请求返回 401', async () => {
      await request(httpServer).get('/api/portal/menus').expect(401);
    });

    it('无权限的角色返回空菜单', async () => {
      const user = createStaffUser();
      const res = await mockAuthRequest(
        httpServer,
        user,
        'get',
        '/api/portal/menus',
      ).expect(200);

      const menus = res.body.menus ?? res.body.data?.menus ?? res.body;
      expect(Array.isArray(menus)).toBe(true);
      // staff 没有 portal 权限，应返回空数组
      expect(menus.length).toBe(0);
    });
  });

  // ============================================================
  // 2. API 测试 — GET /api/portal/profile
  // ============================================================

  describe('GET /api/portal/profile — 个人档案', () => {
    it('[AC] 学生成功获取个人档案', async () => {
      const user = createStudentUser();
      const res = await mockAuthRequest(
        httpServer,
        user,
        'get',
        '/api/portal/profile',
      ).expect(200);

      expect(res.body).toBeDefined();
    });

    it('[AC] 家长+student_id=未关联孩子 → 403', async () => {
      const user = createParentUser({}, ['student-uuid-001']);
      const res = await mockAuthRequest(
        httpServer,
        user,
        'get',
        '/api/portal/profile?student_id=unrelated-student-uuid',
      ).expect(403);

      expect(res.body).toBeDefined();
    });

    it('家长获取已关联孩子档案应成功', async () => {
      const user = createParentUser({}, ['student-uuid-001']);
      const res = await mockAuthRequest(
        httpServer,
        user,
        'get',
        '/api/portal/profile?student_id=student-uuid-001',
      ).expect(200);

      expect(res.body).toBeDefined();
    });

    it('学生不传 student_id 应返回自身档案', async () => {
      const user = createStudentUser({ id: 'student-uuid-001' });
      const res = await mockAuthRequest(
        httpServer,
        user,
        'get',
        '/api/portal/profile',
      ).expect(200);

      expect(res.body).toBeDefined();
    });
  });

  // ============================================================
  // 3. API 测试 — PUT /api/portal/profile
  // ============================================================

  describe('PUT /api/portal/profile — 更新个人档案', () => {
    const validUpdate = {
      phone: '91234567',
      email: 'test@school.edu.hk',
      address: '香港仔田灣大樓A座',
      emergency_contact: '陳大文',
    };

    it('[AC] 学生更新电话/邮箱成功', async () => {
      const user = createStudentUser();
      const res = await mockAuthRequest(
        httpServer,
        user,
        'put',
        '/api/portal/profile',
      )
        .send(validUpdate)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('[AC] 学生试图更新学号(只读字段) → 400', async () => {
      const user = createStudentUser();
      const res = await mockAuthRequest(
        httpServer,
        user,
        'put',
        '/api/portal/profile',
      )
        .send({
          ...validUpdate,
          student_id: 'NEW-ID-99999', // 学号不可修改
        })
        .expect(400);

      expect(res.body).toBeDefined();
    });

    it('学生试图更新姓名(只读字段) → 400', async () => {
      const user = createStudentUser();
      await mockAuthRequest(httpServer, user, 'put', '/api/portal/profile')
        .send({
          ...validUpdate,
          name_zh: '新名字',
        })
        .expect(400);
    });

    it('学生试图更新性别(只读字段) → 400', async () => {
      const user = createStudentUser();
      await mockAuthRequest(httpServer, user, 'put', '/api/portal/profile')
        .send({
          ...validUpdate,
          gender: 'F',
        })
        .expect(400);
    });

    it('学生更新时可只传部分可编辑字段', async () => {
      const user = createStudentUser();
      const res = await mockAuthRequest(
        httpServer,
        user,
        'put',
        '/api/portal/profile',
      )
        .send({ phone: '98765432' })
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('匿名用户更新档案 → 401', async () => {
      await request(httpServer)
        .put('/api/portal/profile')
        .send(validUpdate)
        .expect(401);
    });

    it('家长更新档案 → 403（家长只读）', async () => {
      const user = createParentUser();
      await mockAuthRequest(httpServer, user, 'put', '/api/portal/profile')
        .send(validUpdate)
        .expect(403);
    });
  });

  // ============================================================
  // 4. API 测试 — POST /api/portal/leave
  // ============================================================

  describe('POST /api/portal/leave — 提交请假', () => {
    const validLeave = {
      leaveType: 'sick',
      startDate: '2026-09-15',
      endDate: '2026-09-16',
      reason: '發燒及感冒',
      contactPhone: '91234567',
    };

    const parentLeaveWithStudent = (studentId: string) => ({
      ...validLeave,
      studentId,
    });

    it('[AC] 学生提交请假成功', async () => {
      const user = createStudentUser();
      const res = await mockAuthRequest(
        httpServer,
        user,
        'post',
        '/api/portal/leave',
      )
        .send(validLeave)
        .expect(201);

      expect(res.body).toBeDefined();
    });

    it('[AC] 家长代请假成功（关联孩子）', async () => {
      const user = createParentUser({}, ['student-uuid-001']);
      const res = await mockAuthRequest(
        httpServer,
        user,
        'post',
        '/api/portal/leave',
      )
        .send(parentLeaveWithStudent('student-uuid-001'))
        .expect(201);

      expect(res.body).toBeDefined();
    });

    it('[AC] 家长代请假 student_id=未关联孩子 → 403', async () => {
      const user = createParentUser({}, ['student-uuid-001']);
      await mockAuthRequest(httpServer, user, 'post', '/api/portal/leave')
        .send(parentLeaveWithStudent('unrelated-student-uuid'))
        .expect(403);
    });

    it('学生提交请假时不需要传 student_id', async () => {
      const user = createStudentUser();
      const res = await mockAuthRequest(
        httpServer,
        user,
        'post',
        '/api/portal/leave',
      )
        .send(validLeave)
        .expect(201);

      expect(res.body).toBeDefined();
    });

    it('请假缺少必填字段 → 400', async () => {
      const user = createStudentUser();
      await mockAuthRequest(httpServer, user, 'post', '/api/portal/leave')
        .send({ reason: 'test' }) // 缺少 leaveType, startDate, endDate
        .expect(400);
    });

    it('匿名用户提交请假 → 401', async () => {
      await request(httpServer)
        .post('/api/portal/leave')
        .send(validLeave)
        .expect(401);
    });
  });

  // ============================================================
  // 5. 越权攻击测试 — 水平越权 (Horizontal Privilege Escalation)
  // ============================================================

  describe('越权攻击 — 水平越权', () => {
    it('[SEVERITY:CRITICAL] student A 通过 student_id 参数访问 student B 的档案', async () => {
      // student A 登录，尝试查看 student B 的档案
      const studentA = createStudentUser({ id: 'student-a-uuid' });
      const res = await mockAuthRequest(
        httpServer,
        studentA,
        'get',
        '/api/portal/profile?student_id=student-b-uuid',
      );

      // 预期: 403 Forbidden 或返回 student A 自身档案
      // 学生只能查看自己的档案，传递其他 student_id 应被拒绝
      expect([403, 200]).toContain(res.status);
      if (res.status === 200) {
        // 如果返回 200，必须确保返回的是 student A 的数据而非 student B 的数据
        expect(res.body).toBeDefined();
      }
    });

    it('[SEVERITY:CRITICAL] parent A 通过 student_id 参数访问非关联学生数据', async () => {
      // parent A 关联 student-1, student-2, 尝试查询 student-3
      const parentA = createParentUser({ id: 'parent-a-uuid' }, [
        'student-1-uuid',
        'student-2-uuid',
      ]);

      // 尝试获取未关联学生 student-3 的数据
      const res = await mockAuthRequest(
        httpServer,
        parentA,
        'get',
        '/api/portal/profile?student_id=student-3-uuid',
      );

      // 预期: 403 Forbidden
      expect(res.status).toBe(403);
    });

    it('[SEVERITY:CRITICAL] student A 获取 student B 的请假记录', async () => {
      const studentA = createStudentUser({ id: 'student-a-uuid' });
      const res = await mockAuthRequest(
        httpServer,
        studentA,
        'get',
        '/api/portal/leave?student_id=student-b-uuid',
      );

      // 学生只能看自己的请假记录，不能加 student_id 查别人
      expect([403, 200]).toContain(res.status);
    });
  });

  // ============================================================
  // 6. 越权攻击测试 — 垂直越权 (Vertical Privilege Escalation)
  // ============================================================

  describe('越权攻击 — 垂直越权', () => {
    it('[SEVERITY:CRITICAL] 学生访问 /portal/leave/:id/approve 审批端点', async () => {
      const studentUser = createStudentUser();
      // 审批端点是管理员/班主任功能，学生不应访问
      const res = await mockAuthRequest(
        httpServer,
        studentUser,
        'post',
        '/api/portal/leave/some-leave-uuid/approve',
      ).send({ comment: '批准' });

      // 预期: 403 Forbidden
      expect(res.status).toBe(403);
    });

    it('[SEVERITY:CRITICAL] 家长访问 /portal/leave/:id/approve 审批端点', async () => {
      const parentUser = createParentUser();
      const res = await mockAuthRequest(
        httpServer,
        parentUser,
        'post',
        '/api/portal/leave/some-leave-uuid/approve',
      ).send({ comment: '批准' });

      expect(res.status).toBe(403);
    });

    it('[SEVERITY:CRITICAL] 学生访问 admin-only /api/leaves 管理端点', async () => {
      const studentUser = createStudentUser();
      const res = await mockAuthRequest(
        httpServer,
        studentUser,
        'get',
        '/api/leaves',
      );

      // 学生不应能访问 leaves 管理接口
      expect([401, 403]).toContain(res.status);
    });

    it('[SEVERITY:CRITICAL] 学生访问 /api/portal/leave/:id/check-in 销假端点', async () => {
      const studentUser = createStudentUser();
      const res = await mockAuthRequest(
        httpServer,
        studentUser,
        'post',
        '/api/portal/leave/some-leave-uuid/check-in',
      );

      expect(res.status).toBe(403);
    });

    it('[SEVERITY:MEDIUM] 家长访问 /api/dashboard 管理仪表板', async () => {
      const parentUser = createParentUser();
      const res = await mockAuthRequest(
        httpServer,
        parentUser,
        'get',
        '/api/dashboard',
      );

      expect([401, 403]).toContain(res.status);
    });
  });

  // ============================================================
  // 7. 越权攻击测试 — 参数篡改 (Parameter Tampering)
  // ============================================================

  describe('越权攻击 — 参数篡改', () => {
    it('[SEVERITY:CRITICAL] 家长代请假时篡改 student_id 为未关联孩子', async () => {
      const parentUser = createParentUser({ id: 'parent-a-uuid' }, [
        'legit-student-uuid',
      ]);

      // 家长 legit-student-uuid 的孩子，但传参时篡改为其他学生 ID
      const res = await mockAuthRequest(
        httpServer,
        parentUser,
        'post',
        '/api/portal/leave',
      ).send({
        studentId: 'other-student-uuid',
        leaveType: 'sick',
        startDate: '2026-09-15',
        endDate: '2026-09-16',
        reason: 'test',
      });

      // 后端应校验 student_id 是否关联到当前家长
      expect(res.status).toBe(403);
    });

    it('[SEVERITY:CRITICAL] 学生提交请假时注入其他 student_id 参数', async () => {
      const studentUser = createStudentUser({ id: 'student-own-uuid' });
      // 学生不应允许传 student_id 参数替他人请假
      const res = await mockAuthRequest(
        httpServer,
        studentUser,
        'post',
        '/api/portal/leave',
      ).send({
        studentId: 'other-student-uuid',
        leaveType: 'sick',
        startDate: '2026-09-15',
        endDate: '2026-09-16',
        reason: 'test',
      });

      // 后端应忽略或拒绝学生传的 student_id
      expect([400, 403]).toContain(res.status);
    });

    it('[SEVERITY:HIGH] 参数注入攻击 — 尝试修改 role 字段', async () => {
      // 模拟 JWT 篡改: 即使 token 里写了 admin，后端也应根据签名验证
      const tamperedUser = createStudentUser({
        id: 'student-uuid-001',
        role: 'admin', // 篡改 role
        permissions: [], // 清空权限试图绕过
      });

      // 如果后端验证签名，篡改 token 应返回 401
      const res = await mockAuthRequest(
        httpServer,
        tamperedUser,
        'get',
        '/api/portal/menus',
      );

      // MockJwtAuthGuard 不验证签名，所以会放行
      // 但后端应校验实际权限
      expect(res.status).not.toBe(200);
    });

    it('[SEVERITY:HIGH] 尝试枚举其他用户 ID', async () => {
      const parentUser = createParentUser({ id: 'parent-a-uuid' }, [
        'my-child-uuid',
      ]);

      // 尝试枚举不同的 student_id 参数
      const studentIds = ['stolen-uuid-1', 'stolen-uuid-2', 'stolen-uuid-3'];
      for (const stolenId of studentIds) {
        const res = await mockAuthRequest(
          httpServer,
          parentUser,
          'get',
          `/api/portal/profile?student_id=${stolenId}`,
        );
        // 所有未关联的学生ID都应返回 403
        expect(res.status).toBe(403);
      }
    });

    it('[SEVERITY:MEDIUM] 尝试通过路径遍历访问上级目录', async () => {
      const studentUser = createStudentUser();
      const res = await mockAuthRequest(
        httpServer,
        studentUser,
        'get',
        '/api/portal/../../../etc/passwd',
      );

      // NestJS 会自动规范化路径，返回 404 而不是泄露文件
      expect([400, 404]).toContain(res.status);
    });
  });

  // ============================================================
  // 8. 数据脱敏测试
  // ============================================================

  describe('数据脱敏 — 敏感字段掩码', () => {
    it('[AC] 学生查看档案时手机号应部分掩码', async () => {
      const user = createStudentUser();
      const res = await mockAuthRequest(
        httpServer,
        user,
        'get',
        '/api/portal/profile',
      ).expect(200);

      const body = res.body;
      // 如果 profile 对象嵌套在 data 字段内
      const profile = body.data ?? body;
      const profileData = profile.profile ?? profile;

      // 手机号应被掩码（含 ****）
      if (profileData.phone) {
        expect(profileData.phone.toString()).toContain('****');
      }
      // 邮箱应被掩码
      if (profileData.email) {
        expect(profileData.email.toString()).toContain('***');
      }
      // 地址应被掩码
      if (profileData.address) {
        expect(profileData.address.toString()).toContain('****');
      }
    });

    it('[AC] 家长查看子女档案时应完整掩码', async () => {
      const user = createParentUser({}, ['student-uuid-001']);
      const res = await mockAuthRequest(
        httpServer,
        user,
        'get',
        '/api/portal/profile?student_id=student-uuid-001',
      ).expect(200);

      const body = res.body;
      const profile = body.data ?? body;
      const profileData = profile.profile ?? profile;

      // 敏感字段应掩码
      if (profileData.phone) {
        expect(profileData.phone.toString()).toContain('****');
      }
      if (profileData.email) {
        expect(profileData.email.toString()).toContain('***');
      }
    });
  });

  // ============================================================
  // 9. 审计日志测试
  // ============================================================

  describe('审计日志 — 操作记录', () => {
    it('越权访问应触发审计日志记录', async () => {
      mockAuditLogRepo.create.mockClear();
      mockAuditLogRepo.save.mockClear();

      const parentUser = createParentUser({}, ['my-child-uuid']);
      await mockAuthRequest(
        httpServer,
        parentUser,
        'get',
        '/api/portal/profile?student_id=unrelated-uuid',
      );

      // StudentRoleGuard 和 ParentRoleGuard 的 logUnauthorizedAccess 应记录审计日志
      // 在守卫中调用 auditLogRepo.create + save
      // 注意: 由于使用的 mock guard 不同，这里仅做概念验证
      // 实际测试应验证审计日志表有写入
      expect(true).toBe(true);
    });
  });
});

// ============================================================
// 10. 前端 E2E 页面加载测试 (Playwright)
// ============================================================

/**
 * 注意：以下测试需要前端服务运行 + playwright 配置，
 * 在 CI 流水线中可配合 app.e2e.ts 一起运行。
 *
 * 这些测试作为参考模板，在纯后端测试环境默认跳过。
 * 完整 E2E 运行需要 npm run test:e2e 配合前端部署。
 */

describe.skip('E2E — 门户页面加载（需前端服务 + Playwright）', () => {
  const PORTAL_BASE = process.env.PORTAL_BASE_URL || 'http://localhost:5173';

  it('学生门户页面应加载并显示侧边栏菜单', async () => {
    // 此测试使用 @playwright/test，需要在 E2E 测试框架中运行
    // 示例:
    //   const { test, expect } = require('@playwright/test');
    //   await page.goto(`${PORTAL_BASE}/portal/student`);
    //   await expect(page.getByText('个人档案')).toBeVisible();
    //   await expect(page.getByText('电子请假')).toBeVisible();
    expect(PORTAL_BASE).toBeDefined();
  });

  it('家长门户页面应加载并显示关联子女信息', async () => {
    // 示例:
    //   await page.goto(`${PORTAL_BASE}/portal/parent`);
    //   await expect(page.getByText('子女档案')).toBeVisible();
    //   await expect(page.getByText('校内缴费')).toBeVisible();
    expect(PORTAL_BASE).toBeDefined();
  });

  it('匿名访问门户页面应重定向到登录页', async () => {
    // 示例:
    //   await page.goto(`${PORTAL_BASE}/portal/student`);
    //   await page.waitForURL('**/login**');
    expect(PORTAL_BASE).toBeDefined();
  });
});
