# Coze Proxy Configuration for School Admin System

> This document describes how the Coze platform proxy routes requests to the School Admin System testing environment.

## External Access URL

```
https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site
```

## Architecture

```
Internet Request
       |
       v
Coze Platform Proxy (https://*.dev.coze.site)
       |
       v
Sandbox Port 5000 (Nginx — host machine)
       |
       |—— admin-app (端口 8080, 教职工后台管理)
       |   +── /school-admin/*
       |   +── /school-admin/api/* → backend:3000
       |
       |—— portal-app (端口 8081, QR考勤+学生/家长门户)
       |   +── /attendance/*
       |   +── /portal/*
       |
       +── /api/*          → localhost:3000 (backend API backup)
       +── /assets/*        → localhost:8081 (portal-app)
       +── /*               → localhost:5001 (OpenClaw Gateway)
```

## Routing Table

| Coze URL Path | Target (localhost) | Service | Description |
|---------------|-------------------|---------|-------------|
| `/school-admin/` | `:8080` | Frontend (旧) | React app entry point — 旧UI v1.6.0 |
| `/school-admin/api/*` | `:3000/api/*` | Backend API | API requests from frontend |
| `/school-admin/multi-agent-dashboard.html` | `:8080/multi-agent-dashboard.html` | Dashboard | Agent状态仪表板 — 即时更新,无需认证 |
| `/school-admin/assets/*` | `:8080/assets/*` | Static Files | JS/CSS bundles — 旧UI |
| `/api/*` | `:3000/api/*` | Backend API | Direct API access (backup) |
| `/assets/*` | `:8081/assets/*` | Static Files | portal 静态资源 (basename=/，根 /assets/ → :8081) |
| `/attendance/*` | `:8081` | portal-app | QR考勤（`/attendance/qr` 学生展示、`/attendance/scan` 教职工扫码）|
| `/portal/*` | `:8081` | portal-app | 学生/家长门户（`/portal/student`、`/portal/parent`）|
| `/grafana/` | `:3001` | Grafana | OPS Dashboard → `admin/admin123` |
| `/prometheus/` | `:9091` | Prometheus | OPS Metrics |
| `/alertmanager/` | `:9093` | Alertmanager | OPS Alerts |
| `/` | `:5001` | OpenClaw | Gateway + Web UI |

## CR-20260714-001 新功能路由（目标状态）

以下路由将在**Phase 5 部署完成后**生效，新前端部署到 `127.0.0.1:8081`（计划新增端口）：

| Coze URL Path | Target | Service | Description |
|---------------|--------|---------|-------------|
| `/attendance/qr` | `:8081` | QR考勤 — 学生展示页 | 动态QR Code，学生扫码签到 |
| `/attendance/scan` | `:8081` | QR考勤 — 教职工扫码页 | 摄像头扫码记录考勤 |
| `/portal/student/*` | `:8081` | 学生门户 | 个人档案查看/编辑、电子请假 |
| `/portal/parent/*` | `:8081` | 家长门户 | 孩子切换查看、请假管理 |
| `/school-admin/*` | `:8080` | 旧前端（保持不变） | 教职工后台管理系统 |

> ✅ **现状**: 新前端 (`apps/frontend/`) 已部署并 running（`school-admin-frontend-v2`，:8081，bind mount `apps/frontend/dist`）。QR考勤 + 学生/家长门户已可经 Coze 代理访问。

## Access URLs

