# Mac本地测试环境安装指南

**目标**: 在Mac本地搭建完整的测试环境，用于测试已完成的模块

---

## 1. 前置要求

### Mac系统要求
- macOS 12.0 (Monterey) 或更高版本
- 至少 8GB RAM (推荐 16GB)
- 至少 20GB 可用磁盘空间

### 必需软件

| 软件 | 版本 | 检查命令 | 安装方式 |
|------|------|----------|----------|
| Homebrew | 最新 | `brew --version` | 官网安装脚本 |
| Node.js | >= 22.0 | `node --version` | `brew install node@22` |
| pnpm | >= 9.0 | `pnpm --version` | `npm install -g pnpm@9.15.4` |
| Docker | >= 24.0 | `docker --version` | 官网下载Docker Desktop |
| Git | 最新 | `git --version` | `brew install git` |

---

## 2. 安装步骤

### 步骤1: 安装Homebrew (如未安装)

打开终端，执行：
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

添加到PATH（Intel Mac）：
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### 步骤2: 安装Node.js 22

```bash
brew install node@22

# 验证安装
node --version  # 应显示 v22.x.x
npm --version
```

### 步骤3: 安装pnpm

```bash
npm install -g pnpm@9.15.4

# 验证安装
pnpm --version  # 应显示 9.15.4
```

### 步骤4: 安装Docker Desktop

1. 下载Docker Desktop for Mac: https://www.docker.com/products/docker-desktop
2. 安装并启动Docker Desktop
3. 验证安装：
```bash
docker --version  # 应显示 Docker version 24.x.x
docker-compose --version  # 应显示 Docker Compose version v2.x.x
```

### 步骤5: 克隆项目仓库

```bash
# 替换为你的仓库地址
git clone https://github.com/jchu-hk/school-admin-system.git
cd school-admin-system

# 确保在main分支
git checkout main
```

### 步骤6: 安装项目依赖

```bash
# 使用pnpm安装所有依赖
pnpm install
```

---

## 3. 启动基础设施服务

### 步骤7: 启动Docker服务

```bash
# 启动所有基础设施 (PostgreSQL, Redis, Kafka, Prometheus, Grafana)
pnpm infra:up

# 查看服务状态
docker ps

# 查看服务日志
pnpm infra:logs
```

**启动的服务**:

| 服务 | 端口 | 默认账号密码 |
|------|------|-------------|
| PostgreSQL | 5432 | school_admin / school_admin123 |
| Redis | 6379 | 无需密码 |
| Kafka | 9092 | - |
| Prometheus | 9091 | - |
| Grafana | 3001 | admin / admin123 |

**预期输出**:
```
✅ PostgreSQL 16 已启动
✅ Redis 7 已启动
✅ Kafka 已启动
✅ Prometheus 已启动
✅ Grafana 已启动
```

### 步骤8: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件 (使用你喜欢的编辑器)
nano .env
# 或
open -a TextEdit .env
```

**必须修改的配置**:
```bash
# 数据库密码 (修改为强密码)
DB_PASSWORD=your_secure_password_here

# JWT密钥 (修改为长随机字符串)
JWT_SECRET=change-this-to-a-long-random-secret-in-production

# 测试环境可使用mock通知
NOTIFICATION_CHANNEL=mock
```

### 步骤9: 数据库初始化

```bash
# 执行数据库迁移
pnpm migrate:dev
```

**预期输出**:
```
✅ 创建数据库成功
✅ 执行迁移脚本 0001_initial_schema.sql
✅ 执行迁移脚本 0002_initial_data.sql
✅ 插入初始数据完成
```

---

## 4. 启动应用服务

### 步骤10: 启动后端服务

**方式1: 仅后端**
```bash
pnpm dev:backend
```

**方式2: 前后端同时启动**
```bash
pnpm dev
```

**验证后端启动**:
- 访问 http://localhost:3000
- 应看到: `Welcome to School Admin System API`
- 访问API文档: http://localhost:3000/api-docs

**预期输出**:
```
[Nest] info Starting Nest application...
[Nest] info AppModule dependencies initialized +19ms
[Nest] info Server is running on http://[::]:3000
```

### 步骤11: 启动前端服务 (如需测试UI)

**新终端窗口**:
```bash
cd school-admin-system
pnpm dev:frontend
```

**验证前端启动**:
- 访问 http://localhost:5173
- 应看到登录页面

**预期输出**:
```
  VITE v5.x.x  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
```

---

## 5. 验证安装

### 验证清单

```bash
# 1. 检查Docker容器
docker ps | grep -E "postgres|redis|kafka|prometheus|grafana"

# 2. 测试数据库连接
psql -h localhost -U school_admin -d school_admin -c "SELECT version();"

# 3. 测试后端API
curl http://localhost:3000/health

