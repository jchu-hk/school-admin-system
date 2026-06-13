# 智能校务助理系统 - E2E 自动化测试

> Playwright + k6 自动化测试框架

## 📁 目录结构

```
e2e-tests/
├── playwright.config.ts       # Playwright 主配置
├── package.json              # 依赖管理
├── tsconfig.json             # TypeScript 配置
├── .env.example              # 环境变量模板
│
├── tests/                    # 测试用例
│   ├── auth/                 # 认证测试
│   │   ├── login.spec.ts     # 登录流程
│   │   └── auth.setup.ts     # 认证状态预填充
│   ├── user-management/       # 用户管理测试
│   │   └── user-crud.spec.ts
│   ├── leave/                 # 请假审批测试
│   │   └── leave-approval.spec.ts
│   ├── notification/          # 通知发送测试
│   │   └── notification.spec.ts
│   ├── permission/            # 权限验证测试
│   │   └── permission.spec.ts
│   └── api/                   # API 测试
│       └── auth.api.spec.ts
│
├── pages/                    # Page Object 模型
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── UserManagementPage.ts
│   ├── LeavePage.ts
│   ├── NotificationPage.ts
│   └── PermissionPage.ts
│
├── fixtures/                 # 测试数据
│   ├── users.ts              # 测试用户数据
│   └── test-data.ts          # 班级/学生/请假数据
│
├── utils/                   # 工具函数
│   ├── helpers.ts            # 测试辅助函数
│   ├── api-client.ts         # API 客户端封装
│   ├── global-setup.ts       # 全局 setup
│   └── global-teardown.ts    # 全局 teardown
│
├── performance/              # k6 性能测试
│   ├── api-load-test.js      # 负载测试
│   └── smoke-test.js         # 冒烟测试
│
└── reports/                  # 测试报告
    ├── html/
    ├── junit/
    └── allure/
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd e2e-tests
pnpm install
```

### 2. 安装 Playwright 浏览器

```bash
pnpm playwright:install
# 或安装所有浏览器
pnpm exec playwright install --with-deps
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入测试账号
```

### 4. 启动被测系统

```bash
# 在项目根目录
cd /workspace/projects/workspace
pnpm dev
```

### 5. 运行测试

```bash
# 运行所有测试
pnpm test

# 运行冒烟测试 (@smoke)
pnpm test:smoke

# 运行特定模块
pnpm test:auth
pnpm test:user-mgmt
pnpm test:leave

# 在有头模式运行 (可见浏览器)
pnpm test:headed

# 在 UI 模式运行 (调试友好)
pnpm test:ui

# 打开报告
pnpm report
```

## 📊 性能测试

### k6 负载测试

```bash
# 安装 k6 (如未安装)
# macOS
brew install k6
# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# 冒烟测试 (单用户)
k6 run performance/smoke-test.js

# 负载测试
k6 run performance/api-load-test.js

# 导出 HTML 报告
k6 run performance/api-load-test.js --out html=reports/k6-report.html
```

### 性能基准

| 指标 | 目标 | 说明 |
|------|------|------|
| P95 响应时间 | < 500ms | CRUD API |
| QPS | >= 100 | 系统最大吞吐量 |
| 成功率 | >= 99% | 无错误请求 |
| 登录 P95 | < 1000ms | 含 JWT 签发 |

## 🏷️ 测试标签

| 标签 | 用途 | 执行频率 |
|------|------|---------|
| `@smoke` | 冒烟测试，核心路径 | 每次提交 |
| `@critical` | 关键业务流程 | 每次提交 |
| `@regression` | 完整回归测试 | 每日 |
| `@auth` | 认证授权测试 | 每次提交 |
| `@api` | API 接口测试 | 每次提交 |
| `@security` | 安全相关测试 | 每次提交 |
| `@performance` | 性能测试 | 每周 |

## 🔧 CI/CD 集成

### GitHub Actions

```bash
# 在项目根目录
pnpm --filter @school-admin/e2e-tests test
```

CI 环境变量:
- `CI=true`
- `BASE_URL=https://staging.example.com`
- `API_BASE_URL=https://staging.example.com/api/v1`
- `ADMIN_PASSWORD=${{ secrets.TEST_ADMIN_PASSWORD }}`

## 📝 编写新测试

### 1. 创建 Page Object (如需)

```typescript
// pages/NewFeaturePage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class NewFeaturePage extends BasePage {
  constructor(page: Page) {
    super(page, '/new-feature', 'NewFeaturePage');
    this.someElement = page.getByTestId('some-element');
  }
}
```

### 2. 添加测试用例

```typescript
// tests/new-feature/feature.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { NewFeaturePage } from '../../pages/NewFeaturePage';

test.describe('新功能测试 @new-feature', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAsAdmin();
  });

  test('功能正常流程 @critical', async ({ page }) => {
    const page = new NewFeaturePage(page);
    await page.goto();
    // ...
  });
});
```

## 🛡️ 测试数据原则

- **使用独立测试账号**: 不使用生产账号
- **数据隔离**: 每个测试独立创建/清理数据
- **随机化**: 使用 faker.js 生成唯一数据，避免测试间干扰
- **Mock 外部依赖**: API 测试使用 Mock 而非真实第三方

## 📈 报告查看

```bash
# Playwright HTML 报告
pnpm report

# Allure 报告
pnpm report:allure

# JUnit XML (CI)
cat reports/junit/results.xml
```

## 常见问题

| 问题 | 解决方案 |
|------|---------|
| 浏览器启动失败 | 更新 Playwright: `pnpm exec playwright install` |
| 测试 flaky | 增加 `await page.waitForLoadState('networkidle')` |
| CI 失败但本地通过 | 使用 `docker-compose.test.yml` 统一环境 |
| 视频/截图在哪 | 查看 `reports/` 目录 |
