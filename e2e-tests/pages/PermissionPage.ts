import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * 权限管理页面 Page Object
 */
export class PermissionPage extends BasePage {
  // 导航
  readonly userListTab: Locator;
  readonly roleConfigTab: Locator;
  readonly auditLogTab: Locator;

  // 用户权限
  readonly userTable: Locator;
  readonly userPermissionButton: Locator;
  readonly permissionPanel: Locator;
  readonly roleSelect: Locator;

  // 权限列表
  readonly permissionTree: Locator;
  readonly permissionNode: (permissionId: string) => Locator;
  readonly permissionCheckbox: (permissionId: string) => Locator;

  // 跨班级访问申请
  readonly crossClassAccessButton: Locator;
  readonly crossClassModal: Locator;
  readonly classCheckbox: (classCode: string) => Locator;
  readonly accessReasonInput: Locator;
  readonly submitAccessRequest: Locator;

  // 审批流程
  readonly approvalList: Locator;
  readonly approvalRows: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly otpModal: Locator;

  // 审计日志
  readonly auditTable: Locator;
  readonly auditFilterUser: Locator;
  readonly auditFilterAction: Locator;
  readonly auditFilterDateFrom: Locator;
  readonly auditFilterDateTo: Locator;

  // 临时权限
  readonly temporaryPermissionBadge: Locator;
  readonly permissionExpiryDate: Locator;

  // 权限验证错误
  readonly accessDeniedMessage: Locator;

  constructor(page: Page) {
    super(page, '/permissions', 'PermissionPage');

    this.userListTab = page.getByTestId('user-list-tab');
    this.roleConfigTab = page.getByTestId('role-config-tab');
    this.auditLogTab = page.getByTestId('audit-log-tab');
    this.userTable = page.getByTestId('user-permission-table');
    this.userPermissionButton = page.getByTestId('user-permission-button');
    this.permissionPanel = page.getByTestId('permission-panel');
    this.roleSelect = page.getByTestId('role-select');
    this.permissionTree = page.getByTestId('permission-tree');
    this.permissionNode = (permissionId: string) =>
      page.locator(`[data-testid="permission-node-${permissionId}"]`);
    this.permissionCheckbox = (permissionId: string) =>
      page.locator(`[data-testid="permission-checkbox-${permissionId}"]`);
    this.crossClassAccessButton = page.getByTestId('cross-class-access-button');
    this.crossClassModal = page.getByTestId('cross-class-modal');
    this.classCheckbox = (classCode: string) =>
      page.locator(`[data-testid="class-checkbox-${classCode}"]`);
    this.accessReasonInput = page.getByTestId('access-reason-input');
    this.submitAccessRequest = page.getByTestId('submit-access-request-button');
    this.approvalList = page.getByTestId('approval-list');
    this.approvalRows = page.locator('[data-testid="approval-row"]');
    this.approveButton = page.getByTestId('approve-button');
    this.rejectButton = page.getByTestId('reject-button');
    this.otpModal = page.getByTestId('mfa-modal');
    this.auditTable = page.getByTestId('audit-log-table');
    this.auditFilterUser = page.getByTestId('audit-user-filter');
    this.auditFilterAction = page.getByTestId('audit-action-filter');
    this.auditFilterDateFrom = page.getByTestId('audit-date-from');
    this.auditFilterDateTo = page.getByTestId('audit-date-to');
    this.temporaryPermissionBadge = page.getByTestId('temporary-permission-badge');
    this.permissionExpiryDate = page.getByTestId('permission-expiry-date');
    this.accessDeniedMessage = page.getByTestId('access-denied-message');
  }

  /**
   * 打开用户权限面板
   */
  async openUserPermission(userId: string): Promise<void> {
    await this.userTable
      .locator(`[data-testid="user-row-${userId}"]`)
      .getByTestId('view-permission-button')
      .click();
    await expect(this.permissionPanel).toBeVisible();
  }

  /**
   * 修改用户角色
   */
  async changeUserRole(userId: string, newRole: string): Promise<void> {
    await this.openUserPermission(userId);
    await this.selectOption(this.roleSelect, newRole);
    await this.page.getByTestId('save-role-button').click();
    await this.expectToast('角色更新成功');
  }

  /**
   * 申请跨班级访问权限
   */
  async requestCrossClassAccess(classCodes: string[], reason: string): Promise<void> {
    await this.safeClick(this.crossClassAccessButton);
    await expect(this.crossClassModal).toBeVisible();

    for (const code of classCodes) {
      await this.classCheckbox(code).check();
    }

    await this.accessReasonInput.fill(reason);
    await this.safeClick(this.submitAccessRequest);
    await this.expectToast('申请已提交');
  }

  /**
   * 审批跨班级访问申请 (二次认证)
   */
  async approveAccessRequest(requestId: string, otp: string = '123456'): Promise<void> {
    const row = this.approvalRows.filter({
      has: this.page.locator(`[data-testid="approval-id-${requestId}"]`),
    });
    await row.getByTestId('approve-button').click();
    await expect(this.otpModal).toBeVisible();
    await this.page.getByTestId('otp-input').fill(otp);
    await this.page.getByTestId('verify-otp-button').click();
    await this.expectToast('审批通过');
  }

  /**
   * 拒绝访问申请
   */
  async rejectAccessRequest(requestId: string, reason: string): Promise<void> {
    const row = this.approvalRows.filter({
      has: this.page.locator(`[data-testid="approval-id-${requestId}"]`),
    });
    await row.getByTestId('reject-button').click();
    await this.page.getByTestId('reject-reason-input').fill(reason);
    await this.page.getByTestId('confirm-reject-button').click();
  }

  /**
   * 查看审计日志
   */
  async viewAuditLog(filters?: {
    userId?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<void> {
    await this.safeClick(this.auditLogTab);

    if (filters?.userId) {
      await this.selectOption(this.auditFilterUser, filters.userId);
    }
    if (filters?.action) {
      await this.selectOption(this.auditFilterAction, filters.action);
    }
    if (filters?.dateFrom) {
      await this.auditFilterDateFrom.fill(filters.dateFrom);
    }
    if (filters?.dateTo) {
      await this.auditFilterDateTo.fill(filters.dateTo);
    }

    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 验证权限不存在 (403)
   */
  async expectAccessDenied(): Promise<void> {
    await expect(this.accessDeniedMessage).toBeVisible();
    await expect(this.accessDeniedMessage).toContainText('無權');
  }

  /**
   * 验证临时权限
   */
  async expectTemporaryPermission(expiryDate: string): Promise<void> {
    await expect(this.temporaryPermissionBadge).toBeVisible();
    await expect(this.permissionExpiryDate).toContainText(expiryDate);
  }

  /**
   * 验证用户角色
   */
  async expectUserRole(userId: string, role: string): Promise<void> {
    const row = this.userTable.locator(`[data-testid="user-row-${userId}"]`);
    await expect(row.getByTestId('user-role-badge')).toContainText(role);
  }
}
