import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * 仪表板 (Dashboard) 页面 Page Object
 */
export class DashboardPage extends BasePage {
  // 导航
  readonly navMenu: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  // 欢迎信息
  readonly welcomeMessage: Locator;
  readonly currentDate: Locator;

  // 仪表板组件
  readonly attendanceWidget: Locator;
  readonly attendancePresentCount: Locator;
  readonly attendanceLateCount: Locator;
  readonly attendanceAbsentCount: Locator;

  readonly lunchOrderWidget: Locator;
  readonly inquiryQueueWidget: Locator;
  readonly feeTrackerWidget: Locator;

  // 快捷操作
  readonly quickActions: Locator;
  readonly newLeaveButton: Locator;

  // 语言切换
  readonly languageSwitcher: Locator;

  // 通知铃铛
  readonly notificationBell: Locator;
  readonly notificationBadge: Locator;

  constructor(page: Page) {
    super(page, '/dashboard', 'DashboardPage');

    this.navMenu = page.locator('nav');
    this.userMenu = page.getByTestId('user-menu');
    this.logoutButton = page.getByTestId('logout-button');
    this.welcomeMessage = page.getByTestId('welcome-message');
    this.currentDate = page.getByTestId('current-date');
    this.attendanceWidget = page.getByTestId('attendance-widget');
    this.attendancePresentCount = page.getByTestId('attendance-present-count');
    this.attendanceLateCount = page.getByTestId('attendance-late-count');
    this.attendanceAbsentCount = page.getByTestId('attendance-absent-count');
    this.lunchOrderWidget = page.getByTestId('lunch-order-widget');
    this.inquiryQueueWidget = page.getByTestId('inquiry-queue-widget');
    this.feeTrackerWidget = page.getByTestId('fee-tracker-widget');
    this.quickActions = page.getByTestId('quick-actions');
    this.newLeaveButton = page.getByTestId('new-leave-button');
    this.languageSwitcher = page.getByTestId('language-switcher');
    this.notificationBell = page.getByTestId('notification-bell');
    this.notificationBadge = page.getByTestId('notification-badge');
  }

  /**
   * 打开用户菜单
   */
  async openUserMenu(): Promise<void> {
    await this.safeClick(this.userMenu);
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.safeClick(this.logoutButton);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 验证登录用户名称
   */
  async expectUserName(name: string): Promise<void> {
    await expect(this.welcomeMessage).toContainText(name);
  }

  /**
   * 获取出勤统计数字
   */
  async getAttendanceStats(): Promise<{
    present: number;
    late: number;
    absent: number;
  }> {
    const present = parseInt((await this.attendancePresentCount.textContent()) || '0', 10);
    const late = parseInt((await this.attendanceLateCount.textContent()) || '0', 10);
    const absent = parseInt((await this.attendanceAbsentCount.textContent()) || '0', 10);
    return { present, late, absent };
  }

  /**
   * 点击新增请假
   */
  async clickNewLeave(): Promise<void> {
    await this.safeClick(this.newLeaveButton);
  }

  /**
   * 打开通知
   */
  async openNotifications(): Promise<void> {
    await this.safeClick(this.notificationBell);
  }

  /**
   * 获取通知数量
   */
  async getNotificationCount(): Promise<number> {
    const badge = this.notificationBadge;
    if (!(await badge.isVisible())) return 0;
    const text = await badge.textContent();
    return parseInt(text || '0', 10);
  }

  /**
   * 导航到指定模块
   */
  async navigateTo(moduleName: string): Promise<void> {
    await this.safeClick(this.navMenu.locator(`text=${moduleName}`));
  }
}
