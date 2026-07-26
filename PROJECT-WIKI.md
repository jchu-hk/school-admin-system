# Project Wiki - School Admin System

> Last updated: 2026-07-21 13:37 GMT+8
> Updated by: PM (OPS监控工具已配置上线，待人工测试)

---

## 📦 Current Version

- **Version**: v2.0.0-draft.1
- **Release Date**: 2026-07-18 (所有P0/P1缺陷已修复)
- **Git Commit (当前)**: `68e28b9` (latest), `adbbf28` (#235 fix), `cc0db46` (QR fixes)
- **Branch**: `main`
- **Status**: CR-20260714-001 Phase 1~4 完成 + Phase 5 T24全系统回归通过（12/12模块）— 等待人工Sanity测试后确认Phase 5方向
- **Tested By**: QA Agent (Phase 4验证 + T24全系统回归通过)

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
| | | | |
| **🛠️ OPS Monitoring Tools** | | | |
| Grafana Dashboards | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/grafana/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/grafana/) | 🔐 ops | `admin` / `admin123` |
| Prometheus Metrics | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/prometheus/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/prometheus/) | 🔐 ops | 开源监控 |
| Alertmanager Alerts | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/alertmanager/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/alertmanager/) | 🔐 ops | 告警管理 |

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
| **系统管理员** | **qa_test** | `Admin123!` | ✅ | **全部功能** | ⚠️ 需 OTP |
| **校务人员** | **staff1** | `Admin123!` | ❌ | 日常管理 | ✅ **可用** |
| 教师 | teacher1 | `Admin123!` | ✅ | 教学管理 | ⚠️ 需 OTP |
| 家长 | parent1 | `Admin123!` | ❌ | 家长门户 | ✅ 功能有限 |
| 学生 | student1 | `Admin123!` | ❌ | 学生门户 | ✅ 功能有限 |

> ✅ **推荐**: `staff1` (日常管理，免OTP) | `qa_test` (完整权限，需OTP)
> 📍 **唯一信息来源**: docs/school-admin-system/PROJECT-WIKI.md

### 🛠️ 系统服务账号

| Service | Username | Notes |
|---------|----------|-------|
| PostgreSQL | `postgres` | See `.env` for password |
| Grafana | `admin` | See `.env` for password |

> See `.env` file in project root for full credentials. Never commit `.env` to Git.

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