| Service | URL |
|---------|-----|
| School Admin Frontend (旧) | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/` |
| School Admin API | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/api/` |
| QR考勤 — 学生展示 | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/attendance/qr` |
| 学生门户 | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student` |
| 家长门户 | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/parent` |
| OpenClaw Web UI | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/` |
| Grafana Dashboards | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/grafana/` | 🔐 `admin` / `admin123` |
| Prometheus Metrics | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/prometheus/` |
| Alertmanager Alerts | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/alertmanager/` |

> ✅ QR考勤和门户链接已上线（:8081 portal-app 部署完成，可经 Coze 代理访问）。

## Docker Services

| Container | Port Mapping | Image | Status |
|-----------|--------------|-------|--------|
| school-admin-frontend | 8080 -> 80 | school-admin-frontend:latest (v1.6.0 — 旧UI) | Up |
| school-admin-backend | 3000 -> 3000 | school-admin-backend:v1.5.7 | Up (healthy) |
| school-admin-postgres | 5432 -> 5432 | postgres:16-alpine | Up (healthy) |
| school-admin-redis | 6379 -> 6379 | redis:7-alpine | Up (healthy) |
| school-admin-grafana | 3001 -> 3000 | grafana/grafana:10.1.0 | Up |
| school-admin-prometheus | 9091 -> 9090 | prom/prometheus:v2.47.0 | Up |
| school-admin-kafka | 9092 -> 9092 | confluentinc/cp-kafka:7.4.0 | Up (healthy) |
| school-admin-alertmanager | 9093 -> 9093 | prom/alertmanager:v0.26.0 | Up |
| school-admin-zookeeper | 2181 | confluentinc/cp-zookeeper:7.4.0 | Up |
| school-admin-opa | 8181 | openpolicyagent/opa:0.62.0 | Up |

### ⚠️ 新前端需要新增容器

Phase 5 T25 部署任务将为 QR考勤+门户 创建新Docker服务：

```
school-admin-frontend-v2  | 8081 -> 80 | apps/frontend/Dockerfile | ❌ 待建
```

## Frontend Configuration

### 旧前端 — school-admin-frontend/ (v1.6.0)
- **basename**: `/school-admin` (React Router)
- **API base URL**: 相对路径 → `/school-admin/api/*`
- **端口**: 8080 (Docker)
- **功能**: 教职工后台管理（学生管理、出勤、用户、资产等）

### 新前端 — apps/frontend/ (CR-20260714-001, portal-app)
- **basename**: `/` (React Router `<BrowserRouter>` 默认 basename=`/`，路由以 `/attendance/` 和 `/portal/` 为前缀；**绝不使用 `/school-admin`** — admin-app 专属)
- **vite base**: `/`（已显式配置）
- **API base URL**: 相对路径 → `/api/*`
- **端口**: 8081 (Docker)
- **功能**: QR考勤展示/扫码、学生门户、家长门户
- **构建产物**（`npm run build` → `apps/frontend/dist/`）: `index.html` 引用根路径 `/assets/index-<hash>-20260707.js`，bundle 内含 `attendance/qr`、`portal/parent`、`portal/student` 路由且**不含任何 `/school-admin` 引用**（验证通过）
- **部署状态**: 容器 bind-mount `apps/frontend/dist`；**必须重建/重部署**以替换 stale dist（BUG-D 根因：:8081 误留旧 admin 版 bundle）
- ⚠️ **package.json name** = `school-admin-portal-app`（与 admin-app `school-admin-frontend` 区分，避免 hash 命名混淆）

## Nginx Configuration File (Host)

Location: `/etc/nginx/sites-available/openclaw-full` (symlink → `/etc/nginx/sites-enabled/openclaw-full`)

Key routing rules:
- 端口 5000 监听
- `/school-admin/api/*` → 后端 127.0.0.1:3000
- `/api/*` → 后端 127.0.0.1:3000 (备用)
- `/school-admin/*` → 旧前端 127.0.0.1:8080
- `/*` → OpenClaw Gateway 127.0.0.1:5001

### 部署后需加入的新路由

```nginx
# QR考勤 + 学生/家长门户 — 新前端
location /attendance/ {
    proxy_pass http://127.0.0.1:8081;
    proxy_set_header Host $host;
}
location /portal/ {
    proxy_pass http://127.0.0.1:8081;
    proxy_set_header Host $host;
}
```

## Important Notes for OpenClaw Agent

1. **旧前端 vs 新前端**:
   - 旧前端 (`school-admin-frontend/`) → 8080 → 教职工后台管理
   - 新前端 (`apps/frontend/`) → 8081 → QR考勤 + 门户
   - 两个前端共享同一后端API (`school-admin-backend:3000`)

2. **部署状态**: ✅ `school-admin-frontend-v2` 已部署并running（bind mount from apps/frontend/dist）

3. **端口5000路由**: 主机nginx监听端口5000，Coze外网代理直接路由至此。
   - `/attendance/*` → port 8081 (portal-app)
   - `/portal/*` → port 8081 (portal-app)
   - `/school-admin/*` → port 8080 (admin-app)
   - `/api/*` → port 3000 (backend)
   - `/*` → port 5001 (OpenClaw Gateway)

4. **路由权限**:
   - `/attendance/scan` — **公开页面**，教职工扫码签到，无auth guard
   - `/attendance/qr` — 需登录（学生考勤QR展示）
   - `/portal/student` — 需登录
   - `/portal/parent` — 需登录
   - `/login` — 登录页（学生/家长，暂不支持教职工登录）

5. **CDN caching**: The Coze CDN may cache files. Use timestamped filenames in vite config to bust cache.

## Verification Commands

```bash
# 旧前端 — 兼容性检查
curl https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/
curl https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/api/health

# 新功能 — 部署后验证
curl -L https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/attendance/qr  # 部署后可用
curl -L https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/student  # 部署后可用
curl -L https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/portal/parent   # 部署后可用

# Check Docker status
docker ps

# Check nginx config
nginx -t && cat /etc/nginx/sites-available/school-admin
```

---

*Last updated: 2026-08-18 22:45 GMT+8 (门户/QR 已上线，/assets/→:8081 已补，admin vite base 修复中)*
*OpenClaw model: deepseek/deepseek-chat (direct API, not Coze tokens)*
