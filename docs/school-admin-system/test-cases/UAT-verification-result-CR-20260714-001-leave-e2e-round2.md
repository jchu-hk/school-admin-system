# UAT 验证结果（Round 2）— 电子请假 修复后复验（QA）

> **关联 Issue**: #262 (CR-20260714-001 / T26)
> **执行日期**: 2026-08-18
> **执行者**: QA（subagent）
> **验收目标**: 复验上一轮发现的 4 个 bug（BUG-A/B/C/D）是否已真正修复、端到端 API 可用；确认前端 UI 是否就绪供真人 UAT
> **前置条件（DEVOPS/DEV 已声明）**: 后端已重编译部署（3 P0 + audit 枚举迁移已应用）；前端 portal 已重建（basename=/）
> **基准确认**: audit_logs.action 枚举已含 `leave_apply/leave_approve/leave_reject/leave_cancel`（pg_type 实测）；3 个 P0 修复对应代码已就位

---

## 0. 🔴 结论（TL;DR）

### 🔶 **后端 API 全流程已修复并通过 E2E（BUG-A/B/C 解除），前端应用层 BUG-D 已修复——但外部 UAT 环境仍未就绪。**

| # | 严重级 | 复验结论 | 说明 |
|---|--------|---------|------|
| BUG-A | 🔴 P0 | ✅ **已修复** | audit 枚举 4 值已落库；提交/审批/驳回/撤回均返回正确 HTTP 码，审计日志正确写入（含 actor 与 responseStatus），不再 500 |
| BUG-B | 🔴 P0 | ✅ **已修复** | 列表/详情返回 200，日期序列化正常（`formatLeaveRecord` 类型安全处理生效），不再 `.toISOString` 崩溃 |
| BUG-C | 🔴 P0 | ✅ **已修复** | 教师/主任 `GET /portal/leave` 返回**非空列表**（total=5/6），不再恒空，审批入口有数据 |
| BUG-D | 🟠 P1 | ⚠️ **应用层已修复，但外部仍被阻断** | portal 页 **本地渲染正常**（basename=/ 修复生效，root 挂载成功）；但 Coze proxy 对根路径 `/assets/*` **全部返回 404** → 门户/家长/QR 及 admin 页经 proxy **外部均白屏** |

> ⚠️ **UAT-ready 判定**: **后端 API 已就绪可测，但前端 UI 经外部 Coze proxy 仍白屏，真人 UAT（UI 级）暂不可用。** 阻塞点不在应用代码（basename 修复正确、本地渲染验证通过），而在 **Coze proxy 的 `/assets/` 根路径未路由**。需 DEVOPS 处理 proxy 路由（见 §6）。

---

## 1. API 全流程复验（真实 token，经 Coze proxy 外部入口）

> 基准：`https://aade13aa-...coze.site/school-admin/api/portal/leave`
> 账号：student1/parent1（免OTP）、teacher_1a/director（邮箱OTP，日志取码）。凭据敏感，未写入本文件。

### 1.1 BUG-A：audit 枚举 4 值已补齐，写操作不再 500 ✅

**DB 实测**（`pg_enum` `audit_logs_action_enum`）已含：
`...inquiry_create, leave_apply, leave_approve, leave_reject, leave_cancel`

**E2E 实测**（此前全部 500，现全部正确）：

| 操作 | 角色 | 期望 | 实际 HTTP | 审计日志写入 |
|------|------|------|-----------|--------------|
| 提交请假 | student1 | 201 | ✅ **201** | `leave_apply` status=201 actor=student1 |
| 家长代提交 | parent1 | 201 | ✅ **201** | `leave_apply` status=201 actor=parent1 |
| 审批 approve | teacher_1a | 200 | ✅ **200** (status=APPROVED) | `leave_approve` actor=teacher_1a |
| 驳回 reject | director | 200 | ✅ **200** (status=REJECTED) | `leave_reject` actor=director |
| 撤回 pending | student1 | 200 | ✅ **200** (status=CANCELLED) | `leave_cancel` 200 |

> DB `audit_logs` 实测 6 条 leave 审计记录，actor（student1/parent1/teacher_1a/director）与 responseStatus 全部正确。审计写操作不再抛 500。

### 1.2 BUG-B：日期序列化不再崩溃 ✅

