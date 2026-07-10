# 🚀 新项目设置流程

**版本**: v1.0.0
**日期**: 2026-07-10
**状态**: 已建立

---

## 1. 概述

本文档描述如何使用AI团队开发新项目，包括：
- GitHub仓库初始化
- 项目文档创建
- AI团队Dashboard配置
- CI/CD环境设置
- 监控和日志系统

---

## 2. 前置条件

在开始之前，确保具备以下条件：

### 2.1 必需工具

| 工具 | 用途 | 验证命令 |
|------|------|----------|
| Git | 版本控制 | `git --version` |
| Node.js 18+ | 前端/后端运行 | `node --version` |
| Docker | 容器化部署 | `docker --version` |
| Docker Compose | 多容器编排 | `docker compose version` |
| GitHub CLI | GitHub操作 | `gh auth status` |
| Python 3.8+ | 脚本执行 | `python3 --version` |

### 2.2 必需账户

| 账户 | 用途 | 备注 |
|------|------|------|
| GitHub | 代码仓库、Actions | 需要创建Personal Access Token |
| Docker Hub / GHCR | 镜像存储 | 可选 |
| Cloudflare | 内网穿透 | 可选 |

---

## 3. 项目初始化阶段

### 3.1 创建GitHub仓库

#### 步骤1：创建远程仓库

```bash
# 使用GitHub CLI创建仓库
gh repo create your-project-name --public --clone

# 或在GitHub网页创建后克隆
git clone https://github.com/your-username/your-project-name.git
cd your-project-name
```

#### 步骤2：初始化项目结构

```bash
# 创建标准目录结构
mkdir -p docs/agent-templates
mkdir -p docs/school-admin-system
mkdir -p skills/agent-communication/scripts
mkdir -p skills/multi-agent-dashboard/scripts
mkdir -p skills/github-status/scripts
mkdir -p memory
mkdir -p infra
mkdir -p scripts
mkdir -p qa_report
mkdir -p e2e-tests/tests

# 创建README
cat > README.md << 'EOF'
# Project Name

## 项目描述

## 技术栈

## 快速开始

## 文档

## 许可证
EOF
```

#### 步骤3：创建.gitignore

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
dist/
build/
.next/
out/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

# Testing
coverage/
.nyc_output/

# Docker
*.tar

# Misc
*.tgz
.cache/
EOF
```

---

## 4. AI团队基础设施设置

### 4.1 创建Multi-Agent Dashboard

#### 步骤1：复制Dashboard模板

```bash
# 从workspace复制Dashboard文件
cp /workspace/projects/workspace/multi-agent-dashboard.html ./

# 复制Dashboard Skill
cp -r /workspace/projects/workspace/skills/multi-agent-dashboard ./skills/
```

#### 步骤2：创建Dashboard数据文件

```bash
# 创建agent-status.json
cat > agent-status.json << 'EOF'
{
  "version": "1.0.0",
  "lastUpdated": "2026-07-10T00:00:00+08:00",
  "agents": {
    "PM": { "status": "idle", "lastActivity": null },
    "DEV": { "status": "idle", "lastActivity": null },
    "QA": { "status": "idle", "lastActivity": null },
    "DEVOPS": { "status": "idle", "lastActivity": null },
    "CHECKER": { "status": "idle", "lastActivity": null },
    "ARCH": { "status": "idle", "lastActivity": null },
    "REQ": { "status": "idle", "lastActivity": null },
    "OPS": { "status": "idle", "lastActivity": null }
  }
}
EOF

# 创建agent-messages.json
cat > agent-messages.json << 'EOF'
{
  "version": "1.0.0",
  "messages": []
}
EOF
```

#### 步骤3：启用GitHub Pages

1. 进入 GitHub仓库 → Settings → Pages
2. Source: 选择 **GitHub Actions**
3. 保存设置

#### 步骤4：推送到GitHub

```bash
git add .
git commit -m "feat: initial project setup with multi-agent dashboard"
git push origin main
```

---

### 4.2 配置Agent Communication Skill

#### 步骤1：复制Communication Skill

```bash
cp -r /workspace/projects/workspace/skills/agent-communication ./skills/
```

#### 步骤2：验证write_message.py

```bash
# 测试脚本是否可用
python3 skills/agent-communication/scripts/write_message.py --help

