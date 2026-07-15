# Project Wiki - School Admin System

> Last updated: 2026-07-15 07:10 GMT+8
> Updated by: PM (CR-20260714-001 Phase 1~4 完成, Phase 5 待部署)

---

## 📦 Current Version

- **Version**: v1.6.0 → v2.0.0-draft.1
- **Release Date (当前)**: 2026-07-13 (v1.6.0 — 全部Bug清零)
- **开发中版本**: v2.0.0 (CR-20260714-001 — QR考勤 + 学生/家长门户)
- **Git Commit (当前)**: `d81c25e` (main)
- **Branch**: `main` (dashboard自动更新commit; 新功能代码在workspace未提交)
- **Status**: Bug清零发布(v1.6.0) + 新功能开发完成(Phase 1~4) → 等待Phase 5集成部署
- **Tested By**: QA Agent (Phase 4 验证通过)

## 🚀 CR-20260714-001 变更概览
| `3f207a2` | 修复出勤记录按钮无响应 | Frontend |
| `24787b4` | 添加inquiry实体@Column装饰器 | Backend |
| `83358fe` | API分页参数limit改为pageSize | Backend |

**注意**: Coze环境可能未包含以上所有修复


### CR-20260714-001 变更内容

| 编号 | 模块 | 状态 | 进度 |
|------|------|------|------|
| Phase 1 | 文档编制 (T01~T07) | ✅ 已完成 | CHECKER QC通过 |
| Phase 2 | 后端编码 (T08~T12) | ✅ 已完成 | CHECKER Code Review通过 |
| Phase 3 | 前端编码 (T13~T19) | ✅ 已完成 | CHECKER Code Review通过 |
| Phase 4 | QA验证 (T20~T23) | ✅ 已完成 | 所有测试通过 |
| Phase 5 | **集成部署 (T24~T28)** | 🔄 进行中 | T25子任务完成✅（新前端容器已部署到8081）|
| Phase 6 | 上线后 (T29~T30) | ⏳ 待启动 | 依赖Phase 5 |

**完整计划**: `docs/CHANGE-REQUEST-PLAN-20260714.md`

### 新功能访问方式

新功能代码在 `apps/frontend/` 目录下（独立的React前端应用），**尚未部署到Docker容器**。

| 功能 | 路由 | 访问链接 (Coze) |
|------|------|-----------------|
| QR考勤 — 学生展示 | `/attendance/qr` | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/attendance/qr](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/attendance/qr) |
| QR考勤 — 教职工扫码 | `/attendance/scan` | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/attendance/scan](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/attendance/scan) |
| 学生门户 — 首页 | `/portal/student` | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student) |
| 学生门户 — 个人档案 | `/portal/student/profile` | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student/profile](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student/profile) |
| 学生门户 — 电子请假 | `/portal/student/leave` | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student/leave](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student/leave) |
| 家长门户 — 孩子列表 | `/portal/parent/children` | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/parent/children](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/parent/children) |
| 家长门户 — 请假管理 | `/portal/parent/leaves` | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/parent/leaves](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/parent/leaves) |
| 家长门户 — 通知中心 | `/portal/parent/notifications` | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/parent/notifications](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/parent/notifications) |
| 家长门户 — 账户设置 | `/portal/parent/settings` | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/parent/settings](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/parent/settings) |

> 🔗 **旧前端 (教职工后台)**: [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/)
> ⚠️ 新功能链接在 Coze Nginx 路由已配置好（指向8081端口），但等新前端容器部署完成后才真正可用。

### Phase 5 待办任务 (P0)

| Issue | 任务 | 负责角色 | 依赖 |
|-------|------|---------|------|
| #259 | T24: 全系统回归测试 | QA | T20~T23完成 |
| #261 | T25: 部署脚本 — DB迁移/Docker/环境变量 | DEVOPS | T07 |
| #262 | T26: UAT准备 — 环境+用例+培训材料 | DEVOPS+Admin | T24+T25 |
| #263 | T27: UAT执行 | Admin+QA | T26 |
| #264 | T28: 生产发布 | DEVOPS | T27 |

> 所有Phase 5 Issue已创建但**未分配**，需PM按流程分配并启动。

