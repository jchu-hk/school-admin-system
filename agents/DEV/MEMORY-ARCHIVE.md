# DEV Agent - 长期记忆

*上次更新: 2026-07-25*

---

### 2026-07-25 — [#284][#285] Fix i18n English Translation Defects

**#284: Attendance menu only shows 2 sub-items in English**
- **根因**: `en.ts` nav section missing `assetManagement` and `assetRentalManagement` keys
  - Layout.tsx references `t.nav.assetManagement` and `t.nav.assetRentalManagement` which returned undefined
  - These keys existed in `zh-CN.ts` but not in `en.ts`
- **修复**: Added both keys to `en.ts` and `zh-TW.ts`

**#285: Page titles still display Chinese after switching to English**
- **根因**: Layout.tsx hardcoded `智慧校园` as the system title
- **修复**:
  1. Added `nav.systemTitle` key to all 3 locale files with English value 'Smart Campus'
  2. Changed Layout.tsx from `智慧校园` to `{t.nav.systemTitle}`
  3. Also removed fallback `|| '关于系统'` from Layout.tsx about button

**Dashboard improvements (caught during audit)**:
- Replaced hardcoded Chinese chart labels `'出勤'`, `'迟到'`, `'早退'`, `'缺勤'` with `t()` calls
- Added `dashboard.dailyDetail`, `dashboard.presentCount`, `dashboard.lateCount`, `dashboard.earlyLeaveCount`, `dashboard.absentCount`, `dashboard.pendingInquiries`, `dashboard.pendingLeaves` keys to all 3 locales
- Fixed BarChart to use English dataKeys with translated tooltip formatter

**Key finding**: Many pages (AttendancePage, FinanceScholarshipPage, LunchOrderPage, NotificationPage) do NOT use `useI18n` at all. They hardcode Chinese throughout. Fixing those is a larger separate effort beyond these two issues.

**Files changed**:
- `src/i18n/locales/en.ts` — Added 11 keys
- `src/i18n/locales/zh-CN.ts` — Added 11 keys
- `src/i18n/locales/zh-TW.ts` — Added 11 keys
- `src/components/Layout.tsx` — Fixed hardcoded title, removed fallback
- `src/pages/Dashboard.tsx` — Fixed chart labels

**Build**: `npx vite build` → `docker cp` ✅

**Scope note**: Only pages using `useI18n` were fixed. Pages without i18n (Attendance, FinanceScholarship, LunchOrder, Notification) remain Chinese-only — requires separate feature.

---

## 🧠 我的身份

我是 **DEV Agent** — 开发执行者。我负责根据 PM 指派的 Issue 进行代码开发、修复 Bug、实现功能。

**汇报对象**: PM
**协作对象**: QA（移交测试）

---

## 📚 项目上下文（我必须知道的核心信息）

### 项目名: School Admin System
- **后端**: NestJS, TypeORM, PostgreSQL, 端口 3000
- **前端**: React + TypeScript + Vite, 端口 8080
- **部署**: Docker (`school-admin-frontend`, `school-admin-backend`)
- **代理**: Coze 代理 (`https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/`)
- **容器路径**: `/usr/share/nginx/html/` (前端静态文件)

### 关键架构特性
- **Coze 代理前缀**: `/school-admin/api/*` → `localhost:3000/api/*`
- **前端路由 basename**: `/school-admin`
- **API 前缀**: `/api/`（前端 `client.ts` 中 `VITE_API_BASE_URL` 默认值）
- **ValidationPipe**: `whitelist: true, transform: true` — 未知 query 参数静默丢弃
- **数据库类型**: PostgreSQL

### 代码位置
- **项目根**: `/workspace/school-admin-system/`
- **后端源码**: `apps/backend/src/`
- **前端源码**: `school-admin-frontend/src/`
- **Docker Compose**: `docker-compose.yml`

### 登录信息
- 用户名: `testuser`
- 密码: （参考 PM 获取）
- 方式: OTP 认证（登录→获取OTP→验证OTP→获取 access_token）
- 用户ID: `98d9b050-39b6-4d06-9fa9-12ef655b13e5`

---

## 📋 我的工作过 & 我知道的 Bug 背景

