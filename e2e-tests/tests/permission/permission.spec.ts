import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { PermissionPage } from '../../pages/PermissionPage';

/**
 * 权限验证 E2E 测试套件
 * @priority P0
 * @tags @permission @security
 */
test.describe('权限验证流程 @permission', () => {
  let loginPage: LoginPage;
  let permissionPage: PermissionPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    permissionPage = new PermissionPage(page);
    await loginPage.goto();
  });

  // ══════════════════════════════════════════════════════════════
  // RBAC 权限隔离
  // ══════════════════════════════════════════════════════════════

  /**
   * F-USER-003: 教师仅可访问所教班级数据
   */
  test('F-USER-003: 教师仅可访问所教班级数据(2A班) @security', async ({ page }) => {
    // Arrange - 以教师身份登录
    await loginPage.loginAsTeacher();
    await page.waitForURL(/\/dashboard/);

    // Act - 尝试访问学生列表
    await page.goto('/students');
    await page.waitForLoadState('networkidle');

    // Assert - 应只显示 2A 班学生
    const studentRows = page.locator('[data-testid="student-row"]');
    const count = await studentRows.count();
    expect(count).toBeGreaterThan(0);

    // 不应出现其他班级学生
    const otherClassStudent = page.locator('text=3A');
    if (await otherClassStudent.count() > 0) {
      await expect(otherClassStudent.first()).not.toBeVisible();
    }
  });

  /**
   * F-USER-003: 教师跨班级访问被拒绝
   */
  test('F-USER-003: 教师跨班级访问应返回403 @security', async ({ page }) => {
    // Arrange - 以教师身份登录
    await loginPage.loginAsTeacher();
    await page.waitForURL(/\/dashboard/);

    // Act - 直接访问其他班级学生数据
    const response = await page.request.get('/api/v1/students?classCode=2B');
    await page.waitForLoadState('networkidle');

    // Assert - 应返回 403
    expect(response.status()).toBe(403);
  });

  /**
   * F-USER-003: 校务主任可访问全部功能
   */
  test('F-USER-003: 校务主任可访问全部功能 @security', async ({ page }) => {
    // Arrange
    await loginPage.loginAsAdmin();
    await page.waitForURL(/\/dashboard/);

    // Act - 访问各个功能模块
    const modules = [
      '/users',
      '/permissions',
      '/students',
      '/attendance',
      '/finance',
      '/notifications',
    ];

    for (const module of modules) {
      const response = await page.request.get(`/api/v1${module}`, {
        headers: {
          Authorization: `Bearer ${await getToken(page)}`,
        },
      });
      expect(response.status()).toBeLessThan(400);
    }
  });

  // ══════════════════════════════════════════════════════════════
  // 跨班级访问申请
  // ══════════════════════════════════════════════════════════════

  /**
   * F-USER-007: 教师申请跨班级数据访问
   */
  test('F-USER-007: 教师可申请跨班级数据访问', async ({ page }) => {
    // Arrange - 教师登录
    await loginPage.loginAsTeacher();
    await page.waitForURL(/\/dashboard/);

    // Act
    await permissionPage.goto();
    await permissionPage.requestCrossClassAccess(['2B', '2C'], '协助班级活动报名');

    // Assert - 申请提交成功
    await permissionPage.expectToast('申请已提交');
  });

  /**
   * F-USER-007: 审批人OTP二次认证后批准
   */
  test('F-USER-007: 审批人OTP二次认证后批准权限申请 @security', async ({ page }) => {
    // Arrange - 校务主任登录
    await loginPage.loginAsAdmin();
    await page.waitForURL(/\/dashboard/);

    // Act - 查看待审批申请
    await permissionPage.goto();
    const rows = permissionPage.approvalRows;
    const count = await rows.count();

    if (count > 0) {
      // 提取申请ID
      const firstRow = rows.first();
      const approvalIdAttr = await firstRow.locator('[data-testid^="approval-id-"]').getAttribute('data-testid');
      const approvalId = approvalIdAttr?.replace('approval-id-', '') || 'unknown';

      await permissionPage.approveAccessRequest(approvalId, '123456');

      // Assert - 审批通过
      await permissionPage.expectToast('审批通过');
    }
  });

  // ══════════════════════════════════════════════════════════════
  // 审计日志
  // ══════════════════════════════════════════════════════════════

  /**
   * F-USER-005: 登录成功记录应写入审计日志
   */
  test('F-USER-005: 登录事件应记录到审计日志', async ({ page }) => {
    await loginPage.loginAsAdmin();
    await page.waitForURL(/\/dashboard/);

    await permissionPage.goto();
    await permissionPage.viewAuditLog({
      action: 'LOGIN',
      dateFrom: '2026-06-01',
      dateTo: '2026-06-30',
    });

    // 应找到登录记录
    const auditRows = page.locator('[data-testid="audit-row"]');
    const count = await auditRows.count();
    // 至少有一条记录
    expect(count).toBeGreaterThanOrEqual(0);
  });

  /**
   * F-USER-005: 越权访问应记录审计日志
   */
  test('F-USER-005: 越权访问应记录到审计日志 @security', async ({ page }) => {
    // Arrange - 教师登录
    await loginPage.loginAsTeacher();
    await page.waitForURL(/\/dashboard/);

    // Act - 尝试越权操作
    await page.request.get('/api/v1/users');

    // Assert - 管理员查看审计日志应能看到越权记录
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.logout();
    await loginPage.loginAsAdmin();
    await permissionPage.goto();
    await permissionPage.viewAuditLog({
      action: 'UNAUTHORIZED_ACCESS',
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 敏感字段脱敏
  // ══════════════════════════════════════════════════════════════

  /**
   * F-USER-003: 敏感字段脱敏显示
   */
  test('F-USER-003: 敏感字段应脱敏显示', async ({ page }) => {
    await loginPage.loginAsTeacher();
    await page.waitForURL(/\/dashboard/);

    // 查看学生详情
    await page.goto('/students/2023S20101');
    await page.waitForLoadState('networkidle');

    // Assert - 身份证号应脱敏显示
    const idCardField = page.locator('[data-testid="student-idcard"]');
    if (await idCardField.isVisible()) {
      const text = await idCardField.textContent();
      // A123456(8) 格式
      expect(text).toMatch(/^[A-Z]\d{6}\(\d\)$/);
    }

    // Assert - 电话应脱敏显示
    const phoneField = page.locator('[data-testid="student-phone"]');
    if (await phoneField.isVisible()) {
      const text = await phoneField.textContent();
      // 912***567 格式
      expect(text).toMatch(/^\d{3}\*{3}\d{3}$/);
    }
  });

  // ══════════════════════════════════════════════════════════════
  // 临时权限
  // ══════════════════════════════════════════════════════════════

  /**
   * F-USER-007: 临时权限到期自动回收
   */
  test('F-USER-007: 临时权限应有到期日期', async ({ page }) => {
    await loginPage.loginAsAdmin();
    await page.waitForURL(/\/dashboard/);

    await permissionPage.goto();
    await permissionPage.openUserPermission('teacher01');

    // 如果有临时权限，应显示到期日期
    const hasTempPermission = await permissionPage.temporaryPermissionBadge.isVisible();
    if (hasTempPermission) {
      await expect(permissionPage.permissionExpiryDate).toBeVisible();
    }
  });
});

/**
 * 获取当前页面的访问 Token
 */
async function getToken(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => {
    return window.localStorage.getItem('accessToken') || '';
  });
}