### 测试账号 (v2.0.0新角色)

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 系统管理员 | `qa_test` | `Admin123!` | 全部功能 |
| 校务人员 | `staff1` | `Admin123!` | 日常管理 |
| 教师 | `teacher1` | `Admin123!` | +需OTP |
| **学生** | **`student1`** | **`Admin123!`** | **仅学生门户** (新) |
| **家长** | **`parent1`** | **`Admin123!`** | **仅家长门户** (新) |

### 已知问题

- **#235 P1**: `student`角色保存权限配置失败（未分配、未修复）

---

## 🐳 Docker 服务清单

| Container | Image | Port | 应用 | Status |
|-----------|-------|------|------|--------|
| school-admin-frontend | school-admin-frontend:latest | 8080→80 | **admin-app** (教职工后台) | ✅ 运行中 |
| school-admin-frontend-v2 | nginx:alpine | 8081→80 | **portal-app** (QR考勤+门户) | ✅ 已部署 |
| school-admin-backend | school-admin-backend:v1.5.7 | 3000 | 后端API | ✅ 运行中 |
| school-admin-postgres | postgres:16-alpine | 5432 | 数据库 | ✅ 运行中 |
| school-admin-redis | redis:7-alpine | 6379 | 缓存 | ✅ 运行中 |

## 🌐 测试环境刷新流程

### 何时刷新测试环境

| 场景 | 操作 |
|------|------|
| DEV完成修复，需要QA验收 | **必须刷新** |
| 代码合并到main后 | **必须刷新** |
| QA开始新任务前 | **必须验证版本号** |
| 每次部署后 | **必须检查About页面版本** |

### 如何刷新测试环境

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 构建后端
cd apps/backend && npm run build

# 3. 部署后端到容器
docker cp dist/. school-admin-backend:/app/dist/
docker restart school-admin-backend

# 4. 构建前端
cd ../../school-admin-frontend && npm run build

# 5. 部署前端到容器
docker cp dist/. school-admin-frontend:/usr/share/nginx/html/

# 6. 验证 - 检查About页面版本号
curl http://localhost:8080/school-admin/about | grep version
```

### QA验收前检查清单

- [ ] About页面版本号正确（应为当前版本）
- [ ] Backend API正常响应
- [ ] 登录功能正常
- [ ] 被测功能可访问

### 版本号验证点

**About页面** (`/school-admin/about`) 显示的版本号必须与：
1. 当前Git commit版本一致
2. PROJECT-WIKI中记录的版本一致

**不一致 = 测试环境未正确刷新**

---

## 🌐 Environment URLs

> 💡 **测试环境说明**:
> - **localhost** = 测试环境（Coze只是代理转发到localhost）
> - About页面版本号 = 测试环境的实际代码版本

| Service | URL | 类型 | 状态 |
|---------|-----|------|------|
| **admin-app** (本地) | http://localhost:8080 | ✅ 自管 | ✅ v1.6.0 |
| **portal-app** (本地) | http://localhost:8081 | ✅ 自管 | ✅ QR考勤+门户 |
| Backend API (本地) | http://localhost:3000 | ✅ 自管 | ✅ v1.5.7 |
| Coze — admin-app | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/) | ☁️ Coze | ✅ 教职工后台 |
| Coze — portal-app | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/attendance/qr](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/attendance/qr) | ☁️ Coze | ✅ 已连通 |
| Coze — portal-app | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student) | ☁️ Coze | ✅ 已连通 |
| Cloudflare Tunnel | `https://...trycloudflare.com` | ⚡ 临时代理 | ⚠️ URL会变化 |
| Coze 入口 | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/) | ☁️ Coze | → OpenClaw Gateway |

**Coze 基本 URL**: [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/)

> 💡 **推荐使用本地测试环境** — 我们控制的，始终最新

### ⚠️ 双前端环境说明

系统目前存在**两个独立前端应用**（非渐进增强，是独立SPA）：

| 应用 | 代码位置 | 端口 | 功能 | 部署状态 |
|------|---------|------|------|---------|
| **🧑‍🏫 admin-app** | `school-admin-frontend/` | 8080 | 教职工后台管理 | ✅ 运行中 |
| **👨‍🎓 portal-app** | `apps/frontend/` | 8081 | QR考勤 + 学生/家长门户 | ✅ 已部署 |

两个应用共享同一后端API (`school-admin-backend:3000`)，通过不同URL路径区分：
- admin-app: `/school-admin/*`
- portal-app: `/attendance/*`, `/portal/*`

