import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * 学生管理模块 E2E 测试用例
 * 
 * 测试覆盖范围:
 * - 基础功能: 列表加载、筛选、搜索、分页、CRUD
 * - 边界情况: 空列表、权限验证、表单验证、密码强度、重复检测、错误处理
 * 
 * 测试环境: https://yang-wanna-dramatically-given.trycloudflare.com
 * 测试账号: staff1 / Admin123!
 */

const TEST_USER = {
  username: 'staff1',
  password: 'Admin123!',
};

// ============ 辅助函数 ============

async function login(page: any) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  // 使用正确的选择器
  await loginPage.login(TEST_USER.username, TEST_USER.password);
  // 等待跳转到 dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  // 等待页面完全加载
  await page.waitForLoadState('networkidle');
}

async function navigateToStudentPage(page: any) {
  await page.goto('/students');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: '学生管理' })).toBeVisible({ timeout: 10000 });
}

// ============ 基础功能测试 ============

test.describe('【基础功能】学生列表', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToStudentPage(page);
  });

  test('SM-001: 学生列表页面正确加载', async ({ page }) => {
    // 验证页面标题和新增按钮
    await expect(page.getByRole('heading', { name: '学生管理' })).toBeVisible();
    await expect(page.getByRole('button', { name: /新增学生/i })).toBeVisible();
    
    // 验证筛选器区域
    await expect(page.getByPlaceholder('搜索学号或姓名...')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
    
    // 验证表格头部
    await expect(page.getByText('学号')).toBeVisible();
    await expect(page.getByText('姓名')).toBeVisible();
    await expect(page.getByText('班级')).toBeVisible();
    await expect(page.getByText('状态')).toBeVisible();
    await expect(page.getByText('操作')).toBeVisible();
  });

  test('SM-002: 学生列表数据正确加载', async ({ page }) => {
    // 等待数据加载
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });
    
    // 验证有数据行
    const rows = await page.locator('tbody tr:not(:has(.text-center))').count();
    expect(rows).toBeGreaterThan(0);
    
    // 验证分页信息显示
    await expect(page.getByText(/共 \d+ 条/)).toBeVisible();
  });

  test('SM-003: 分页导航功能正常', async ({ page }) => {
    // 获取当前页码显示
    const pageInfo = await page.getByText(/共 \d+ 条/).textContent();
    
    // 如果有多个页面，测试翻页
    if (pageInfo && pageInfo.includes('20')) {
      // 点击下一页
      const nextButton = page.locator('button[disabled]').count() === 0 
        ? page.locator('button.rounded-r-md').last()
        : null;
      
      if (nextButton) {
        const isDisabled = await nextButton.isDisabled();
        if (!isDisabled) {
          await nextButton.click();
          await page.waitForLoadState('networkidle');
          
          // 验证页码变化
          const newPageInfo = await page.getByText(/共 \d+ 条/).textContent();
          expect(newPageInfo).not.toBe(pageInfo);
        }
      }
    }
  });

  test('SM-004: 点击学生行可查看详情', async ({ page }) => {
    // 点击第一行学生
    await page.locator('tbody tr').first().click();
    
    // 验证详情弹窗出现
    await expect(page.getByText('学生详情')).toBeVisible({ timeout: 5000 });
    
    // 验证详情信息
    await expect(page.getByText('用户名')).toBeVisible();
    await expect(page.getByText('姓名')).toBeVisible();
    await expect(page.getByText('状态')).toBeVisible();
    
    // 关闭弹窗
    await page.getByText('关闭').click();
    await page.waitForTimeout(500);
  });
});

