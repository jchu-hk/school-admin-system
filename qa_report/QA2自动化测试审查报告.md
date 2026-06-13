# QA2 自动化测试审查报告

| 项目 | 内容 |
|------|------|
| **审查分支** | `feature/phase-2-qa2-automation` |
| **审查日期** | 2026-06-07 |
| **审查维度** | 测试框架规范性、测试用例覆盖率、性能测试规范性、测试数据规范性 |
| **审查结论** | 🟡 **条件通过** |

---

## 一、测试框架规范性

### 1.1 Playwright 配置 ✅ 优秀

**优点：**
- 多浏览器支持完整（Chromium / Firefox / WebKit / 移动端 Chrome+Safari），覆盖桌面与移动场景
- 并行策略合理：`CI: workers=3`，本地自动使用全部 CPU，避免资源争抢
- CI 重试策略合理：`retries=2`，减少 flaky test 误报
- 超时配置分层：`actionTimeout=15s`、`navigationTimeout=30s`、`expect=10s`，精准控制
- 报告配置完善：HTML（本地按需打开）、JUnit XML（CI 集成）、Allure（趋势追踪）
- `trace: on-first-retry`、`screenshot: only-on-failure`、`video: on-first-retry`，CI 资源节省
- 支持 `@smoke`、`@regression`、`@critical` 等多级标签，支持按标签选择性运行
- Web Server 自动启动被测应用，开发体验友好

**⚠️ 问题：**
- `auth.setup.ts` **仅生成 admin 角色的认证状态**（`playwright/.auth/user.json`），`teacher`、`officer`、`parent` 角色每次测试都重新登录，拖慢测试速度，且 teacher/parent 测试无法共享已登录的 storageState
- 移动端项目（mobile-chrome / mobile-safari）复用 admin 的 storageState，session 复用逻辑与角色预期不符

### 1.2 CI/CD 流水线 ✅ 良好

**优点：**
- GitHub Actions 配置规范：触发条件覆盖 PR / push / schedule / manual
- 路径过滤正确：`paths` 只在 `apps/backend`、`apps/frontend`、`e2e-tests` 变更时触发，避免资源浪费
- Secrets 管理正确：`secrets.TEST_*_PASSWORD` 而非明文
- 多 Job 并行：`e2e-chromium` + `api-tests` 并行执行，`test-summary` 汇总结果
- 报告上传配置：`if: always()` 确保失败也能留存产物，retention 14 天合理
- JUnit XML 输出支持与主流 CI 系统（GitHub Checks、Jenkins）集成

**⚠️ 问题：**
- 后端启动只等待 `30s`，冷启动慢时容易超时，建议改为健康检查轮询
- **k6 性能测试未集成到 CI**（`.github/workflows/e2e-tests.yml` 中无 k6 Job）

### 1.3 Page Object 模式 ✅ 规范

**优点：**
- `BasePage` 抽象类提供 13 个通用方法（`safeClick`、`fillAndVerify`、`expectToast`、`waitForNavigation` 等），避免重复代码
- 6 个业务 Page Object 继承 `BasePage`，各自封装 `url`、`locators`、`业务操作`
- locators 使用 `data-testid` 选择器，优先于 CSS selector，DOM 变更更稳定
- 统一 `goto()` + `waitForLoad()` 初始化模式

**结论：** Page Object 模式实现规范，符合行业最佳实践。

---

## 二、测试用例覆盖率

### 2.1 业务流程覆盖 ✅ 完整

| 业务流程 | 用例数 | 覆盖状态 |
|---------|--------|---------|
| 登录认证（4角色 + 异常 + OTP） | 7 | ✅ 完整 |
| 用户 CRUD | 7 | ✅ 完整 |
| 请假申请与审批 | 7 | ✅ 完整 |
| 通知发送与管理 | 7 | ✅ 完整 |
| 权限隔离（RBAC） | 8 | ✅ 完整 |

### 2.2 用例设计 ✅ 合理

**正向流程：**
- 4 个角色均可成功登录 ✅
- CRUD 完整链路（Create → Read → Update → Delete）✅
- 请假提交 → 审批 → 进度查询全链路 ✅
- 通知多渠道（WeChat/SMS/Email）发送 ✅

**异常流程：**
- 密码连续错误 5 次锁定账户 ✅
- 病假 >2 天无医生证明被拒绝 ✅
- 重复用户名被拦截 ✅
- 缺少必需变量（通知模板）被拦截 ✅

**边界场景：**
- 空用户名/密码表单验证 ✅
- 弱密码复杂度校验 ✅
- 登出后 URL 校验 ✅
- 语言切换（zh-HK/en）✅

### 2.3 权限隔离测试 ✅ 覆盖充分

- 教师跨班级访问返回 403 ✅（`F-USER-003`）
- 教师仅能访问所教班级（2A）数据 ✅
- 校务主任可访问全部功能 ✅
- 越权访问记录到审计日志 ✅（`F-USER-005`）
- 敏感字段脱敏（身份证 A123456(8)、电话 912***567）✅
- 权限变更审批流程 ✅（`F-USER-007`）

---

## 三、性能测试规范性

### 3.1 k6 脚本 ✅ 基本达标

**符合要求的指标：**