### 2026-07-11 — #222: 新增学生报 Internal Server Error (student_id 字段长度超限)
- **根因**: 数据库 `students.student_id` 列 `varchar(10)`, 前端 Zod schema 允许 `max(50)`。输入超10字符时 PostgreSQL 报 `value too long for type character varying(10)`，后端返回 500
- **修复**: 在 `StudentPage.tsx` 中更改 3 个位置:
  1. `createStudentSchema` 和 `studentSubmissionSchema` 中的 `student_id: z.string().max(50)` → `max(10)`
  2. Form input 添加 `maxLength={10}` 属性
- **涉及文件**: `StudentPage.tsx`
- **构建部署**: `npx vite build` → `docker cp dist/. school-admin-frontend:/usr/share/nginx/html/`
- **验证**:
  - 11字符 → 后端 500（前端 Zod 会拦截）
  - 10字符 → 创建成功
  - 留空 → 自动生成（如 `20260022`）

### 2026-07-11 — #220: 编辑学生后保存无效（前端PATCH但后端只接受PUT）
- **根因**: `StudentPage.tsx` 第467行 `apiClient.patch(...)` 发 PATCH 请求，但后端 controller 只定义 `@Put(':id')`（只接受 PUT）。PATCH 返回 404，修改从未写入数据库。
- **修复**: 改 `apiClient.patch` 为 `apiClient.put`
- **涉及文件**: `StudentPage.tsx`（第467行）
- **构建部署**: `npx vite build` → `docker cp dist/. school-admin-frontend:/usr/share/nginx/html/`
- **验证**: 用 `parent_chen` + `Admin123!` 登录，验证 `PUT /api/students/:id` 正常工作
- **注意**: `testuser` 密码与记忆中的 `schooladmin2024` 不匹配，实际可用测试账号是 `parent_chen` + `Admin123!`

### 2026-07-11 — #218 #219: 学生管理筛选 Bug 修复

**Issue #218: 班级下拉框空白**
- **根因**:
  1. 前端 `StudentPage.tsx` 传 `className`（字符串），后端 DTO `StudentQueryDto` 定义的是 `class_id`（UUID）
  2. `ValidationPipe` 的 `whitelist: true` 静默丢弃 `className` 参数
  3. 数据库种子数据使用 UUID v1（如 `00000001-0001-0001-0001-000000000001`），后端 `@IsUUID()` 不接受 UUID v1
- **修复**:
  1. 前端: dropdown `<option value={c.id}>`（原来是 `value={c.name}`）
  2. 前端: fetch 参数 `if (classFilter) params.append('class_id', classFilter)`（原来是 `className`）
  3. 后端 DTO: `@IsUUID()` → `@IsOptional() @IsString()`（因为后端用 raw SQL 查询，不依赖 UUID 验证）
- **涉及文件**: `StudentPage.tsx`, `student.dto.ts`
- **验证方法**: 用 access_token 请求 `?class_id=00000001-0001-0001-0001-000000000001` 应返回该班学生

**Issue #219: 状态筛选不工作**
- **根因**: 前端源码已有 `if (statusFilter) params.append('status', statusFilter)` 逻辑，但**已部署的 JS 是旧版本**，没有这部分代码
- **修复**: 重新构建前端并部署 (`vite build` → `docker cp`)
- **注意**: 这个 bug 是"代码改了但没重新构建"的问题，不是代码错误

### 2026-07-03 — 测试环境刷新
- 下载最新代码从 v1.5.4 到 v1.5.5
- 修复 `student.entity.ts` 循环依赖
- 后端重新编译部署至容器
- 前端重新构建并部署(使用 `vite build` 配合 `docker cp`)
- 数据库迁移同步 (21个migrations)

### 2026-07-11 — #223: 编辑学生时班级分配不保存
- **根因**: 前端 PUT 请求携带 `class_id`，但后端 `studentService.update()` 不处理班级分配
- **修复**: 在 `update()` 方法末尾添加班级分配逻辑：
  1. 如果 `dto.class_id` 存在 → 关闭旧的 main allocation + 创建新的
  2. 如果 `dto.class_id` 为空字符串 → 关闭旧的 main allocation（清除班级）
  3. 默认使用当前学年（`isCurrent: true`）
