# DEVOPS Agent - 长期记忆

*上次更新: 2026-07-11*

---

## 🧠 我的身份

我是 **DEVOPS Agent** — 运维工程师。我负责环境部署、CI/CD 维护和镜像管理。

**汇报对象**: PM
**协作对象**: DEV（构建代码）、QA（提供测试环境）

---

## 📚 项目上下文（我必须知道的核心信息）

### 项目名: School Admin System
- **后端**: NestJS, TypeORM, PostgreSQL, 端口 3000
- **前端**: React + TypeScript + Vite, 端口 8080
- **部署**: Docker Compose
- **代理**: Coze（`/school-admin/` → localhost:8080, `/school-admin/api/*` → localhost:3000/api/*）

### 容器列表
| 服务 | 镜像 | 端口 |
|------|------|------|
| school-admin-backend | school-admin-backend:latest | 3000 |
| school-admin-frontend | school-admin-frontend:latest | 8080 |
| school-admin-postgres | postgres:16-alpine | 5432 |
| school-admin-redis | redis:7-alpine | 6379 |
| school-admin-kafka | confluentinc/cp-kafka:7.4.0 | 9092 |
| school-admin-zookeeper | confluentinc/cp-zookeeper:7.4.0 | 2181 |
| school-admin-prometheus | prom/prometheus:v2.47.0 | 9090 |
| school-admin-grafana | grafana/grafana:10.1.0 | 3001 |
| school-admin-alertmanager | prom/alertmanager:v0.26.0 | 9093 |
| school-admin-cloudflared | cloudflare/cloudflared:latest | - |

### 重建命令
```bash
# 后端
cd /workspace/school-admin-system && npm run build
docker cp dist/ school-admin-backend:/app/
docker exec school-admin-backend /bin/sh -c "cd /app && npm run migration:run"

# 前端
cd /workspace/school-admin-system/school-admin-frontend && npm run build
docker cp dist/ school-admin-frontend:/usr/share/nginx/html/
docker exec school-admin-frontend nginx -s reload 2>/dev/null || true
```

### ⚠️ 已知限制
- **Docker Hub 网络受限**（中国网络限制），无法通过 `docker build` 重建镜像
- 使用 `docker cp` + `docker exec` 直接更新运行容器
- **COZE_PROXY_CONFIG.md 是只读参考**，不能修改 — 配置问题由用户向 Coze 反馈

### Docker Compose
- 位置: `/workspace/school-admin-system/docker-compose.yml`
- 启动: `docker compose -f /workspace/school-admin-system/docker-compose.yml up -d`
- 停止: `docker compose -f /workspace/school-admin-system/docker-compose.yml down`

---

## 📋 我的工作记录

### [2026-07-11] 修复 #226 #230 — 资产管理后端500错误

**问题**: `Asset.school_id` 列在数据库 `assets` 表中不存在，导致 `findAllAssets`、`createAsset`、`getAssetStatistics` 均返回 500。

**根因**: 实体 `Asset` 定义了完整的字段（含 `school_id`、`code`、`category` 等），但数据库中的 `assets` 表是旧的简化版（仅 `id, name, type, status, quantity, location, description, created_at, updated_at`），缺少绝大部分字段。

**修复**:
1. 编写迁移文件 `1717700000000-RecreateAssetsTableWithEntitySchema.ts`
2. 编译为 JS 并通过 `docker cp` 复制到容器
3. TypeORM CLI 因 bcrypt 模块缺失无法运行，改为直接通过 `psql` 在 Postgres 容器中执行 SQL
4. 重建的 `assets` 表包含所有实体定义的 21 列 + 5 个索引
5. 手动插入迁移记录到 `migrations` 表
6. 重启 backend 并验证所有端点均返回 200

**验证结果**:
- `GET /api/asset` → HTTP 200 ✅
- `POST /api/asset` (create) → HTTP 201 ✅
- `GET /api/asset/:id` → HTTP 200 ✅
- `GET /api/asset/statistics` → HTTP 200 ✅
- 重复 code 检测正常 → HTTP 409 ✅

**注意**: 迁移文件已提交到 `src/migrations/`，但因 `bcrypt` 依赖问题，TypeORM CLI 无法在容器内运行。直接 SQL 执行是可靠替代方案。

---

## 🛠 工作流

## 🛠 工作流

### 收到部署请求
```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from DEVOPS --to PM \
  --message "开始部署 vX.X.X" \
  --type received --status running
```

### 部署完成
```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from DEVOPS --to PM \
  --message "vX.X.X 部署完成" \
  --type done --status idle
```

### 部署失败
```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from DEVOPS --to PM \
  --message "部署失败: [原因]" \
  --type failed --status idle
```

---

## ⚡ spawn 时我应该做什么

1. **读我的 MEMORY.md** — 了解项目上下文和历史
2. **读 AGENTS.md** — 了解最新规则
3. **读 PM 的 task** — 理解部署任务
4. **记录 received 到 Dashboard**
5. **开始部署**
6. **完成后更新我的 MEMORY.md** — 追加部署记录和经验
7. **记录 done/failed 到 Dashboard**
