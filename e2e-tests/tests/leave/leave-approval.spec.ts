import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { LeavePage } from '../../pages/LeavePage';
import { leaveApplications, leaveTypes } from '../../fixtures/test-data';

/**
 * 请假申请审批 E2E 测试套件
 * @priority P0
 * @tags @leave
 */
test.describe('请假申请审批流程 @leave', () => {
  let loginPage: LoginPage;
  let leavePage: LeavePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    leavePage = new LeavePage(page);
    await loginPage.goto();
  });

  // ══════════════════════════════════════════════════════════════
  // 家长提交请假
  // ══════════════════════════════════════════════════════════════

  /**
   * F-LEAVE-001: 家长提交病假申请 (<=2天，无需医生证明)
   */
  test('F-LEAVE-001: 家长提交1天病假申请(无需证明) @critical', async ({ page }) => {
    // Arrange - 家长登录
    await loginPage.loginAsParent();
    await page.waitForURL(/\/parent-portal|\/dashboard/);

    // Act - 进入请假页面
    await leavePage.goto();
    await leavePage.clickNewLeave();

    // Assert - 填写病假申请 (<=2天)
    await leavePage.submitLeaveApplication({
      leaveType: leaveTypes.sick.code,
      startDate: leaveApplications.validSickLeave.startDate,
      endDate: leaveApplications.validSickLeave.endDate,
      reason: leaveApplications.validSickLeave.reason,
      hasCertificate: false,
    });

    await leavePage.expectToast('申请已提交');
  });

  /**
   * F-LEAVE-001: 家长提交病假申请 (>2天，需医生证明)
   */
  test('F-LEAVE-001: 家长提交3天病假申请(需上传证明) @critical', async ({ page }) => {
    await loginPage.loginAsParent();
    await page.waitForURL(/\/parent-portal|\/dashboard/);

    await leavePage.goto();
    await leavePage.clickNewLeave();

    await leavePage.submitLeaveApplication({
      leaveType: leaveTypes.sick.code,
      startDate: leaveApplications.sickLeaveWithCertificate.startDate,
      endDate: leaveApplications.sickLeaveWithCertificate.endDate,
      reason: leaveApplications.sickLeaveWithCertificate.reason,
      hasCertificate: true,
    });

    await leavePage.expectToast('申请已提交');
  });

  /**
   * F-LEAVE-001: 病假>2天无医生证明应被拒绝
   */
  test('F-LEAVE-001: 病假>2天无医生证明应显示警告 @critical', async ({ page }) => {
    await loginPage.loginAsParent();
    await page.waitForURL(/\/parent-portal|\/dashboard/);

    await leavePage.goto();
    await leavePage.clickNewLeave();

    // 选择病假类型
    await leavePage.leaveTypeSelect.selectOption(leaveTypes.sick.code);
    await leavePage.startDateInput.fill(leaveApplications.invalidSickLeaveNoCert.startDate);
    await leavePage.endDateInput.fill(leaveApplications.invalidSickLeaveNoCert.endDate);
    await leavePage.reasonTextarea.fill(leaveApplications.invalidSickLeaveNoCert.reason);

    // Assert - 应显示需要医生证明的警告
    await leavePage.expectCertificateRequired();

    // 尝试提交
    await leavePage.submitButton.click();

    // 应显示错误，不允许提交
    await expect(page.getByTestId('submit-error')).toBeVisible();
  });

  // ══════════════════════════════════════════════════════════════
  // 代课老师推荐
  // ══════════════════════════════════════════════════════════════

  /**
   * F-LEAVE-001: 代课老师推荐
   */
  test('F-LEAVE-001: 请假申请后应显示代课老师推荐', async ({ page }) => {
    await loginPage.loginAsParent();
    await page.waitForURL(/\/parent-portal|\/dashboard/);

    await leavePage.goto();
    await leavePage.clickNewLeave();

    await leavePage.submitLeaveApplication({
      leaveType: leaveTypes.sick.code,
      startDate: leaveApplications.validSickLeave.startDate,
      endDate: leaveApplications.validSickLeave.endDate,
      reason: leaveApplications.validSickLeave.reason,
    });

    // 应显示代课老师推荐
    await expect(leavePage.substituteTeacherList).toBeVisible();
    const teachers = leavePage.substituteTeacherList.locator('[data-testid="teacher-option"]');
    const count = await teachers.count();
    expect(count).toBeGreaterThan(0);
  });

  // ══════════════════════════════════════════════════════════════
  // 校务处审批
  // ══════════════════════════════════════════════════════════════

  /**
   * F-LEAVE-001: 校务处同工审批请假申请 (二次认证)
   */
  test('F-LEAVE-001: 校务处审批请假并通过OTP验证 @critical', async ({ page }) => {
    // Arrange - 校务员登录
    await loginPage.loginAsOfficer();
    await page.waitForURL(/\/dashboard/);

    // Act - 进入待审批列表
    await leavePage.goto();
    await leavePage.switchToPendingApproval();

    // 查找并批准请假
    const pendingRows = leavePage.leaveRows;
    const count = await pendingRows.count();

    if (count > 0) {
      // 批准第一个
      const firstRow = pendingRows.first();
      const leaveId = await firstRow.locator('[data-testid*="leave-id-"]').getAttribute('data-testid');
      const id = leaveId?.replace('leave-id-', '') || 'unknown';

      await leavePage.approveLeave(id, '123456');
      await leavePage.expectToast('审批通过');
    }
  });

  // ══════════════════════════════════════════════════════════════
  // 审批进度查看
  // ══════════════════════════════════════════════════════════════

  /**
   * F-LEAVE-001: 查看请假审批进度
   */
  test('F-LEAVE-001: 家长可查看请假审批进度', async ({ page }) => {
    await loginPage.loginAsParent();
    await page.waitForURL(/\/parent-portal|\/dashboard/);

    await leavePage.goto();

    // 查看第一个请假详情
    const rows = leavePage.leaveRows;
    const count = await rows.count();
    if (count > 0) {
      await rows.first().getByTestId('view-leave-detail-button').click();
      await expect(leavePage.leaveProgressBar).toBeVisible();
    }
  });

  // ══════════════════════════════════════════════════════════════
  // 边界场景
  // ══════════════════════════════════════════════════════════════

  /**
   * F-LEAVE-001: 设置跟进提醒
   */
  test('F-LEAVE-001: 可为请假申请设置跟进提醒', async ({ page }) => {
    await loginPage.loginAsOfficer();
    await page.waitForURL(/\/dashboard/);

    await leavePage.goto();
    await leavePage.switchToPendingApproval();

    const count = await leavePage.leaveRows.count();
    if (count > 0) {
      await leavePage.leaveRows.first().getByTestId('set-reminder-button').click();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      await leavePage.setFollowUpReminder(
        futureDate.toISOString().split('T')[0],
        '跟进学生情况',
      );
      await leavePage.expectToast('提醒已设置');
    }
  });
});
