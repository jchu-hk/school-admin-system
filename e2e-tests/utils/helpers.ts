import { Page, test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Test helper utility functions
 */

/**
 * Get current date in Asia/Hong_Kong timezone, formatted as YYYY-MM-DD
 */
function hkDate(daysOffset: number = 0): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return formatter.format(d);
}

/**
 * 登录辅助函数
 */
export async function loginAs(
  page: Page,
  role: 'admin' | 'officer' | 'teacher' | 'parent',
): Promise<void> {
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
}

/**
 * 等待元素稳定 (用于处理 flaky tests)
 */
export async function waitForStable(
  page: Page,
  selector: string,
  timeout: number = 5000,
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return el && !el.getAttribute('data-loading');
    },
    selector,
    { timeout },
  );
}

/**
 * Generate random date in the future (within N days)
 * Uses Asia/Hong_Kong timezone
 */
export function getRandomFutureDate(daysAhead: number = 7): string {
  const offset = Math.floor(Math.random() * daysAhead) + 1;
  return hkDate(offset);
}

/**
 * Generate random date in the past (within N days)
 * Uses Asia/Hong_Kong timezone
 */
export function getRandomPastDate(daysBack: number = 30): string {
  const offset = -(Math.floor(Math.random() * daysBack) + 1);
  return hkDate(offset);
}

/**
 * Format date as YYYY-MM-DD (in Asia/Hong_Kong timezone)
 */
export function formatDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Get today's date (in Asia/Hong_Kong timezone)
 */
export function getToday(): string {
  return hkDate(0);
}

/**
 * 截屏辅助 (失败时自动调用)
 */
export async function takeScreenshotOnFailure(
  page: Page,
  testName: string,
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `reports/screenshots/failure-${testName}-${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 截图已保存: ${filename}`);
}

/**
 * 清除所有 Cookie
 */
export async function clearCookies(page: Page): Promise<void> {
  await page.context().clearCookies();
}

/**
 * 强制等待 (慎用)
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 获取元素文本并去除空格
 */
export async function getCleanText(page: Page, selector: string): Promise<string> {
  const text = await page.locator(selector).textContent();
  return (text || '').replace(/\s+/g, ' ').trim();
}

/**
 * 验证表格行数
 */
export async function expectTableRowCount(
  page: Page,
  tableSelector: string,
  expectedCount: number,
): Promise<void> {
  const rows = page.locator(`${tableSelector} tr`);
  const count = await rows.count();
  if (count !== expectedCount) {
    throw new Error(`Expected ${expectedCount} rows, but found ${count}`);
  }
}

/**
 * 滚动到页面底部
 */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

/**
 * 滚动到页面顶部
 */
export async function scrollToTop(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, 0));
}