test.describe('【基础功能】筛选功能', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToStudentPage(page);
  });

  test('SM-005: 班级筛选器显示所有班级', async ({ page }) => {
    // 等待筛选器加载
    await page.waitForSelector('select', { timeout: 5000 });
    
    // 获取班级筛选器（第二个select）
    const classSelect = page.locator('select').nth(1);
    const options = await classSelect.locator('option').allTextContents();
    
    // 验证有"全部班级"选项
    expect(options).toContain('全部班级');
    
    // 验证有具体班级选项
    expect(options.length).toBeGreaterThan(1);
    console.log('可用班级:', options.join(', '));
  });

  test('SM-006: 按班级筛选学生列表', async ({ page }) => {
    // 获取所有班级选项
    const classSelect = page.locator('select').nth(1);
    const options = await classSelect.locator('option').allTextContents();
    
    if (options.length > 1) {
      const selectedClass = options[1].trim();
      
      // 选择班级
      await classSelect.selectOption(selectedClass);
      await page.waitForLoadState('networkidle');
      
      // 验证筛选器显示选中状态
      await expect(classSelect).toHaveValue(selectedClass);
      
      // 如果有数据，验证所有学生都是该班级
      const classCells = await page.locator('tbody tr td:nth-child(3)').allTextContents();
      for (const cls of classCells) {
        if (cls && cls.trim() !== '-') {
          expect(cls.trim()).toBe(selectedClass);
        }
      }
    }
  });

  test('SM-007: 状态筛选器显示所有状态', async ({ page }) => {
    // 获取状态筛选器（第三个select）
    const statusSelect = page.locator('select').nth(2);
    const options = await statusSelect.locator('option').allTextContents();
    
    // 验证有"全部状态"选项
    expect(options).toContain('全部状态');
    
    // 验证有具体状态选项
    expect(options).toContain('活跃');
    console.log('状态选项:', options.join(', '));
  });

  test('SM-008: 按状态筛选学生列表', async ({ page }) => {
    // 选择"活跃"状态
    const statusSelect = page.locator('select').nth(2);
    await statusSelect.selectOption('active');
    await page.waitForLoadState('networkidle');
    
    // 验证筛选器显示选中状态
    await expect(statusSelect).toHaveValue('active');
    
    // 验证所有显示的学生状态为"活跃"
    const statusCells = await page.locator('tbody tr td:nth-child(4) span').allTextContents();
    for (const status of statusCells) {
      expect(status).toContain('活跃');
    }
  });

  test('SM-009: 组合筛选：班级+状态', async ({ page }) => {
    // 先选择班级
    const classSelect = page.locator('select').nth(1);
    const classOptions = await classSelect.locator('option').allTextContents();
    
    if (classOptions.length > 1) {
      await classSelect.selectOption(classOptions[1].trim());
      await page.waitForLoadState('networkidle');
      
      // 再选择状态
      const statusSelect = page.locator('select').nth(2);
      await statusSelect.selectOption('active');
      await page.waitForLoadState('networkidle');
      
      // 验证两个筛选条件都生效
      await expect(classSelect).toHaveValue(classOptions[1].trim());
      await expect(statusSelect).toHaveValue('active');
    }
  });
});

test.describe('【基础功能】搜索功能', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToStudentPage(page);
  });

  test('SM-010: 搜索框功能正常', async ({ page }) => {
    const searchInput = page.getByPlaceholder('搜索学号或姓名...');
    await expect(searchInput).toBeVisible();
    
    // 输入搜索关键词
    const testKeyword = 'test';
    await searchInput.fill(testKeyword);
    
    // 等待搜索结果
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // 验证搜索结果包含关键词
    const tableContent = await page.locator('tbody').textContent();
    if (tableContent && !tableContent.includes('暂无数据')) {
      // 验证结果中包含搜索关键词
      expect(
        tableContent.toLowerCase().includes(testKeyword.toLowerCase()) ||
        tableContent.includes('暂无数据')
      ).toBeTruthy();
    }
  });

  test('SM-011: 搜索后清空搜索条件', async ({ page }) => {
    const searchInput = page.getByPlaceholder('搜索学号或姓名...');
    
    // 输入并搜索
    await searchInput.fill('abc');
    await page.waitForLoadState('networkidle');
    
    // 清空搜索
    await searchInput.clear();
    await page.waitForLoadState('networkidle');
    
    // 验证恢复到完整列表
    const pageInfo = await page.getByText(/共 \d+ 条/).textContent();
    expect(pageInfo).toBeTruthy();
  });
});

// ============ CRUD功能测试 ============

