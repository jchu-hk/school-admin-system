# Environment Cleanup Plan

> **Created**: 2026-07-11 01:07 GMT+8
> **Objective**: Establish a clean test environment aligned with the release-tag philosophy, enabling reliable functional verification
> **Trigger**: Repeated defect reports traced to environment inconsistencies (untagged images, dirty HEAD, empty DB, duplicated project directories)
> **Owner**: PM → DEV/QA/DEVOPS (parallel)
> **Target State**: Clean checkout from `v1.5.7`, release-tagged Docker images, populated test data

---

## Current State Assessment

### ⚠️ Gaps Found

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| G1 | **Backend image `infra-backend:latest` (untagged)** | 🔴 High | Cannot trace which code version is running; breaks reproducibility |
| G2 | **Frontend image `school-admin-frontend:v1.5.7` runs but `infra-backend` newer?** | 🟡 Medium | Version mismatch between frontend/backend possible |
| G3 | **Docker-compose.yml uses `build:` context, but actual running containers are pre-built** | 🟡 Medium | Config drift: compose file says "build from source" but containers use pre-built images |
| G4 | **Duplicate project dirs: `school-admin-system/` is a separate git worktree** | 🟡 Medium | Confusion on which source is authoritative; `school-admin-system/Dockerfile` exists |
| G5 | **Database has 56 tables but 0 rows** | 🔴 High | No test data → functional verification impossible |
| G6 | **HEAD (a58493d) is 8 commits ahead of v1.5.7 (cb3ee0a)** | 🟡 Medium | Workspace not aligned to release — changes are dashboard/heartbeat only (non-functional) |
| G7 | **`docker cp` hotfix approach documented in COZE_PROXY_CONFIG.md** | 🟡 Medium | Encourages deploy-time patching instead of proper rebuilds |

### 🔬 Root Cause

The environment evolved organically:
1. Frontend was rebuilt properly (`school-admin-frontend:v1.5.7` ✅)
2. Backend was never retagged — old `infra-backend:latest` persists ❌
3. DB was migrated (schema exists) but never seeded with test data
4. `school-admin-system/` is a stale worktree clone
5. Clean deployment philosophy was only recently articulated — no established procedure yet

---

## Target State (After Cleanup)

```
Source of Truth: git tag v1.5.7 (commit cb3ee0a)
  ├─ Docker Image: school-admin-backend:v1.5.7  (built from tag, pushed to GHCR)
  ├─ Docker Image: school-admin-frontend:v1.5.7 (already aligned ✅)
  └─ Database: 56 tables + test data seed (idempotent SQL)

Working Directory: checked out at v1.5.7 (not ahead)
Docker Compose: infra/docker-compose.yml only, no stale worktree
Deployment: "docker compose build + up" only — no docker cp
```

---

## Task Plan

### Phase 1: Preparation & Cleanup (PM)

**Starting Condition**: Current workspace state documented (this file exists).

| Step | Action | Assignee | Depends On |
|------|--------|----------|------------|
| 1.1 | Clean up stale `school-admin-system/` worktree — delete it | DEV | — |
| 1.2 | Reset git HEAD to `v1.5.7` tag (soft reset, preserve memory files) | DEV | — |
| 1.3 | Update `COZE_PROXY_CONFIG.md` — remove `docker cp` references, add correct build instructions | DEV | — |

### Phase 2: Rebuild Docker Images from Release Tag (DEVOPS)

**Starting Condition**: HEAD at `v1.5.7`, working directory clean.

| Step | Action | Assignee | Depends On |
|------|--------|----------|------------|
| 2.1 | Build backend image from `v1.5.7` source: `docker build -t school-admin-backend:v1.5.7 -f apps/backend/Dockerfile .` | DEVOPS | 1.2 |
| 2.2 | Tag backend as `latest`: `docker tag school-admin-backend:v1.5.7 school-admin-backend:latest` | DEVOPS | 2.1 |
| 2.3 | Verify backend compiles and starts with health check passing | DEVOPS | 2.2 |
| 2.4 | Rebuild frontend from v1.5.7 (confirm existing image is correct, rebuild if needed) | DEVOPS | 1.2 |

