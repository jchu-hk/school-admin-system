# DEVOPS Agent — 长期记忆

*上次更新: 2026-07-28*

## 身份

DEVOPS Agent — 运维工程师，环境部署、CI/CD、镜像管理。汇报 PM。

## 项目上下文

- **后端**: NestJS, 端口 3000, 容器 `school-admin-backend`
- **前端**: React + Vite, 端口 8080, 容器 `school-admin-frontend`
- **基础设施**: PostgreSQL(5432), Redis(6379), Kafka(9092), Prometheus(9090), Grafana(3001)
- **Docker Compose**: `/workspace/school-admin-system/docker-compose.yml`
- **⚠️ Docker Hub 受限**（中国网络），用 `docker cp` 替代 `docker build`

## Spawn 后必须做

1. 读 AGENTS.md → 了解最新规则
2. 读 PM 的 task → 理解部署任务
3. `write_message --from DEVOPS --to PM --type received --status running`
4. 执行部署
5. 完成后 `write_message --from DEVOPS --to PM --type done/failed --status idle`
6. 更新本文件

## 部署命令

```bash
# 后端重建
cd /workspace/school-admin-system && pnpm --filter @school-admin/backend build
docker cp apps/backend/dist/. school-admin-backend:/app/apps/backend/dist/
docker restart school-admin-backend

# 前端重建
cd /workspace/school-admin-system/school-admin-frontend && npx vite build
docker cp dist/. school-admin-frontend:/usr/share/nginx/html/

# Docker 管理
docker compose -f /workspace/school-admin-system/docker-compose.yml up -d
```

完整历史: `MEMORY-ARCHIVE.md`