- 学生 `GET /portal/leave` → **200**（total=5），`startDate`/`endDate` 均返回 `'YYYY-MM-DD'` 字符串（如 `2026-08-20`），不再 500。
- 学生 `GET /portal/leave/{id}` → **200**，`startDate:'2026-08-20'` `endDate:'2026-08-21'`。
- 撤回后详情能正常返回 `status=cancelled`、`canCancel=false`。

### 1.3 BUG-C：教职工/主任可见性修复 ✅

| 查询 | 期望 | 实际 | DB total |
|------|------|------|----------|
| teacher_1a `GET /portal/leave` | 有数据 | ✅ **200 + 非空** | total=5 |
| director `GET /portal/leave` | 有数据 | ✅ **200 + 非空** | total=6 |

### 1.4 撤回 / 校验 / 越权 / 隔离（全部通过）

| 用例 | 操作 | 期望 | 实际 |
|------|------|------|------|
| 撤回 pending | 新提交 pending → PATCH /:id/cancel | 200+CANCELLED | ✅ 200, status=CANCELLED, 详情 canCancel=false |
| 撤回非 pending | PATCH 已 approved 的记录 /cancel | 400 | ✅ **400**（仅 pending 可撤回） |
| 学生越权审批 | student1 POST 他人请假 /approve | 403 | ✅ **403** |
| 日期重叠校验 | 已有 pending 时重复提交相同时段 | 400 | ✅ **400**（不重复落库） |
| 数据隔离 | student 列表仅本人相关记录 | 仅本人 | ✅（学生列表 total=5 全部为 student1 名下） |

---

## 2. 浏览器端 UI 复验

> 工具：agent-browser（headless Chrome）。关键：必须用**全新 profile 清缓存**，否则会残留上一轮部署的旧 admin index.html/bundle，导致误判白屏。本地验证均以全新 profile 执行。

### 2.1 BUG-D 应用层修复确认（basename=/ 已生效）✅

**本地（:8081 frontend-v2，新 profile）：**

| 页面 | title | #root children | bodyText | 结论 |
|------|-------|----------------|----------|------|
| `/portal/student` | 智能校务助理系统 | **1** ✅ | 门户登录页文案（学生登录/家长登录） | ✅ **正常渲染** |
| `/portal/parent` | 智能校务助理系统 | **1** ✅ | 同门户登录页 | ✅ **正常渲染** |

