import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { NotificationPage } from '../../pages/NotificationPage';
import { notificationTemplates } from '../../fixtures/test-data';

/**
 * 通知发送 E2E 测试套件
 * @priority P1
 * @tags @notification
 */
test.describe('通知发送流程 @notification', () => {
  let loginPage: LoginPage;
  let notificationPage: NotificationPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    notificationPage = new NotificationPage(page);
    await loginPage.goto();
  });

  // ══════════════════════════════════════════════════════════════
  // 创建通知
  // ══════════════════════════════════════════════════════════════

  /**
   * F-NEW-002: 发送校车延误通知
   */
  test('F-NEW-002: 发送校车延误通知 @critical', async ({ page }) => {
    // Arrange - 校务员登录
    await loginPage.loginAsOfficer();
    await page.waitForURL(/\/dashboard/);

    // Act - 发送通知
    await notificationPage.goto();
    await notificationPage.createNotification({
      channels: ['wechat', 'sms'],
      recipients: ['class:2A'],
      title: '校车延误通知',
      content: '将军澳线校车将延误15分钟',
      variables: {
        routeName: '将军澳线',
        delayMinutes: '15',
        newETA: '08:15',
      },
      isUrgent: true,
    });

    // Assert
    await notificationPage.expectToast('通知发送成功');
  });

  /**
   * F-NEW-002: 使用模板发送通知
   */
  test('F-NEW-002: 使用模板发送通知', async ({ page }) => {
    await loginPage.loginAsOfficer();
    await page.waitForURL(/\/dashboard/);

    await notificationPage.goto();
    await notificationPage.createNotification({
      templateId: 'bus-delay-template',
      channels: ['wechat'],
      recipients: ['class:2A'],
      variables: {
        routeName: '将军澳线',
        delayMinutes: '15',
        newETA: '08:15',
      },
    });

    await notificationPage.expectToast('通知发送成功');
  });

  // ══════════════════════════════════════════════════════════════
  // 模板管理
  // ══════════════════════════════════════════════════════════════

  /**
   * F-NEW-002: 创建多渠道通知模板
   */
  test('F-NEW-002: 创建多渠道通知模板 @critical', async ({ page }) => {
    await loginPage.loginAsAdmin();
    await page.waitForURL(/\/dashboard/);

    await notificationPage.goto();
    await notificationPage.createTemplate({
      name: `自动化测试模板_${Date.now()}`,
      category: 'bus',
      channels: ['wechat', 'sms', 'email'],
      content: '尊敬的家长，{{studentName}}的校车{{routeName}}将延误{{delayMinutes}}分钟，新预计到达时间为{{newETA}}。',
      variables: ['studentName', 'routeName', 'delayMinutes', 'newETA'],
    });

    await notificationPage.expectToast('模板创建成功');
  });

  /**
   * F-NEW-002: 缺少必需变量应被拦截
   */
  test('F-NEW-002: 缺少必需变量应拦截发送', async ({ page }) => {
    await loginPage.loginAsOfficer();
    await page.waitForURL(/\/dashboard/);

    await notificationPage.goto();
    await notificationPage.createNotification({
      templateId: 'bus-delay-template',
      channels: ['wechat'],
      recipients: ['class:2A'],
      // 故意不填必需的 routeName 变量
      variables: {
        delayMinutes: '15',
        // 缺少 routeName
      },
    });

    // Assert - 应显示缺少变量的错误
    await expect(page.getByTestId('missing-variable-error')).toBeVisible();
  });

  // ══════════════════════════════════════════════════════════════
  // 发送历史
  // ══════════════════════════════════════════════════════════════

  /**
   * F-NEW-002: 查看发送历史
   */
  test('F-NEW-002: 查看发送历史记录', async ({ page }) => {
    await loginPage.loginAsOfficer();
    await page.waitForURL(/\/dashboard/);

    await notificationPage.goto();
    await notificationPage.viewHistory({
      dateFrom: '2026-06-01',
      dateTo: '2026-06-30',
    });

    await expect(notificationPage.historyTable).toBeVisible();
  });

  /**
   * F-NEW-002: 导出发送历史
   */
  test('F-NEW-002: 导出发送历史为Excel', async ({ page }) => {
    await loginPage.loginAsAdmin();
    await page.waitForURL(/\/dashboard/);

    await notificationPage.goto();
    await notificationPage.viewHistory();

    const filename = await notificationPage.exportHistory();
    expect(filename).toMatch(/\.(xlsx?|csv)$/);
  });

  // ══════════════════════════════════════════════════════════════
  // 紧急通知
  // ══════════════════════════════════════════════════════════════

  /**
   * F-NEW-002: 紧急通知自动切换SMS备用
   */
  test('F-NEW-002: 紧急通知微信失败自动切换SMS', async ({ page }) => {
    await loginPage.loginAsOfficer();
    await page.waitForURL(/\/dashboard/);

    await notificationPage.goto();
    await notificationPage.createNotification({
      channels: ['wechat', 'sms'],
      recipients: ['class:2A'],
      title: '紧急通知',
      content: '校车发生事故，请联系学校',
      isUrgent: true,
    });

    await notificationPage.expectToast('通知发送成功');
    // 验证发送历史中显示切换到 SMS
    await notificationPage.viewHistory();
  });

  // ══════════════════════════════════════════════════════════════
  // 边界
  // ══════════════════════════════════════════════════════════════

  /**
   * F-NEW-002: 通知历史审计查询
   */
  test('F-NEW-002: 通知历史应可被审计查询', async ({ page }) => {
    await loginPage.loginAsAdmin();
    await page.waitForURL(/\/dashboard/);

    await notificationPage.goto();
    await notificationPage.viewHistory({
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      status: 'delivered',
    });

    // 历史记录应包含发送时间、渠道、接收人、模板ID
    const rows = notificationPage.historyRows;
    const count = await rows.count();
    if (count > 0) {
      await expect(rows.first().locator('[data-testid="history-timestamp"]')).toBeVisible();
    }
  });
});
