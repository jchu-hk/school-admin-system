# Project Wiki — School Admin System

> **Last updated**: 2026-08-02 09:14 GMT+8
> **Latest commit**: `a332c4ed` — main branch

---

## 1. 📦 Release Info

| Item | Detail |
|------|--------|
| **Version** | v1.6.1 |
| **Release Date** | 2026-08-01 |
| **GitHub Releases** | [github.com/jchu-hk/school-admin-system/releases](https://github.com/jchu-hk/school-admin-system/releases) |
| **Open Issues** | 19 (0 P0 / 0 P1) |
| **Open PRs** | 0 |

---

## 2. 🌐 Test Environment URLs

> 💡 All external URLs route through Coze proxy → localhost. Local URLs are the source of truth.

### Applications

| App | Local | External (Coze) | Description |
|-----|-------|------------------|-------------|
| **admin-app** | [localhost:8080](http://localhost:8080) | [coze.site/school-admin/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/) | 教职工后台管理 |
| **portal-app** | [localhost:8081](http://localhost:8081) | [coze.site/portal/student](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student) | QR考勤 + 学生/家长门户 |
| **QR 考勤** | [localhost:8081](http://localhost:8081) | [coze.site/attendance/qr](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/attendance/qr) | 扫码考勤页 |
| **Backend API** | [localhost:3000](http://localhost:3000) | — | NestJS REST API |
| **Gateway** | [localhost:5001](http://localhost:5001) | [coze.site/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/) | OpenClaw Gateway |

### Monitoring (🔐 OPS)

| Tool | External URL | Credentials |
|------|-------------|-------------|
| **Grafana** | [coze.site/grafana/](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/grafana/) | `admin` / see `.env` |
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

## 4. 📁 Documentation Inventory

### Core Specs

| Document | Purpose |
|----------|---------|
| `SPEC-COMPLETE.md` | Full feature specification (7 modules, 45 functions) |
| `SPEC-SYSTEM-DESIGN.md` | System architecture & design decisions |
| `API-DESIGN.md` | REST API reference |
| `DB-SCHEMA.md` | Database schema |
| `DATA-DICTIONARY.md` | Field definitions |

### Workflow & Rules

| Document | Purpose |
|----------|---------|
| `AGENTS.md` | Agent operating rules & navigation |
| `SOUL.md` | Core identity & safety rails |
| `CRITICAL_RULES.md` | Hard red lines (spawn rules, forbidden actions) |
| `MEMORY.md` | Long-term memory & lessons learned |
| `HEARTBEAT.md` | System heartbeat log |
| `COZE_PROXY_CONFIG.md` | Coze proxy routing configuration |
| `docs/PM-WORKFLOW.md` | PM workflow reference |
| `docs/SVA-GATE.md` | Self-Verifying Agent role-action matrix |

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

### Docker Services (14 containers)

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
| **Network** | | |
| `school-admin-cloudflared` | — | Public tunnel |

> Compose project: `infra` · Internal network: `school-network`

---

## 6. 🧪 QA Test Reports

| Module | Date | Status | Report |
|--------|------|--------|--------|
| Student Management E2E | 2026-06-27 | ✅ Pass | [TEST-REPORT.md](e2e-tests/TEST-REPORT.md) |
| Student Management Regression (35 cases) | 2026-07-06 | ❌ 28.57% | [Report](qa_report/student-management-regression-report-20260706.md) |
| Student Management Regression Fix | 2026-07-06 | ✅ Fixed | [Report](qa_report/student-management-regression-fix-report-20260706.md) |
| Student Management Full QA | 2026-07-06 | ⚠️ Blocked | [Report](qa_report/student-management-full-report-20260706.md) |
| Student Management Root Cause | 2026-07-06 | 📋 Analysis | [Report](qa_report/student-page-performance-root-cause.md) |
| Student Management (human QA) | 2026-07-05 | ✅ Pass | Manual test |

---

## 7. 🤖 Multi-Agent System

| Agent | Role |
|-------|------|
| **PM** | Task assignment, review, human reporting |
| **DEV** | Implementation |
| **QA** | Testing, test reports |
| **CHECKER** | Code review, spec compliance |
| **OPS** | Deployment, monitoring |
| **Project Admin** | Heartbeat monitoring, dashboard updates |

> **Dashboard**: [coze.site/agents](https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/agents) (public) · Backup: `multi-agent-dashboard.html`

---

## 8. 🛠️ OPS Reference

### Health Checks (Quick)

```bash
# All endpoints
curl -s http://localhost:3000/api/health      # Backend → 200
curl -so /dev/null -w "%{http_code}" http://localhost:8080/   # admin-app → 200
curl -so /dev/null -w "%{http_code}" http://localhost:8081/   # portal-app → 200
curl -so /dev/null -w "%{http_code}" http://localhost:5001/   # Gateway → 200/401

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

---

*Wiki restructured: 2026-08-02 09:14 GMT+8*
