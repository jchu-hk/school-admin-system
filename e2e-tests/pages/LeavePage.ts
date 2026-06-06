import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { getMockOTP } from '../fixtures/users';

/**
 * 请假申请页面 Page Object
 */
export class LeavePage extends BasePage {
  // 导航
  readonly newLeaveButton: Locator;
  readonly leaveListTab: Locator;
  readonly pendingApprovalTab: Locator;

  // 筛选
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;
  readonly statusFilter: Locator;
  readonly studentFilter: Locator;
  readonly classFilter: Locator;

  // 请假申请表单
  readonly studentSelect: Locator;
  readonly leaveTypeSelect: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly reasonTextarea: Locator;
  readonly certificateUpload: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  // 证书相关
  readonly certificateRequiredWarning: Locator;
  readonly certificateUploadArea: Locator;

  // 请假列表
  readonly leaveTable: Locator;
  readonly leaveRows: Locator;

  // 审批
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly mfaModal: Locator;
  readonly otpInput: Locator;
  readonly verifyOtpButton: Locator;

  // 进度查看
  readonly leaveProgressBar: Locator;
  readonly statusBadge: Locator;

  // 代课老师推荐
  readonly substituteTeacherList: Locator;
  readonly selectSubstituteButton: Locator;

  // 跟进提醒
  readonly setReminderButton: Locator;
  readonly reminderDateInput: Locator;
  readonly reminderContentInput: Locator;

  constructor(page: Page) {
    super(page, '/leave', 'LeavePage');

    this.newLeaveButton = page.getByTestId('new-leave-button');
    this.leaveListTab = page.getByTestId('leave-list-tab');
    this.pendingApprovalTab = page.getByTestId('pending-approval-tab');
    this.dateFromInput = page.getByTestId('date-from-input');
    this.dateToInput = page.getByTestId('date-to-input');
    this.statusFilter = page.getByTestId('status-filter');
    this.studentFilter = page.getByTestId('student-filter');
    this.classFilter = page.getByTestId('class-filter');
    this.studentSelect = page.getByTestId('student-select');
    this.leaveTypeSelect = page.getByTestId('leave-type-select');
    this.startDateInput = page.getByTestId('start-date-input');
    this.endDateInput = page.getByTestId('end-date-input');
    this.reasonTextarea = page.getByTestId('reason-textarea');
    this.certificateUpload = page.getByTestId('certificate-upload');
    this.submitButton = page.getByTestId('submit-leave-button');
    this.cancelButton = page.getByTestId('cancel-button');
    this.certificateRequiredWarning = page.getByTestId('certificate-required-warning');
    this.certificateUploadArea = page.getByTestId('certificate-upload-area');
    this.leaveTable = page.getByTestId('leave-table');
    this.leaveRows = page.locator('[data-testid="leave-row"]');
    this.approveButton = page.getByTestId('approve-leave-button');
    this.rejectButton = page.getByTestId('reject-leave-button');
    this.mfaModal = page.getByTestId('mfa-modal');
    this.otpInput = page.getByTestId('otp-input');
    this.verifyOtpButton = page.getByTestId('verify-otp-button');
    this.leaveProgressBar = page.getByTestId('leave-progress-bar');
    this.statusBadge = page.getByTestId('leave-status-badge');
    this.substituteTeacherList = page.getByTestId('substitute-teacher-list');
    this.selectSubstituteButton = page.getByTestId('select-substitute-button');
    this.setReminderButton = page.getByTestId('set-reminder-button');
    this.reminderDateInput = page.getByTestId('reminder-date-input');
    this.reminderContentInput = page.getByTestId('reminder-content-input');
  }

  /**
   * 点击新增请假
   */
  async clickNewLeave(): Promise<void> {
    await this.safeClick(this.newLeaveButton);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 提交请假申请
   */
  async submitLeaveApplication(data: {
    studentId?: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    hasCertificate?: boolean;
  }): Promise<void> {
    if (data.studentId) {
      await this.selectOption(this.studentSelect, data.studentId);
    }
    await this.selectOption(this.leaveTypeSelect, data.leaveType);
    await this.startDateInput.fill(data.startDate);
    await this.endDateInput.fill(data.endDate);
    await this.reasonTextarea.fill(data.reason);
    if (data.hasCertificate) {
      // 上传医生证明文件
      await this.certificateUploadArea.setInputFiles({
        name: 'medical-certificate.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('mock-pdf-content'),
      });
    }
    await this.safeClick(this.submitButton);
  }

  /**
   * 批准请假 (带二次认证)
   */
  async approveLeave(leaveId: string, otp?: string): Promise<void> {
    const row = this.leaveRows.filter({ has: this.page.locator(`[data-testid="leave-id-${leaveId}"]`) });
    await row.getByTestId('approve-leave-button').click();
    // 等待 MFA 弹窗
    await expect(this.mfaModal).toBeVisible({ timeout: 5000 });
    await this.otpInput.fill(otp || getMockOTP());
    await this.safeClick(this.verifyOtpButton);
  }

  /**
   * 拒绝请假
   */
  async rejectLeave(leaveId: string, reason: string): Promise<void> {
    const row = this.leaveRows.filter({ has: this.page.locator(`[data-testid="leave-id-${leaveId}"]`) });
    await row.getByTestId('reject-leave-button').click();
    await this.page.getByTestId('reject-reason-input').fill(reason);
    await this.page.getByTestId('confirm-reject-button').click();
  }

  /**
   * 查看请假进度
   */
  async viewLeaveProgress(leaveId: string): Promise<void> {
    const row = this.leaveRows.filter({ has: this.page.locator(`[data-testid="leave-id-${leaveId}"]`) });
    await row.getByTestId('view-leave-detail-button').click();
  }

  /**
   * 获取请假状态
   */
  async getLeaveStatus(leaveId: string): Promise<string> {
    const row = this.leaveRows.filter({ has: this.page.locator(`[data-testid="leave-id-${leaveId}"]`) });
    const badge = row.getByTestId('leave-status-badge');
    return (await badge.textContent()) || '';
  }

  /**
   * 设置跟进提醒
   */
  async setFollowUpReminder(date: string, content: string): Promise<void> {
    await this.safeClick(this.setReminderButton);
    await this.reminderDateInput.fill(date);
    await this.reminderContentInput.fill(content);
    await this.page.getByTestId('save-reminder-button').click();
  }

  /**
   * 验证病假超过2天需要证明的警告
   */
  async expectCertificateRequired(): Promise<void> {
    await expect(this.certificateRequiredWarning).toBeVisible();
    await expect(this.certificateRequiredWarning).toContainText('超過2天');
  }

  /**
   * 切换到待审批标签
   */
  async switchToPendingApproval(): Promise<void> {
    await this.safeClick(this.pendingApprovalTab);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 筛选班级
   */
  async filterByClass(classCode: string): Promise<void> {
    await this.safeClick(this.classFilter);
    await this.page.getByRole('option', { name: classCode }).click();
    await this.page.waitForLoadState('networkidle');
  }
}