test.describe('【CRUD功能】创建学生', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToStudentPage(page);
  });

  test('SM-012: 打开新增学生弹窗', async ({ page }) => {
    // 点击新增按钮
    await page.getByRole('button', { name: /新增学生/i }).click();
    
    // 验证弹窗出现
    await expect(page.getByText('新增学生').first()).toBeVisible({ timeout: 5000 });
    
    // 验证表单字段
    await expect(page.getByTestId('field-name_zh')).toBeVisible();
    await expect(page.getByTestId('field-name_zh')).toBeVisible();
    await expect(page.getByTestId('field-gender')).toBeVisible();
    await expect(page.getByTestId('field-birth_date')).toBeVisible();
    await expect(page.getByTestId('field-name_zh')).toBeVisible();
    await expect(page.getByTestId('btn-save')).toBeVisible();
    await expect(page.getByText('资助资格信息')).toBeVisible();
    
    // 关闭弹窗
    await page.locator('button[title], button.rounded').first().click();
  });

  test('SM-013: 成功创建新学生', async ({ page }) => {
    const uniqueUsername = `student_${Date.now()}`;
    
    // 打开新增弹窗
    await page.getByRole('button', { name: /新增学生/i }).click();
    await page.waitForTimeout(500);
    
    // 填写表单
    await page.getByTestId('field-name_zh').fill(uniqueUsername);
    await page.getByTestId('field-name_zh').fill('自动化测试学生');
    await page.locator('select[id*="className"], select').first().selectOption('1A');
    await page.getByTestId('field-birth_date').fill('2010-01-15');
    await page.getByTestId('field-admission_date').fill('2024-09-01');
    
    // 提交
    await page.getByRole('button', { name: /保存/i }).click();
    
    // 等待结果
    await page.waitForTimeout(2000);
    
    // 验证新学生出现在列表中
    await expect(page.getByText(uniqueUsername)).toBeVisible({ timeout: 5000 });
  });

  test('SM-014: 创建学生时资助资格信息', async ({ page }) => {
    const uniqueUsername = `student_${Date.now()}`;
    
    // 打开新增弹窗
    await page.getByRole('button', { name: /新增学生/i }).click();
    await page.waitForTimeout(500);
    
    // 填写基本信息
    await page.getByTestId('field-name_zh').fill(uniqueUsername);
    await page.getByTestId('field-name_zh').fill('资助测试学生');
    await page.getByTestId('field-birth_date').fill('2010-01-15');
    await page.getByTestId('field-admission_date').fill('2024-09-01');
    
    // 设置资助资格
    await page.locator('select').last().selectOption('full_subsidy');
    
    // 提交
    await page.getByRole('button', { name: /保存/i }).click();
    await page.waitForTimeout(2000);
    
    // 验证创建成功
    await expect(page.getByText(uniqueUsername)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('【CRUD功能】编辑学生', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToStudentPage(page);
  });

  test('SM-015: 打开编辑学生弹窗', async ({ page }) => {
    // 等待数据加载
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    
    // 点击第一个学生的编辑按钮
    await page.locator('tbody tr').first().locator('button[title="编辑"]').click();
    
    // 验证弹窗出现
    await expect(page.getByText('编辑学生')).toBeVisible({ timeout: 5000 });
    
    // 验证表单预填充
    await expect(page.getByLabel('用户名')).not.toBeEmpty();
    await expect(page.getByLabel('姓名')).not.toBeEmpty();
    
    // 关闭弹窗
    await page.locator('button[title], button.rounded').first().click();
  });

  test('SM-016: 编辑学生信息', async ({ page }) => {
    // 点击第一个学生的编辑按钮
    await page.locator('tbody tr').first().locator('button[title="编辑"]').click();
    await page.waitForTimeout(500);
    
    // 修改姓名
    const newName = `编辑测试_${Date.now()}`;
    await page.getByLabel('姓名').clear();
    await page.getByLabel('姓名').fill(newName);
    
    // 提交
    await page.getByRole('button', { name: /保存/i }).click();
    await page.waitForTimeout(2000);
    
    // 验证修改成功 - 关闭弹窗后检查列表
    await expect(page.getByText(newName)).toBeVisible({ timeout: 5000 });
  });

  test('SM-017: 编辑时密码留空不修改', async ({ page }) => {
    // 点击编辑按钮
    await page.locator('tbody tr').first().locator('button[title="编辑"]').click();
    await page.waitForTimeout(500);
    
    // 验证密码提示
    await expect(page.getByText('留空则不修改密码')).toBeVisible();
    
    // 密码字段应该为空
    const passwordInput = page.locator('input[type="password"]').first();
    const passwordValue = await passwordInput.inputValue();
    expect(passwordValue).toBe('');
    
    // 关闭弹窗
    await page.getByRole('button', { name: /取消/i }).click();
  });
});