# 预期输出帮助信息
```

#### 步骤3：配置GitHub Token

```bash
# 创建本地配置
cat > .local-config << 'EOF'
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=your-username
GITHUB_REPO=your-project-name
EOF

# 添加到.gitignore
echo ".local-config" >> .gitignore
```

---

### 4.3 配置GitHub Status Skill

#### 步骤1：复制Skill

```bash
cp -r /workspace/projects/workspace/skills/github-status ./skills/
```

#### 步骤2：创建GitHub Actions Workflow

```bash
mkdir -p .github/workflows
```

创建CI/CD Workflow:

```bash
cat > .github/workflows/ci.yml << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
EOF
```

---

## 5. 项目文档创建

### 5.1 创建核心文档

#### SPEC-COMPLETE.md (功能规格)

```bash
cat > docs/SPEC-COMPLETE.md << 'EOF'
# 功能规格说明书

**版本**: v1.0.0
**日期**: 2026-07-10
**状态**: 草稿

---

## 1. 项目概述

### 1.1 项目背景
[描述项目背景]

### 1.2 项目目标
[描述项目目标]

### 1.3 范围定义
[定义项目范围]

---

## 2. 功能模块

### 2.1 Module 1: [模块名称]

#### 功能列表
| ID | 功能名称 | 优先级 | 状态 |
|----|----------|--------|------|
| F-XXX-001 | 功能描述 | P1 | 待开发 |

---

## 3. 非功能性需求

### 3.1 性能需求
- 响应时间: < 200ms
- 并发用户: 100+

### 3.2 安全需求
- 认证机制
- 权限控制
- 数据加密

### 3.3 可用性需求
- 系统可用性: 99.9%
- 备份策略

---

## 附录

### A. 术语表
### B. 参考资料
EOF
```

#### SPEC-SYSTEM-DESIGN.md (系统设计)

```bash
cat > docs/SPEC-SYSTEM-DESIGN.md << 'EOF'
# 系统架构设计

**版本**: v1.0.0
**日期**: 2026-07-10

---

## 1. 系统架构

### 1.1 架构概览
[系统架构图]

### 1.2 技术栈
| 组件 | 技术 | 版本 |
|------|------|------|
| 前端 | Next.js | 14+ |
| 后端 | NestJS | 10+ |
| 数据库 | PostgreSQL | 15+ |

---

## 2. 模块设计

### 2.1 前端模块
[前端模块设计]

### 2.2 后端模块
[后端模块设计]

### 2.3 数据层
[数据库设计]

---

## 3. 安全设计

### 3.1 认证授权
[JWT/OAuth配置]

### 3.2 数据安全
[加密/脱敏策略]

---

## 4. 部署架构

### 4.1 开发环境
[开发环境配置]

### 4.2 测试环境
[测试环境配置]

### 4.3 生产环境
[生产环境配置]
EOF
```

#### DB-SCHEMA.md (数据库设计)

```bash
cat > docs/DB-SCHEMA.md << 'EOF'
# 数据库Schema设计

**版本**: v1.0.0
**日期**: 2026-07-10

---

## 1. 数据库概述

### 1.1 数据库信息
| 属性 | 值 |
|------|-----|
| 数据库类型 | PostgreSQL |
| 版本 | 15+ |
| 字符集 | UTF-8 |

---

## 2. 表结构

### 2.1 users (用户表)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

---

## 3. 枚举类型

### 3.1 user_role

| 值 | 描述 |
|----|------|
| admin | 管理员 |
| staff | 校务人员 |
| teacher | 教师 |
| parent | 家长 |
| student | 学生 |

---

## 4. 关系图

[ER图描述]

---

## 5. 索引策略

### 5.1 必要索引
- users: username, email, role
- [其他表索引]

### 5.2 复合索引
- [复合索引定义]
EOF
```

#### API-DESIGN.md (API设计)

```bash
cat > docs/API-DESIGN.md << 'EOF'
# API设计文档

**版本**: v1.0.0
**日期**: 2026-07-10

---

## 1. API概述

