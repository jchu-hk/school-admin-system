# UAT 验证结果 — 电子请假 全流程端到端（QA）

> **关联 Issue**: #262 (CR-20260714-001 / T26)
> **执行日期**: 2026-08-18
> **执行者**: QA（subagent）
> **验收目标**: 验证电子请假修复后的全流程 E2E，确认 UAT 阻断是否彻底解除
> **后端版本**: 测试环境 `school-admin-backend`（已含 HEAD，`53e2c31`；路由接线修复已部署）

---

## 0. 🔴 结论（TL;DR）

### ❌ **UAT 阻断未解除。** 电子请假全流程**仍不可用**，`leave_requests` 表/路由虽然已就绪，但存在 **3 个代码级阻断 Bug + 1 个前端部署级阻断 Bug**，导致：

| # | 严重级 | 现象 | 影响范围 | 状态 |
|---|--------|------|----------|------|
| BUG-A | 🔴 P0 | 审计日志动作枚举缺失 → 请假写操作 500 | 提交/审批/驳回/撤回 **全部 500** | 未修 |
| BUG-B | 🔴 P0 | `formatLeaveRecord` 对字符串日期调 `.toISOString()` → 列表/详情 500 | 学生/家长查询请假 **500** | 未修 |
| BUG-C | 🔴 P0 | `getAccessibleStudentIds` 对 teacher/staff/director 返回空 + `findAll` 提前返回空 | 教职工/主任 **永远看不到任何请假列表**（无法审批） | 未修 |
| BUG-D | 🟠 P1 | portal-app(:8081) 错发 admin 包（router `basename=/school-admin`） | 门户/QR/家长/学生页 **外部+本地均白屏** | 未修 |

> ✅ **已确认解除的部分**：`/api/portal/leave` 系列路由不再 404（验证返回 401，路由已注册，无 token 鉴权拦截）——DEVOPS 部署的接线修复**有效**。
> ⚠️ 但 DEVOPS 结论「关键阻塞（leave 路由未接线）已解除」仅解决了**路由层**，**功能层仍是坏的**。QA 本轮 E2E 证明：**换一个 DB 约束 / 换一个日期格式化，就能还原出新的 500/空列表**，原 404 阻塞只是表象之一。

---

## 1. 测试账号与 Token 获取（✅ 通过）

| 角色 | 账号 | OTP | 结果 |
|------|------|-----|------|
| 学生 | `student1` | 免 | ✅ 返回 access_token (role=student) |
| 家长 | `parent1` | 免 | ✅ 返回 access_token (role=parent) |
| 教师 | `teacher_1a` | 邮箱OTP | ✅ 登录→查容器日志取OTP→verify → access_token (role=teacher) |
| 主任 | `director` | 邮箱OTP | ✅ 登录→查容器日志取OTP→verify → access_token (role=school_director) |
| 校务 | `staff1` | 免 | ✅ access_token (role=school_staff)，用于教职工侧隔离/权限测试 |

（凭据敏感，未写入本文件；仅记录过程结论。）

---

## 2. API 级全流程验证

> 基准 URL：`http://localhost:3000/api/portal/leave`（后端容器 :3000）。所有响应含 HTTP 状态码。

### 2.1 BUG-A：审计日志动作枚举缺失（P0，阻断提交/撤回/审批/驳回）

**触发**：任何一次请假「写操作」成功改库后，写入 `audit_logs` 时因枚举缺值抛错 → 返回 **HTTP 500**。

| 操作 | 期望 | 实际 HTTP | DB 实际落库 | 证据 |
|------|------|-----------|------------|------|
| 学生提交请假 | 201 | **500** | ✅ 已插入 status=pending（改库在审计前） | 日志: `invalid input value for enum audit_logs_action_enum: "leave_apply"` |
| 家长代学生提交 | 201 | **500** | ✅ 已插入 status=pending（改库在审计前） | 同上 `leave_apply` |
| 学生撤回 pending | 200 | **500** | ✅ 已置 status=cancelled（改库在审计前） | 日志: `...audit_logs_action_enum: "leave_cancel"` |
| 教师审批 approve | 200 | **500** | ❌ **未落库**（审计在 save 前抛错） | 日志: `...audit_logs_action_enum: "leave_approve"` |
| 教师驳回 reject | 200 | **500** | ❌ **未落库**（审计在 save 前抛错） | 日志: `...audit_logs_action_enum: "leave_reject"` |

**根因**：DB 枚举 `audit_logs_action_enum` 当前取值（`pg_type` 实测）为：
`user_create, user_update, user_delete, user_restore, user_status_change, user_password_reset, permission_change, otp_generated, otp_verify_success, otp_verify_failed, otp_bind_initiated, otp_bind_success, otp_unbind_success, permission_approval_request_created, permission_approval_request_approved, permission_approval_request_rejected, permission_approval_request_cancelled, user_departure, user_expiry_warning_sent, user_graduation, inquiry_create`