- **涉及文件**:
  - `student.service.ts` — `update()` 方法追加班级分配逻辑
  - `student.dto.ts` — `UpdateStudentDto` 添加 `academic_year_id` 字段
- **构建部署**: `pnpm --filter @school-admin/backend build` → `docker cp apps/backend/dist/. school-admin-backend:/app/apps/backend/dist/` → `docker restart school-admin-backend`
- **教训**: 容器中后端实际运行路径是 `/app/apps/backend/dist/main.js`，不是 `/app/dist/main.js`。需要确认`ps aux | grep node`看实际路径
- **验证结果**:
  - 编辑学生 → 选班级(1A班) → 保存 → 重开显示1A班 ✅
  - 改班级(2A班) → 保存 → 显示2A班 ✅
  - 清除班级(``) → 保存 → 无班级显示 ✅

### 2026-07-11 — Test-03: 修复 6 个前端缺陷（#224 #229 #227 #228 #225）

**Issue #224: 学生出勤概览 -> 人工录入按钮无响应**
- **根因**: 出勤概览页(`AttendancePage.tsx`)没有独立的"人工录入"导航按钮在概要视图内，用户必须在页顶标签栏切换
- **修复**: 在概要视图(`renderOverviewTab`)中添加了一个醒目的大按钮"人工录入出勤"，点击后通过 `handleTabChange('manual')` 切换到人工录入页签
- **涉及文件**: `AttendancePage.tsx` (overview tab 底部新增按钮)

**Issue #229: 人工录入出勤 -> 日期下拉框选择无效果**
- **根因**: 日期和班级下拉框使用 `setSelectedDate(e.target.value)` 直接更新 state，依赖 `useCallback(loadData, [selectedDate, selectedClass])` + `useEffect([loadData])` 链隐式触发数据重载。但如果回调引用更新不及时，数据可能不刷新
- **修复**: 将 onChange 改为 `handleDateChange` / `handleClassChange` 包装函数以提高可靠性
- **涉及文件**: `AttendancePage.tsx` (新增 handleDateChange/handleClassChange 函数)

**Issue #228: 人工录入出勤 -> 缺少出勤日期标签**
- **根因**: 人工录入页面顶部没有显示当前操作的出勤日期
- **修复**: 在手动录入模块的表单上方添加一个蓝色标签"📅 出勤日期: YYYY-MM-DD"
- **涉及文件**: `AttendancePage.tsx` (manual tab 新增日期标签)

**Issue #227: 人工录入出勤 -> 重置按钮无响应**
- **根因**: 重置按钮只调用 `initManualRecords()` 但不重置日期到当天，导致用户感觉"没重置"
- **修复**: 重置按钮现在额外调用 `setManualDate(today)` 和 `initManualRecords(today)`，将日期和记录一起重置到当天
- **涉及文件**: `AttendancePage.tsx` (重置按钮 onClick 扩展)

**Issue #225: 用户管理 -> 搜索与下拉筛选不工作**
- **根因 (Phase 1 - Frontend)**: 
  1. MSW mock handler (`user.ts`) 使用 `className` 参数，但前端发送 `dept`
  2. MSW mock handler 使用 `limit` 参数，但前端发送 `pageSize`
  3. 前端代码逻辑正确，但 mock 不匹配导致筛选不生效
  4. E2E 测试通过 `data-testid` 选择器定位元素，但 UserPage 没有这些 testid 属性
- **修复 (Phase 1)**:
  1. MSW: 同时接受 `dept`/`className`、`limit`/`pageSize`
  2. UserPage: 添加 `data-testid` 属性
- **根因 (Phase 2 - Backend API)**: QA 验收发现搜索功能仍不工作。`user.controller.ts` 的 `findAll()` 方法不接收 `@Query('keyword')` 参数，搜索时 keyword 被忽略，API 始终返回全部用户数据。
- **修复 (Phase 2)**:
  1. `user.controller.ts` 的 `findAll()` 添加 `@Query('keyword') keyword?: string` 参数，并传递给 service
  2. `user.service.ts` 的 `findAll()` 添加 `keyword` 参数，查询时增加 `WHERE user.username LIKE '%keyword%' OR user.name LIKE '%keyword%'`
  3. Swagger 添加 `@ApiQuery` 描述
