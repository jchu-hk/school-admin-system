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
Sandbox Port 5000 (Nginx)
       |
       +---> /school-admin/api/*    --> localhost:3000/api/*  (Backend API)
       +---> /school-admin/assets/* --> localhost:8080/assets/* (Static Files)
       +---> /school-admin/*        --> localhost:8080        (Frontend)
       +---> /api/*                 --> localhost:3000/api/*  (Backup API)
       +---> /assets/*              --> localhost:8080/assets/* (Backup Static)
       +---> /*                     --> localhost:5001        (OpenClaw Gateway)
```

## Routing Table

| Coze URL Path | Target (localhost) | Service | Description |
|---------------|-------------------|---------|-------------|
| `/school-admin/` | `:8080` | Frontend | React app entry point |
| `/school-admin/api/*` | `:3000/api/*` | Backend API | API requests from frontend |
| `/school-admin/assets/*` | `:8080/assets/*` | Static Files | JS/CSS bundles |
| `/api/*` | `:3000/api/*` | Backend API | Direct API access (backup) |
| `/assets/*` | `:8080/assets/*` | Static Files | Static assets (backup) |
| `/` | `:5001` | OpenClaw | Gateway + Web UI |

## Access URLs

| Service | URL |
|---------|-----|
| School Admin Frontend | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/` |
| School Admin API | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/api/` |
| OpenClaw Web UI | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/` |

## Docker Services

| Container | Port Mapping | Status |
|-----------|--------------|--------|
| school-admin-frontend | 8080 -> 80 | Up |
| school-admin-backend | 3000 -> 3000 | Up (healthy) |
| school-admin-postgres | 5432 -> 5432 | Up (healthy) |
| school-admin-redis | 6379 -> 6379 | Up (healthy) |
| school-admin-grafana | 3001 -> 3000 | Up |
| school-admin-prometheus | 9091 -> 9090 | Up |
| school-admin-kafka | 9092 -> 9092 | Up (healthy) |
| school-admin-alertmanager | 9093 -> 9093 | Up |
| school-admin-zookeeper | 2181 | Up |

## Frontend Configuration

- **basename**: `/school-admin` (configured in React Router)
- **API base URL**: Relative paths (resolved to `/school-admin/api/*`)
- **Build output**: Files in `/workspace/projects/workspace/school-admin-frontend/dist/`

## Nginx Configuration File

Location: `/etc/nginx/sites-available/school-admin`

Key points:
- Listens on port 5000
- Routes `/school-admin/api/*` to backend with path rewrite
- Routes `/school-admin/*` to frontend
- Routes `/*` to OpenClaw Gateway
- WebSocket support for OpenClaw

## Important Notes for OpenClaw Agent

1. **When modifying frontend code**: The frontend uses `basename="/school-admin"` in React Router, so all routes are prefixed with `/school-admin/`.

2. **API calls from frontend**: Use relative paths like `/api/classes` which resolve to `/school-admin/api/classes` due to the basename.

3. **Static assets**: Must be accessible at `/school-admin/assets/*` for the frontend to load properly.

4. **Testing**: After making changes to frontend/backend — always rebuild from the correct release tag:
   - Ensure workspace is checked out at the target release tag (e.g. `v1.5.7`)
   - Rebuild frontend: `cd /workspace/projects/workspace/school-admin-frontend && pnpm build`
   - Rebuild backend: `docker compose -f infra/docker-compose.yml build`
   - Restart containers: `docker compose -f infra/docker-compose.yml up -d`
   - **Never use `docker cp`** — it bypasses the build pipeline and causes environment drift

5. **CDN caching**: The Coze CDN may cache files. Use timestamped filenames in vite config to bust cache.

## Verification Commands

```bash
# Test API routing
curl https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/api/health

# Test frontend
curl https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/

# Check Docker status
docker ps

# Check nginx config
nginx -t && cat /etc/nginx/sites-available/school-admin
```

---

*Last updated: 2026-07-10*
*OpenClaw model: deepseek/deepseek-chat (direct API, not Coze tokens)*
