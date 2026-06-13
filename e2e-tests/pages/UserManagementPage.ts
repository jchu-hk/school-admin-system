import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * 用户管理页面 Page Object
 */
export class UserManagementPage extends BasePage {
  // 导航和筛选
  readonly searchInput: Locator;
  readonly userTypeFilter: Locator;
  readonly statusFilter: Locator;
  readonly addUserButton: Locator;

  // 用户表格
  readonly userTable: Locator;
  readonly userRows: Locator;
  readonly firstUserRow: Locator;

  // 用户详情
  readonly userDetailModal: Locator;
  readonly userNameField: Locator;
  readonly userEmailField: Locator;
  readonly userTypeField: Locator;
  readonly userStatusField: Locator;
  readonly accountExpiryField: Locator;

  // 表单
  readonly createUserForm: Locator;
  readonly editUserForm: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;

  // 批量操作
  readonly selectAllCheckbox: Locator;
  readonly batchActionDropdown: Locator;
  readonly batchDeleteButton: Locator;

  // 分页
  readonly pagination: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;

  constructor(page: Page) {
    super(page, '/users', 'UserManagementPage');

    this.searchInput = page.getByTestId('user-search-input');
    this.userTypeFilter = page.getByTestId('user-type-filter');
    this.statusFilter = page.getByTestId('status-filter');
    this.addUserButton = page.getByTestId('add-user-button');
    this.userTable = page.getByTestId('user-table');
    this.userRows = page.locator('[data-testid="user-row"]');
    this.firstUserRow = page.locator('[data-testid="user-row"]').first();
    this.userDetailModal = page.getByTestId('user-detail-modal');
    this.userNameField = page.getByTestId('user-name-field');
    this.userEmailField = page.getByTestId('user-email-field');
    this.userTypeField = page.getByTestId('user-type-field');
    this.userStatusField = page.getByTestId('user-status-field');
    this.accountExpiryField = page.getByTestId('account-expiry-field');
    this.createUserForm = page.getByTestId('create-user-form');
    this.editUserForm = page.getByTestId('edit-user-form');
    this.saveButton = page.getByTestId('save-button');
    this.cancelButton = page.getByTestId('cancel-button');
    this.deleteButton = page.getByTestId('delete-user-button');
    this.selectAllCheckbox = page.getByTestId('select-all-users');
    this.batchActionDropdown = page.getByTestId('batch-action-dropdown');
    this.batchDeleteButton = page.getByTestId('batch-delete-button');
    this.pagination = page.getByTestId('pagination');
    this.nextPageButton = page.getByTestId('next-page-button');
    this.prevPageButton = page.getByTestId('prev-page-button');
  }

  /**
   * 搜索用户
   */
  async searchUser(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 筛选用户类型
   */
  async filterByUserType(type: 'SCHOOL_ADMIN' | 'OFFICER' | 'TEACHER' | 'PARENT' | 'ALL'): Promise<void> {
    await this.safeClick(this.userTypeFilter);
    await this.page.getByRole('option', { name: type }).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 点击新增用户
   */
  async clickAddUser(): Promise<void> {
    await this.safeClick(this.addUserButton);
    await expect(this.createUserForm).toBeVisible();
  }

  /**
   * 获取用户总数
   */
  async getUserCount(): Promise<number> {
    return this.userRows.count();
  }

  /**
   * 点击第一个用户查看详情
   */
  async viewFirstUser(): Promise<void> {
    await this.safeClick(this.firstUserRow);
    await expect(this.userDetailModal).toBeVisible();
  }

  /**
   * 创建新用户
   */
  async createUser(data: {
    username: string;
    name: string;
    email: string;
    userType: string;
    department?: string;
    password?: string;
  }): Promise<void> {
    await this.clickAddUser();
    await this.createUserForm.locator('[name="username"]').fill(data.username);
    await this.createUserForm.locator('[name="name"]').fill(data.name);
    await this.createUserForm.locator('[name="email"]').fill(data.email);
    await this.createUserForm.locator('[name="userType"]').selectOption(data.userType);
    if (data.department) {
      await this.createUserForm.locator('[name="department"]').fill(data.department);
    }
    await this.safeClick(this.saveButton);
  }

  /**
   * 删除用户
   */
  async deleteUser(userId: string): Promise<void> {
    const row = this.userRows
      .filter({ has: this.page.locator(`[data-testid="user-id-${userId}"]`) })
      .getByTestId('delete-user-button');
    await row.click();
    await this.page.getByTestId('confirm-delete-button').click();
  }

  /**
   * 编辑用户
   */
  async editUser(userId: string, data: Partial<{ name: string; email: string; department: string }>): Promise<void> {
    const row = this.userRows
      .filter({ has: this.page.locator(`[data-testid="user-id-${userId}"]`) })
      .getByTestId('edit-user-button');
    await row.click();
    if (data.name) {
      await this.editUserForm.locator('[name="name"]').fill(data.name);
    }
    if (data.email) {
      await this.editUserForm.locator('[name="email"]').fill(data.email);
    }
    await this.safeClick(this.saveButton);
  }

  /**
   * 验证用户存在于列表
   */
  async expectUserInList(username: string): Promise<void> {
    await expect(this.userTable.locator(`text=${username}`)).toBeVisible();
  }
}