- **涉及文件**:
  - `user.controller.ts` (4行变动: 参数签名+传递)
  - `user.service.ts` (7行变动: 参数签名+LIKE查询)
- **验证结果**: curl 测试通过 ✅
  - `keyword=admin` → 1 个匹配用户
  - `keyword=系统` → 1 个匹配用户（中文名模糊搜索）
  - `keyword=nonexistent` → 0 结果
  - 不传 keyword → 166 个用户（全部）

**构建部署**: `vite build` → `docker cp dist/. school-admin-frontend:/usr/share/nginx/html/` → `nginx -s reload`

---

## 🛠 我的工具和工作流程

### 构建部署命令（必须记住）
```bash
# 构建前端
cd /workspace/school-admin-system/school-admin-frontend && npx vite build

# 部署前端到容器
docker cp dist/. school-admin-frontend:/usr/share/nginx/html/

# 后端重新编译
cd /workspace/school-admin-system && pnpm --filter @school-admin/backend build
docker cp apps/backend/dist/. school-admin-backend:/app/apps/backend/dist/
# 重启后端
docker restart school-admin-backend
```

### Dashboard 更新（每次 spawn 必须做）
```bash
# 任务开始时
python3 skills/agent-communication/scripts/write_message.py \
  --from DEV --to PM \
  --message "开始修复 Issue #XXX" \
  --type received --status running

# 任务完成时
python3 skills/agent-communication/scripts/write_message.py \
  --from DEV --to PM \
  --message "Issue #XXX 修复完成" \
  --type done --status idle
```

### 验证测试方法（用 Python 脚本避免 shell 转义问题）
```python
import subprocess, json

# 1. 登录获取 token
login = json.loads(subprocess.check_output([
    "curl", "-s", "http://localhost:3000/api/auth/login",
    "-H", "Content-Type: application/json",
    "-d", '{"username":"testuser","password":"***"}'
]))
temp_token, session_id, otp = login["temp_token"], login["sessionId"], login["otpCode"]

# 2. 验证 OTP
verify = json.loads(subprocess.check_output([
    "curl", "-s", "http://localhost:3000/api/auth/verify-otp",
    "-H", "Content-Type: application/json",
    "-d", json.dumps({"sessionId": session_id, "code": otp, "tempToken": temp_token, "otpType": login["otpType"]})
]))
token = verify["access_token"]

# 3. 测试 API
r = json.loads(subprocess.check_output([
    "curl", "-s", "http://localhost:3000/api/students?class_id=...&page=1&pageSize=5",
    "-H", f"Authorization: Bearer {token}"
]))
```

---

## ⚡ spawn 时我应该做什么

每次被 PM 唤醒后，我应当：

1. **读我的 MEMORY.md** — 了解项目上下文和我过去的经验
2. **读 AGENTS.md 里的通信规则** — 确认最新规则
3. **读 PM 的 task** — 理解任务要求
4. **记录 received 到 Dashboard**
5. **开始工作**
6. **完成后更新 MEMORY.md** — 记录新学到的经验
7. **记录 done 到 Dashboard**

---

## 📝 如何更新本文件

每次完成任务后：
1. 在 `## 📋 我的工作过` 下面追加新的工作记录
2. 更新任何变化的知识（URL、端口、配置等）
3. 如果学到了新的教训，添加到"教训"部分

### 2026-07-19 — P0五Bug修复（#268 #269 #270 #271 #273）

**关键发现：所有5个P0 Bug共享一个根因**

#### 根因分析

**数据库 `parent_student_links` 表数据腐败**
- 60+ 条记录 `student_id = '00000000-0000-0000-0000-000000000000'`（null UUID）
- 1条记录 `student_id = 'TEST0077'`（非UUID字符串）
- 这些值通过简单的UUID格式验证（匹配正则），但在 `users` 表找不到对应记录

**传播路径：**
1. 任何调用 `findOne()` 或 `findAllUsers()` 的方法都会触发 `populateRelatedStudentIds()`
2. 该方法从 `parent_student_links` 读取 `student_id` 并赋值给 `user.relatedStudentId`
3. 当 `save()` 被调用时（update/delete/toggleStatus），TypeORM 尝试写回 `related_student_id` FK
4. PostgreSQL 报 `invalid input syntax for type uuid` 或 FK 约束违反 → 500

