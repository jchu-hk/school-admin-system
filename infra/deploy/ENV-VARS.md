# 生产环境变量清单 & 核对 — CR-20260714-001 Phase 5 T25

> 依据：`infra/docker-compose.prod.yml`、`infra/docker-compose.yml`、`infra/run-backend.sh`、`.env.example`、后端 `process.env` 引用。

## 1. 结论摘要

生产部署当前以 **`infra/run-backend.sh`（docker run）** 为准（Docker Hub 受限，未走 docker build）。
经核对，存在 **3 个生产必需但当前部署配置中缺失** 的环境变量，需在 T28 发布前补齐：

| 变量 | 用途 | 缺失位置 | 缺失风险 |
|------|------|---------|---------|
| `QR_SIGNING_MASTER_KEY` | QR 码 HMAC 签名主密钥（每日轮换派生密钥） | run-backend.sh、.env.example、两个 compose 均未定义 | ⚠️ **高危**：缺省时落到硬编码 fallback 密钥，QR 码签名可被预测伪造 |
| `FRONTEND_URL` | CORS 允许的来源（main.ts CORS origin） | 未定义（缺省 localhost:3000） | 中：跨域前端调用会被拒/默认回退 |
| `WEBHOOK_SECRET` | 考勤 Webhook 鉴权密钥 | 未定义（缺省硬编码） | 中：Webhook 签名校验使用默认密钥，可被伪造 |

另：`DB_SSL` / `SESSION_SECURE_COOKIE` 仅在 `docker-compose.prod.yml` 声明，**未在 `run-backend.sh` 中设置**。若生产数据库走 SSL（`.env` 未启用），需在 run-backend.sh 同步加 `-e DB_SSL=true`。当前生产用本地局域网 Postgres，暂未强制，但建议补齐保持一致。

## 2. 三方对照表

### 已覆盖（三处一致或 run-backend.sh 已含）
`NODE_ENV, PORT, APP_NAME, TZ, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, REDIS_HOST, REDIS_PORT, JWT_SECRET, JWT_EXPIRES_IN, OPA_URL, NOTIFICATION_CHANNEL, COZE_API_KEY, COZE_BOT_ID, LOG_LEVEL, BACKUP_DIR`

### 缺失 / 不一致
| 变量 | run-backend.sh | compose.prod.yml | .env.example | 建议 |
|------|---------------|------------------|--------------|------|
| `QR_SIGNING_MASTER_KEY` | ❌ | ❌ | ❌ | **必须新增**，生产设为强随机密钥 |
| `FRONTEND_URL` | ❌ | ❌ | ❌ | 新增，设 https 前端域名 |
| `WEBHOOK_SECRET` | ❌ | ❌ | ❌ | 新增，设强随机密钥 |
| `DB_SSL` | ❌ | `"true"` | ❌ | run-backend.sh 对齐补 `-e DB_SSL` |
| `SESSION_SECURE_COOKIE` | ❌ | `"true"` | ❌ | run-backend.sh 对齐补 |

## 3. 生产必需变量清单（T28 发布项）

部署前必须在 `run-backend.sh` 的 `docker run` 追加：
```bash
-e QR_SIGNING_MASTER_KEY=<强随机64字符hex> \
-e FRONTEND_URL=https://<你的前端域名> \
-e WEBHOOK_SECRET=<强随机密钥> \
```

生成建议：
```bash
openssl rand -hex 32          # QR_SIGNING_MASTER_KEY
openssl rand -hex 32          # WEBHOOK_SECRET
```

## 4. 说明

- 此清单为 **DEVOPS 交付物**，不直接改动 `.env`/`run-backend.sh` 运行参数（避免未经授权改动生产行为）。
  具体 env 值由 PM + 人类授权后在 T28 发布时注入。
- 新增 `QR_SIGNING_MASTER_KEY` 变更后，已签发的旧 QR 码因密钥派生变化会失效，属预期（QR 有效期仅 30s，无存量影响）。
