import { test, expect } from '@playwright/test';

/**
 * Issue #205 修复验证测试
 * 
 * 问题: 学生管理页面「+新增学生」按钮无反应
 * 原因: Zod validation schema类型不匹配
 * 修复: DEFAULT_FORM_VALUES.gender 从 undefined 改为 ''
 * 
 * 测试目标:
 * 1. 验证点击「+新增学生」按钮能正常打开弹窗
 * 2. 验证表单能正常填写和提交（gender字段验证）
 */

const BASE_URL = 'http://localhost:8080';

test.describe('Issue #205 验证', () => {
  
  test('验证「+新增学生」按钮能正常打开弹窗', async ({ page }) => {
    // 直接访问学生管理页面（已登录状态或使用简单绕过）
    await page.goto(`${BASE_URL}/students`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查新增按钮是否存在
    const newStudentBtn = page.getByTestId('btn_new_student');
    await expect(newStudentBtn).toBeVisible({ timeout: 5000 });
    
    // 点击新增按钮
    await newStudentBtn.click();
    
    // 验证弹窗是否出现（这是Issue #205的核心问题）
    await expect(page.getByText('新增学生').first()).toBeVisible({ timeout: 5000 });
    
    // 验证表单字段可见
    await expect(page.getByTestId('field-name_zh')).toBeVisible();
    await expect(page.getByTestId('field-gender')).toBeVisible();
    
    console.log('✅ Issue #205修复验证通过: 新增学生按钮能正常打开弹窗');
  });

  test('验证gender字段默认值和验证逻辑', async ({ page }) => {
    await page.goto(`${BASE_URL}/students`);
    await page.waitForLoadState('networkidle');
    
    // 点击新增按钮
    await page.getByTestId('btn_new_student').click();
    await expect(page.getByText('新增学生').first()).toBeVisible({ timeout: 5000 });
    
    // 检查gender下拉框的默认值（应该为空，而不是undefined导致的错误）
    const genderSelect = page.getByTestId('field-gender');
    await expect(genderSelect).toBeVisible();
    
    // 检查gender下拉框的值（应该是空字符串）
    const genderValue = await genderSelect.inputValue();
    expect(genderValue).toBe('');
    
    // 填写必填字段
    await page.getByTestId('field-name_zh').fill('测试学生Issue205');
    await page.getByTestId('field-birth_date').fill('2010-05-15');
    await page.getByTestId('field-admission_date').fill('2026-09-01');
    
    // 尝试提交（gender未选择，应该有验证错误）
    await page.getByTestId('btn_save').click();
    
    // 等待验证结果显示
    await page.waitForTimeout(1000);
    
    // 验证gender验证错误提示
    const genderError = await page.getByText('请选择性别').isVisible();
    expect(genderError).toBeTruthy();
    
    console.log('✅ Gender验证逻辑正确: 未选择性别时提示错误');
    
    // 选择性别后提交
    await genderSelect.selectOption('male');
    await page.getByTestId('btn_save').click();
    
    // 等待提交结果
    await page.waitForTimeout(2000);
    
    // 验证弹窗关闭（提交成功）
    const modalVisible = await page.getByText('新增学生').first().isVisible();
    expect(modalVisible).toBeFalsy();
    
    console.log('✅ Issue #205修复验证通过: Gender选择后能正常提交');
  });
});