**影响范围：**
- `#268 DELETE user` — `remove()` → `findOne()` → `populateRelatedStudentIds()` → 腐败数据 → `save()` → 500
- `#269 Department/ClassName save` — `update()` → `findOne()` → 腐败数据 → `save()` → 500
- `#270 Toggle status` — `toggleStatus()` → `findOne()` → 腐败数据 → `save()` → 500
- `#271 Add user pre-fill` — 前端独立bug，`reset()` 没有在openCreateModal时调用 ✅ 已在workspace源码中修复
- `#273 Inquiry submit fail` — 枚举和列已经在数据库存在，原始测试失败可能是 corruption 导致的级联错误

#### 主要修复

**数据层（PostgreSQL 直接）：**
```sql
DELETE FROM parent_student_links WHERE student_id = '00000000-0000-0000-0000-000000000000';
```
删除 60 条腐败记录。

**代码层（user.service.ts）：**
在 `populateRelatedStudentIds()` 方法中添加 null-UUID 跳过逻辑：
```typescript
const nullUuid = '00000000-0000-0000-0000-000000000000';
for (const link of links) {
  if (link.studentId === nullUuid) {
    continue;
  }
  primaryLinkMap.set(link.parentId, link.studentId);
}
```
并在无有效链接时为 parent 清除 `relatedStudent` 关系。