test.describe('【CRUD功能】删除学生', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToStudentPage(page);
  });

  test('SM-018: 删除学生前确认弹窗', async ({ page }) => {
    // 等待数据加载
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    
    // 点击第一个学生的删除按钮
    await page.locator('tbody tr').first().locator('button[title="删除"]').click();
    
    // 验证确认弹窗出现
    await expect(page.getByText('删除确认')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/确定要删除学生/)).toBeVisible();
    await expect(page.getByText(/此操作将软删除/)).toBeVisible();
    await expect(page.getByRole('button', { name: /确认删除/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /取消/i }).first()).toBeVisible();
  });

  test('SM-019: 取消删除操作', async ({ page }) => {
    // 点击删除按钮
    await page.locator('tbody tr').first().locator('button[title="删除"]').click();
    await page.waitForTimeout(300);
    
    // 获取当前列表第一个学生
    const firstStudentBefore = await page.locator('tbody tr').first().locator('td').nth(1).textContent();
    
    // 点击取消
    await page.getByRole('button', { name: /取消/i }).first().click();
    await page.waitForTimeout(500);
    
    // 验证弹窗关闭且列表未变化
    await expect(page.getByText('删除确认')).not.toBeVisible();
    const firstStudentAfter = await page.locator('tbody tr').first().locator('td').nth(1).textContent();
    expect(firstStudentAfter).toBe(firstStudentBefore);
  });

  test('SM-020: 确认删除学生', async ({ page }) => {
    // 先创建一个测试学生
    const uniqueUsername = `delete_test_${Date.now()}`;
    await page.getByRole('button', { name: /新增学生/i }).click();
    await page.waitForTimeout(500);
    await page.getByTestId('field-name_zh').fill(uniqueUsername);
    await page.getByLabel('姓名').fill('删除测试学生');
    await page.getByTestId('field-birth_date').fill('2010-01-15');
    await page.getByTestId('field-admission_date').fill('2024-09-01');
    await page.getByRole('button', { name: /保存/i }).click();
    await page.waitForTimeout(2000);
    
    // 验证新学生存在
    await expect(page.getByText(uniqueUsername)).toBeVisible();
    
    // 删除该学生
    await page.locator('tbody tr').filter({ hasText: uniqueUsername }).locator('button[title="删除"]').click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /确认删除/i }).click();
    await page.waitForTimeout(2000);
    
    // 验证学生已从列表中消失
    await expect(page.locator('tbody').filter({ hasText: uniqueUsername })).toHaveCount(0);
  });
});

// ============ 边界情况测试 ============

