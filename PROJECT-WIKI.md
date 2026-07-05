# Project Wiki - School Admin System

> Last updated: 2026-07-05 17:40 GMT+8
> Updated by: PM (automated tunnel refresh)

---

## 📦 Current Version

- **Version**: v1.5.7
- **Release Date**: 2026-07-05 08:49 GMT+8
- **Git Commit**: `926f7f5`
- **Branch**: `main`
- **Status**: Released for Testing
- **Tested By**: Human QA - 2026-07-05
- **Changelog**:
  - Bug修复: 学生管理新增功能正常


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
