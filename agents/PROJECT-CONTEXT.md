# Project Context Base — School Admin System
*所有 Agent 的共享项目上下文，一个文件一把同步*

---

## 项目概览
- **名称**: 学校管理系统 (School Admin System)
- **技术栈**: NestJS + React + TypeScript + PostgreSQL + Redis + Kafka
- **GitHub**: `jchu-hk/school-admin-system`

## 运行环境
| 服务 | 内部地址 | 说明 |
|------|---------|------|
| 后端 API | `localhost:3000` | NestJS, TypeORM |
| 前端 | `localhost:8080` | React, Vite, basename: `/school-admin` |
| PostgreSQL | `school-admin-postgres:5432` | 用户: `school_admin` |
| Redis | `school-admin-redis:6379` | 缓存 |
| Kafka | `school-admin-kafka:9092` | 消息队列 |
| **外部入口** | `https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/` | Coze 代理 |
| API 代理 | `/school-admin/api/*` → `localhost:3000/api/*` | |
| 前端路由 basename | `/school-admin` | React Router |

## 登录信息
- 用户名: `testuser`
- 认证方式: OTP（一次性验证码）
- 账户类型: `system_admin`

## ⚠️ 关键约束（必须遵守）
1. **COZE_PROXY_CONFIG.md** — 只读参考，不修改；配置错误由用户向 Coze 反馈
2. **Docker Hub 网络受限**（中国网络限制）— 用 `docker cp` 替代 `docker build`
3. **9000 端口** — 有系统服务运行，禁止使用/关闭/拦截
4. **GitHub 文档同步** — 代码变更前先更新文档；紧急修复 24h 内补录

## Docker 容器
| 服务 | 镜像 |
|------|------|
| backend | `school-admin-backend:latest` |
| frontend | `school-admin-frontend:latest` |
| postgres | `postgres:16-alpine` |
| redis | `redis:7-alpine` |
| kafka | `confluentinc/cp-kafka:7.4.0` |
| zookeeper | `confluentinc/cp-zookeeper:7.4.0` |
| prometheus | `prom/prometheus:v2.47.0` |
| grafana | `grafana/grafana:10.1.0` |
| alertmanager | `prom/alertmanager:v0.26.0` |
| cloudflared | `cloudflare/cloudflared:latest` |

## Dashboard 协作规则（强制）
```bash
# 开始工作 — spawn 后立即执行
python3 skills/agent-communication/scripts/write_message.py \
  --from {YOUR_AGENT_NAME} --to PM \
  --message "[Issue #XXX] 开始工作" \
  --type received --status running

# 完成工作
python3 skills/agent-communication/scripts/write_message.py \
  --from {YOUR_AGENT_NAME} --to PM \
  --message "[Issue #XXX] 完成/失败" \
  --type passed/failed --status idle
```
- ❌ 禁止直接编辑 `agent-messages.json` 或 `agent-status.json`
- ❌ 禁止手动调用 `update_dashboard.py`

## spawn 时我该做什么
1. 读 `agents/PROJECT-CONTEXT.md` — 项目基础上下文
2. 读自己的 `MEMORY.md` — 个人历史和经验
3. 读 `AGENTS.md` — 最新规则
4. 读 PM 的 task — 理解当前任务
5. 记录 `received` 到 Dashboard
6. 开始工作
7. 完成后更新自己的 MEMORY.md
8. 记录 `done/passed/failed` 到 Dashboard

---

*版本: v1.0 | 最后更新: 2026-07-11*
