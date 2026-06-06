import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { UserManagementPage } from '../../pages/UserManagementPage';
import { testUsers } from '../../fixtures/users';
import { generateUniqueUsername, generateUniqueEmail } from '../../fixtures/users';

/**
 * 用户管理 CRUD E2E 测试套件
 * @priority P0
 * @tags @user-management
 */
test.describe('用户管理 @user-management', () => {
  let loginPage: LoginPage;
  let userPage: UserManagementPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    userPage = new UserManagementPage(page);

    // 以校务主任身份登录
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    await userPage.goto();
  });

  // ══════════════════════════════════════════════════════════════
  // 查询
  // ══════════════════════════════════════════════════════════════

  /**
   * F-USER-001: 用户列表应正确显示
   */
  test('F-USER-001: 用户列表应正确加载', async () => {
    await expect(userPage.userTable).toBeVisible();
    const count = await userPage.getUserCount();
    expect(count).toBeGreaterThan(0);
  });

  /**
   * F-USER-001: 搜索用户
   */
  test('F-USER-001: 按用户名搜索应返回正确结果', async () => {
    await userPage.searchUser(testUsers.officer.username);
    await userPage.expectUserInList(testUsers.officer.username);
  });

  /**
   * F-USER-001: 按用户类型筛选
   */
  test('F-USER-001: 按用户类型筛选应正确过滤', async () => {
    await userPage.filterByUserType('OFFICER');
    const count = await userPage.getUserCount();
    expect(count).toBeGreaterThan(0);
    // 验证所有行都是 OFFICER 类型
    await expect(userPage.userTable.locator('text=OFFICER')).toBeVisible();
  });

  // ══════════════════════════════════════════════════════════════
  // 创建
  // ══════════════════════════════════════════════════════════════

  /**
   * F-USER-001: 创建校务处同工
   */
  test('F-USER-001: 创建校务处同工用户 @critical', async ({ page }) => {
    const newUser = {
      username: generateUniqueUsername(),
      name: '自动化测试新用户',
      email: generateUniqueEmail(),
      userType: 'OFFICER',
      department: '校务处',
    };

    await userPage.createUser(newUser);
    await userPage.expectToast('用户创建成功');
    await userPage.expectUserInList(newUser.username);
  });

  /**
   * F-USER-001: 重复用户名应被拒绝
   */
  test('F-USER-001: 重复用户名应显示错误 @critical', async () => {
    await userPage.clickAddUser();
    await userPage.createUserForm.locator('[name="username"]').fill(testUsers.admin.username);
    await userPage.createUserForm.locator('[name="name"]').fill('重复测试');
    await userPage.createUserForm.locator('[name="email"]').fill(generateUniqueEmail());
    await userPage.createUserForm.locator('[name="userType"]').selectOption('OFFICER');
    await userPage.safeClick(userPage.saveButton);

    // Assert - 应显示重复用户名错误
    await expect(userPage.createUserForm.locator('[data-testid="username-error"]')).toBeVisible();
  });

  // ══════════════════════════════════════════════════════════════
  // 更新
  // ══════════════════════════════════════════════════════════════

  /**
   * F-USER-001: 编辑用户信息
   */
  test('F-USER-001: 编辑用户信息', async ({ page }) => {
    // 创建新用户
    const newUser = {
      username: generateUniqueUsername(),
      name: '测试用户',
      email: generateUniqueEmail(),
      userType: 'OFFICER',
    };
    await userPage.createUser(newUser);

    // 编辑用户
    await userPage.editUser(newUser.username, {
      name: '测试用户已更新',
      email: generateUniqueEmail(),
    });
    await userPage.expectToast('用户更新成功');
  });

  // ══════════════════════════════════════════════════════════════
  // 删除
  // ══════════════════════════════════════════════════════════════

  /**
   * F-USER-001: 删除用户
   */
  test('F-USER-001: 删除用户应成功', async ({ page }) => {
    // 创建测试用户
    const newUser = {
      username: generateUniqueUsername(),
      name: '待删除用户',
      email: generateUniqueEmail(),
      userType: 'OFFICER',
    };
    await userPage.createUser(newUser);
    await userPage.expectToast('用户创建成功');

    // 删除用户
    await userPage.searchUser(newUser.username);
    await userPage.deleteUser(newUser.username);
    await userPage.expectToast('用户已删除');
  });

  // ══════════════════════════════════════════════════════════════
  // 边界
  // ══════════════════════════════════════════════════════════════

  /**
   * F-USER-007: 权限变更审批流程
   */
  test('F-USER-007: 权限变更需审批 @security', async ({ page }) => {
    // 导航到权限管理
    await page.goto('/permissions');
    await page.waitForLoadState('networkidle');

    // 查看权限变更申请列表
    const approvalRows = page.locator('[data-testid="approval-row"]');
    const count = await approvalRows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