### 1.1 基础信息
| 属性 | 值 |
|------|-----|
| 基础URL | /api/v1 |
| 认证方式 | Bearer Token |
| 格式 | JSON |

---

## 2. 认证接口

### POST /auth/login

**描述**: 用户登录

**请求**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应** (200):
```json
{
  "accessToken": "string",
  "user": {
    "id": "uuid",
    "username": "string",
    "role": "string"
  }
}
```

**错误响应** (401):
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

## 3. 用户接口

### GET /users

**描述**: 获取用户列表

**查询参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| page | number | 页码 |
| limit | number | 每页数量 |
| role | string | 按角色筛选 |

**响应** (200):
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

## 4. 错误码定义

| HTTP状态码 | 错误码 | 描述 |
|-----------|--------|------|
| 400 | BAD_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未认证 |
| 403 | FORBIDDEN | 无权限 |
| 404 | NOT_FOUND | 资源不存在 |
| 500 | INTERNAL_ERROR | 服务器错误 |
EOF
```

### 5.2 创建PROJECT-WIKI.md

```bash
cat > docs/PROJECT-WIKI.md << 'EOF'
# [项目名称] - 项目Wiki

> **版本**: v1.0.0
> **最后更新**: 2026-07-10

---

## 🔗 核心链接

| 资源 | 链接 |
|------|------|
| 📦 Releases | [GitHub Releases](https://github.com/username/repo/releases) |
| 🐛 Issues | [GitHub Issues](https://github.com/username/repo/issues) |
| 📊 Dashboard | [Multi-Agent Dashboard](./multi-agent-dashboard.html) |

---

## 📦 当前版本

- **版本**: v1.0.0
- **发布日期**: 2026-07-10
- **状态**: 开发中

---

## 🌐 测试环境

| 环境 | URL | 状态 |
|------|-----|------|
| 开发环境 | http://localhost:3000 | 🔄 开发中 |

---

## 👤 测试账号

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 管理员 | admin | Admin123! | 全部功能 |

---

## 📚 文档库

| 文档 | 说明 |
|------|------|
| [SPEC-COMPLETE.md](./SPEC-COMPLETE.md) | 功能规格 |
| [SPEC-SYSTEM-DESIGN.md](./SPEC-SYSTEM-DESIGN.md) | 系统设计 |
| [API-DESIGN.md](./API-DESIGN.md) | API文档 |
| [DB-SCHEMA.md](./DB-SCHEMA.md) | 数据库设计 |

---

## 🤖 AI团队

### Agent列表

| Agent | 角色 | 说明 |
|-------|------|------|
| PM | 项目经理 | 任务调度、协调 |
| DEV | 开发工程师 | 功能实现 |
| QA | 测试工程师 | 质量验收 |
| DEVOPS | 运维工程师 | 部署、CI/CD |
| CHECKER | 代码审查 | 代码质量审查 |
| ARCH | 架构师 | 系统设计 |
| REQ | 需求分析师 | 需求分析 |
| OPS | 运维监控 | 系统监控 |

### Dashboard

**实时看板**: [multi-agent-dashboard.html](./multi-agent-dashboard.html)

---

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/username/repo.git
cd repo

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### Docker部署

```bash
docker compose up -d
```

---

*此页面在版本发布或重大变更时更新*
EOF
```

---

## 6. 容器化部署设置

### 6.1 创建Docker配置

#### 后端Dockerfile

```bash
mkdir -p apps/backend
cat > apps/backend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
EOF
```

#### 前端Nginx配置

```bash
mkdir -p apps/frontend
cat > apps/frontend/Dockerfile << 'EOF'
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

cat > apps/frontend/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        location /api {
            proxy_pass http://backend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF
```

### 6.2 创建docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/schooldb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    depends_on:
      - backend
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=schooldb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
EOF
```

---

## 7. 监控和日志设置

### 7.1 Prometheus配置

```bash
mkdir -p infra/monitoring
cat > infra/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
EOF
```

### 7.2 Grafana配置

```bash
cat > infra/monitoring/grafana.ini << 'EOF'
[server]
http_port = 3001

[database]
type = postgres
host = postgres:5432
name = grafana
user = postgres
password = password

[security]
admin_user = admin
admin_password = admin123
EOF
```

### 7.3 添加监控到docker-compose

```bash
cat >> docker-compose.yml << 'EOF'

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./infra/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9091:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    volumes:
      - ./infra/monitoring/grafana.ini:/etc/grafana/grafana.ini
      - grafana_data:/var/lib/grafana
    ports:
      - "3002:3001"
    depends_on:
      - prometheus
    restart: unless-stopped

volumes:
  grafana_data:
EOF
```

---

## 8. CI/CD自动化

### 8.1 GitHub Actions - 构建和推送镜像

```bash
mkdir -p .github/workflows
cat > .github/workflows/docker.yml << 'EOF'
name: Docker Build & Push

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./apps/backend
          push: true
          tags: ghcr.io/${{ github.repository }}/backend:${{ github.sha }}

      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./apps/frontend
          push: true
          tags: ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}
EOF
```

### 8.2 GitHub Actions - 自动更新Dashboard

```bash
cat > .github/workflows/dashboard.yml << 'EOF'
name: Update Dashboard

on:
  schedule:
    - cron: '*/5 * * * *'  # 每5分钟
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Update Dashboard
        run: |
          python3 skills/multi-agent-dashboard/scripts/update_dashboard.py \
            --repo ${{ github.repository }}

      - name: Commit and push
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add multi-agent-dashboard.html agent-status.json agent-messages.json
          git diff --staged --quiet || git commit -m "chore: update dashboard [skip ci]"
          git push
EOF
```

---

## 9. 项目启动检查清单

### 9.1 GitHub仓库检查

- [ ] 仓库已创建
- [ ] .gitignore已配置
- [ ] README.md已创建
- [ ] GitHub Pages已启用

### 9.2 AI团队基础设施检查

- [ ] multi-agent-dashboard.html已创建
- [ ] agent-status.json已创建
- [ ] agent-messages.json已创建
- [ ] skills/agent-communication已复制
- [ ] skills/multi-agent-dashboard已复制
- [ ] skills/github-status已复制

### 9.3 文档检查

- [ ] docs/SPEC-COMPLETE.md已创建
- [ ] docs/SPEC-SYSTEM-DESIGN.md已创建
- [ ] docs/DB-SCHEMA.md已创建
- [ ] docs/API-DESIGN.md已创建
- [ ] docs/PROJECT-WIKI.md已创建
- [ ] docs/PM-WORKFLOW.md已创建

### 9.4 CI/CD检查

- [ ] GitHub Actions CI workflow已配置
- [ ] Docker构建已配置
- [ ] Dashboard自动更新已配置

### 9.5 监控检查

- [ ] Prometheus已配置
- [ ] Grafana已配置
- [ ] 日志系统已配置

### 9.6 安全检查

- [ ] .env文件已添加到.gitignore
- [ ] Secrets已配置在GitHub
- [ ] 依赖项已审计

---

## 10. 项目初始化脚本

### 10.1 自动化初始化脚本

```bash
cat > scripts/init-project.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 开始初始化新项目..."

# 1. 检查依赖
echo "📋 检查依赖..."
command -v git >/dev/null 2>&1 || { echo "Git未安装"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js未安装"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker未安装"; exit 1; }

# 2. 获取项目信息
read -p "项目名称: " PROJECT_NAME
read -p "GitHub用户名: " GITHUB_USER

# 3. 创建GitHub仓库
echo "📦 创建GitHub仓库..."
gh repo create ${PROJECT_NAME} --public --clone
cd ${PROJECT_NAME}

# 4. 复制模板
echo "📁 复制项目模板..."
git clone https://github.com/jchu-hk/school-admin-system-template.git temp_template 2>/dev/null || true

# 5. 初始化目录结构
mkdir -p docs/{agent-templates,school-admin-system}
mkdir -p skills/{agent-communication,multi-agent-dashboard,github-status}/scripts
mkdir -p memory scripts infra qa_report e2e-tests/tests

# 6. 创建核心文档
echo "📝 创建核心文档..."
# [文档创建命令...]

# 7. 提交和推送
echo "📤 推送到GitHub..."
git add .
git commit -m "feat: initial project setup"
git push origin main

# 8. 启用GitHub Pages
echo "🌐 启用GitHub Pages..."
gh api repos/${GITHUB_USER}/${PROJECT_NAME}/pages -X POST \
  --input-body '{"build_type": "workflow", "source": {"branch": "main"}}'

echo "✅ 项目初始化完成!"
echo ""
echo "📋 下一步:"
echo "1. 配置GitHub Secrets"
echo "2. 启动开发服务器"
echo "3. 访问 Dashboard: https://${GITHUB_USER}.github.io/${PROJECT_NAME}/multi-agent-dashboard.html"
EOF

chmod +x scripts/init-project.sh
```

---

## 11. PM工作流程初始化

### 11.1 创建Agent模板目录

```bash
mkdir -p docs/agent-templates
```

每个Agent模板应包含：

| 文件 | 说明 |
|------|------|
| AGENT-PM.md | PM角色定义 |
| AGENT-DEV.md | 开发角色定义 |
| AGENT-QA.md | 测试角色定义 |
| AGENT-DEVOPS.md | 运维角色定义 |
| AGENT-CHECKER.md | 审查角色定义 |
| AGENT-ARCH.md | 架构角色定义 |
| AGENT-REQ.md | 需求角色定义 |
| AGENT-OPS.md | 监控角色定义 |

### 11.2 创建Cron任务

PM应设置以下定时任务：

| 任务 | 频率 | 说明 |
|------|------|------|
| GitHub Issue巡检 | 每30分钟 | 检查新Issue、未指派Issue |
| Agent状态巡检 | 每15分钟 | 检查Stuck Tasks |
| 每日状态汇报 | 09:00, 18:00 | 向用户汇报 |
| Dashboard更新 | 每5分钟 | GitHub Actions自动 |

---

## 12. 后续步骤

项目初始化完成后，按以下顺序开始开发：

### 阶段1：需求分析 (REQ)
1. 分析用户需求
2. 创建功能规格文档
3. CHECKER审查需求

### 阶段2：系统设计 (ARCH)
1. 设计数据库Schema
2. 设计API接口
3. 设计系统架构
4. CHECKER审查设计

### 阶段3：开发 (DEV)
1. 按模块开发
2. 编写单元测试
3. 提交代码到main

### 阶段4：测试 (QA)
1. 编写测试用例
2. 执行功能测试
3. 生成测试报告

### 阶段5：部署 (DEVOPS)
1. 构建Docker镜像
2. 部署到测试环境
3. 验证部署成功

### 阶段6：监控 (OPS)
1. 配置监控系统
2. 设置告警规则
3. 验证监控数据

---

## 13. 常见问题

### Q1: GitHub Pages不显示Dashboard？

**解决方案**：
1. 检查GitHub Actions是否运行成功
2. 确认Pages source设置为GitHub Actions
3. 检查仓库Settings → Pages → 确认分支为main

### Q2: write_message.py执行失败？

**解决方案**：
1. 检查Python版本 (需要3.8+)
2. 检查skills/agent-communication/scripts/write_message.py是否存在
3. 检查GITHUB_TOKEN是否配置

### Q3: Docker构建失败？

**解决方案**：
1. 检查Dockerfile路径是否正确
2. 检查.dockerignore是否排除不必要文件
3. 检查构建上下文是否正确

### Q4: CI/CD Pipeline失败？

**解决方案**：
1. 检查GitHub Secrets是否配置
2. 检查workflow文件语法
3. 查看Actions日志排查错误

---

## 14. 附录

### A. 相关文档

| 文档 | 说明 |
|------|------|
| PM-WORKFLOW.md | PM工作流程规范 |
| MULTI-AGENT-SYSTEM.md | 多Agent系统架构 |
| AGENTS.md | Agent操作规则 |

### B. 参考资源

- [GitHub Actions文档](https://docs.github.com/en/actions)
- [Docker官方文档](https://docs.docker.com/)
- [Prometheus文档](https://prometheus.io/docs/)
- [Grafana文档](https://grafana.com/docs/)

---

*本文档为新项目设置指南，每次创建新项目时按此流程执行*
