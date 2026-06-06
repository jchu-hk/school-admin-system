import { test as setup, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * 认证状态预填充 - 多角色支持
 * 这个 setup 文件在所有浏览器测试之前运行
 * 登录并保存认证状态到 .auth/{role}.json
 *
 * 使用方法:
 * - admin:   pnpm playwright test --project=chromium --storage-state=playwright/.auth/admin.json
 * - officer: pnpm playwright test --project=chromium --storage-state=playwright/.auth/officer.json
 * - teacher: pnpm playwright test --project=chromium --storage-state=playwright/.auth/teacher.json
 * - parent:  pnpm playwright test --project=chromium --storage-state=playwright/.auth/parent.json
 *
 * 或在 playwright.config.ts 中为每个项目指定对应的 storageState
 */

type Role = 'admin' | 'officer' | 'teacher' | 'parent';

const roleConfigs: Record<Role, { name: string; storageState: string }> = {
  admin: {
    name: '校务主任',
    storageState: 'playwright/.auth/admin.json',
  },
  officer: {
    name: '校务处同工',
    storageState: 'playwright/.auth/officer.json',
  },
  teacher: {
    name: '教师',
    storageState: 'playwright/.auth/teacher.json',
  },
  parent: {
    name: '家长',
    storageState: 'playwright/.auth/parent.json',
  },
};

// 通用登录函数
async function loginAsRole(page: Page, role: Role): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  switch (role) {
    case 'admin':
      await loginPage.loginAsAdmin();
      break;
    case 'officer':
      await loginPage.loginAsOfficer();
      break;
    case 'teacher':
      await loginPage.loginAsTeacher();
      break;
    case 'parent':
      await loginPage.loginAsParent();
      break;
  }

  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/(dashboard|home)/);
}

// 为每个角色创建独立的 setup
for (const [role, config] of Object.entries(roleConfigs)) {
  setup(`Auth: ${config.name} 登录`, async ({ page }) => {
    await loginAsRole(page, role as Role);
    // 保存该角色的认证状态到独立文件
    await page.context().storageState({ path: config.storageState });
  });
}