### ⚠️ About页面版本号的重要性
**About页面显示的版本号反映代码库的实际版本**。每次刷新测试环境后，必须：
1. 验证About页面版本号是否正确
2. 如果版本号不对，说明测试环境没有正确刷新
3. 这是确保QA测试的是正确代码的关键步骤

---

## 🏗️ Architecture

```
Browser → Cloudflare Tunnel → Frontend (Next.js :3001)
                                   ↓ proxy
                              Backend (NestJS :3000)
                                   ↓
                              PostgreSQL (:5432) + Redis (:6379)
                                   ↓
                              Kafka (:9092) + Zookeeper (:2181)
```

### Services (Docker)

| Container | Port | Purpose |
|-----------|------|---------|
| `school-admin-frontend` | 8080 → 80 | Web app (Nginx) |
| `school-admin-backend` | 3000 | NestJS REST API |
| `school-admin-postgres` | 5432 | Primary database |
| `school-admin-redis` | 6379 | Cache/queue |
| `school-admin-opa` | 8181 | Open Policy Agent (ABAC) |
| `school-admin-kafka` | 9092 | Event streaming (persistent) |
| `school-admin-zookeeper` | 2181 | Kafka coordination (persistent) |
| `school-admin-prometheus` | 9091 | Metrics (persistent) |
| `school-admin-grafana` | 3001 | Dashboards (persistent) |
| `school-admin-alertmanager` | 9093 | Alerts (persistent)

---

## 🔑 Credentials

### 👤 测试账号 (2026-07-09 验证)

| 角色 | 用户名 | 密码 | OTP | 权限 | 验证状态 |
|------|--------|------|-----|------|---------|
| **系统管理员** | **qa_test** | `Admin123!` | ❌ | **全部功能** | ✅ **推荐** |
| **校务人员** | **staff1** | `Admin123!` | ❌ | 日常管理 | ✅ **可用** |
| 教师 | teacher1 | `Admin123!` | ✅ | 教学管理 | ⚠️ 需 OTP |
| 家长 | parent1 | `Admin123!` | ❌ | 家长门户 | ✅ 功能有限 |
| 学生 | student1 | `Admin123!` | ❌ | 学生门户 | ✅ 功能有限 |

> ✅ **推荐**: `qa_test` (完整权限) 或 `staff1` (日常管理)
> 📍 **唯一信息来源**: docs/school-admin-system/PROJECT-WIKI.md

### 🛠️ 系统服务账号

| Service | Username | Notes |
|---------|----------|-------|
| PostgreSQL | `postgres` | See `.env` for password |
| Grafana | `admin` | See `.env` for password |

> See `.env` file in project root for full credentials. Never commit `.env` to Git.

---

## 🐛 Open Issues

### Priority Summary

| Priority | Count | Issues |
|----------|-------|--------|
| P0 | 6 | CR-20260714-001 Phase 5 (T24~T28 + T29) |
| P1 | 1 | #235 student角色权限保存失败 |
| P2 | ~10 | Core module backlog |
| P3 | ~5 | AI features, TypeORM warnings |
| P4 | 2 | Enhancements (teacher recruitment, meeting management) |

### Key Issues

| # | Title | Status | Priority |
|---|-------|--------|----------|
| #259 | T24: 全系统回归测试 | open (unassigned) | P0 |
| #261 | T25: 部署脚本 | open (unassigned) | P0 |
| #262 | T26: UAT准备 | open (unassigned) | P0 |
| #263 | T27: UAT执行 | open (unassigned) | P0 |
| #264 | T28: 生产发布 | open (unassigned) | P0 |
| #235 | student角色权限保存失败 | open (unassigned) | P1 |
| #140 | TypeORM warnings fix | ready-for-review | P3 |
| #184 | Teacher recruitment module | backlog | P4 |
| #182 | Meeting management module | backlog | P4 |

---

## ⚠️ Known Gaps (Non-Blocking)

These are known issues that do not currently impact operations:

1. **Missing DB tables**: `lunch_changes`, `assets` — not yet migrated
   - No current functionality depends on these tables
   - Will be addressed in future migration

2. **PROJECT-WIKI.md**: Was missing; created 2026-07-03

3. **Issue #140**: CHECKER review pending for TypeORM warnings fix

---

## 📁 Key Documentation

