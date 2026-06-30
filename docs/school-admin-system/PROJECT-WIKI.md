# 智慧校园管理系统 - 项目Wiki

> 静态常查阅资料集成页 | **版本**: v1.5.5 | **最后更新**: 2026-06-30 11:03 (GMT+8)

---

## 🔗 核心链接

| 资源 | 链接 |
|------|------|
| 📦 Releases | [github.com/.../releases](https://github.com/jchu-hk/school-admin-system/releases) |
| 🐛 Issues | [github.com/.../issues](https://github.com/jchu-hk/school-admin-system/issues) |
| 📖 API文档 | Swagger UI (测试环境) |
| 📋 PM流程 | [PM-WORKFLOW.md](./PM-WORKFLOW.md) |
| 📊 实时看板 | [Multi-Agent Dashboard](../../multi-agent-dashboard.html) |

---

## 📊 Multi-Agent 实时看板

### 🌐 访问地址

**GitHub Pages (推荐，无缓存)**: 
https://jchu-hk.github.io/school-admin-system/multi-agent-dashboard.html

> ℹ️ 需先在 GitHub Settings → Pages 中启用（详见 docs/GITHUB-PAGES-SETUP.md）

**GitHub Blob (仅代码)**:
https://github.com/jchu-hk/school-admin-system/blob/main/multi-agent-dashboard.html

**临时方案 (htmlpreview)**:
https://jchu-hk.github.io/school-admin-system/multi-agent-dashboard.html

**自动更新**: 由Multi-Agent Dashboard Skill驱动

### 🎭 看板功能

- AI团队状态 (PM, DEV, QA, DEVOPS, CHECKER, ARCH, REQ)
- 今日统计 (Open Issues, In Progress, Commits)
- 消息流活动记录 (从GitHub Events自动生成)

### 🔄 更新机制

**双Skill架构**:
1. **github-status Skill**: Agent调用，更新GitHub Issue labels/assignee/close
2. **multi-agent-dashboard Skill**: Dashboard读取GitHub，生成展示

**工作流程**:
```
Agent工作 → github-status Skill → GitHub更新
                              ↓
Dashboard Skill ← 自动读取GitHub Events
```

**Agent调用示例**:
```bash
# DEV开始工作
python skills/github-status/scripts/github_status.py --action start --issue 165 --agent DEV

# DEV完成
python skills/github-status/scripts/github_status.py --action done --issue 165 --agent DEV --comment "修复完成"
```

### 📁 相关Skills

| Skill | 位置 | 功能 |
|-------|------|------|
| **github-status** | `skills/github-status/` | 更新Issue状态 |
| **multi-agent-dashboard** | `skills/multi-agent-dashboard/` | Dashboard生成 |

**更新Dashboard**:
```bash
python skills/multi-agent-dashboard/scripts/update_dashboard.py --repo jchu-hk/school-admin-system
```

---

---

## 🧪 测试环境

> ⚠️ **最后更新**: 2026-06-30 14:10 (GMT+8)
> ⚠️ Cloudflare Quick Tunnel 有间歇性连接问题

| 服务 | 本地URL (本机) | 外部URL | 状态 |
|------|----------------|---------|------|
| **后端API** | http://localhost:3000/api | https://salvation-fellowship-fool-competition.trycloudflare.com/api | ⚠️ Quick Tunnel |
| **前端** | http://localhost:8080 | https://yen-courts-soft-continuous.trycloudflare.com | ⚠️ Quick Tunnel |
| **健康检查** | http://localhost:3000/api/health | https://salvation-fellowship-fool-competition.trycloudflare.com/api/health | ⚠️ Quick Tunnel |

**访问方式说明**:
- **本地访问** (推荐): 直接访问 `http://localhost:8080` 和 `http://localhost:3000`
- **外部URL**: Cloudflare Quick Tunnels 可能间歇性不可用，如遇 530 错误请使用本地访问

**DNS传播进度**: 通常需要5-10分钟生效
| Grafana | [https://navigator-new-imaging-elections.trycloudflare.com](https://navigator-new-imaging-elections.trycloudflare.com) | ✅ 已配置 |

### 🍎 Mac 本地测试环境 (Docker镜像)

**Docker镜像仓库**: GitHub Container Registry (ghcr.io)

#### 快速启动

```bash
# 1. 克隆代码库
git clone https://github.com/jchu-hk/school-admin-system.git
cd school-admin-system

# 2. 拉取最新Docker镜像
docker pull ghcr.io/jchu-hk/school-admin-system/backend:latest
docker pull ghcr.io/jchu-hk/school-admin-system/frontend:latest

# 3. 启动服务 (使用简化的本地配置)
docker compose -f infra/docker-compose.local.yml up -d

# 4. 查看日志
docker compose -f infra/docker-compose.local.yml logs -f

# 5. 停止服务
docker compose -f infra/docker-compose.local.yml down
```

#### 验证服务

```bash
# 检查后端健康状态
curl http://localhost:3000/api/health

# 检查前端
open http://localhost:8080
```

#### 配置说明

**环境变量** (可选，在项目根目录创建 `.env` 文件):

```bash
# 数据库配置
DB_USER=school_admin
DB_PASSWORD=school_admin123
DB_NAME=school_admin
DB_PORT=5432

# Redis配置
REDIS_PORT=6379

# 后端配置
BACKEND_PORT=3000
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=7d

# 前端配置
FRONTEND_PORT=8080

# OPA配置
OPA_PORT=8181

# 日志级别
LOG_LEVEL=info

# 可选: AI服务配置
COZE_API_KEY=
COZE_BOT_ID=
```

#### Docker镜像信息

| 镜像 | 仓库 | 标签 |
|------|------|------|
| 后端 | ghcr.io/jchu-hk/school-admin-system/backend | latest, commit-sha |
| 前端 | ghcr.io/jchu-hk/school-admin-system/frontend | latest, commit-sha |

**自动构建**: 当代码推送到 `main` 分支时，GitHub Actions会自动构建并推送最新镜像

#### 常见问题

**Q: 镜像拉取失败？**
```bash
# 确保Docker已登录GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

**Q: 端口被占用？**
修改 `.env` 文件中的端口配置，例如:
```bash
BACKEND_PORT=3001
FRONTEND_PORT=8081
```

**Q: 数据库初始化失败？**
```bash
# 停止服务并清理数据卷
docker compose -f infra/docker-compose.local.yml down -v
# 重新启动
docker compose -f infra/docker-compose.local.yml up -d
```

**Q: 查看镜像构建日志？**
访问: https://github.com/jchu-hk/school-admin-system/actions/workflows/docker-build-push.yml


### 系统版本信息

| 组件 | 版本 | Git Commit | 更新时间 |
|------|------|------------|----------|
| 后端 | v1.5.4 | `bb18156` | 2026-06-26 20:15:00 |
| 前端 | v1.5.4 | `bb18156` | 2026-06-26 20:15:00 |
| 数据库 | v1.5.1 | - | 2026-06-26 |

**代码基线**: https://github.com/jchu-hk/school-admin-system/commit/bb18156
**最新Tag**: v1.5.4

### 监控Dashboard

**Grafana 登录信息**: Username=`admin`, Password=`admin123`
| 资源 | URL | 说明 |
|------|-----|------|
| Grafana | [https://navigator-new-imaging-elections.trycloudflare.com](https://navigator-new-imaging-elections.trycloudflare.com) | 系统监控、性能指标 (admin/admin123) | ✅ PostgreSQL + Prometheus数据源 |
| Dashboard 1 | [System Health Overview](/d/system-health-overview/system-health-overview---school-admin) | 数据库状态、表统计、索引使用 |
| Dashboard 2 | [Container Resources](/d/container-resources/container-resources---school-admin) | 容器资源监控 |
| Dashboard 3 | [API Monitoring](/d/api-monitoring/api-monitoring---school-admin) | API性能监控 |
| Prometheus | http://localhost:9091 (仅内网) | 指标数据采集 |
| Swagger UI | http://localhost:3000/api/docs (仅内网) | API文档 |

> ✅ Grafana已配置PostgreSQL和Prometheus数据源，创建了3个监控Dashboard

---

## 👤 测试账号

| 角色 | 用户名 | 密码 | OTP | 权限 |
|------|--------|------|-----|------|
| 系统管理员 | admin | Admin123! | ✅ | 全部功能 |
| 校务人员 | staff1 | Admin123! | ❌ | 日常管理 |
| 教师 | teacher1 | Admin123! | ✅ | 教学管理 |
| 家长 | parent1 | Admin123! | ❌ | 家长门户 |
| 学生 | student1 | Admin123! | ❌ | 学生门户 |

> ✅ **注意**: 2026-06-26 更新 - 所有测试账号密码统一为 `Admin123!`

---

## 📚 文档库

### 规格文档
| 文档 | 说明 | 版本 |
|------|------|------|
| [SPEC-COMPLETE.md](./SPEC-COMPLETE.md) | 功能规格说明书 | v1.2.0 |
| [SPEC-SYSTEM-DESIGN.md](./SPEC-SYSTEM-DESIGN.md) | 系统架构设计 | - |
| [API-DESIGN.md](./API-DESIGN.md) | API设计文档 | - |
| [DB-SCHEMA.md](./DB-SCHEMA.md) | 数据库Schema | v1.5.1 |
| [DATA-DICTIONARY.md](./DATA-DICTIONARY.md) | 数据字典 | v1.5.1 |

### 运维文档
| 文档 | 说明 |
|------|------|
| [OPS.md](./OPS.md) | 运维手册 |

### 开发文档
| 文档 | 说明 |
|------|------|
| [DEVELOPMENT.md](./DEVELOPMENT.md) | 开发指南 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 部署指南 |

---

## 🐛 今日缺陷修复 (2026-06-26)

### P0缺陷 - 全部修复完成 ✅

| # | 缺陷 | 模块 | 状态 | Commit |
|---|------|------|------|--------|
| #153 | 班级筛选器数据不完整 | 学生管理 | ✅ 已关闭 | f059dd7 |
| #154 | 仪表盘学生总数显示0 | 仪表盘 | ✅ 已关闭 | 8d80d04 |
| #155 | 学生编辑无法保存 | 学生管理 | ✅ 已关闭 | 8d80d04 |
| #156 | 用户电话保存后未更新 | 用户管理 | ✅ 已关闭 | 26547bd |
| #157 | 出勤概览无数据显示 | 出勤管理 | ✅ 已关闭 | e9b17da |
| #158 | About页面TypeError | 系统 | ✅ 已关闭 | 0e40ff9 |
| #159 | 请假管理TypeError | 请假管理 | ✅ 已关闭 | f865c5e |
| #160 | 家长查询提交失败 | 家长查询 | ✅ 已关闭 | e9b17da |

**修复效率**: 4.3倍 (并行模式，28分钟完成8个P0缺陷)

---

## 📊 模块完成度

| 模块 | 完成度 | 状态 |
|------|--------|------|
| 用户管理 | 100% | ✅ |
| 认证授权 | 100% | ✅ |
| 出勤管理 | 100% | ✅ |
| 学费管理 | 100% | ✅ |
| 请假管理 | 100% | ✅ |
| 病假AI核验 | 100% | ✅ |
| 午膳管理 | 100% | ✅ |
| i18n国际化 | 100% | ✅ |
| 家长查询队列 | 100% | ✅ |
| 费用管理 | 100% | ✅ |
| 奖学金管理 | 100% | ✅ |
| 成绩管理 | 40% | 🔄 |

---

## 🧪 QA模块测试案例

### 已完成的模块测试

| 模块 | 测试案例文档 | 状态 | 测试日期 |
|------|-------------|------|----------|
| 用户管理 | [user.spec.ts](../../e2e-tests/tests/user.spec.ts) | ✅ 通过 | 2026-06-25 |
| 登录认证 | [login.spec.ts](../../e2e-tests/tests/login.spec.ts) | ✅ 通过 | 2026-06-25 |
| 学生管理 | [student.spec.ts](../../e2e-tests/tests/student.spec.ts) | ✅ 通过 | 2026-06-25 |
| 权限管理 | [permission.spec.ts](../../e2e-tests/tests/permission/permission.spec.ts) | ✅ 通过 | 2026-06-25 |
| 通知系统 | [notification.spec.ts](../../e2e-tests/tests/notification/notification.spec.ts) | ✅ 通过 | 2026-06-25 |
| 请假审批 | [leave-approval.spec.ts](../../e2e-tests/tests/leave/leave-approval.spec.ts) | ✅ 通过 | 2026-06-25 |
| 成绩管理 | [grades-qa-report](./archive/grades-qa-report-20250625.md) | ✅ 通过 | 2026-06-25 |

### 测试报告归档

| 报告 | 路径 | 日期 |
|------|------|------|
| 成绩管理QA报告 | [qa_report/grades-qa-report-20250625.md](../../qa_report/grades-qa-report-20250625.md) | 2026-06-25 |
| 用户管理QA报告 | [qa_report/user_qa_report_20260625.md](../../qa_report/user_qa_report_20260625.md) | 2026-06-25 |

### 运行测试
```bash
# E2E测试
pnpm test:e2e

# 特定模块测试
pnpm --filter @school-admin/e2e-tests test:auth    # 认证测试
pnpm --filter @school-admin/e2e-tests test:leave   # 请假测试
```

---

## 🛠️ 开发指南

### 快速启动
```bash
git clone https://github.com/jchu-hk/school-admin-system.git
cd school-admin-system
docker-compose -f infra/docker-compose.yml up -d
```

### 测试
```bash
pnpm test       # 单元测试
pnpm test:e2e  # E2E测试
```

### 提交规范
```bash
feat:     新功能
fix:      Bug修复
docs:     文档更新
refactor: 重构
test:     测试
chore:    杂项
```

---

## 🚀 进行中的工作 (In Progress)

| Issue | 描述 | 负责人 | 开始时间 | 预计完成 |
|-------|------|--------|----------|----------|
| #152 | 配置Grafana公网访问 | agent-DEVOPS | 2026-06-26 | 2026-06-27 |
| #45 | 成绩发布管理 | agent-ARCH | 2026-06-25 | 2026-06-28 |

> 标注 `in-progress` 标签的Issue会在此列表显示

---

## 📋 近期完成

| Issue | 描述 | 完成时间 | 交付物 |
|-------|------|----------|--------|
| #136-#141 | 关键缺陷修复 | 2026-06-26 07:06 | commit 67e3dd9 |
| #138 | 成绩管理QA验收 | 2026-06-25 | 测试报告 |
| #42 | 学生成绩管理 | 2026-06-25 | PR合并 |

*此页面在版本发布或重大变更时更新*

---

## 🤖 Multi-Agent Dashboard

**实时监控**: AI团队状态、提交记录、消息流

### 访问方式

**推荐 (实时预览)**:
```
https://jchu-hk.github.io/school-admin-system/multi-agent-dashboard.html
```

**GitHub Raw (直接下载)**:
```
https://raw.githubusercontent.com/jchu-hk/school-admin-system/main/multi-agent-dashboard.html
```

**GitHub Blob (查看源码)**:
```
https://github.com/jchu-hk/school-admin-system/blob/main/multi-agent-dashboard.html
```

### 更新频率

每5分钟自动更新 (由Project Admin Agent管理)

### 状态说明

| 状态 | 图标 | 说明 |
|------|------|------|
| 运行中 | 🟢 | Agent正在工作 |
| 空闲 | ⏸️ | Agent未分配任务或已完成 |

### Agent列表

- 🧑‍💼 PM - 调度中枢
- 🤖 DEV - 开发实现
- 🔍 QA - 质量验收
- 🔧 DEVOPS - 运维部署
- ✓ CHECKER - 代码审查
- 🏗️ ARCH - 架构设计
- 📝 REQ - 需求分析

---

## 📞 联系方式

- **仓库**: https://github.com/jchu-hk/school-admin-system
- **Owner**: jchu-hk

---

*此页面在版本发布或重大变更时更新*
