import { Page, Locator, expect } from '@playwright/test';

/**
 * 基础页面对象
 * 所有 Page Object 的基类
 * 提供通用操作方法
 */
export abstract class BasePage {
  readonly page: Page;
  readonly url: string;
  readonly pageName: string;

  constructor(page: Page, url: string = '/', pageName: string = 'BasePage') {
    this.page = page;
    this.url = url;
    this.pageName = pageName;
  }

  /**
   * 导航到页面
   */
  async goto(): Promise<void> {
    await this.page.goto(this.url);
    await this.waitForLoad();
  }

  /**
   * 等待页面加载完成
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 获取元素文本内容
   */
  async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) || '';
  }

  /**
   * 安全点击 (等待元素可见后再点击)
   */
  async safeClick(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: options?.timeout ?? 10000 });
    await locator.click();
  }

  /**
   * 填写表单并验证值已填入
   */
  async fillAndVerify(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
    await expect(locator).toHaveValue(value);
  }

  /**
   * 等待并验证 Toast 消息
   */
  async expectToast(message: string, timeout: number = 5000): Promise<void> {
    const toast = this.page.locator('[data-testid="toast-message"]');
    await expect(toast).toContainText(message, { timeout });
    await toast.waitFor({ state: 'hidden', timeout: timeout + 1000 });
  }

  /**
   * 截图 (带时间戳)
   */
  async screenshot(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = `reports/screenshots/${name}-${timestamp}.png`;
    await this.page.screenshot({ path, fullPage: true });
    return path;
  }

  /**
   * 等待导航完成
   */
  async waitForNavigation(callback: () => Promise<unknown>): Promise<void> {
    await Promise.all([this.page.waitForLoadState('networkidle'), callback()]);
  }

  /**
   * 检查元素是否存在
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible().catch(() => false);
  }

  /**
   * 等待元素可点击
   */
  async waitForClickable(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.waitFor({ state: 'attached' });
  }

  /**
   * 获取页面标题
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * 滚动到元素
   */
  async scrollTo(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * 下拉选择
   */
  async selectOption(locator: Locator, value: string | string[]): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.selectOption(value);
  }

  /**
   * 关闭当前页面/弹窗
   */
  async closeDialog(): Promise<void> {
    const dialog = this.page.locator('[role="dialog"]');
    if (await dialog.isVisible()) {
      await this.page.keyboard.press('Escape');
    }
  }

  /**
   * 验证当前 URL
   */
  async expectUrl(pattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }
}