#### 部署
- 后端：`cd apps/backend && npm run build` → `docker cp user.service.js` → `docker restart`
- frontend fix (#271) 已在 deployed container v1.6.1 中

#### 验证结果
- PATCH department → HTTP 200 ✅
- PATCH status disabled → HTTP 200 ✅
- DELETE user → HTTP 204 ✅
- POST inquiry → HTTP 201 ✅
- Frontend reset() → source code confirmed ✅

**教训：**
- 1. 数据腐败是这次所有bug的共同根源
- 2. 之前的"修复"（commit cde56ea）只加了前端alert，没处理后端500
- 3. 总是先检查数据库数据完整性再找代码问题
- 4. TypeORM 的 `save()` 会序列化 entity 所有字段到 DB，腐败的 `relatedStudentId` 会导致级联 FK 错误
- 5. 前端的 `department` vs 后端 `className` 字段名不匹配是另一个已知但未解决的非P0问题

---

### 2026-07-13 — 周一工作: 诊断剩余Bugs + 环境清理

**Working directory**: `/workspace/school-admin-system/`

**Issue #229: 人工录入出勤 -> 日期下拉框选择无效果**
- **根因**: `initManualRecords` 函数每次用默认 PRESENT 状态初始化表单，数据来自静态 MOCK_STUDENTS，用户更改日期后看不到任何变化
- **修复**: 
  1. `initManualRecords` 改为 async，日期变更时优先调用 `attendanceApi.getByClassAndDate()` 加载已有记录
  2. 有记录 → 用实际出勤记录填充表单
  3. 无记录 → 回退到默认初始化
  4. 加载成功时显示临时提示 "已加载 N 条出勤记录"
- **构建**: vite build → docker cp
- **Commit**: 7ea4e86

**Issue #225: 用户管理 -> 搜索与下拉筛选不工作**
- **根因 (搜索)**: 前端 UserPage.tsx 传 `search` 参数名，后端只接受 `keyword` 参数名
- **根因 (筛选)**: 后端 `findAll()` 控制器方法没有 `keyword` 参数，service 也没实现 LIKE 查询
- **修复 (前端)**: `params.append('search', searchTerm)` → `params.append('keyword', searchTerm)` (此前已在某次dashboard更新中被修复)
- **修复 (后端)**: 
  1. `user.controller.ts`: `findAll()` 和 `getStudents()` 添加 `@Query('keyword')` 参数
  2. `user.service.ts`: `findAll()` 添加 `keyword` 参数 + `WHERE (username LIKE %keyword% OR name LIKE %keyword%)`
  3. Swagger 添加 `@ApiQuery` 描述
- **部署**: `pnpm --filter @school-admin/backend build` → `docker cp dist/` → `docker restart`
- **验证**: keyword=staff → 2结果, keyword=陈 → 4结果, 无keyword → 167结果
- **Commit**: 5e5a1de

**环境清理 (#213-#216)**
- **关键发现**: 重置到 v1.5.7 会丢失 220 个 commit 的所有修复
- **实际操作**: 
  - 跳过破坏性 git reset，保留所有修复
  - 后端容器从 `infra-backend` 切换到 `school-admin-backend:v1.5.7`
  - 环境变量必须匹配旧容器（DB_HOST=postgres, REDIS_HOST=redis）
  - 网络使用 `school-admin-network`
  - 数据库种子数据完整: 170 users, 104 students, 12 classes, 169 attendances
- **所有4个cleanup issues已关闭并注释根因**

**重要教训**:
- `school-admin-backend:v1.5.7` 镜像不含 hotpatch 的 keyword 等修复，必须重新构建部署
- Docker 容器环境变量（DB_HOST=postgres vs school-admin-postgres）要匹配网络配置
- 后端容器网络是 `school-admin-network` 不是 `school-admin-system_default`
- 后端实际运行路径: `/app/apps/backend/dist/main.js`

### 2026-07-25 — #283: DeepSeek 模型弃用排查验证
- **背景**: DeepSeek 弃用 `deepseek-chat` 和 `deepseek-reasoner`，影响所有 agent 运行
- **用户修复**: 更新到 `deepseek-v4-flash` 和 `deepseek-v4-pro`
- **验证结果**:
  1. ✅ Gateway 配置仅含新模型 ID，无旧引用
  2. ✅ 全工作区扫描无旧模型 ID 残留（仅 agent-messages.json 有事件日志）
  3. ✅ 强制运行 cron 任务（pm-daily-check, dashboard-refresh）均成功
  4. ✅ Issue #283 已评论排查报告
- **教训**: 当模型提供商弃用模型 ID 时，需验证 (1) gateway config (2) 全工作区引用 (3) cron/script 运行时兼容性

### 2026-07-25 — [#281][#282]: API Base URL Fallback + 奖学金路径 Bug

**根因**:
1. `#281` — 所有前端 API 文件使用 `import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'` 作为 fallback，但 3001 是 Grafana 端口，不是后端 API。`VITE_API_BASE_URL` 在 `.env.production` 中为空字符串（falsy），导致 fallback 到错误地址
2. `#282` — 奖学金页面调用 `${API_BASE_URL}/scholarship/scholarships`，但后端 controller prefix = `scholarships`（无额外 `scholarship/` 前缀），正确路径应为 `/api/scholarships`

**修复 (10 个文件)**：
- API 文件: `settings.ts`, `budget.ts`, `exam.ts`, `course.ts`, `dse.ts` (5 个)
- 页面文件: `FinanceScholarshipPage.tsx`, `FinanceTuitionPage.tsx`, `FinanceFeePage.tsx`, `FinanceInstallmentPage.tsx` (4 个)
- 统一从 `'http://localhost:3001/api'` → `'/api/'`
- `FinanceScholarshipPage.tsx` 路径修复: `scholarship/scholarships` → `scholarships`, `scholarship/applications` → `scholarships/applications`

**部署**: `npx vite build` → `docker cp dist/. school-admin-frontend:/usr/share/nginx/html/`

**验证结果**:
- `localhost:3001` 从构建产物中完全清除 ✅
- `GET /api/settings/configs` (admin) → 200 ✅
- `GET /api/scholarships` (admin) → 200 ✅
- `GET /api/scholarships` (staff1) → 200 ✅
- 旧路径 `GET /api/scholarship/scholarships` → 404 (正确失败) ✅
- `GET /api/budgets` / `exams` / `courses` → 500 (后端表/列缺失，预存 bug，非本次修复范围)
- `GET /api/scholarships/applications` → 500 (后端 SQL 语法错误，预存 bug)

**教训**:
- 所有前端 API 调用都必须使用相对路径 `/api/`，不要硬编码端口
- 检查前端页面内的 fetch 调用同样需要修复（不只是 api/ 目录下的文件）
- 奖学金页面有 `scholarship/scholarships` 和 `scholarship/applications` 路径错误 — 多了一个 `scholarship/` 前缀
