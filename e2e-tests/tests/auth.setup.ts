import { test as setup, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * 认证状态预填充 - 单角色支持 (staff1/校务处同工)
 * 使用 staff1 账号登录并保存认证状态
 */

async function loginAsStaff(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  
  // 使用校务处同工账号登录
  await loginPage.usernameInput.fill('staff1');
  await loginPage.passwordInput.fill('Admin123!');
  await loginPage.loginButton.click();
  
  // 等待跳转到 dashboard
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
}

// Staff 角色登录
setup('Auth: 校务处同工登录', async ({ page }) => {
  await loginAsStaff(page);
  // 保存认证状态
  await page.context().storageState({ path: 'playwright/.auth/staff.json' });
});
