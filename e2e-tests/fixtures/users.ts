import { faker } from '@faker-js/faker';

/**
 * 测试用户数据
 * 所有角色对应的测试账号
 */

// 测试账号 (从 .env 读取，或使用默认值)
export const testUsers = {
  // 校务主任 (管理员)
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'Test@2026',
    userType: 'SCHOOL_ADMIN',
    name: '测试管理员',
    email: 'admin@school.edu.hk',
    department: '校务处',
  },

  // 校务处同工
  officer: {
    username: process.env.OFFICER_USERNAME || 'officer01',
    password: process.env.OFFICER_PASSWORD || 'Test@2026',
    userType: 'OFFICER',
    name: '测试校务员',
    email: 'officer01@school.edu.hk',
    department: '校务处',
  },

  // 教师 (班主任)
  teacher: {
    username: process.env.TEACHER_USERNAME || 'teacher01',
    password: process.env.TEACHER_PASSWORD || 'Test@2026',
    userType: 'TEACHER',
    name: '测试教师',
    email: 'teacher01@school.edu.hk',
    classCode: '2A',
    subject: '中文',
  },

  // 家长
  parent: {
    username: process.env.PARENT_USERNAME || 'parent01',
    password: process.env.PARENT_PASSWORD || 'Test@2026',
    userType: 'PARENT',
    name: '测试家长',
    email: 'parent01@school.edu.hk',
    phone: process.env.PARENT_PHONE || '+85290000001',
    childName: '王小明',
    childClass: '2A',
    childStudentId: '2023S20101',
  },

  // 普通用户 (无特殊权限)
  regularUser: {
    username: 'user01',
    password: 'Test@2026',
    userType: 'GENERAL',
    name: '测试普通用户',
    email: 'user01@school.edu.hk',
  },
};

/**
 * 错误登录测试数据
 */
export const invalidLoginData = {
  wrongPassword: 'WrongPassword123!',
  wrongUsername: 'nonexistent_user',
  emptyUsername: '',
  emptyPassword: '',
  shortPassword: '123',
  weakPassword: '123456',
};

/**
 * 密码重置测试数据
 */
export const passwordResetData = {
  validEmail: 'admin@school.edu.hk',
  invalidEmail: 'notanemail',
  unregisteredEmail: 'nobody@school.edu.hk',
};

/**
 * 获取测试 OTP (Mock)
 * 从环境变量 TEST_OTP_CODE 读取，默认为 '123456'
 */
export function getMockOTP(): string {
  return process.env.TEST_OTP_CODE || '123456';
}

/**
 * 生成唯一用户名 (用于创建用户测试)
 */
export function generateUniqueUsername(): string {
  return `testuser_${faker.string.alphanumeric(8).toLowerCase()}`;
}

/**
 * 生成唯一邮箱
 */
export function generateUniqueEmail(): string {
  return `test_${faker.string.alphanumeric(8)}@school.edu.hk`;
}
