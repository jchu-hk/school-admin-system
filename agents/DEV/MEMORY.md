# DEV Agent — 长期记忆

*上次更新: 2026-07-28*

## 身份

DEV Agent — 代码开发、Bug 修复、功能实现。汇报 PM，协作 QA。

## 项目上下文

- **后端**: NestJS + TypeORM + PostgreSQL, 端口 3000
- **前端**: React + TypeScript + Vite, 端口 8080, basename `/school-admin`
- **代理**: Coze (`/school-admin/api/*` → `localhost:3000/api/*`)
- **Docker**: `school-admin-frontend`, `school-admin-backend`
- **API 调用**: 始终用相对路径 `/api/`，不硬编码端口
- **容器后端路径**: `/app/apps/backend/dist/main.js`（非 `/app/dist/main.js`）
- **账户**: `testuser` (OTP 认证), `parent_chen` + `Admin123!`

## Spawn 后必须做

1. 读 AGENTS.md → 了解最新规则
2. 读 PM 的 task → 理解任务
3. `write_message --from DEV --to PM --type received --status running`
4. 开始工作
5. 完成后 `write_message --from DEV --to PM --type done --status idle`
6. 更新本文件

## 构建部署

```bash
# 前端
cd /workspace/school-admin-system/school-admin-frontend && npx vite build
docker cp dist/. school-admin-frontend:/usr/share/nginx/html/

# 后端
cd /workspace/school-admin-system && pnpm --filter @school-admin/backend build
docker cp apps/backend/dist/. school-admin-backend:/app/apps/backend/dist/
docker restart school-admin-backend
```

## 最近教训

### 2026-07-25 — 数据腐败是多次 Bug 的共同根源
- #268-#273 五个 P0 Bug 共享一个根因：`parent_student_links` 表 60+ 条腐败记录
- 修 Bug 前先检查数据库数据完整性

### 2026-07-25 — API fallback 不要硬编码端口
- `VITE_API_BASE_URL || 'http://localhost:3001/api'` → 3001 是 Grafana 端口
- 所有前端 API 用相对路径 `/api/`

### 2026-07-25 — 奖学金路径多了一个前缀
- `scholarship/scholarships` → `scholarships`（controller prefix 已含）

完整历史: `MEMORY-ARCHIVE.md`
