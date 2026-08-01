# Project Wiki - School Admin System

> Last updated: 2026-08-01 11:57 GMT+8
> Updated by: PM (Dashboard via /attendance/ + /agents — Coze page routing workaround)

---

## 📦 Current Version

- **Version**: v1.6.1
- **Release Date**: 2026-07-31 22:57 GMT+8
- **Git Commit**: `6816155`
- **Branch**: `main`
- **Status**: Released for Testing
- **Tested By**: PM (human testing pending)
- **Changelog**:
  - fix(#267): AssetController route ordering conflict — GET rentals matched by :id wildcard
fix(#268-#273): User/Asset/Leave management — 7 P0 defects closed (delete alert, status toggle, modal reset, leave teachers fetch, UUID validation, parent links data corruption, inquiry_create enum)
fix(#220): Student edit form date fields blank — ISO datetime incompatible with HTML5 date input
fix(#280): UpdateStudentDto missing admission_date field
fix(#290): RoleService DI conflict — duplicate service definitions causing permission save failures
fix(#291): i18n build error 't is not defined' — module-level t() usage in Attendance/Scholarship/Lunch/Notification pages
fix(#294): Exam API undefined params filter + merge conflict in FinanceScholarshipPage
fix(#235): Missing PATCH /api/roles/:id endpoint for role permission update
fix: QR scan page — camera init, jsQR ESM import, backend 401 JWT guard conflict
fix: Scholarship API path duplicate directory
fix: System settings API path — .env.production overwriting VITE_API_BASE_URL
fix: Missing userService.ts — imported by Layout and Login but never created
fix: pnpm-lock.yaml regeneration for CI frozen-lockfile
infra: Three-layer context architecture to prevent bootstrap truncation


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
| **admin-app** (本地) | http://localhost:8080 | ✅ 自管 | ✅ v1.6.2 |
| **portal-app** (本地) | http://localhost:8081 | ✅ 自管 | ✅ QR考勤+门户 |
| Backend API (本地) | http://localhost:3000 | ✅ 自管 | ✅ v1.5.7 |
| Coze — admin-app | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/) | ☁️ Coze | ✅ 教职工后台 |
| Coze — portal-app | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/attendance/qr](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/attendance/qr) | ☁️ Coze | ✅ 已连通 |
| Coze — portal-app | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student) | ☁️ Coze | ✅ 已连通 |
| Cloudflare Tunnel | `https://...trycloudflare.com` | ⚡ 临时代理 | ⚠️ URL会变化 |
| Coze — Dashboard | [https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/login?agents](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/login?agents) | ☁️ Coze | 公开，无需登录 |
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

Live dashboard (Coze): [/agents](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/agents)  （公开，无需登录）
Backup: [/attendance/dashboard.html](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/attendance/dashboard.html) 或 SPA 内 `/dashboard` 🤖 Agents tab
GitHub backup: [multi-agent-dashboard.html](multi-agent-dashboard.html)

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

## 🛠️ OPS Information — School Admin System

> 集中收录系统运维相关的重要信息、工具、脚本和使用手册。

### 📂 Infrastructure Stack

所有服务运行在 Docker Compose 编排环境中，配置文件位于 `infra/docker-compose.yml`。

| 组件 | 容器名 | 端口 (宿主机) | 类型 |
|-------|--------|---------------|------|
| **Core Services** | | | |
| Backend API | `school-admin-backend` | 3000 | NestJS REST API (v1.5.7) |
| Frontend (admin-app) | `school-admin-frontend` | 8080→80 | Nginx SPA (v1.6.0) |
| Frontend (portal-app) | `school-admin-frontend-v2` | 8081→80 | Nginx SPA (QR考勤+门户) |
| PostgreSQL | `school-admin-postgres` | 5432 | 主数据库 |
| Redis | `school-admin-redis` | 6379 | 缓存/队列 |
| | | | |
| **Policy & Event** | | | |
| OPA (ABAC) | `school-admin-opa` | 8181 | 策略引擎 |
| Kafka | `school-admin-kafka` | 9092 | 事件流 |
| Zookeeper | `school-admin-zookeeper` | 2181 | Kafka 协调 |
| | | | |
| **Monitoring** | | | |
| Prometheus | `school-admin-prometheus` | 9091 | 指标采集 |
| Grafana | `school-admin-grafana` | 3001 | 可视化面板 |
| Alertmanager | `school-admin-alertmanager` | 9093 | 告警管理 |
| Node Exporter | `school-admin-node-exporter` | 9100 | 主机指标 |
| Postgres Exporter | `school-admin-postgres-exporter` | 9187 | 数据库指标 |
| | | | |
| **Network** | | | |
| Cloudflare Tunnel | `school-admin-cloudflared` | — | 公网代理 |

> Docker Compose 项目名: `infra` | 内部网络: `school-network`

---

### 📊 Monitoring Stack Access

所有监控工具通过 Coze 代理访问（需要认证）：

| Service | URL | 默认凭据 |
|---------|-----|----------|
| **Grafana** | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/grafana/` | `admin` / 见 `.env` |
| **Prometheus** | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/prometheus/` | 开源，无认证 |
| **Alertmanager** | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/alertmanager/` | 开源，无认证 |

**Prometheus 采集目标**:
- `school-backend` → `/api/metrics` (每10s)
- `postgres` → `postgres_exporter:9187` (每10s)
- `node_exporter` → `node_exporter:9100` (每15s)
- `cadvisor` → Docker gateway `172.19.0.1:9393` (每15s)

**预配置告警规则** (`infra/prometheus/rules/alerts.yml`):
| 告警名 | 条件 | 严重度 |
|--------|------|--------|
| ServiceDown | `up == 0` 持续30s | 🔴 critical |
| ContainerDown | `docker_container_up == 0` 持续1m | 🔴 critical |
| DiskSpaceLow | 磁盘使用 > 85% 持续5m | 🔴 critical |
| ContainerHighCPU | CPU > 80% 持续2m | 🟡 warning |
| ContainerHighMemory | 内存 > 80% 持续2m | 🟡 warning |
| BackendCPUHigh | 后端进程CPU > 80% 持续2m | 🟡 warning |
| NodeHighCPU | 主机CPU > 80% 持续5m | 🟡 warning |
| NodeMemoryLow | 主机内存 > 85% 持续5m | 🟡 warning |

---

### 🗄️ Database Operations

#### 连接信息

| 字段 | 值 |
|------|-----|
| Host | `localhost` (宿主机) / `school-admin-postgres` (容器内) |
| Port | 5432 |
| User | `school_admin` |
| Database | `school_admin` |
| Password | 见 `.env` 或 `school_admin123` (默认) |

#### 常用命令

```bash
# 连接数据库
PGPASSWORD="school_admin123" psql -h localhost -p 5432 -U school_admin -d school_admin

# 查看迁移状态
docker compose -f infra/docker-compose.yml exec backend npm run migration:show

# 运行迁移
docker compose -f infra/docker-compose.yml exec backend npm run migration:run

# 回滚迁移
docker compose -f infra/docker-compose.yml exec backend npm run migration:revert
```

#### 备份

备份脚本位于 `scripts/backup-database.sh`，支持：

| 功能 | 说明 |
|------|------|
| 自动备份 | 支持 cron 定期执行 |
| 压缩 | .sql.gz 格式 |
| 保留策略 | 默认保留30天 |
| 通知 | 支持 Webhook / Email |

```bash
# 手动备份
DB_PASSWORD="school_admin123" bash scripts/backup-database.sh

# 设置 cron 每日备份（示例）
0 2 * * * cd /workspace/projects/workspace && DB_PASSWORD="xxx" bash scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

**Seed 数据脚本** (`scripts/`):
- `seed-users.sql` — 用户种子数据
- `seed-full-test-data.sql` — 完整测试数据
- `seed-dashboard-data.sql` ~ `seed-dashboard-data-v4.sql` — Dashboard 演示数据
- `seed-attendance-data.sql` / `seed-attendance-and-inquiry-data.sql` — 考勤+咨询数据
- `seed-test-data-issue157-160.sql` — Issue #157-160 测试数据
- `seed-daily-attendance.sh` / `seed-daily-attendance.ts` — 日考勤种子脚本

---

### 🩺 Health Checks

| Check | 命令/Endpoint | 期望结果 |
|-------|-------------|----------|
| Backend API | `curl http://localhost:3000/api/health` | 200 + `{"status":"ok"}` |
| Frontend v1 | `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/` | 200 |
| Frontend v2 | `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/` | 200 |
| Gateway | `curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/` | 200/401/404 |
| PostgreSQL | `docker compose exec postgres pg_isready -U school_admin` | `accepting connections` |
| Redis | `docker compose exec redis redis-cli ping` | `PONG` |
| OPA | `docker compose exec opa opa eval '1+1'` | 2 |
| Kafka | `docker compose exec kafka kafka-topics --list --bootstrap-server localhost:9092` | topics 列表 |

**深度数据库健康检查脚本**: `scripts/db-health-check.sh` — 检查连接池、WAL、慢查询等。

---

### 💾 Backup & Disaster Recovery

| 脚本 | 用途 | 位置 |
|------|------|------|
| `backup-database.sh` | PostgreSQL 自动备份+压缩+保留管理+通知 | `scripts/` |
| `backup_database.sh` | 基础版数据库备份 | `scripts/` |
| `backup-memory.sh` | Agent 记忆文件备份 | `scripts/` |
| `dr-recovery.sh` | 一键灾难恢复（L4 区域级故障切换） | `scripts/` |
| `ssl-cert-renew.sh` | SSL 证书到期自动续期 | `scripts/` |

---

### 🌐 Cloudflare Tunnel

Cloudflare Tunnel 提供公网访问入口，运行在 `school-admin-cloudflared` 容器中。

**相关脚本**:
| 脚本 | 用途 |
|------|------|
| `infra/cloudflared-manager.sh` | Tunnel 管理（启动/停止/状态） |
| `scripts/start-cloudflare-tunnel.sh` | 启动 Tunnel |
| `scripts/run-tunnel.sh` | 运行 Tunnel |
| `scripts/keep-tunnel-alive.sh` | 保活脚本 |
| `scripts/check-tunnel-health.sh` | 健康检查 |
| `scripts/setup-cloudflare-tunnels.sh` | 初始设置 |
| `scripts/tunnel.sh` | 简易 Tunnel 管理 |
| `scripts/cloudflare-watchdog.py` | 看门狗监控 |

```bash
# 重启 Tunnel（URL 变化时）
docker compose -f infra/docker-compose.yml restart cloudflared
```

---

### 🔧 Nginx Configuration

Nginx 作为反向代理位于 `infra/nginx/nginx.conf`，主要配置：

| 功能 | 配置 |
|------|------|
| Gzip 压缩 | `on` — text/css/js/json/svg 等 |
| 安全头 | X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy |
| CORS | 按请求方法映射 |
| 限流 | API: 30r/s, Auth: 5r/m |
| 静态缓存 | JS/CSS/图片等缓存 1 年 |

---

### 📜 OPS Scripts Reference

所有脚本位于 `scripts/` 目录，分类如下：

| 类别 | 脚本 | 用途 |
|------|------|------|
| **部署** | `release.sh` | 发布流程 |
| | `daily-integrate.sh` | 日集成 |
| | `daily-release.sh` | 日发布 |
| | `update-status-page.sh` | 状态页更新 |
| **CI** | `auto-update-dashboard.sh` | Dashboard 自动更新 |
| | `dashboard-refresh.sh` | Dashboard 刷新 |
| **监控** | `agent-monitor.sh` | Agent 监控 |
| | `agent-monitor-simple.sh` | Agent 监控（简化版） |
| | `patrol.py` | 定时巡检 |
| | `pm_monitor.py` | PM 监控 |
| | `pm-auto-monitor.sh` | PM 自动监控 |
| | `subagent-watchdog.sh` | Subagent 看门狗 |
| | `validate-agent-messages.py` | 消息验证 |
| **数据库** | `db-health-check.sh` | 数据库健康检查 |
| | `schema-init.sql` | Schema 初始化 |
| | `generate-test-data.js` | 测试数据生成 |
| **Tunnel** | (见 Cloudflare Tunnel 章节) | |
| **PM 工具** | `pm-daily-check.sh` | PM 每日检查 |
| | `pm-weekly-report.sh` | PM 周报 |
| | `pm-cleanup-branches.sh` | 清理过期分支 |
| | `check-report-due.sh` | 检查报告到期 |
| | `check-role-activity.sh` | 角色活动检查 |
| | `detect-stuck-tasks.py` | 卡住任务检测 |
| **同步** | `sync-memory.sh` | 记忆同步 |
| | `sync-wiki.sh` | Wiki 同步 |

---

### 🔐 Security & Auth

JWT 认证 + RBAC/ABAC 权限系统。策略由 OPA 引擎执行（策略文件: `infra/opa/policies/`）。

| 组件 | 说明 |
|------|------|
| JWT Auth Guard | `JwtAuthGuard` — 所有 API 请求认证 |
| Role Guard | `RolesGuard` — 基于角色的权限控制 |
| OPA Guard | Open Policy Agent 策略决策 |
| OTP | 管理员/教师登录需 TOTP 二次验证 |

**测试账号**: 见上方 Credentials 章节。

---

### 📋 OPS Quick Reference

```bash
# 全部服务状态
docker compose -f infra/docker-compose.yml ps

# 查看日志（实时）
docker compose -f infra/docker-compose.yml logs -f [service]

# 重启单个服务
docker compose -f infra/docker-compose.yml restart [service]

# 重建并重启
docker compose -f infra/docker-compose.yml up -d --build [service]

# 检查数据库状态
PGPASSWORD="school_admin123" psql -h localhost -U school_admin -d school_admin -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"

# 验证前后端连通性
curl -s http://localhost:3000/api/health
docker compose -f infra/docker-compose.yml exec backend curl -sf http://localhost:3000/api/health

# 查看 Kafka topics
docker compose -f infra/docker-compose.yml exec kafka kafka-topics --list --bootstrap-server localhost:9092

# 清除 Docker 旧镜像（释放磁盘）
docker image prune -af --filter "until=72h"

# 容器资源使用排名
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}" | sort -k3 -h

# 查看容器健康检查状态
docker inspect --format='{{.Name}} {{.State.Health.Status}}' $(docker ps -q)
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
