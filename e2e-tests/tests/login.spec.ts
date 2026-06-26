import { test, expect } from '@playwright/test';

// 测试配置
const TEST_USER = {
  username: 'staff1',
  password: 'Admin123!',
};

test.describe('登录功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('登录页面正确显示', async ({ page }) => {
    await expect(page.getByText('智慧校园管理系统')).toBeVisible();
    await expect(page.getByPlaceholder('admin')).toBeVisible();
    await expect(page.getByRole('button', { name: /登录/i })).toBeVisible();
  });

  test('空用户名显示验证错误', async ({ page }) => {
    await page.getByRole('button', { name: /登录/i }).click();
    await expect(page.getByText('请输入用户名')).toBeVisible();
  });

  test('成功登录并跳转到Dashboard', async ({ page }) => {
    await page.getByPlaceholder('admin').fill(TEST_USER.username);
    await page.getByLabel('密码').fill(TEST_USER.password);
    await page.getByRole('button', { name: /登录/i }).click();
    
    // 等待跳转到Dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await expect(page.getByText('仪表板')).toBeVisible();
  });

  test('登录后Token保存到localStorage', async ({ page }) => {
    await page.getByPlaceholder('admin').fill(TEST_USER.username);
    await page.getByLabel('密码').fill(TEST_USER.password);
    await page.getByRole('button', { name: /登录/i }).click();
    
    // 等待登录完成
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // 验证Token存在
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    expect(token?.length).toBeGreaterThan(100);
  });

  test('错误密码登录失败', async ({ page }) => {
    await page.getByPlaceholder('admin').fill(TEST_USER.username);
    await page.getByLabel('密码').fill('wrongpassword');
    await page.getByRole('button', { name: /登录/i }).click();
    
    await expect(page.getByText('用户名或密码错误')).toBeVisible({ timeout: 5000 });
  });
});