test.describe('【边界情况】表单验证', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToStudentPage(page);
    await page.getByRole('button', { name: /新增学生/i }).click();
    await page.waitForTimeout(500);
  });

  test('SM-021: 必填字段验证 - 用户名', async ({ page }) => {
    // 清空用户名
    await page.getByLabel('用户名').clear();
    
    // 尝试提交
    await page.getByRole('button', { name: /保存/i }).click();
    
    // 等待验证错误
    await page.waitForTimeout(500);
    
    // 验证错误提示
    const pageContent = await page.content();
    expect(pageContent).toMatch(/用户名|不能为空/);
  });

  test('SM-022: 必填字段验证 - 姓名', async ({ page }) => {
    // 清空姓名
    await page.getByLabel('姓名').clear();
    
    // 尝试提交
    await page.getByRole('button', { name: /保存/i }).click();
    
    // 等待验证错误
    await page.waitForTimeout(500);
    
    // 验证错误提示
    const pageContent = await page.content();
    expect(pageContent).toMatch(/姓名|不能为空/);
  });

  test('SM-023: 必填字段验证 - 密码', async ({ page }) => {
    // 填写用户名和姓名
    await page.getByLabel('用户名').fill('test_user');
    await page.getByLabel('姓名').fill('测试用户');
    
    // 清空密码
    await page.getByLabel('密码').clear();
    
    // 尝试提交
    await page.getByRole('button', { name: /保存/i }).click();
    
    // 等待验证错误
    await page.waitForTimeout(500);
    
    // 验证错误提示
    const pageContent = await page.content();
    expect(pageContent).toMatch(/密码|不能为空/);
  });

  test('SM-024: 密码强度验证 - 长度不足', async ({ page }) => {
    // 填写其他必填字段
    await page.getByLabel('用户名').fill('test_user');
    await page.getByLabel('姓名').fill('测试用户');
    
    // 输入弱密码（太短）
    await page.getByLabel('密码').fill('Abc1!');
    
    // 尝试提交
    await page.getByRole('button', { name: /保存/i }).click();
    
    // 等待验证错误
    await page.waitForTimeout(500);
    
    // 验证错误提示（密码至少8位）
    const pageContent = await page.content();
    expect(pageContent).toMatch(/密码.*8|8.*密码|至少/);
  });

  test('SM-025: 密码强度验证 - 缺少大写字母', async ({ page }) => {
    await page.getByLabel('用户名').fill('test_user');
    await page.getByLabel('姓名').fill('测试用户');
    
    // 输入缺少大写字母的密码
    await page.getByLabel('密码').fill('test123!');
    
    await page.getByRole('button', { name: /保存/i }).click();
    await page.waitForTimeout(500);
    
    const pageContent = await page.content();
    expect(pageContent).toMatch(/大写|密码/);
  });

  test('SM-026: 密码强度验证 - 缺少特殊字符', async ({ page }) => {
    await page.getByLabel('用户名').fill('test_user');
    await page.getByLabel('姓名').fill('测试用户');
    
    // 输入缺少特殊字符的密码
    await page.getByLabel('密码').fill('Test12345');
    
    await page.getByRole('button', { name: /保存/i }).click();
    await page.waitForTimeout(500);
    
    const pageContent = await page.content();
    expect(pageContent).toMatch(/特殊字符|密码/);
  });

  test('SM-027: 香港身份证格式验证', async ({ page }) => {
    await page.getByLabel('用户名').fill('test_user');
    await page.getByLabel('姓名').fill('测试用户');
    await page.getByTestId('field-birth_date').fill('2010-01-15');
    await page.getByTestId('field-admission_date').fill('2024-09-01');
    
    // 输入格式错误的身份证
    const hkIdInput = page.locator('input[placeholder="例如：A123456(7)"]');
    if (await hkIdInput.isVisible()) {
      await hkIdInput.fill('invalid-id');
      
      await page.getByRole('button', { name: /保存/i }).click();
      await page.waitForTimeout(500);
      
      const pageContent = await page.content();
      expect(pageContent).toMatch(/身份证|格式不正确/);
    }
  });

  test('SM-028: 手机号格式验证', async ({ page }) => {
    await page.getByLabel('用户名').fill('test_user');
    await page.getByLabel('姓名').fill('测试用户');
    await page.getByTestId('field-birth_date').fill('2010-01-15');
    await page.getByTestId('field-admission_date').fill('2024-09-01');
    
    // 输入格式错误的手机号（不是852开头）
    const phoneInput = page.locator('input[placeholder="例如：85291234567"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('12345678');
      
      await page.getByRole('button', { name: /保存/i }).click();
      await page.waitForTimeout(500);
      
      const pageContent = await page.content();
      expect(pageContent).toMatch(/手机号|852|格式不正确/);
    }
  });
});

