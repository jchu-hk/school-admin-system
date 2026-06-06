import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { testUsers, invalidLoginData, getMockOTP } from '../../fixtures/users';

/**
 * 用户认证 E2E 测试套件
 * @priority P0
 * @tags @auth @smoke
 */
test.describe('用户认证流程 @auth', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  // ══════════════════════════════════════════════════════════════
  // 正常流程
  // ══════════════════════════════════════════════════════════════

  /**
   * USER-002-01: 账号密码登录成功
   * 校务主任应能成功登录，跳转到仪表板
   */
  test('USER-002-01: 校务主任账号密码登录成功 @critical', async ({ page }) => {
    // Act
    await loginPage.login(testUsers.admin.username, testUsers.admin.password);

    // Assert
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });

  /**
   * USER-002-01: 校务处同工登录
   */
  test('USER-002-01: 校务处同工登录成功', async ({ page }) => {
    await loginPage.login(testUsers.officer.username, testUsers.officer.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });

  /**
   * USER-002-01: 教师登录
   */
  test('USER-002-01: 教师登录成功', async ({ page }) => {
    await loginPage.login(testUsers.teacher.username, testUsers.teacher.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });

  /**
   * USER-002-03: 家长短信 OTP 登录
   */
  test('USER-002-03: 家长OTP短信登录 @critical', async ({ page }) => {
    // Act - 切换到 OTP 登录
    await loginPage.switchToOtpLogin();
    await loginPage.sendOtp(testUsers.parent.phone);
    await loginPage.verifyOtp(getMockOTP());

    // Assert
    await expect(page).toHaveURL(/\/(parent-portal|dashboard)\//, { timeout: 15000 });
  });

  // ══════════════════════════════════════════════════════════════
  // 异常流程
  // ══════════════════════════════════════════════════════════════

  /**
   * USER-002-04: 密码错误5次锁定
   */
  test('USER-002-04: 连续5次密码错误应锁定账户 @security', async ({ page }) => {
    // Arrange
    const wrongPassword = invalidLoginData.wrongPassword;

    // Act - 连续5次错误登录
    for (let i = 0; i < 5; i++) {
      await loginPage.login(testUsers.officer.username, wrongPassword);
      await loginPage.expectLoginError('密碼錯誤');
      // 重新加载页面继续尝试
      if (i < 4) {
        await loginPage.goto();
      }
    }

    // Assert - 第6次应看到锁定提示
    await loginPage.expectAccountLocked(15);
  });

  /**
   * 错误用户名登录
   */
  test('USER-002-04: 错误用户名应显示友好错误', async ({ page }) => {
    await loginPage.login(invalidLoginData.wrongUsername, testUsers.admin.password);
    await loginPage.expectLoginError('用戶不存在');
  });

  /**
   * 空用户名/密码
   */
  test('表单验证: 空用户名和密码应显示验证错误', async ({ page }) => {
    await loginPage.loginButton.click();
    await expect(page.getByTestId('username-error')).toBeVisible();
    await expect(page.getByTestId('password-error')).toBeVisible();
  });

  /**
   * USER-002-06: 密码复杂度校验
   */
  test('USER-002-06: 弱密码应被拒绝 @security', async ({ page }) => {
    // Arrange - 导航到修改密码页面
    await loginPage.login(testUsers.admin.username, testUsers.admin.password);
    await page.goto('/change-password');
    await page.waitForLoadState('networkidle');

    // Act - 输入弱密码
    await page.getByTestId('current-password').fill(testUsers.admin.password);
    await page.getByTestId('new-password').fill(invalidLoginData.weakPassword);
    await page.getByTestId('confirm-password').fill(invalidLoginData.weakPassword);
    await page.getByTestId('submit').click();

    // Assert - 应显示复杂度不足错误
    await expect(page.getByTestId('password-error')).toContainText('複雜度');
  });

  // ══════════════════════════════════════════════════════════════
  // 边界场景
  // ══════════════════════════════════════════════════════════════

  /**
   * 登录后登出
   */
  test('登出: 成功登出并跳转回登录页', async ({ page }) => {
    await loginPage.login(testUsers.admin.username, testUsers.admin.password);
    await page.waitForURL(/\/dashboard/);
    await dashboardPage.logout();
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * 语言切换
   */
  test('界面: 语言切换后界面文本正确切换', async ({ page }) => {
    await loginPage.switchLanguage('en');
    await expect(page.getByTestId('login-button')).toContainText('Log In');
    await loginPage.switchLanguage('zh-HK');
    await expect(page.getByTestId('login-button')).toContainText('登入');
  });
});