> 上一轮 BUG-D 根因（portal 误服 admin bundle、basename=/school-admin 不匹配 /portal/*）**已消除**：现在 portal HTML 引用 `/assets/index-BTSIfyoS-20260707.js`（basename 根路径），bundle 有效（377KB），root 成功挂载，门户登录入口可见可操作。

### 2.2 ⚠️ 外部（Coze proxy）仍白屏 — proxy 根路径 `/assets/` 404

| 页面 | 经 proxy 渲染 | 根因 |
|------|--------------|------|
| `/portal/student` | ❌ **白屏**（#root=0, bodyText="") | `/assets/index-BTSIfyoS-...js` 经 proxy → **404** |
| `/portal/parent` | ❌ **白屏**（#root=0） | 同上 |
| `/attendance/qr` | ❌ **白屏**（#root=0） | `/assets/index-B52kQjGo-...js` → **404**（admin 前端） |
| `/school-admin/` | ❌ **白屏**（#root=0） | admin HTML 引用根 `/assets/index-B52kQjGo-...js` → **404** |

**实测证据**（经 Coze proxy 直连）：
- `/assets/index-BTSIfyoS-20260707.js` → **404**
- `/assets/index-B52kQjGo-20260707.js` → **404**（admin bundle）
- `/assets/browser-BXdiCFWD-20260707.js` → **404**
- `/school-admin/assets/index-B52kQjGo-...js` → **200**（proxy 仅转发 `/school-admin/*` 前缀，**不转发根 `/assets/*`**）

> ⚠️ 结论：basename=/ 修复要求前端资源引用根路径 `/assets/...`，而 Coze proxy 只把 `/school-admin/*` 透传到前端、未路由外层 `/assets/*`。因此即便应用层已是正确代码，**外部所有前端页面（门户/家长/QR/admin）因 bundle 加载失败而白屏**。本地（nginx 直连）无此问题。

---

## 3. 回归冒烟

| 项 | 结果 |
|----|------|
| `/school-admin/api/health`（外部） | ✅ 200 `{"status":"ok"}`, `{"timestamp":...}` |
| 学生/家长/教师/主任 4 角色 OTP/免OTP 登录链路 | ✅ 全部可拿正确角色 token |
| `GET /api/portal/leave` 无 token | ✅ 401（鉴权正常） |
| 越权 403 / 校验 400 | ✅ 见 §1.4 |
| 后端 API 全流程（经 proxy） | ✅ 全部通过（见 §1）|

---

## 4. 通过 / 未通过 汇总

### ✅ 已修复并通过复验
1. **BUG-A**：audit 枚举 4 值已落库；提交/审批/驳回/撤回不再 500，审计正确写入。
2. **BUG-B**：列表/详情日期序列化不再崩溃，返回 200 + 规范日期字符串。
3. **BUG-C**：教师/主任请假列表返回非空数据，审批入口有数据可点。
4. **BUG-D（应用层）**：basename=/ 生效，portal/parent 本地渲染正常，root 挂载成功。

### ⚠️ 仍未解除（外部 UAT 阻断）
5. **BUG-D（外部路由）**：Coze proxy 不路由根路径 `/assets/*` → 门户/家长/QR/admin **经外部一律白屏**。应用代码正确，但外部不可用。

---

## 5. 测试数据残留说明

本轮 QA 复验向 `leave_requests` 新增（student1 名下，供 DEV/后续 UAT 参考）：
- status=`approved`（teacher_1a approve 测试）
- status=`rejected`（director reject 测试，parent1 代提交）
- status=`cancelled`（撤回测试）

另有上一轮遗留的若干 pending/approved/cancelled 记录。均不影响功能验证；UAT 正式前建议清理或忽略。

---

## 6. 需要 DEVOPS/DEV 处理的事项

### 🔴 DEVOPS（阻断外部 UI UAT）
- **Coze proxy 需增加对根路径 `/assets/*` 的转发/路由**，使其透传到对应前端容器（frontend-v2 :8081 的 portal 资源 + frontend :8080 的 admin 资源）。当前根 `/assets/*` 一律 404 → 所有前端页面外部白屏。
- 备选：将前端 SPA 资源改为可被 proxy 当前路由模型命中的路径前缀（但会与 basename=/ 修复冲突，需评估），核心是确保外部能拉取 JS/CSS。

### ✅ DEV（无遗留）
- 后端 3 个 P0 + audit 迁移已有效，无新增后端 bug。

---

## 7. 证据文件

- 截图：
  - `qa_proxy_portal_student_blank.png` — proxy `/portal/student` **白屏**（本次复验证据，已在 workspace 清理，结论可复现）
  - 本地 `/portal/student` 渲染正常（#root=1，门户登录页文案可见）
- DB 实测：
  - `pg_enum audit_logs_action_enum` 含 4 个 leave 值（§1.1）
  - `audit_logs` 存在 6 条 leave 审计，actor/status 正确
  - `leave_requests` 新记录 status 正确流转（pending→approved/rejected/cancelled）
- proxy 直连：
  - 根 `/assets/*` → 404（多个 bundle 均验证）
  - `/school-admin/assets/*` → 200
- 浏览器 eval：proxy 页 `#root children=0, bodyText=""`；本地页 `#root children=1` 且正文含门户登录文案

---

## 8. UAT-ready 结论（供 PM / DEVOPS 决策）

- **后端 API**：✅ 就绪，可支撑真实 UAT 的全流程操作（提交/审批/驳回/撤回/查询）。
- **前端 UI（外部）**：❌ **暂不就绪**。因 Coze proxy 对根 `/assets/` 404，**所有门户/家长/QR/admin 页面经外部均白屏**，真人 UAT 无法操作 UI。
- **前端 UI（内部/本地 nginx 直连）**：✅ 渲染正常，可先做内网 UI 验证。

> **建议**：由 DEVOPS 修复 Coze proxy 对 `/assets/*` 的转发后，再做一次 5 分钟 UI 冒烟即可放行真人外部 UAT。其余（后端、权控、回归）均已通过。
