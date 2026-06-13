import { test, expect } from '@playwright/test';
import { ApiClient } from '../../utils/api-client';
import { testUsers, invalidLoginData } from '../../fixtures/users';

/**
 * 认证 API 测试
 * @priority P0
 * @tags @api @auth
 */
test.describe('认证 API @api @auth', () => {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
  const client = new ApiClient(baseURL);

  /**
   * 登录成功返回 Token
   */
  test('POST /auth/login 应返回有效 accessToken 和 refreshToken', async ({ request }) => {
    const response = await request.post(`${baseURL}/auth/login`, {
      data: {
        username: testUsers.admin.username,
        password: testUsers.admin.password,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('refreshToken');
    expect(body.user).toHaveProperty('userType', 'SCHOOL_ADMIN');
    expect(body.accessToken).toMatch(/^eyJ/); // JWT format
  });

  /**
   * 登录失败返回 401
   */
  test('POST /auth/login 错误密码应返回 401', async ({ request }) => {
    const response = await request.post(`${baseURL}/auth/login`, {
      data: {
        username: testUsers.admin.username,
        password: invalidLoginData.wrongPassword,
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.message).toContain('密碼錯誤');
  });

  /**
   * 5次登录失败后账户锁定
   */
  test('POST /auth/login 连续5次失败应锁定账户(第6次返回423)', async ({ request }) => {
    const loginData = {
      username: testUsers.officer.username,
      password: invalidLoginData.wrongPassword,
    };

    // 5次失败
    for (let i = 0; i < 5; i++) {
      const r = await request.post(`${baseURL}/auth/login`, { data: loginData });
      expect(r.status()).toBe(401);
    }

    // 第6次应返回 423 Locked
    const response = await request.post(`${baseURL}/auth/login`, { data: loginData });
    expect(response.status()).toBe(423);
    const body = await response.json();
    expect(body.message).toContain('帳戶已鎖定');
  });

  /**
   * Token 刷新
   */
  test('POST /auth/refresh 应返回新的 accessToken', async ({ request }) => {
    // 先登录
    const loginRes = await request.post(`${baseURL}/auth/login`, {
      data: {
        username: testUsers.admin.username,
        password: testUsers.admin.password,
      },
    });
    const { refreshToken } = await loginRes.json();

    // 使用 refreshToken
    const refreshRes = await request.post(`${baseURL}/auth/refresh`, {
      data: { refreshToken },
    });

    expect(refreshRes.ok()).toBeTruthy();
    const body = await refreshRes.json();
    expect(body).toHaveProperty('accessToken');
    expect(body.accessToken).toMatch(/^eyJ/);
  });

  /**
   * 过期 Token 访问应返回 401
   */
  test('过期 Token 应返回 401', async ({ request }) => {
    const response = await request.get(`${baseURL}/users`, {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxfQ.expired',
      },
    });

    expect(response.status()).toBe(401);
  });

  /**
   * 登出
   */
  test('POST /auth/logout 应使 Token 失效', async ({ request }) => {
    // 登录
    const loginRes = await request.post(`${baseURL}/auth/login`, {
      data: {
        username: testUsers.admin.username,
        password: testUsers.admin.password,
      },
    });
    const { accessToken } = await loginRes.json();

    // 登出
    const logoutRes = await request.post(`${baseURL}/auth/logout`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(logoutRes.ok()).toBeTruthy();

    // 使用已登出的 Token
    const staleRes = await request.get(`${baseURL}/users`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(staleRes.status()).toBe(401);
  });
});

/**
 * 用户管理 API 测试
 * @priority P0
 * @tags @api @user-management
 */
test.describe('用户管理 API @api @user-management', () => {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
  let adminToken: string;
  let officerToken: string;

  test.beforeAll(async ({ request }) => {
    // 获取 admin token
    const adminLogin = await request.post(`${baseURL}/auth/login`, {
      data: { username: testUsers.admin.username, password: testUsers.admin.password },
    });
    const adminBody = await adminLogin.json();
    adminToken = adminBody.accessToken;

    // 获取 officer token
    const officerLogin = await request.post(`${baseURL}/auth/login`, {
      data: { username: testUsers.officer.username, password: testUsers.officer.password },
    });
    const officerBody = await officerLogin.json();
    officerToken = officerBody.accessToken;
  });

  /**
   * 获取用户列表
   */
  test('GET /users 应返回用户列表', async ({ request }) => {
    const response = await request.get(`${baseURL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBeGreaterThan(0);
  });

  /**
   * 按角色筛选用户
   */
  test('GET /users?role=OFFICER 应返回校务员列表', async ({ request }) => {
    const response = await request.get(`${baseURL}/users?role=OFFICER`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    for (const user of body.data) {
      expect(user.userType).toBe('OFFICER');
    }
  });

  /**
   * 创建用户
   */
  test('POST /users 应创建新用户', async ({ request }) => {
    const uniqueId = `test_${Date.now()}`;
    const newUser = {
      username: uniqueId,
      name: `测试用户 ${uniqueId}`,
      email: `${uniqueId}@school.edu.hk`,
      userType: 'OFFICER',
      password: 'Test@2026',
    };

    const response = await request.post(`${baseURL}/users`, {
      data: newUser,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.username).toBe(uniqueId);
  });

  /**
   * 普通用户无权访问用户管理
   */
  test('普通用户访问 /users 应返回 403', async ({ request }) => {
    const response = await request.get(`${baseURL}/users`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });

    expect(response.status()).toBe(403);
  });
});

/**
 * 请假 API 测试
 * @priority P0
 * @tags @api @leave
 */
test.describe('请假 API @api @leave', () => {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
  let parentToken: string;

  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post(`${baseURL}/auth/login`, {
      data: { username: testUsers.parent.username, password: testUsers.parent.password },
    });
    const body = await loginRes.json();
    parentToken = body.accessToken;
  });

  /**
   * 提交请假申请
   */
  test('POST /leaves 应创建请假申请', async ({ request }) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const dateStr = futureDate.toISOString().split('T')[0];

    const response = await request.post(`${baseURL}/leaves`, {
      data: {
        studentId: '2023S20101',
        leaveType: 'sick',
        startDate: dateStr,
        endDate: dateStr,
        reason: '自动化测试请假',
        hasCertificate: false,
      },
      headers: { Authorization: `Bearer ${parentToken}` },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body.status).toBe('pending');
  });

  /**
   * 获取请假列表
   */
  test('GET /leaves 应返回请假列表', async ({ request }) => {
    const response = await request.get(`${baseURL}/leaves`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  /**
   * 请假>2天无证明应被拒绝
   */
  test('POST /leaves 病假>2天无证明应返回 400', async ({ request }) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateEnd = new Date();
    dateEnd.setDate(dateEnd.getDate() + 7);
    const startStr = futureDate.toISOString().split('T')[0];
    const endStr = dateEnd.toISOString().split('T')[0];

    const response = await request.post(`${baseURL}/leaves`, {
      data: {
        studentId: '2023S20101',
        leaveType: 'sick',
        startDate: startStr,
        endDate: endStr,
        reason: '旅行',
        hasCertificate: false,
      },
      headers: { Authorization: `Bearer ${parentToken}` },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toContain('超過2天');
  });
});