### Phase 3: Database Reset & Seed Data (DEVOPS)

**Starting Condition**: Backend container running at `v1.5.7`.

| Step | Action | Assignee | Depends On |
|------|--------|----------|------------|
| 3.1 | Review existing migration files at `packages/database/migrations/` — ensure SQL is idempotent | DEVOPS | — |
| 3.2 | Drop and recreate database from migrations (clean state) | DEVOPS | 2.2 |
| 3.3 | Create seed data SQL — realistic test data for all 56 tables (students, classes, fees, grades, attendance, etc.) | DEVOPS | 3.2 |
| 3.4 | Apply seed data and verify row counts | DEVOPS | 3.3 |

### Phase 4: Verification (QA)

**Starting Condition**: Clean Docker stack + seeded DB running from v1.5.7.

| Step | Action | Assignee | Depends On |
|------|--------|----------|------------|
| 4.1 | Run health check: `GET /api/health` returns 200 | QA | 3.4 |
| 4.2 | Login test: verify authentication flow works with seeded test users | QA | 4.1 |
| 4.3 | Student module: verify CRUD operations on seeded data | QA | 4.2 |
| 4.4 | Fee module: verify fee types, collections, tuition calculation | QA | 4.2 |
| 4.5 | Attendance/Academic: verify records, grades, leaves | QA | 4.2 |
| 4.6 | Verify no console errors on frontend | QA | 4.1 |
| 4.7 | Compile verification report | QA | 4.3–4.6 |

### Phase 5: Release & Docs Update (PM)

**Starting Condition**: QA passes, environment stable.

| Step | Action | Assignee | Depends On |
|------|--------|----------|------------|
| 5.1 | Push `school-admin-backend:v1.5.7` to GHCR (for future deployments) | DEVOPS | 2.1 |
| 5.2 | Update `PROJECT-WIKI.md` with environment philosophy & release procedure | PM | 4.7 |
| 5.3 | Create/update `SETUP.md` — clean setup from git clone to running environment | PM | 5.2 |
| 5.4 | Notify via WeChat: "Environment cleanup complete, ready for verification" | PM | 5.3 |

---

## Timing & Parallelism

```
Phase 1 (PM/DEV): 0-start ──────────────────┐
Phase 2 (DEVOPS):      └── depends on 1.2 ──┐
Phase 3 (DEVOPS):      └── depends on 2.2 ──┐
Phase 4 (QA):              └── depends on 3.4
Phase 5 (PM/DEVOPS):              └── after 4.7
```

**Parallel allowed within phases** where no dependency chain.

---

## Success Criteria

1. ✅ `git log -1` shows `cb3ee0a` (v1.5.7)
2. ✅ `docker images` shows `school-admin-backend:v1.5.7` (not `infra-backend`)
3. ✅ `docker images` shows `school-admin-frontend:v1.5.7`
4. ✅ Database has 56 tables with realistic test data (all >0 rows)
5. ✅ All key modules (login, student, fee, attendance, grades) pass functional verification
6. ✅ `docker cp` not used — all changes go through `docker compose build`

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| DB seed SQL conflicts with existing migrations | Medium | Review migrations first; use `CREATE IF NOT EXISTS` / idempotent patterns |
| Backend build fails due to outdated lockfile | Low | Docker build uses `pnpm install` from source; CI passed on v1.5.7 |
| Test data leaks real user info | Low | Use synthetic data only (randomized names/IDs/amounts) |
| Cloudflare tunnel breaks during restart | Low | It's stateless; container restart fixes automatically |

---

## Verification Checklist (for QA)

- [ ] `GET /api/health` → `{"status":"ok"}`
- [ ] Login as `admin` with seeded password → JWT token returned
- [ ] `GET /api/students` → list of students (non-empty)
- [ ] `GET /api/classes` → list of classes (non-empty)
- [ ] `GET /api/fee/types` → fee type list (non-empty)
- [ ] Frontend loads without console errors
- [ ] Navigation works through: Dashboard → Students → Fees → Attendance → Grades
