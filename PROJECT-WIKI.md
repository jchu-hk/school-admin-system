# Project Wiki — School Admin System

> **Last updated**: 2026-09-06 15:45 GMT+8
> **Latest commit**: `(docs-sync)` — main branch

---

## 🔧 Latest Test-Env Deployment

> **Deployed**: 2026-08-02 15:40 GMT+8 · **Frontend** `school-admin-frontend` (:8080)
> **Build**: `v1.6.1` · commit `2c7680c` (main) · build 2026-08-02
> **New JS**: `index-B52kQjGo-20260707.js` (admin-app :8080; 注: 旧台账 `index-Clv-l0p1-20260707.js` 已过期) · portal-app :8081 = `index-BTSIfyoS-20260707.js` (QR/portal, basename `/`，经 `apps/frontend` 独立构建产物)
> **Fixes deployed (test env)**:
> - #306 — 课程管理 API 路径修复 (VITE_API_BASE_URL = `/school-admin/api/`) → 修复 Gateway(404) 路由问题
> - #308 — token key 修复 (`token` → `auth_token`)
> **Verified (2026-08-18 T26)**: admin :8080 `version.json`=v1.6.1/commit 2c7680c | portal :8081 QR+学生/家长门户功能在产物中确认 | backend 容器(image `v1.5.9` tag) Dockerfile与HEAD(`53e2c31`)一致、`pg_dump 16.15`在位、夜间备份14+晚非空 → **版本=main** · `localhost:8080/8081`→200 · Coze proxy `/school-admin/ /portal/student /portal/parent /attendance/qr /school-admin/api/health`→200

---

## 1. 📦 Release Info

