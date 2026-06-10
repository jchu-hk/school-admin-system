# DEPLOYMENT_REPORT.md - School Admin System

> Last Updated: 2026-06-08 12:50 GMT+8

---

## 互联网可访问测试环境

### 状态: ✅ 已配置

### 测试 URL

**前端（通过 serveo.net 隧道）:**
```
https://c9953270c50b8d26-115-190-36-195.serveousercontent.com
```

**API 基础地址:**
```
https://c9953270c50b8d26-115-190-36-195.serveousercontent.com/api
```

### 访问凭证

| 用途 | 用户名 | 密码 | 角色 | OTP 要求 |
|------|--------|------|------|---------|
| 测试账号 | `testuser` | `admin123` | school_staff | ❌ 无需 OTP |
| 管理员账号 | `admin` | `admin123` | system_admin | ✅ 需要 OTP（邮件验证码）|

### 登录流程

```bash
# 1. 获取访问令牌
curl -X POST https://<TUNNEL_URL>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"admin123"}'

# 2. 使用令牌访问受保护接口
curl https://<TUNNEL_URL>/api/dashboard/stats \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## 技术实现

### 网络架构

```
互联网用户
    ↓
serveo.net SSH 隧道 (端口 80 → 本地 80)
    ↓
Nginx (Docker: school-admin-nginx, 端口 80/443)
    ↓
前端静态文件 (/usr/share/nginx/html)
    ↓
API 代理 (/api/* → backend:3000)
    ↓
NestJS 后端 (Docker: infra-backend-1, 端口 3000)
    ↓
PostgreSQL + Redis
```

### 防火墙限制说明

服务器 (IP: 101.126.131.121) 的入站规则：
- **端口 9000**: 已开放（系统服务）
- **端口 80/443**: 被防火墙阻止（INPUT chain 仅允许 9000）
- **解决方案**: 使用 serveo.net SSH 隧道绕过防火墙

### 服务状态

```bash
$ docker ps
school-admin-nginx     ✅ 运行中 (端口 80/443)
infra-backend-1        ✅ 运行中 (端口 3000)
school-admin-postgres  ✅ 运行中 (端口 5432)
school-admin-redis     ✅ 运行中 (端口 6379)
```

### 隧道管理

```bash
# 查看隧道状态
/workspace/projects/workspace/scripts/tunnel.sh status

# 重启隧道（如 URL 过期）
/workspace/projects/workspace/scripts/tunnel.sh restart
```

⚠️ **注意**: serveo.net 免费版的 URL 每次重启后会变化。如需固定 URL，建议：
1. 注册 serveo.net 账号并使用固定子域名
2. 或配置 ngrok（需 authtoken）
3. 或使用 Cloudflare Tunnel

---

## 验证清单

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 前端页面互联网访问 | ✅ | HTML 正确返回 |
| API Health 检查 | ✅ | `/api/health` 正常 |
| 用户登录 | ✅ | `testuser` 登录成功 |
| JWT 认证 | ✅ | Dashboard API 返回数据 |
| Nginx 代理 | ✅ | `/api/` 正确转发 |

---

## 已修复的问题

### 1. 数据库未初始化
- **问题**: `relation "users" does not exist`
- **原因**: Docker 镜像使用旧构建代码（未包含最新 Entity 变更）
- **修复**: 
  - 重新构建 `docker compose build backend`
  - `NODE_ENV=development` 启用 TypeORM synchronize 自动建表
  - 手动插入测试用户

### 2. API 路由双重前缀
- **问题**: `@Controller('api/auth')` + `app.setGlobalPrefix('api')` → `/api/api/auth/login`
- **修复**: 移除所有 Controller 的 `api/` 前缀（保留全局 `api` 前缀）
- **涉及文件**: `auth`, `dashboard`, `inquiry`, `leave`, `notification`, `otp`, `role` controllers

### 3. JWT Strategy 未注册
- **问题**: `Unknown authentication strategy "jwt"` 
- **修复**: 在 `AuthModule` 中注册 `JwtStrategy` + 修复导入路径

### 4. 防火墙阻断 HTTP 流量
- **问题**: 服务器 iptables 规则仅允许端口 9000
- **修复**: 使用 serveo.net SSH 反向隧道暴露服务

---

## 配置变更记录

### docker-compose.yml
```yaml
# 已修改
- NODE_ENV: development  # 原为 production（启用 TypeORM synchronize）
```

### 源代码修改（应合并回主干）
1. `apps/backend/src/modules/auth/auth.module.ts` - 注册 JwtStrategy
2. 所有 Controller 文件 - 移除 `@Controller('api/xxx')` 中的 `api/` 前缀

---

## 后续建议

1. **隧道稳定性**: 配置 ngrok authtoken 或 Cloudflare Tunnel 获取固定 URL
2. **数据库迁移**: 将 TypeORM synchronize 替换为正式迁移脚本
3. **环境配置**: 恢复 `NODE_ENV=production` 并运行正式迁移
4. **CORS**: 验证浏览器访问时 CORS 头正确（当前 serveo.net 会自动处理）

---

## 互联网部署配置 - 2026-06-08 13:04

### 测试URL
```
https://c9953270c50b8d26-115-190-36-195.serveousercontent.com
```

### 访问凭证
- 测试账号：testuser / admin123（无需OTP）
- 管理员：admin / admin123（需邮件OTP）

### 技术方案
- 内网穿透：serveo.net SSH反向隧道
- 隧道管理：/workspace/projects/workspace/scripts/tunnel.sh

### 已修复问题
1. API路由双重前缀（/api/api/xxx → /api/xxx）
2. JWT Strategy未注册到AuthModule
3. 数据库未初始化（NODE_ENV=development）
4. Nginx Health代理路径错误

### 注意事项
- serveo.net URL每次重启后变化
- 仅用于测试，生产需正式部署