| Document | Purpose |
|----------|---------|
| `SPEC-COMPLETE.md` | Full feature specification |
| `SPEC-SYSTEM-DESIGN.md` | System architecture |
| `API-DESIGN.md` | REST API reference |
| `DB-SCHEMA.md` | Database schema |
| `DATA-DICTIONARY.md` | Field definitions |
| `docs/PM-WORKFLOW.md` | PM workflow reference |
| `AGENTS.md` | Agent operating rules |
| `multi-agent-dashboard.html` | Real-time agent dashboard |

## 🧪 QA Test Reports

| Report | Type | Date | Status | Link |
|--------|------|------|--------|------|
| Student Management E2E Test | End-to-End | 2026-06-27 | ✅ Pass | [TEST-REPORT.md](e2e-tests/TEST-REPORT.md) |
| Student Management E2E Regression | End-to-End | 2026-07-06 | ❌ Failed (28.57%) | [Regression Report](./qa_report/student-management-regression-report-20260706.md) |
| Student Management E2E Regression Fix | End-to-End | 2026-07-06 | ✅ Fixed & Closed | [Fix Report](./qa_report/student-management-regression-fix-report-20260706.md) |
| Student Management Full | Full QA | 2026-07-06 | ⚠️ Blocked | [Full Report](./qa_report/student-management-full-report-20260706.md) |
| Student Management Root Cause | Analysis | 2026-07-06 | 📋 Analysis | [Root Cause](./qa_report/student-page-performance-root-cause.md) |

---

## 🤖 Multi-Agent Dashboard

Live dashboard: [multi-agent-dashboard.html](multi-agent-dashboard.html)

### Agent Roles

| Agent | Role |
|-------|------|
| PM | Project Manager — task assignment, review, human reporting |
| DEV | Developer — implementation |
| QA | Quality Assurance — testing, test reports |
| CHECKER | Quality checker — code review, spec compliance |
| OPS | Operations — deployment, monitoring |
| Project Admin | Coordinator — heartbeat monitoring, dashboard updates |

---

## 🔄 Recent Activity

### 2026-07-15 07:07 — CR-20260714-001 状态更新 & Wiki同步

**CR-20260714-001 整体进度**: Phase 1~4（文档→后端→前端→QA验证）**全部完成** ✅

**剩余**: Phase 5 集成部署（T24~T28）待启动 ⛔

**关键变更**:
- 系统新增两个大模块：Module 16 QR签到考勤 + Module 17 学生/家长门户
- 新增独立前端应用 `apps/frontend/`（与旧 `school-admin-frontend/` 并行）
- 新前端路由：`/attendance/*`（QR考勤）、`/portal/*`（学生/家长门户）
- 新前端**尚未部署**到Docker，需Phase 5 T25完成
- Coze Nginx需新增 `/attendance/` 和 `/portal/` 路由规则
- 文档已同步更新：COZE_PROXY_CONFIG.md + PROJECT-WIKI.md

---

### 2026-07-08 — Issue #206 #207 QA验收通过

**时间**: 12:55 GMT+8

**验收结果**: ✅ 通过

**修复内容**:
- #206: 班级下拉框现在显示12个班级 ✅
- #207: 新增学生保存返回 HTTP 201 ✅

**额外修复** (QA验收中发现):
1. `classes` 属性缺失 → 已添加到 StudentFormProps 接口 (commit ff6886a)
2. nginx路由配置缺失 → 已添加 /students 和 /classes 路由 (commit 8a66942)

**Issue状态**:
- #206 ✅ 已关闭
- #207 ✅ 已关闭

---

### 2026-07-08 — QA Re-verification Task Dispatched

**时间**: 12:33 GMT+8

**派发内容**: Issue #206 + #207 QA重新验收
- #206: 新增学生页面所属班级下拉框无数据
- #207: 新增学生保存失败返回400错误

**修复内容**:
- Backend路由 `/api/classes` 已修复（之前404，现返回401需认证）
- Frontend已重新构建并部署

**QA验收状态**: 🔄 进行中

---

### 2026-07-08 — Backend & Frontend Deployment

**时间**: 12:25-12:33 GMT+8

**问题发现**:
- Backend容器使用旧编译输出，`/api/classes` 路由返回404
- 虽然源代码正确，但dist文件缺失

**修复措施**:
- 重新构建Backend并部署到容器
- 重启容器
- 验证 `/api/classes` 返回401（正常需认证）
- 重新构建Frontend并部署

---