| Item | Detail |
|------|--------|
| **Version** | v1.6.1 |
| **Release Date** | 2026-08-01 |
| **GitHub Releases** | [github.com/jchu-hk/school-admin-system/releases](https://github.com/jchu-hk/school-admin-system/releases) |
| **Open Issues** | 54 (0 P0 / 0 P1) |
| **Open PRs** | 1 (#369 `fix/i18n-lang-switch`) |

---

## 2. 🌐 Test Environment URLs

> 💡 All external URLs route through Coze proxy → localhost. Local URLs are the source of truth.

### Applications

| App | Local | External (Coze) | Description |
|-----|-------|------------------|-------------|
| **admin-app** | [localhost:8080](http://localhost:8080) | [coze.site/school-admin/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/) | 教职工后台管理 |
| **portal-app** | [localhost:8081](http://localhost:8081) | [coze.site/portal/student](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student) | QR考勤 + 学生/家长门户 |
| **QR 考勤** | [localhost:8081](http://localhost:8081) | [coze.site/attendance/qr](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/attendance/qr) | 扫码考勤页 |
| **Backend API** | [localhost:3000](http://localhost:3000) | [coze.site/school-admin/api/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/api/) | NestJS REST API |
| **Gateway** | [localhost:5001](http://localhost:5001) | [coze.site/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/) | OpenClaw Gateway |
| **AI SRE Service** | [localhost:9090](http://localhost:9090) | [coze.site/ai-sre/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/ai-sre/health) | 运维 Agent — 报障 intake / 异常排查 |

### Monitoring (🔐 OPS)

| Tool | External URL | Credentials |
|------|-------------|-------------|
| **Grafana** | [coze.site/grafana/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/grafana/) | `admin` / `admin123` |
| **Prometheus** | [coze.site/prometheus/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/prometheus/) | open-source, no auth |
| **Alertmanager** | [coze.site/alertmanager/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/alertmanager/) | open-source, no auth |
| **Agent Dashboard** | [coze.site/agents](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/agents) | public, no login |

### ⚠️ Dual-Frontend Architecture

System has **two independent SPAs** sharing one backend API:

| App | Code Location | Port | Base Path | Users |
|-----|--------------|------|-----------|-------|
| **admin-app** | `school-admin-frontend/` | 8080 | `/school-admin/*` | 教职工 |
| **portal-app** | `apps/frontend/` | 8081 | `/attendance/*`, `/portal/*` | 学生/家长 |

> About page version (`/school-admin/about`) = actual deployed code version. Must be verified after every test-env refresh.

---

## 3. 👤 Test Accounts

> Verified: 2026-07-09 · All passwords: `Admin123!`

| Role | Username | OTP | Permissions | Status |
|------|----------|-----|-------------|--------|
| **系统管理员** | **qa_test** | ✅ required | Full access | ⚠️ needs OTP |
| **校务人员** | **staff1** | ❌ | Daily management | ✅ **recommended** |
| 教师 | teacher1 | ✅ required | Teaching management | ⚠️ needs OTP |
| 家长 | parent1 | ❌ | Parent portal | ✅ limited |
| 学生 | student1 | ❌ | Student portal | ✅ limited |

> ✅ **Quick test**: use `staff1` (no OTP, daily management)

### 🛠️ System Accounts

| Service | Username | Notes |
|---------|----------|-------|
| PostgreSQL | `school_admin` | Password in `.env` (default: `school_admin123`) |
| Grafana | `admin` | Password in `.env` |

> 🔒 Never commit `.env` to Git.

---

## 4. 📁 系统相关文档

> 🔗 所有链接指向 GitHub `main` 分支，点击即可在线阅读。
> Repo: [github.com/jchu-hk/school-admin-system](https://github.com/jchu-hk/school-admin-system)

### 功能规格文档

| Document | Version | Last Updated | Purpose |
|----------|---------|-------------|---------|
| [SPEC-COMPLETE.md](https://github.com/jchu-hk/school-admin-system/blob/main/docs/school-admin-system/SPEC-COMPLETE.md) | v1.6.1 | 2026-07-28 | 完整功能规格 (7 modules, 45 functions) |
| [SPEC-SYSTEM-DESIGN.md](https://github.com/jchu-hk/school-admin-system/blob/main/docs/school-admin-system/SPEC-SYSTEM-DESIGN.md) | v1.6.1 | 2026-07-28 | 系统架构与设计决策 |
| [API-DESIGN.md](https://github.com/jchu-hk/school-admin-system/blob/main/docs/school-admin-system/API-DESIGN.md) | v1.5.5 | 2026-07-15 | REST API 接口参考 |
| [DB-SCHEMA.md](https://github.com/jchu-hk/school-admin-system/blob/main/docs/school-admin-system/DB-SCHEMA.md) | v1.5.5 | 2026-07-15 | 数据库结构 |
| [DATA-DICTIONARY.md](https://github.com/jchu-hk/school-admin-system/blob/main/docs/school-admin-system/DATA-DICTIONARY.md) | v1.5.4 | 2026-07-02 | 字段定义字典 |

### AI SRE 运维 Agent 文档（独立组件）

> AI SRE 是独立于 SAS 的运维 Agent（`apps/ai-sre-service/`，Node ≥22，默认 `:9090`），当前部署用于支撑 SAS 运营。文档集见 `docs/ai-sre/`。

| Document | Version | Last Updated | Purpose |
|----------|---------|-------------|---------|
| [docs/ai-sre/README.md](https://github.com/jchu-hk/school-admin-system/blob/main/docs/ai-sre/README.md) | — | 2026-09-06 | AI SRE 文档索引 |
| [FUNCTIONAL-SPEC-AI-SRE.md](https://github.com/jchu-hk/school-admin-system/blob/main/docs/ai-sre/FUNCTIONAL-SPEC-AI-SRE.md) | v0.4.0 | 2026-09-05 | 它做什么（功能需求规格） |
| [DESIGN-AI-SRE.md](https://github.com/jchu-hk/school-admin-system/blob/main/docs/ai-sre/DESIGN-AI-SRE.md) | v0.3.0 | 2026-09-05 | 它怎么工作（技术架构设计） |
| [DEPLOY-AI-SRE.md](https://github.com/jchu-hk/school-admin-system/blob/main/docs/ai-sre/DEPLOY-AI-SRE.md) | runbook | 2026-09-05 | 它怎么部署（部署 Runbook） |

### 开发运维规范

| Document | Version | Last Updated | Purpose |
|----------|---------|-------------|---------|
| [AGENTS.md](https://github.com/jchu-hk/school-admin-system/blob/main/AGENTS.md) | — | 2026-07-31 | Agent 操作规则与索引导航 |
| [SOUL.md](https://github.com/jchu-hk/school-admin-system/blob/main/SOUL.md) | — | 2026-07-28 | 核心身份与安全红线 |
| [CRITICAL_RULES.md](https://github.com/jchu-hk/school-admin-system/blob/main/CRITICAL_RULES.md) | — | 2026-07-28 | 硬红线 (spawn规则、禁止行为) |
| [MEMORY.md](https://github.com/jchu-hk/school-admin-system/blob/main/MEMORY.md) | — | 2026-07-30 | 长期记忆与经验教训 |
| [HEARTBEAT.md](https://github.com/jchu-hk/school-admin-system/blob/main/HEARTBEAT.md) | — | 2026-08-01 | 系统心跳日志 |
| [COZE_PROXY_CONFIG.md](https://github.com/jchu-hk/school-admin-system/blob/main/COZE_PROXY_CONFIG.md) | — | 2026-07-28 | Coze 代理路由配置 |
| [docs/PM-WORKFLOW.md](https://github.com/jchu-hk/school-admin-system/blob/main/docs/PM-WORKFLOW.md) | — | 2026-07-10 | PM 工作流程参考 |
| [docs/SVA-GATE.md](https://github.com/jchu-hk/school-admin-system/blob/main/docs/SVA-GATE.md) | v1.0.0 | 2026-07-28 | SVA 角色-动作矩阵 |

### QA 测试报告

| Document | Last Updated | Purpose |
|----------|-------------|---------|
| [e2e-tests/TEST-REPORT.md](https://github.com/jchu-hk/school-admin-system/blob/main/e2e-tests/TEST-REPORT.md) | 2026-06-28 | Student Management E2E 测试报告 |
| [qa_report/…regression-report-20260706.md](https://github.com/jchu-hk/school-admin-system/blob/main/qa_report/student-management-regression-report-20260706.md) | 2026-07-07 | 回归测试报告 (35 cases) |
| [qa_report/…regression-fix-report-20260706.md](https://github.com/jchu-hk/school-admin-system/blob/main/qa_report/student-management-regression-fix-report-20260706.md) | 2026-07-07 | 回归修复报告 |
| [qa_report/…full-report-20260706.md](https://github.com/jchu-hk/school-admin-system/blob/main/qa_report/student-management-full-report-20260706.md) | 2026-07-06 | 完整 QA 报告 |
| [qa_report/…performance-root-cause.md](https://github.com/jchu-hk/school-admin-system/blob/main/qa_report/student-page-performance-root-cause.md) | 2026-07-07 | 性能根因分析 |
| [test-reports/exam-api-test.md](https://github.com/jchu-hk/school-admin-system/blob/main/test-reports/exam-api-test.md) | 2026-07-29 | 考试 API 测试 |
| [test-reports/exam-fix-291.md](https://github.com/jchu-hk/school-admin-system/blob/main/test-reports/exam-fix-291.md) | 2026-07-29 | Issue #291 修复报告 |

### OPS 运维脚本

| Category | Scripts |
|----------|---------|
| **部署发布** | [release.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/release.sh) · [daily-integrate.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/daily-integrate.sh) · [daily-release.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/daily-release.sh) |
| **数据库** | [backup-database.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/backup-database.sh) · [db-health-check.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/db-health-check.sh) · [schema-init.sql](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/schema-init.sql) |
| **监控巡检** | [patrol.py](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/patrol.py) · [pm_monitor.py](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/pm_monitor.py) · [agent-monitor.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/agent-monitor.sh) · [subagent-watchdog.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/subagent-watchdog.sh) |
| **PM 工具** | [pm-daily-check.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/pm-daily-check.sh) · [pm-weekly-report.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/pm-weekly-report.sh) · [pm-cleanup-branches.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/pm-cleanup-branches.sh) |
| **Tunnel** | [start-cloudflare-tunnel.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/start-cloudflare-tunnel.sh) · [keep-tunnel-alive.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/keep-tunnel-alive.sh) · [tunnel.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/tunnel.sh) |
| **种子数据** | [seed-users.sql](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/seed-users.sql) · [seed-full-test-data.sql](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/seed-full-test-data.sql) |
| **Dashboard** | [auto-update-dashboard.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/auto-update-dashboard.sh) · [dashboard-refresh.sh](https://github.com/jchu-hk/school-admin-system/blob/main/scripts/dashboard-refresh.sh) |

---

## 5. 🏗️ Architecture & Services

### Overview

```
Browser → Coze Proxy → Gateway (:5001)
                         ├── /school-admin/* → Frontend admin-app (:8080)
                         ├── /attendance/*  → Frontend portal-app (:8081)
                         └── /api/*         → Backend (:3000)
                                                ├── PostgreSQL (:5432)
                                                ├── Redis (:6379)
                                                ├── OPA (:8181)
                                                └── Kafka (:9092) + ZK (:2181)
```

### Docker Services (15 containers)

| Container | Port | Purpose |
|-----------|------|---------|
| **Core** | | |
| `school-admin-backend` | 3000 | NestJS REST API |
| `school-admin-frontend` | 8080→80 | admin-app (Nginx SPA) |
| `school-admin-frontend-v2` | 8081→80 | portal-app (Nginx SPA) |
| `school-admin-postgres` | 5432 | Primary database |
| `school-admin-redis` | 6379 | Cache / queue |
| **Policy & Event** | | |
| `school-admin-opa` | 8181 | Open Policy Agent (ABAC) |
| `school-admin-kafka` | 9092 | Event streaming |
| `school-admin-zookeeper` | 2181 | Kafka coordination |
| **Monitoring** | | |
| `school-admin-prometheus` | 9091 | Metrics collection |
| `school-admin-grafana` | 3001 | Dashboards |
| `school-admin-alertmanager` | 9093 | Alert management |
| `school-admin-node-exporter` | 9100 | Host metrics |
| `school-admin-postgres-exporter` | 9187 | DB metrics |
| **AI SRE** | | |
| `ai-sre-service` | 9090 | 运维 Agent — 报障 intake / 异常排查 |
| **Network** | | |
| `school-admin-cloudflared` | — | Public tunnel |

> Compose project: `infra` · Internal network: `school-network`
> AI SRE 为**独立编排**（`infra/docker-compose.ai-sre.yml`），但计入同一 `school-network`，与 backend 互通。

---

## 6. 🧪 QA Test Reports

| Module | Date | Status | Report |
|--------|------|--------|--------|
| Student Management E2E | 2026-06-27 | ✅ Pass | [TEST-REPORT.md](https://github.com/jchu-hk/school-admin-system/blob/main/e2e-tests/TEST-REPORT.md) |
| Student Management Regression (35 cases) | 2026-07-06 | ❌ 28.57% | [Report](https://github.com/jchu-hk/school-admin-system/blob/main/qa_report/student-management-regression-report-20260706.md) |
| Student Management Regression Fix | 2026-07-06 | ✅ Fixed | [Report](https://github.com/jchu-hk/school-admin-system/blob/main/qa_report/student-management-regression-fix-report-20260706.md) |
| Student Management Full QA | 2026-07-06 | ⚠️ Blocked | [Report](https://github.com/jchu-hk/school-admin-system/blob/main/qa_report/student-management-full-report-20260706.md) |
| Student Management Root Cause | 2026-07-06 | 📋 Analysis | [Report](https://github.com/jchu-hk/school-admin-system/blob/main/qa_report/student-page-performance-root-cause.md) |
| Student Management (human QA) | 2026-07-05 | ✅ Pass | Manual test |

---

## 7. 🤖 系统开发团队

| 角色 | Agent | 职责 | 触发方式 |
|------|-------|------|----------|
| **项目经理** | PM | 任务分配、Issue 审核、人工汇报、协调调度 | 用户指令 / Cron 巡检 |
| **开发工程师** | DEV | 代码实现、Bug 修复、功能开发 | PM spawn |
| **测试工程师** | QA | 测试执行、回归验证、测试报告 | PM spawn |
| **代码审查** | CHECKER | Code review、规格合规检查 | PM spawn |
| **运维工程师** | DEVOPS | 部署发布、CI/CD、环境管理 | PM spawn |
| **项目管理员** | Project Admin | 心跳监控、Dashboard 更新、状态同步 | Cron 定时 |

> 📊 **Agent Dashboard**: [coze.site/agents](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/agents) — 公开，展示各 Agent 实时状态与最近活动

---

## 8. 🛠️ OPS Reference

### Health Checks (Quick)

```bash
# All endpoints
curl -s http://localhost:3000/api/health      # Backend → 200
curl -so /dev/null -w "%{http_code}" http://localhost:8080/   # admin-app → 200
curl -so /dev/null -w "%{http_code}" http://localhost:8081/   # portal-app → 200
curl -so /dev/null -w "%{http_code}" http://localhost:5001/   # Gateway → 200/401

# AI SRE service
curl -s http://localhost:9090/health   # → {"status":"ok"}
curl -s https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/ai-sre/health   # 外网经 Coze 代理

# Database & Cache
docker compose -f infra/docker-compose.yml exec postgres pg_isready -U school_admin
docker compose -f infra/docker-compose.yml exec redis redis-cli ping
```

### Test Environment Refresh

```bash
git pull origin main

# Backend
cd apps/backend && npm run build
docker cp dist/. school-admin-backend:/app/dist/
docker restart school-admin-backend

# Frontend
cd school-admin-frontend && npm run build
docker cp dist/. school-admin-frontend:/usr/share/nginx/html/

# Verify version
curl http://localhost:8080/school-admin/about | grep version
```

### Database

| Field | Value |
|-------|-------|
| Host | `localhost` (host) / `school-admin-postgres` (container) |
| Port | 5432 |
| User | `school_admin` |
| Database | `school_admin` |

```bash
# Connect
PGPASSWORD="school_admin123" psql -h localhost -U school_admin -d school_admin

# Migrations
docker compose -f infra/docker-compose.yml exec backend npm run migration:show
docker compose -f infra/docker-compose.yml exec backend npm run migration:run
docker compose -f infra/docker-compose.yml exec backend npm run migration:revert

# Backup
DB_PASSWORD="school_admin123" bash scripts/backup-database.sh
```

### Docker Quick Commands

```bash
# Status
docker compose -f infra/docker-compose.yml ps

# Logs
docker compose -f infra/docker-compose.yml logs -f [service]

# Restart
docker compose -f infra/docker-compose.yml restart [service]

# Rebuild
docker compose -f infra/docker-compose.yml up -d --build [service]

# Clean old images
docker image prune -af --filter "until=72h"
```

### Prometheus Alert Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| ServiceDown | `up == 0` for 30s | 🔴 critical |
| ContainerDown | `docker_container_up == 0` for 1m | 🔴 critical |
| DiskSpaceLow | disk > 85% for 5m | 🔴 critical |
| ContainerHighCPU | CPU > 80% for 2m | 🟡 warning |
| ContainerHighMemory | memory > 80% for 2m | 🟡 warning |
| NodeHighCPU | host CPU > 80% for 5m | 🟡 warning |
| NodeMemoryLow | host memory > 85% for 5m | 🟡 warning |

### Key Scripts Inventory

| Category | Scripts |
|----------|---------|
| **Deploy** | `release.sh`, `daily-integrate.sh`, `daily-release.sh` |
| **Backup** | `backup-database.sh`, `backup-memory.sh`, `dr-recovery.sh` |
| **Monitor** | `patrol.py`, `pm_monitor.py`, `agent-monitor.sh`, `subagent-watchdog.sh` |
| **PM Tools** | `pm-daily-check.sh`, `pm-weekly-report.sh`, `pm-cleanup-branches.sh` |
| **Tunnel** | `start-cloudflare-tunnel.sh`, `keep-tunnel-alive.sh`, `check-tunnel-health.sh` |
| **Seed Data** | `seed-users.sql`, `seed-full-test-data.sql`, `seed-dashboard-data*.sql` |

### Security

| Component | Description |
|-----------|-------------|
| JWT Auth Guard | All API requests authenticated |
| Role Guard | RBAC permission control |
| OPA Guard | ABAC policy decisions (`infra/opa/policies/`) |
| OTP | TOTP 2FA for admin/teacher logins |
| Nginx Security | X-Frame-Options, X-Content-Type-Options, XSS-Protection, Referrer-Policy, rate limiting (API 30r/s, Auth 5r/m) |

---

## 9. ⚠️ Known Gaps

1. **Missing DB tables**: `lunch_changes`, `assets` — not yet migrated (no current functionality depends on them)
2. **Issue #140**: CHECKER review pending for TypeORM warnings fix
3. **#296**: Draft status design issue — pending PM/BA decision
4. **AI-SRE 真实网关未接**: 真实 GitHub Issue 网关 + 真实回执外发(write_message) 未接（当前 best-effort/memory sink，见 `docs/ai-sre/DEPLOY-AI-SRE.md` §10）

---

*Wiki restructured: 2026-08-02 09:14 GMT+8*
