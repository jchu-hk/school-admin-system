import { test, expect } from '@playwright/test';

const TEST_USER = {
  username: 'staff1',
  password: 'Admin123!',
};

async function login(page: any) {
  await page.goto('/login');
  await page.getByPlaceholder('admin').fill(TEST_USER.username);
  await page.getByLabel('密码').fill(TEST_USER.password);
  await page.getByRole('button', { name: /登录/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
}

test.describe('学生管理功能', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('学生列表页面正确显示', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByText('学生管理')).toBeVisible();
    await expect(page.getByText('新增学生')).toBeVisible();
  });

  test('学生列表数据正确加载', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    
    // 等待数据加载（显示学号列头）
    await expect(page.getByText('学号')).toBeVisible({ timeout: 10000 });
    
    // 验证至少有学生数据
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('班级筛选器显示所有班级', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    
    // 等待筛选器加载
    await page.waitForSelector('select', { timeout: 5000 });
    
    // 获取所有班级选项
    const classSelect = page.locator('select').nth(1); // 第二个select是班级筛选
    const options = await classSelect.locator('option').allTextContents();
    
    // 应该有多个班级选项
    console.log('班级选项:', options);
    expect(options.length).toBeGreaterThan(1);
  });

  test('班级筛选功能正常工作', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    
    // 获取第一个班级的名称
    const classSelect = page.locator('select').nth(1);
    const options = await classSelect.locator('option').allTextContents();
    
    if (options.length > 1) {
      const firstClass = options[1].trim();
      
      // 选择第一个班级
      await classSelect.selectOption(firstClass);
      await page.waitForLoadState('networkidle');
      
      // 验证筛选后的学生都是该班级
      const classCells = await page.locator('tbody tr td:nth-child(3)').allTextContents();
      classCells.forEach(cls => {
        if (cls && cls.trim() !== '-') {
          expect(cls.trim()).toBe(firstClass);
        }
      });
    }
  });

  test('搜索功能正常工作', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    
    // 获取第一个学生姓名
    const firstStudentName = await page.locator('tbody tr:first-child td:nth-child(2)').textContent();
    
    if (firstStudentName) {
      // 输入搜索
      const searchInput = page.locator('input[placeholder*="搜索"]');
      await searchInput.fill(firstStudentName.trim().substring(0, 2));
      await page.waitForLoadState('networkidle');
      
      // 验证搜索结果包含该学生
      await expect(page.locator('tbody').getByText(firstStudentName.trim())).toBeVisible();
    }
  });

  test('新增学生功能', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    
    // 点击新增按钮
    await page.getByRole('button', { name: /新增学生/i }).click();
    
    // 填写表单
    const testUsername = `student_${Date.now()}`;
    await page.getByLabel('用户名').fill(testUsername);
    await page.getByLabel('姓名').fill('测试学生');
    await page.getByLabel('班级').fill('1A');
    await page.getByLabel('密码').fill('Test123!');
    
    // 提交
    await page.getByRole('button', { name: /确定/i }).click();
    
    // 等待关闭弹窗
    await page.waitForTimeout(1000);
    
    // 验证新学生出现在列表中
    await expect(page.getByText(testUsername)).toBeVisible({ timeout: 5000 });
  });

  test('编辑学生功能', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    
    // 点击第一个学生的编辑按钮
    const editButton = page.locator('tbody tr:first-child button[title="编辑"]');
    await editButton.click();
    
    // 等待弹窗
    await expect(page.getByText('编辑学生')).toBeVisible({ timeout: 5000 });
    
    // 修改姓名
    const newName = `编辑测试_${Date.now()}`;
    await page.getByLabel('姓名').fill(newName);
    
    // 提交
    await page.getByRole('button', { name: /确定/i }).click();
    await page.waitForTimeout(1000);
    
    // 重新打开编辑
    await editButton.click();
    await page.waitForTimeout(500);
    
    // 验证修改已保存
    const nameInput = page.locator('input[form*="student-form"]').nth(1);
    const savedName = await nameInput.inputValue();
    expect(savedName).toContain('编辑测试');
  });

  test('删除学生功能', async ({ page }) => {
    await page.goto('/students');
    await page.waitForLoadState('networkidle');
    
    // 获取第一个学生
    const firstStudent = await page.locator('tbody tr:first-child td:nth-child(2)').textContent();
    
    // 点击删除按钮
    await page.locator('tbody tr:first-child button[title="删除"]').click();
    
    // 确认删除
    await page.getByRole('button', { name: /确认删除/i }).click();
    await page.waitForTimeout(1000);
    
    // 验证学生不在列表中
    if (firstStudent) {
      await expect(page.locator('tbody').getByText(firstStudent.trim())).not.toBeVisible();
    }
  });
});
