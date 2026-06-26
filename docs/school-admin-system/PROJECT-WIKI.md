# 智慧校园管理系统 - 项目Wiki

> 静态常查阅资料集成页 | **版本**: v1.5.4 | **最后更新**: 2026-06-26 20:15:33

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

**GitHub实时更新版**: 
https://github.com/jchu-hk/school-admin-system/blob/main/multi-agent-dashboard.html

**自动更新**: 每5分钟同步一次数据

### 🎭 看板功能

- AI团队状态 (PM, DEV, QA, DEVOPS, CHECKER, ARCH, REQ)
- 今日统计 (缺陷修复, Git提交, 效率提升)
- 系统健康状态
- 消息流活动记录

### 🔄 更新机制

- **自动更新**: PM每5分钟自动同步数据到GitHub
- **手动更新**: 运行 `/tmp/update-dashboard.sh`

---

---

## 🧪 测试环境

| 服务 | URL | 状态 |
|------|-----|------|
| 前端 (用户登录) | https://expanding-contributor-mic-holiday.trycloudflare.com | ✅ |
| 后端API | https://cases-emily-nottingham-seasons.trycloudflare.com | ✅ |
| Grafana | https://dive-earl-basics-reforms.trycloudflare.com | ⚠️ |

> ⚠️ Cloudflare Quick Tunnel不稳定，URL可能变化

### 系统版本信息

| 组件 | 版本 | Git Commit | 更新时间 |
|------|------|------------|----------|
| 后端 | v1.5.4 | `bb18156` | 2026-06-26 20:15:00 |
| 前端 | v1.5.4 | `bb18156` | 2026-06-26 20:15:00 |
| 数据库 | v1.5.1 | - | 2026-06-26 |

**代码基线**: https://github.com/jchu-hk/school-admin-system/commit/bb18156
**最新Tag**: v1.5.4

### 监控Dashboard
| 资源 | URL | 说明 |
|------|-----|------|
| Grafana | https://dive-earl-basics-reforms.trycloudflare.com ⚠️ | 系统监控、性能指标 (530错误待修复) |
| Prometheus | http://localhost:9091 (仅内网) | 指标数据采集 |
| Swagger UI | http://localhost:3000/api/docs (仅内网) | API文档 |

> ⚠️ Grafana需要配置账户密码登录

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

## 📞 联系方式

- **仓库**: https://github.com/jchu-hk/school-admin-system
- **Owner**: jchu-hk

---

**GitHub**: https://github.com/jchu-hk/school-admin-system
**Owner**: jchu-hk

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
