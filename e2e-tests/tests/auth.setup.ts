import { test as setup, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * 认证状态预填充
 * 这个 setup 文件在所有浏览器测试之前运行
 * 登录并保存认证状态到 .auth/user.json
 */

// 校务主任认证状态
setup('Auth: 校务主任登录', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginAsAdmin();
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/dashboard/);
});

// 其他角色的认证可以在这里添加 (需要多个 .json 文件)
