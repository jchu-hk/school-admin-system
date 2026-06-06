import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * 通知管理页面 Page Object
 */
export class NotificationPage extends BasePage {
  // 导航
  readonly newNotificationButton: Locator;
  readonly templateListTab: Locator;
  readonly historyTab: Locator;

  // 创建通知表单
  readonly templateSelect: Locator;
  readonly channelCheckboxes: Locator;
  readonly recipientSelect: Locator;
  readonly titleInput: Locator;
  readonly contentEditor: Locator;
  readonly sendButton: Locator;
  readonly previewButton: Locator;

  // 模板管理
  readonly templateTable: Locator;
  readonly createTemplateButton: Locator;
  readonly editTemplateButton: Locator;
  readonly deleteTemplateButton: Locator;
  readonly templateNameInput: Locator;
  readonly templateCategorySelect: Locator;
  readonly saveButton: Locator;

  // 发送历史
  readonly historyTable: Locator;
  readonly historyRows: Locator;
  readonly resendButton: Locator;
  readonly exportHistoryButton: Locator;

  // 紧急通知
  readonly urgentNotificationToggle: Locator;
  readonly autoSmsFallbackToggle: Locator;

  // 变量
  readonly variableList: Locator;
  readonly variableTag: (name: string) => Locator;

  // 发送状态
  readonly sendingProgress: Locator;
  readonly deliveryReport: Locator;

  constructor(page: Page) {
    super(page, '/notifications', 'NotificationPage');

    this.newNotificationButton = page.getByTestId('new-notification-button');
    this.templateListTab = page.getByTestId('template-list-tab');
    this.historyTab = page.getByTestId('history-tab');
    this.templateSelect = page.getByTestId('template-select');
    this.channelCheckboxes = page.getByTestId('channel-checkboxes');
    this.recipientSelect = page.getByTestId('recipient-select');
    this.titleInput = page.getByTestId('notification-title-input');
    this.contentEditor = page.getByTestId('notification-content-editor');
    this.sendButton = page.getByTestId('send-notification-button');
    this.previewButton = page.getByTestId('preview-button');
    this.templateTable = page.getByTestId('template-table');
    this.createTemplateButton = page.getByTestId('create-template-button');
    this.editTemplateButton = page.getByTestId('edit-template-button');
    this.deleteTemplateButton = page.getByTestId('delete-template-button');
    this.templateNameInput = page.getByTestId('template-name-input');
    this.templateCategorySelect = page.getByTestId('template-category-select');
    this.saveButton = page.getByTestId('save-button');
    this.historyTable = page.getByTestId('history-table');
    this.historyRows = page.locator('[data-testid="history-row"]');
    this.resendButton = page.getByTestId('resend-button');
    this.exportHistoryButton = page.getByTestId('export-history-button');
    this.urgentNotificationToggle = page.getByTestId('urgent-toggle');
    this.autoSmsFallbackToggle = page.getByTestId('auto-sms-fallback-toggle');
    this.variableList = page.getByTestId('variable-list');
    this.variableTag = (name: string) => page.locator(`[data-testid="variable-${name}"]`);
    this.sendingProgress = page.getByTestId('sending-progress');
    this.deliveryReport = page.getByTestId('delivery-report');
  }

  /**
   * 创建新通知
   */
  async createNotification(data: {
    templateId?: string;
    channels: string[];
    recipients: string[];
    title?: string;
    content?: string;
    variables?: Record<string, string>;
    isUrgent?: boolean;
  }): Promise<void> {
    await this.safeClick(this.newNotificationButton);

    if (data.templateId) {
      await this.selectOption(this.templateSelect, data.templateId);
      await this.page.waitForLoadState('networkidle');
    }

    for (const channel of data.channels) {
      await this.channelCheckboxes.locator(`[value="${channel}"]`).check();
    }

    await this.selectOption(this.recipientSelect, data.recipients);

    if (data.title) {
      await this.titleInput.fill(data.title);
    }

    if (data.content) {
      await this.contentEditor.fill(data.content);
    }

    if (data.variables) {
      for (const [name, value] of Object.entries(data.variables)) {
        const tag = this.variableTag(name);
        if (await tag.isVisible()) {
          await tag.click();
          // 填入变量值
          await this.page.getByTestId(`variable-value-${name}`).fill(value);
        }
      }
    }

    if (data.isUrgent) {
      await this.urgentNotificationToggle.check();
    }

    await this.safeClick(this.sendButton);
  }

  /**
   * 创建通知模板
   */
  async createTemplate(data: {
    name: string;
    category: string;
    channels: string[];
    content: string;
    variables: string[];
  }): Promise<void> {
    await this.safeClick(this.createTemplateButton);
    await this.templateNameInput.fill(data.name);
    await this.selectOption(this.templateCategorySelect, data.category);

    for (const channel of data.channels) {
      await this.channelCheckboxes.locator(`[value="${channel}"]`).check();
    }

    await this.contentEditor.fill(data.content);

    // 添加变量
    for (const variable of data.variables) {
      await this.page.getByTestId('add-variable-button').click();
      await this.page.getByTestId('variable-name-input').last().fill(variable);
    }

    await this.safeClick(this.saveButton);
  }

  /**
   * 查看发送历史
   */
  async viewHistory(filters?: { dateFrom?: string; dateTo?: string; status?: string }): Promise<void> {
    await this.safeClick(this.historyTab);
    if (filters?.dateFrom) {
      await this.page.getByTestId('history-date-from').fill(filters.dateFrom);
    }
    if (filters?.dateTo) {
      await this.page.getByTestId('history-date-to').fill(filters.dateTo);
    }
    if (filters?.status) {
      await this.selectOption(this.page.getByTestId('history-status-filter'), filters.status);
    }
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 重新发送通知
   */
  async resendNotification(historyId: string): Promise<void> {
    const row = this.historyRows.filter({ has: this.page.locator(`[data-testid="history-id-${historyId}"]`) });
    await row.getByTestId('resend-button').click();
    await this.page.getByTestId('confirm-resend-button').click();
  }

  /**
   * 导出发送历史
   */
  async exportHistory(): Promise<string> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.safeClick(this.exportHistoryButton),
    ]);
    return download.suggestedFilename();
  }

  /**
   * 验证发送状态
   */
  async expectDeliveryStatus(
    historyId: string,
    channel: string,
    status: 'delivered' | 'failed' | 'pending',
  ): Promise<void> {
    const row = this.historyRows.filter({ has: this.page.locator(`[data-testid="history-id-${historyId}"]`) });
    const statusCell = row.getByTestId(`channel-status-${channel}`);
    await expect(statusCell).toContainText(status);
  }
}
