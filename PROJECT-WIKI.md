# Project Wiki - School Admin System

> Last updated: 2026-07-03 08:45 GMT+8
> Updated by: PM Agent (automated)

---

## 📦 Current Version

- **Version**: 10.1.0
- **Latest Commit**: `095af5055a9fa1419197181ae7841d9afee1ac98`
- **Branch**: `main` (clean)
- **Docker Uptime**: ~25h+

---

## 🌐 Environment URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend | `https://school-admin.[tunnel].trycloudflare.com` | ✅ Active |
| Backend API | `https://school-admin-backend.[tunnel].trycloudflare.com` | ✅ Active |
| Local Frontend | `http://localhost:3001` | ✅ |
| Local Backend | `http://localhost:3000` | ✅ |

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
| `frontend` | 3001 | Next.js web app |
| `backend` | 3000 | NestJS REST API |
| `postgres` | 5432 | Primary database |
| `redis` | 6379 | Cache/queue |
| `kafka` | 9092 | Event streaming |
| `zookeeper` | 2181 | Kafka coordination |
| `prometheus` | 9090 | Metrics |
| `grafana` | 3003 | Dashboards |
| `alertmanager` | 9093 | Alerts |

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

- **2026-07-03**: Project-Wiki created; backend health endpoint verified
- **2026-07-02**: Cloudflare tunnel restarted; tunnel URLs updated
- **2026-07-02**: Docker services running ~25h; all healthy

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
