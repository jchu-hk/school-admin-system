# Project Wiki - School Admin System

> Last updated: 2026-07-08 12:56 GMT+8
> Updated by: QA Agent (fix: missing classes prop in StudentFormProps + nginx proxy fix)

---

## 📦 Current Version

- **Version**: v1.5.7
- **Release Date**: 2026-07-05 08:49 GMT+8
- **Git Commit**: `8a66942`
- **Branch**: `main`
- **Status**: Released for Testing
- **Tested By**: QA Agent - 2026-07-08
- **Changelog**:
  - Bug修复: Issue #206 - 修复StudentFormProps缺失classes属性导致班级下拉框报错
  - Bug修复: Issue #207 - 修复nginx配置缺失/students和/classes路由导致API请求404
  - 前端重新构建并部署


## 🌐 Environment URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend (Cloudflare Tunnel) | `https://expenses-forests-collections-pad.trycloudflare.com` | ✅ Active |
| Backend API (Cloudflare Tunnel) | `https://meaning-harvey-clearly-automobiles.trycloudflare.com` | ✅ Active |
| Coze Frontend | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/` | ✅ Active |
| Coze API | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/api/` | ✅ Active |
| Local Backend | `http://localhost:3000` | ✅ Healthy (`{"status":"ok"}`) |
| PostgreSQL | `localhost:5432` | ✅ Healthy |
| Redis | `localhost:6379` | ✅ Healthy |
| OPA | `localhost:8181` | ✅ Healthy |

> **Note**: Tunnel URLs may change after tunnel restart. Verify connectivity if frontend/backend become unreachable.

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
| P0 | 0 | — |
| P1 | 0 | — |
| P2 | ~10 | Core module backlog |
| P3 | ~5 | AI features, TypeORM warnings |
| P4 | 2 | Enhancements (teacher recruitment, meeting management) |

### Key Issues

| # | Title | Status | Priority |
|---|-------|--------|----------|
| #140 | TypeORM warnings fix | ready-for-review | P3 |
| #184 | Teacher recruitment module | backlog | P4 |
| #182 | Meeting management module | backlog | P4 |
| #56 | AI content generation | backlog | P3 |
| #55 | AI homework analysis | backlog | P3 |
| #54 | AI exam analysis | backlog | P3 |
| #53 | AI student behavior analysis | backlog | P3 |

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
| Student Management E2E Regression Fix | End-to-End | 2026-07-06 | ❌ Failed | [Fix Report](./qa_report/student-management-regression-fix-report-20260706.md) |
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
