import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

/**
 * Playwright E2E Test Configuration
 * Smart School Admin System - Automation Test Framework
 * 
 * Supported environments:
 * - dev: Development (http://localhost:3000)
 * - staging: Staging
 * - ci: CI (CI=true)
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 3 : undefined,
  retries: process.env.CI ? 2 : 0,
  timeout: 60 * 1000,
  expect: { timeout: 10 * 1000 },
  globalSetup: path.resolve(__dirname, './utils/global-setup.ts'),
  globalTeardown: path.resolve(__dirname, './utils/global-teardown.ts'),

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: process.env.CI ? 'never' : 'on-failure' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
    ['allure-playwright', { detail: true, outputFolder: 'reports/allure', suiteTitle: false }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: process.env.CI ? true : false,
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    testIdAttribute: 'data-testid',
    ignoreHTTPSErrors: true,
    permissions: ['geolocation', 'notifications'],
    extraHTTPHeaders: { 'X-Test-Environment': process.env.TEST_ENV || 'dev' },
  },

  projects: [
    // Setup: Multi-role auth state pre-population
    { name: 'setup', testMatch: '**/*.setup.ts' },

    // Chromium (main browser) - admin role (default)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/admin.json' },
      dependencies: ['setup'],
    },

    // Role-specific projects
    {
      name: 'chromium-officer',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/officer.json' },
      dependencies: ['setup'],
    },
    {
      name: 'chromium-teacher',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/teacher.json' },
      dependencies: ['setup'],
    },
    {
      name: 'chromium-parent',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/parent.json' },
      dependencies: ['setup'],
    },

    // Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: 'playwright/.auth/admin.json' },
      dependencies: ['setup'],
    },

    // WebKit/Safari
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: 'playwright/.auth/admin.json' },
      dependencies: ['setup'],
    },

    // Mobile Chrome
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'], storageState: 'playwright/.auth/admin.json' },
      dependencies: ['setup'],
    },

    // Mobile Safari
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'], storageState: 'playwright/.auth/admin.json' },
      dependencies: ['setup'],
    },

    // API tests (no UI)
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
      use: { baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api/v1' },
    },
  ],

  webServer: process.env.CI ? undefined : {
    command: 'cd /workspace/projects/workspace && pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