### 2026-07-07 — Student Management Testing Data & E2E Report

**测试数据创建** (22:05 GMT+8):
- 60个测试学生（12个班级 × 5个学生/班）
- 60个家长账户
- 60个班级分配
- 120条考勤记录（昨天+今天）

**E2E测试报告**:
- 报告位置: `e2e-tests/TEST-REPORT.md`
- 测试用例: 35个学生管理测试用例
- 覆盖范围: 列表、筛选、搜索、CRUD、表单验证
- 测试状态: ✅ 已完成

**Wiki更新**: 添加了E2E测试报告链接到PROJECT-WIKI.md

---

### 2026-07-04 — Production Release Deployed

**Version: v1.5.6 — Bug fixes for #197 & #198**

- **Deploy time**: 08:44 GMT+8
- **Pull**: Fresh Docker images from GHCR (backend + frontend `latest`)
- **Git**: Updated to `dfc40a5` (fast-forward from `2b249df`)
- **Changes deployed**:
  - 🐛 Fix #197: `currentClass` returning null
  - 🐛 Fix #198: Prevent soft-deleted student_id reuse
  - ✨ New: `CreateStudentDto.student_id` optional field
  - 📄 New: Test credentials doc (`docs/test-credentials.md`)
  - 📄 New: Test cases for #197 & #198
  - 📄 New: `CHANGELOG.md` version management
  - 🛠 New: Release automation script (`scripts/release.sh`)
  - 📋 New: Release Management Plan (`docs/RELEASE-MANAGEMENT.md`)
- **Compose stack**: Fresh deploy via `infra/docker-compose.local.yml`
  - Architecture: Backend (NestJS) + Frontend (Nginx) + Postgres + Redis + OPA
  - Backend/frontend run as prebuilt GHCR images (amd64 via Rosetta)
  - Postgres/Redis data volumes persist across deployments
  - OPA serves as ABAC policy engine
- **Platform note**: Images are `linux/amd64`; Rosetta emulation on Apple Silicon

---

## 🛠️ Maintenance

### Restart Tunnel (if URLs change)

```bash
# Stop tunnel
pkill -f cloudflared

# Restart tunnel (from project root)
cloudflared tunnel --url http://localhost:3001
cloudflared tunnel --url http://localhost:3000
```

### Docker Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart services
docker compose restart backend

# Full restart
cd /workspace/projects/school-admin-system && docker compose down && docker compose up -d
```

### Run DB Migration

```bash
docker compose exec backend npm run migration:run
```

### Update Dashboard (manual)

```bash
cd /workspace/projects/workspace
python3 skills/multi-agent-dashboard/scripts/update_dashboard.py --repo jchu-hk/school-admin-system
```

---

## 🧪 QA Module Test Cases

### Student Management Module (2026-07-06)

| Module | Test Date | Status | Report |
|--------|-----------|--------|--------|
| Student Management (E2E Regression - 35 Cases) | 2026-07-06 | ❌ Failed (28.57% Pass Rate) | [查看报告](./qa_report/student-management-regression-report-20260706.md) |
| Student Management (E2E - 35 Cases) | 2026-07-06 | ⚠️ Blocked (Environment) | [查看报告](./qa_report/student-management-qa-report-2026-07-06.md) |
| Student Management (MOD-STU-001 ~ MOD-STU-011) | 2026-07-06 | ⚠️ Blocked (Tool Issue) | [查看报告](./qa_report/student-management-qa-report-2026-07-06.md) |

**测试覆盖范围**:
- 学生档案 CRUD (创建、查询、编辑、删除)
- 班级分配管理
- 学生状态管理
- 搜索与筛选功能
- 权限控制
- 数据导入/导出

**测试状态说明**:
- ✅ **Passed**: 所有测试案例通过
- ❌ **Failed**: 发现缺陷，需要修复
- ⚠️ **Blocked**: 测试执行受阻（工具问题、环境问题等）
- ⏳ **Pending**: 等待执行

**测试案例文档**: [student-management-test-cases-2026-07-06.md](./qa_report/student-management-test-cases-2026-07-06.md)

### Previous Test Results

| Module | Test Date | Status | Notes |
|--------|-----------|--------|-------|
| 学生管理新增功能 | 2026-07-05 | ✅ Passed | Human QA 手动测试 |

---

*Wiki last full update: 2026-07-15 07:10 GMT+8 (CR-20260714-001 sync)*