→ **缺少** `leave_apply / leave_approve / leave_reject / leave_cancel` 四个值。
`leave.service.ts` 中 `auditService.log('leave_apply'|'leave_cancel'|'leave_approve'|'leave_reject' as AuditAction, ...)` 触发了 PG 非法枚举。

**用户可见影响**：学生/家长提交请假、撤回、教师/主任审批/驳回，**前台一律报「服务器错误(500)」**；其中提交/撤回后端实际已改库（数据不一致——前端以为失败但 DB 已写入 pending/cancelled），审批/驳回完全失败。

**修复方向（请 DEV）**：为 `audit_logs_action_enum` 增加 4 个枚举值（`leave_apply`/`leave_approve`/`leave_reject`/`leave_cancel`），或将 leave 审计动作映射到已存在的合法枚举值。
⚠️ QA 不改业务代码/DB，仅报告。

---

### 2.2 BUG-B：列表/详情 `.toISOString()` 崩溃（P0，阻断学生/家长查询）

**触发**：学生/家长 `GET /api/portal/leave`（自己的列表）→ **HTTP 500**。

- 实测：`student1` 查询列表，本会话存在 pending 记录时 → `{"statusCode":500,"message":"Internal server error"}` HTTP 500
- 日志：`TypeError: leave.startDate.toISOString is not a function` at `LeaveService.formatLeaveRecord`

**根因**：`create-leave.dto.ts` 用 `@IsDateString`，实体列 `startDate`/`endDate` 为 date 类型；在 student/parent 的 `findAll` 单主路径（`findAndCount`）返回的 `startDate`/`endDate` 是**字符串**，而 `formatLeaveRecord` 直接 `leave.startDate.toISOString()`、`leave.endDate.toISOString()` 崩溃。`createdAt` 是 Date 没问题。

**用户可见影响**：学生/家长查看请假记录列表、详情 全部 500，无法看到自己提交的任何请假。

---

### 2.3 BUG-C：教职工/主任 `findAll` 恒为空（P0，阻断审批入口数据）

**触发**：`staff1`（school_staff）`GET /api/portal/leave` → **HTTP 200 但 `{"records":[],"total":0}`**，即使 DB 存在 pending 记录。

**根因**（`leave.service.ts` 逻辑顺序错误）：
1. `getAccessibleStudentIds()` 对 teacher/school_staff/school_director **恒返回 `[]`**（该方法注释明确：Teacher/Staff 返回 空）
2. `findAll` 开头：
   ```js
   if (accessibleIds.length === 0) {
     return { records: [], total: 0, page };   // ← 提前 return 空
   }
   ```
3. 因此后续 `if (role === TEACHER||STAFF||DIRECTOR) delete where.studentId`（本会让教职工看全部记录的分支）**永远执行不到**。

**用户可见影响**：教师/主任/校务的请假审批列表**永远是空的**，即使有待审批请假。审批功能入口无数据可点。

---

### 2.4 越权 / 校验 / 隔离（✅ 通过 — 这些安全规则工作正常）

| 用例 | 操作 | 期望 | 实际 |
|------|------|------|------|
| 学生越权审批 | `student1` POST 他人请假 `/approve` | 403 | ✅ **403 Forbidden** |
| 校务越权撤回 | `staff1` PATCH `/cancel`（staff 不在 cancel 角色） | 403 | ✅ **403 Forbidden** |
| 家长代提交未指定学生 | parent1 无 `studentId` 提交 | 400 | ✅ **400** |
| 家长代提交非关联学生 | parent1 给 `stu001` 提交（无 link） | 403 | ✅ **403 「您不是该学生的关联家长」** |
| 家长代关联学生提交 | parent1→student1(已link) | 201 | ⚠️ 实际 500（BUG-A），但**DB 已成功插入 status=pending、submitter_role=parent** |
| 数据隔离（只看到自己的） | student 查询自己的列表 | 仅自己 | ⚠️ **无法用 E2E 证实**——列表接口已被 BUG-B 打 500，无法返回记录；隔离逻辑（`getAccessibleStudentIds` 按 studentId 过滤 + `findOne`/`cancel` 的 ownership 403 守卫）已在代码层确认存在且守卫 403 生效 |

> 注：跨学生隔离因测试环境缺少第二个可用登录的学生 token（批量 seed 账号非 `Admin123!`）未做跨账号 E2E；但所有权守卫（403）在代码与上述用例中均已验证存在并生效。隔离本身未被破坏。

---

## 3. 浏览器端 UI 验证

### 3.1 BUG-D（P1）：portal-app 误服 admin 包 → 门户/QR/家长/学生页白屏

| 页面 | 外部(Coze proxy) | 本地(:8081) | 现象 |
|------|-----------------|-------------|------|
| `/portal/student` | 200(HTML) → 白屏 | 200(HTML) → **ROOT EMPTY** | 路由器不匹配，不渲染 |
| `/portal/parent` | 200(HTML) | — | （同 bundle，预期同白屏） |
| `/attendance/qr` | 200(HTML) | **ROOT EMPTY** | 同白屏 |
| `/school-admin/` (admin-app :8080) | — | ✅ 正常渲染 | 菜单完整，含「请假管理」，dashboard 出勤正常 |