# 4. 测试API文档访问
open http://localhost:3000/api-docs
```

**所有检查应显示✅**

---

## 6. 测试已完成的模块

### 已完成模块清单

| 模块 | 功能 | Issue | API路径 |
|------|------|-------|---------|
| attendance | 学生出勤管理 | #30 | `/api/v1/attendance/*` |
| leave | 教师请假管理 | #31 | `/api/v1/leave/*` |
| inquiry | 家长查询管理 | #32 | `/api/v1/inquiry/*` |
| lunch | 午膳管理 | #36 | `/api/v1/lunch/*` |
| bus | 校车管理 | - | `/api/v1/bus/*` |
| tuition | 学费管理 | #33 | `/api/v1/tuition/*` |
| fee | 费用/奖学金 | #34/#35 | `/api/v1/fee/*` |
| user | 用户管理 | #39/#40 | `/api/v1/users/*` |
| ai | AI智能建议 | #52 | `/api/v1/ai/*` |

### 测试步骤

**1. 获取认证Token**
```bash
# 注册管理员用户
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@test.com",
    "password": "Admin123!",
    "role": "admin"
  }'

# 登录获取Token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }'

# 保存返回的 accessToken
```

**2. 测试学生出勤模块**
```bash
# 创建出勤记录
curl -X POST http://localhost:3000/api/v1/attendance \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "classId": "CLS001",
    "date": "2026-06-15",
    "status": "present"
  }'

# 查询出勤记录
curl -X GET "http://localhost:3000/api/v1/attendance?date=2026-06-15" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**3. 测试教师请假模块**
```bash
# 创建请假申请
curl -X POST http://localhost:3000/api/v1/leave \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "teacherId": "TCH001",
    "startDate": "2026-06-16",
    "endDate": "2026-06-16",
    "reason": "personal"
  }'

# 查询请假记录
curl -X GET "http://localhost:3000/api/v1/leave?teacherId=TCH001" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**4. 测试家长查询模块**
```bash
# 创建查询记录
curl -X POST http://localhost:3000/api/v1/inquiry \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "张家长",
    "phone": "12345678",
    "subject": "成绩查询",
    "content": "我想查询孩子最近的成绩"
  }'

# 查询记录
curl -X GET "http://localhost:3000/api/v1/inquiry?status=pending" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**5. 测试AI智能建议模块**
```bash
# 获取AI建议
curl -X GET "http://localhost:3000/api/v1/ai/suggestions/student/STU001/analysis" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 获取仪表板摘要
curl -X GET "http://localhost:3000/api/v1/ai/suggestions/dashboard-summary" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 7. 常见问题排查

### 问题1: Docker Desktop启动失败

**症状**: Docker图标不出现或无法启动

**解决方案**:
```bash
# 重置Docker Desktop
# 打开Docker Desktop
# 菜单 -> Troubleshoot -> Clean / Purge data
# 重启Docker Desktop
```

### 问题2: 端口被占用

**症状**: `Error: listen EADDRINUSE: address already in use`

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :3000    # 后端
lsof -i :5432    # PostgreSQL
lsof -i :6379    # Redis
lsof -i :5173    # 前端

# 杀死进程
kill -9 <PID>
```

### 问题3: 数据库连接失败

**症状**: `Connection refused` 或 `ECONNREFUSED`

**解决方案**:
```bash
# 检查PostgreSQL容器状态
docker ps | grep postgres

# 查看PostgreSQL日志
docker logs school-admin-postgres-1

# 重启PostgreSQL容器
docker restart school-admin-postgres-1

# 检查.env配置
cat .env | grep DB_
```

### 问题4: pnpm install失败

**症状**: `npm ERR! network` 或超时

**解决方案**:
```bash
# 清除缓存
pnpm store prune

# 使用国内镜像源
pnpm config set registry https://registry.npmmirror.com

# 重新安装
pnpm install
```

### 问题5: 迁移失败

**症状**: `Error: database "school_admin" does not exist`

**解决方案**:
```bash
# 手动创建数据库
docker exec -it school-admin-postgres-1 psql -U school_admin -c "CREATE DATABASE school_admin;"

# 重新执行迁移
pnpm migrate:dev
```

---

## 8. 清理环境

### 停止所有服务
```bash
# 停止Docker服务
pnpm infra:down

# 或直接docker-compose down
cd infra
docker-compose down -v
```

### 清理数据
```bash
# 清理所有数据 (包括数据库)
cd infra
docker-compose down -v

# 删除node_modules
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# 重新安装依赖
pnpm install
```

---

## 9. 快速命令参考

```bash
# 启动所有服务
pnpm infra:up && pnpm dev

# 仅启动后端
pnpm dev:backend

# 查看日志
pnpm infra:logs

# 重启数据库
docker restart school-admin-postgres-1

# 重启所有服务
pnpm infra:down && pnpm infra:up

# 运行测试
pnpm test

# Lint检查
pnpm lint
```

---

## 10. 下一步

安装完成后，您可以：

1. ✅ 测试已完成的模块 (见第6节)
2. ✅ 访问API文档: http://localhost:3000/api-docs
3. ✅ 访问Grafana监控: http://localhost:3001 (admin/admin123)
4. ✅ 查看Prometheus: http://localhost:9091

---

**文档更新时间**: 2026-06-15
**适用系统**: macOS 12.0+