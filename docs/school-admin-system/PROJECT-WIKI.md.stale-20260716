# 智慧校园管理系统 - 项目Wiki

> **版本**: v2.0.0-draft.1 | **最后更新**: 2026-07-15 08:27 (GMT+8)
> **维护人**: PM Agent | **主仓库**: [jchu-hk/school-admin-system](https://github.com/jchu-hk/school-admin-system)
> ⚠️ 任何内容变更后必须更新顶部时间戳

---

## 🔗 核心链接

| 资源 | 链接 |
|------|------|
| 📦 **Releases** | [github.com/.../releases](https://github.com/jchu-hk/school-admin-system/releases) |
| 🐛 **Issues** | [github.com/.../issues](https://github.com/jchu-hk/school-admin-system/issues) |
| 📖 **API文档** | `http://localhost:3000/api/docs` (仅内网) |
| 📊 **Multi-Agent Dashboard** | [GitHub Pages](https://jchu-hk.github.io/school-admin-system/multi-agent-dashboard.html) |
| 📋 **PM工作流规则** | [MULTI-AGENT-WORKFLOW-RULES.md](../../docs/MULTI-AGENT-WORKFLOW-RULES.md) |

---

## 📚 文档库

### 规格与设计文档

| 文档 | 说明 | 版本 | 最后更新 |
|------|------|------|----------|
| [SPEC-COMPLETE.md](SPEC-COMPLETE.md) | 功能规格说明书 | v1.2.0 | 2026-05-24 |
| [SPEC-UI-PROTO.md](SPEC-UI-PROTO.md) | UI界面原型设计 | v1.4.0-draft.1 | 2026-07-14 |
| [SPEC-SYSTEM-DESIGN.md](SPEC-SYSTEM-DESIGN.md) | 系统架构设计 | v0.4 | 2026-06-25 |
| [API-DESIGN.md](API-DESIGN.md) | API接口设计 | v1.5.0 | 2026-07-13 |
| [DB-SCHEMA.md](DB-SCHEMA.md) | 数据库Schema | v1.5.1 | 2026-07-03 |
| [DATA-DICTIONARY.md](DATA-DICTIONARY.md) | 数据字典 | v1.5.1 | 2026-07-03 |

### 开发与运维文档

| 文档 | 说明 |
|------|------|
| [DEVELOPMENT.md](DEVELOPMENT.md) | 开发指南 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | 部署指南 |
| [OPS.md](OPS.md) | 运维手册 |
| [PM-WORKFLOW.md](PM-WORKFLOW.md) | PM工作流程 |
| [MULTI-AGENT-WORKFLOW-RULES.md](../../docs/MULTI-AGENT-WORKFLOW-RULES.md) | 多Agent协作规则(v2.0) |

### 测试文档

| 文档 | 说明 |
|------|------|
| [test-cases/test-cases-qr-attendance.md](test-cases/test-cases-qr-attendance.md) | QR考勤测试用例 (31个TC, T20) |
| `backend/test/portal.e2e-spec.ts` | 门户E2E测试 (778行, T23) |

---

## 🧪 测试环境

### 🌐 外部访问 (Coze.dev)

| 服务 | URL | 状态 |
|------|-----|------|
| **学校管理系统** | https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/ | ✅ |
| **学校管理系统 API** | https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/api/ | ✅ |
| **新增强UI原型(手机)** | https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/enhancement-ui.html | ✅ v2 |

### 🏠 本地访问

| 服务 | URL | 状态 |
|------|-----|------|
| 后端API | http://localhost:3000/api | ✅ |
| 前端 | http://localhost:8080 | ✅ |
| 健康检查 | http://localhost:3000/api/health | ✅ |
| Swagger UI | http://localhost:3000/api/docs | ✅ (仅内网) |

### 监控Dashboard

| 资源 | URL | 登录 | 状态 |
|------|-----|------|------|
| Grafana | [https://navigator-new-imaging-elections.trycloudflare.com](https://navigator-new-imaging-elections.trycloudflare.com) | `admin` / `admin123` | ✅ |
| Prometheus | http://localhost:9091 (仅内网) | - | ✅ |

### Coze Proxy 配置

详见 [COZE_PROXY_CONFIG.md](../../COZE_PROXY_CONFIG.md)

**路由规则**:
```
/school-admin/            → 前端 (:8080)
/school-admin/api/*       → 后端 (:3000/api/*)
/school-admin/enhancement-ui.html → 手机UI原型
/                         → OpenClaw Gateway (:5001)
```

---

## 👤 测试账号 (2026-07-09 验证)

> ⚠️ **最后更新**: 2026-07-09
> 📍 **唯一信息来源**: 本 PROJECT-WIKI.md

| 角色 | 用户名 | 密码 | OTP | 权限 | 验证状态 |
|------|--------|------|-----|------|---------|
| **系统管理员** | **qa_test** | `Admin123!` | ❌ | **全部功能** | ✅ **推荐** |
| **校务人员** | **staff1** | `Admin123!` | ❌ | 日常管理 | ✅ **可用** |
| 教师 | teacher1 | `Admin123!` | ✅ | 教学管理 | ⚠️ |
| 家长 | parent1 | `Admin123!` | ❌ | 家长门户 | ✅ |
| 学生 | student1 | `Admin123!` | ❌ | 学生门户 | ✅ |

---

## 📦 当前版本

> **Release 页面** (版本号/Git Commit/ChangeLog): [github.com/jchu-hk/school-admin-system/releases](https://github.com/jchu-hk/school-admin-system/releases)

---

## 🚀 跨环境安装指南

### Mac/Linux (Docker)

```bash
# 1. 克隆
git clone https://github.com/jchu-hk/school-admin-system.git
cd school-admin-system

# 2. 拉取镜像
docker pull ghcr.io/jchu-hk/school-admin-system/backend:latest
docker pull ghcr.io/jchu-hk/school-admin-system/frontend:latest

# 3. 启动
docker compose -f infra/docker-compose.local.yml up -d

# 4. 验证
curl http://localhost:3000/api/health
open http://localhost:8080
```

### 环境变量 (可选 `.env` 文件)

```bash
DB_USER=school_admin
DB_PASSWORD=school_admin123
DB_NAME=school_admin
JWT_SECRET=change-me-in-production
OPA_PORT=8181
```

### Docker镜像信息

| 镜像 | 仓库 | 标签 |
|------|------|------|
| 后端 | ghcr.io/jchu-hk/school-admin-system/backend | `latest`, `commit-sha` |
| 前端 | ghcr.io/jchu-hk/school-admin-system/frontend | `latest`, `commit-sha` |

> 自动构建: main分支push时 GitHub Actions 自动构建

---

## 📊 Multi-Agent Dashboard

### 访问地址

| 方式 | URL |
|------|-----|
| **GitHub Pages (推荐)** | https://jchu-hk.github.io/school-admin-system/multi-agent-dashboard.html |
| GitHub Raw | https://raw.githubusercontent.com/jchu-hk/school-admin-system/main/multi-agent-dashboard.html |
| GitHub Blob | https://github.com/jchu-hk/school-admin-system/blob/main/multi-agent-dashboard.html |

### 更新方式

```bash
# 自动更新 (推荐)
python3 skills/agent-communication/scripts/write_message.py --from {AGENT} --to PM --message "XXX" --type passed

# 手动刷新
python3 skills/multi-agent-dashboard/scripts/update_dashboard.py --repo jchu-hk/school-admin-system
```

### Agent 角色

| 角色 | 职责 | 状态 |
|------|------|------|
| 🧑‍💼 PM | 调度中枢 | ⏸️ |
| 🤖 DEV | 开发实现 | ⏸️ |
| 🔍 QA | 质量验收 | ⏸️ |
| 🔧 DEVOPS | 运维部署 | ⏸️ |
| ✓ CHECKER | 代码审查 | ⏸️ |
| 🏗️ ARCH | 架构设计 | ⏸️ |
| 📝 REQ | 需求分析 | ⏸️ |

---

> 🔗 Bug修复记录已迁移至 GitHub Issues → [查看全部已关闭Issues](https://github.com/jchu-hk/school-admin-system/issues?q=is%3Aissue+is%3Aclosed)
> 每个Issue包含根因分析、修复方案、验证记录，以Issue comment形式记录

---

## 📊 模块完成度

| 模块 | 完成度 | 状态 | 最后更新 |
|------|--------|------|----------|
| 用户管理 | 100% | ✅ | 2026-07-14 |
| 认证授权 (含RBAC+脱敏) | 100% | ✅ | 2026-07-14 |
| 出勤管理 (含QR考勤) | 100% | ✅ | 2026-07-14 |
| 学费管理 | 100% | ✅ | 2026-07-14 |
| 请假管理 (含学生/家长) | 100% | ✅ | 2026-07-14 |
| 午膳管理 | 100% | ✅ | 2026-07-14 |
| 学生门户 (档案+请假) | 100% | ✅ | 2026-07-14 |
| 家长门户 (只读+代请假) | 100% | ✅ | 2026-07-14 |
| 成绩管理 | 40% | 🔄 | 2026-06-25 |
| i18n国际化 | 100% | ✅ | 2026-07-14 |

---

## 📞 联系方式

| 角色 | 名称 |
|------|------|
| **仓库Owner** | jchu-hk |
| **PM Agent** | 主调度 + Wiki维护 |
| **DEVOPS Agent** | 环境 + 部署 |
| **QA Agent** | 测试账号管理 |
| **仓库地址** | https://github.com/jchu-hk/school-admin-system |

---

*本Wiki由PM Agent定期维护。任何内容变更后必须更新顶部`最后更新`时间戳。*
*更新触发: 文档变更/版本发布/环境变更/模块完成/Bug修复完成时。*
