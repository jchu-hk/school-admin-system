import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

/**
 * Playwright E2E 测试配置
 * 智能校务助理系统 - 自动化测试框架
 * 
 * 支持环境:
 * - dev: 开发环境 (http://localhost:3000)
 * - staging: 预发布环境
 * - ci: CI 环境 (CI=true)
 */
export default defineConfig({
  // 测试目录
  testDir: './tests',

  // 完全并行执行测试文件
  fullyParallel: true,

  // CI: 并行3个 workers，本地: 使用所有可用 CPU
  workers: process.env.CI ? 3 : undefined,

  // 重试策略: CI 失败重试2次，本地不重试
  retries: process.env.CI ? 2 : 0,

  // 每个测试的全局超时
  timeout: 60 * 1000,

  // expect 断言超时
  expect: {
    timeout: 10 * 1000,
  },

  // 全局 setup / teardown
  globalSetup: path.resolve(__dirname, './utils/global-setup.ts'),
  globalTeardown: path.resolve(__dirname, './utils/global-teardown.ts'),

  // 测试报告配置
  reporter: [
    // 终端列表报告
    ['list'],
    // HTML 可交互报告
    [
      'html',
      {
        outputFolder: 'reports/html',
        open: process.env.CI ? 'never' : 'on-failure',
      },
    ],
    // JUnit XML (CI 集成)
    ['junit', { outputFile: 'reports/junit/results.xml' }],
    // Allure 报告
    [
      'allure-playwright',
      {
        detail: true,
        outputFolder: 'reports/allure',
        suiteTitle: false,
      },
    ],
  ],

  // 共享配置
  use: {
    // 基础 URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // 浏览器上下文
    headless: process.env.CI ? true : false,

    // Playwright tracing (调试)
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',

    // 失败截图
    screenshot: 'only-on-failure',

    // 失败视频
    video: 'on-first-retry',

    // 默认视口
    viewport: { width: 1440, height: 900 },

    // 动作超时 (点击、填写等)
    actionTimeout: 15 * 1000,

    // 导航超时 (页面跳转)
    navigationTimeout: 30 * 1000,

    // 测试 ID 属性
    testIdAttribute: 'data-testid',

    // 忽略 HTTPS 错误 (测试环境)
    ignoreHTTPSErrors: true,

    // 权限 (地理位置、通知等)
    permissions: ['geolocation', 'notifications'],

    // 额外 HTTP 头
    extraHTTPHeaders: {
      'X-Test-Environment': process.env.TEST_ENV || 'dev',
    },
  },

  // 项目配置
  projects: [
    // ── Setup 项目: 认证状态预填充 ──────────────────────────────────
    {
      name: 'setup',
      testMatch: '**/*.setup.ts',
    },

    // ── Chromium (主浏览器) ──────────────────────────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 复用 setup 阶段的认证状态
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // ── Firefox ─────────────────────────────────────────────────────
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // ── WebKit / Safari ─────────────────────────────────────────────
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // ── 移动端 Chrome ───────────────────────────────────────────────
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // ── 移动端 Safari ───────────────────────────────────────────────
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 14'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // ── API 测试 (无 UI) ───────────────────────────────────────────
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
      },
    },
  ],

  // 本地开发: 启动被测应用
  webServer: process.env.CI
    ? undefined
    : {
        command: 'cd /workspace/projects/workspace && pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