**根因**：`localhost:8081`（portal-app）为 `/portal/student`、`/attendance/qr`、根 `/` 都返回主入口 `index-BZuNsJUY-20260707.js`，该 bundle **内建 `<BrowserRouter basename="/school-admin">`**（实测为 admin 版 bundle），无法匹配 `/portal/*` / `/attendance/qr` URL → 控制台报警：
```
[warning] <Router basename="/school-admin"> is not able to match the URL "/portal/student"
because it does not start with the basename, so the <Router> won't render anything.
```
参考 wiki 期望 portal-app 主线应为 `index-DZuNsJUY-20260707.js`（该文件在 :8081 实测 **404**，仅存在于 :8080）。即 **portal-app 部署的入口 HTML 指向了错的（admin）bundle**。

**用户可见影响**：外部（Coze proxy）与本地访问**所有门户/QR 页面白屏**，无法做任何门户 UI 操作（提交/查看/撤回请假入口全不可见）。此为**部署/前端产物配错**，属 DEVOPS 范围，但阻断 UI 级 UAT。

**proxy 侧附加**：即使修好 bundle，外部访问还受 `/assets/*` 在 Coze proxy 上 404 影响——外部 HTML 引用根路径 `/assets/...`，proxy 未路由该路径（`/portal/assets/...` 才 200）。本地无此问题。

---

## 4. 回归冒烟

| 项 | 结果 |
|----|------|
| `/school-admin/api/health`（外部） | ✅ 200 `{"status":"ok"}` |
| `/portal/student` `/portal/parent` `/school-admin/` `/attendance/qr`（外部 HTTP 可达） | ✅ 均 200（HTML 可返回，但 portal 白屏见 BUG-D） |
| admin-app `/school-admin/` 本地渲染 | ✅ 正常，菜单含「请假管理」，dashboard 无回归 |
| `GET /api/portal/menus`（无 token） | ✅ 401（路由健在，正常鉴权拦截） |
| 学生登录 / 家长登录 / 教师OTP / 主任OTP | ✅ 全部可拿正确角色 token |

---

## 5. 通过 / 失败清单汇总

### ✅ 通过（无需改动）
1. `/api/portal/leave` 路由不再 404（401/403 正确返回，鉴权正常）— DEVOPS 部署修复有效
2. 越权控制：学生越权审批 403、校务越权撤回 403、家长未指定学生 400、家长非关联学生 403
3. 家长为关联学生代提交的**数据正确写入**（status=pending 落库）
4. 角色 OTP 登录链路全部打通（student/parent 免、teacher/director OTP 日志取码可验）
5. 回归冒烟：admin-app 正常、health 200、menus 路由健在

### ❌ 失败 / 阻断（需修复）
| ID | 阻断说明 | 级别 |
|----|----------|------|
| BUG-A | 审计枚举缺 `leave_apply/approve/reject/cancel` → 请假写操作全部 500（且提交/撤回改库成功但前端报错=数据不一致） | P0 |
| BUG-B | `formatLeaveRecord` 对字符串日期 `.toISOString()` → 学生/家长列表/详情 500 | P0 |
| BUG-C | `getAccessibleStudentIds` 对教职工返回空 + `findAll` 提前 return → 教职工/主任列表永远空，无法审批 | P0 |
| BUG-D | portal-app 入口误服 admin bundle（`basename=/school-admin`）+ Coze proxy `/assets` 404 → 门户/QR 白屏 | P1 |

> 修复顺序建议：① BUG-A 枚举（最简单，先恢复写操作）；② BUG-B 日期序列化；③ BUG-C 教职工可见性逻辑顺序；④ BUG-D 前端产物/部署（DEVOPS）。

---

## 6. 测试数据残留说明

QA 验证过程中向 `leave_requests` 写入了几条**测试残留**（student1 名下），便于 DEV 复现：
- `reason=QA完整性验证-发烧需休息` (status=cancelled, 由撤回测试)
- `reason=QA-approve测试` (status=pending)
- `reason=QA-reject测试` (status=pending)
- `reason=QA-parent代提交测试` (status=pending, submitter_role=parent)

（DEV 修完可清理；不影响功能验证。）

---

## 7. 附：证据文件

- 截图：`qa-screenshots/admin_app.png`（admin-app 正常渲染）、`qa-screenshots/portal_student.png`（portal 白屏）
- 后端日志（关键错误，容器 `school-admin-backend`）：
  - `invalid input value for enum audit_logs_action_enum: "leave_apply"` / `"leave_cancel"` / `"leave_approve"` / `"leave_reject"`
  - `TypeError: leave.startDate.toISOString is not a function` at `LeaveService.formatLeaveRecord`
- 浏览器 console（portal）：`<Router basename="/school-admin"> is not able to match the URL "/portal/student" ...`