| 指标 | 要求 | 实际配置 | 状态 |
|------|------|---------|------|
| QPS | ≥ 100 | `target: 100 req/s`（ramping-arrival-rate） | ✅ |
| P95 响应时间 | < 500ms | `http_req_duration: ['p(95)<500']` | ✅ |
| 成功率 | ≥ 99% | `http_req_failed: ['rate<0.01']` | ✅ |
| 登录 P95 | < 1000ms | `login_duration: ['p(95)<1000']` | ✅ |

**测试场景：**
- 场景 1：30s 预热 → 1min 升到 100 req/s → 保持 2min → 30s 降至 0（完整的负载曲线）✅
- 场景 2：峰值测试（stress_test，50 VUs × 10 iterations）✅
- smoke-test：5 VUs × 30s，低并发基准验证 ✅

**API 覆盖：** `/auth/login`、`/users`、`/leaves`、`/attendance`、`/dashboard`、`/notifications`、`/finance/fees` ✅

**⚠️ 问题：**
- **k6 未集成到 CI 流水线**，性能退化无法被自动发现
- smoke-test.js 的 `vus: 5` 偏小，可作为 CI 快速检查，但主负载测试必须手动触发
- 登录成功后才执行后续请求，若 token 过期未处理，高并发下可能产生大量失败

### 3.2 性能测试场景合理性 ✅ 合理

负载曲线模拟了真实流量模式（缓升→峰值→保持→缓降），包含多 API 混合调用，符合真实用户行为。

---

## 四、测试数据规范性

### 4.1 测试账号覆盖 ✅ 完整

| 角色 | 用途 | 状态 |
|------|------|------|
| admin（SCHOOL_ADMIN） | 管理员全功能测试 | ✅ |
| officer01（OFFICER） | 校务员审批测试 | ✅ |
| teacher01（TEACHER，2A班） | 教师权限隔离测试 | ✅ |
| parent01（PARENT） | 家长请假/OTP登录 | ✅ |
| user01（GENERAL） | 普通用户基础测试 | ✅ |

### 4.2 测试数据代表性 ✅ 良好

- 使用 `@faker-js/faker` 动态生成唯一用户名/邮箱，避免测试间数据污染 ✅
- `leaveApplications` 覆盖所有请假类型（病假、事假、公假、丧假）✅
- 边界数据：病假 ≤2天 / >2天、有/无医生证明均有对应用例 ✅
- 班级数据：9 个班（1A~6A），学生数据包含 SEN 标记 ✅

**⚠️ 问题：**
- `getMockOTP()` 硬编码返回 `'123456'`，测试环境和生产逻辑耦合，若真实 OTP 逻辑变化，测试无法发现
- `leaveApplications` 中日期使用 `new Date()` 动态计算，但时区未明确（UTC vs HKT），跨环境可能产生日期偏差
- `smoke-test.js` 固定使用 admin 账号，缺少多角色性能差异测试

---

## 五、综合结论

### 结论：🟡 条件通过

### 评分明细

| 维度 | 评分 | 说明 |
|------|------|------|
| 测试框架规范性 | ⭐⭐⭐⭐ (4/5) | Playwright 配置优秀，CI 流水线规范；auth.setup 仅支持 admin 为主要扣分项 |
| 测试用例覆盖率 | ⭐⭐⭐⭐⭐ (5/5) | 4大业务流程全覆盖，正向/异常/边界用例齐全，RBAC 隔离测试完整 |
| 性能测试规范性 | ⭐⭐⭐⭐ (4/5) | k6 脚本配置正确，指标达标；未集成 CI 为主要扣分项 |
| 测试数据规范性 | ⭐⭐⭐⭐ (4/5) | 账号覆盖完整，faker 动态数据优秀；硬编码 OTP 和时区问题扣分 |

### 问题清单

| 优先级 | 问题 | 建议修复 |
|--------|------|---------|
| 🔴 高 | `auth.setup.ts` 仅支持 admin 认证，其他角色每次重新登录，拖慢测试速度 | 为 officer / teacher / parent 各自创建 `*.setup.ts` 并生成独立 `storageState` 文件 |
| 🔴 高 | k6 性能测试未集成到 CI，无法自动发现性能退化 | 在 `e2e-tests.yml` 中新增 `performance-tests` job，每日在 staging 环境运行 |
| 🟡 中 | 后端服务启动仅等待 30s，冷启动场景易超时 | 改为健康检查轮询（`curl --retry 10 --retry-delay 3`） |
| 🟡 中 | `getMockOTP()` 硬编码 `'123456'`，与真实 OTP 生成逻辑耦合 | 改为服务端共享 mock OTP 端点或读取环境变量 |
| 🟡 中 | `leaveApplications` 日期计算未指定时区 | 明确使用 `Asia/Hong_Kong` 时区，避免跨环境日期偏差 |
| 🟢 低 | smoke-test.js 的 `vus: 5` 偏小，仅验证功能而非性能 | 提升至 `vus: 20` 并将 smoke-test 纳入每次 PR 的 CI 快速检查 |

### 亮点

1. **Page Object 模式规范**：`BasePage` 抽象彻底，locators 统一使用 `data-testid`，维护成本低
2. **多级标签驱动**：支持 `@smoke` / `@critical` / `@regression` 分级执行，CI 策略灵活
3. **Allure + JUnit 双重报告**：支持趋势分析和 CI 系统集成
4. **权限隔离测试充分**：RBAC、审计日志、脱敏全覆盖，安全测试意识强
5. **faker.js 动态数据**：有效避免测试间数据污染

---

*审查人：CHECKER 质检岗*
*审查时间：2026-06-07 07:16 GMT+8*