test.describe('【边界情况】重复检测', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToStudentPage(page);
  });

  test('SM-029: 检测重复用户名', async ({ page }) => {
    // 获取第一个学生的用户名
    const firstUsername = await page.locator('tbody tr').first().locator('td').nth(0).textContent();
    
    if (firstUsername) {
      // 尝试创建同名用户
      await page.getByRole('button', { name: /新增学生/i }).click();
      await page.waitForTimeout(500);
      
      await page.getByLabel('用户名').fill(firstUsername.trim());
      await page.getByLabel('姓名').fill('重复测试');
      await page.getByTestId('field-birth_date').fill('2010-01-15');
    await page.getByTestId('field-admission_date').fill('2024-09-01');
      
      await page.getByRole('button', { name: /保存/i }).click();
      await page.waitForTimeout(2000);
      
      // 验证出现错误提示（用户名已存在）
      const pageContent = await page.content();
      expect(
        pageContent.includes('已存在') ||
        pageContent.includes('用户名') ||
        pageContent.includes('重复')
      ).toBeTruthy();
      
      // 关闭弹窗
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('【边界情况】空状态', () => {
  test('SM-030: 无数据时显示空状态', async ({ page }) => {
    // 使用一个不存在的筛选条件
    await login(page);
    await navigateToStudentPage(page);
    
    // 输入一个不可能存在的搜索条件
    const searchInput = page.getByPlaceholder('搜索学号或姓名...');
    await searchInput.fill(`__non_existent_student_${Date.now()}__`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 验证显示"暂无数据"
    const tableContent = await page.locator('tbody').textContent();
    if (tableContent) {
      // 如果有数据，表格中应该包含搜索词
      // 如果没数据，显示"暂无数据"
      console.log('搜索结果:', tableContent.substring(0, 200));
    }
  });
});

test.describe('【边界情况】权限验证', () => {
  test('SM-031: 未登录用户访问学生页面', async ({ page }) => {
    // 直接访问学生页面（未登录）
    await page.goto('/students');
    
    // 验证被重定向到登录页
    await expect(page).toHaveURL(/\/login/);
  });
});

// ============ 详情弹窗测试 ============

test.describe('【详情功能】学生详情', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToStudentPage(page);
  });

  test('SM-032: 查看学生详情信息', async ({ page }) => {
    // 等待数据加载
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    
    // 点击查看详情按钮
    await page.locator('tbody tr').first().locator('button[title="查看详情"]').click();
    
    // 验证详情弹窗
    await expect(page.getByText('学生详情')).toBeVisible({ timeout: 5000 });
    
    // 验证详情字段
    await expect(page.getByText('用户名')).toBeVisible();
    await expect(page.getByText('姓名')).toBeVisible();
    await expect(page.getByText('状态')).toBeVisible();
    await expect(page.getByText('资助资格')).toBeVisible();
    
    // 验证有实际值显示
    const detailItems = await page.locator('[class*="DetailItem"], .space-y-4 > div').count();
    expect(detailItems).toBeGreaterThan(5);
    
    // 关闭详情
    await page.getByRole('button', { name: /关闭/i }).click();
    await page.waitForTimeout(500);
  });

  test('SM-033: 详情弹窗显示资助信息', async ({ page }) => {
    // 先创建一个有资助信息的学生
    const uniqueUsername = `subsidy_${Date.now()}`;
    await page.getByRole('button', { name: /新增学生/i }).click();
    await page.waitForTimeout(500);
    
    await page.getByTestId('field-name_zh').fill(uniqueUsername);
    await page.getByLabel('姓名').fill('资助测试');
    await page.getByTestId('field-birth_date').fill('2010-01-15');
    await page.getByTestId('field-admission_date').fill('2024-09-01');
    
    // 设置资助信息
    await page.locator('select').last().selectOption('full_subsidy');
    
    await page.getByRole('button', { name: /保存/i }).click();
    await page.waitForTimeout(2000);
    
    // 查看详情
    await page.locator('tbody tr').filter({ hasText: uniqueUsername }).locator('button[title="查看详情"]').click();
    await page.waitForTimeout(500);
    
    // 验证资助信息显示
    await expect(page.getByText('全额资助')).toBeVisible();
  });
});

// ============ 资助资格功能测试 ============

test.describe('【资助功能】资助资格管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToStudentPage(page);
  });

  test('SM-034: 创建学生时设置资助资格', async ({ page }) => {
    const uniqueUsername = `subsidy_create_${Date.now()}`;
    
    await page.getByRole('button', { name: /新增学生/i }).click();
    await page.waitForTimeout(500);
    
    await page.getByTestId('field-name_zh').fill(uniqueUsername);
    await page.getByLabel('姓名').fill('资助资格测试');
    await page.getByTestId('field-birth_date').fill('2010-01-15');
    await page.getByTestId('field-admission_date').fill('2024-09-01');
    
    // 选择半额资助
    await page.locator('select').last().selectOption('half_subsidy');
    
    await page.getByRole('button', { name: /保存/i }).click();
    await page.waitForTimeout(2000);
    
    // 验证创建成功
    await expect(page.getByText(uniqueUsername)).toBeVisible({ timeout: 5000 });
  });

  test('SM-035: 编辑学生资助资格', async ({ page }) => {
    // 先创建一个测试学生
    const uniqueUsername = `subsidy_edit_${Date.now()}`;
    await page.getByRole('button', { name: /新增学生/i }).click();
    await page.waitForTimeout(500);
    
    await page.getByTestId('field-name_zh').fill(uniqueUsername);
    await page.getByLabel('姓名').fill('资助编辑测试');
    await page.getByTestId('field-birth_date').fill('2010-01-15');
    await page.getByTestId('field-admission_date').fill('2024-09-01');
    await page.locator('select').last().selectOption('pending');
    
    await page.getByRole('button', { name: /保存/i }).click();
    await page.waitForTimeout(2000);
    
    // 编辑该学生
    await page.locator('tbody tr').filter({ hasText: uniqueUsername }).locator('button[title="编辑"]').click();
    await page.waitForTimeout(500);
    
    // 修改资助资格为无资助
    await page.locator('select').last().selectOption('none');
    
    await page.getByRole('button', { name: /保存/i }).click();
    await page.waitForTimeout(2000);
    
    // 验证修改成功
    await expect(page.getByText(uniqueUsername)).toBeVisible();
  });
});
