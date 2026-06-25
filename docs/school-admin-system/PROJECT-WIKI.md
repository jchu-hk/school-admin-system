# 智慧校园管理系统 - 项目Wiki

> 📌 **最后更新**: 2026-06-25 09:01

---

## 🔗 快速链接

| 资源 | 链接 |
|------|------|
| 📦 最新版本 | [v1.5.x Releases](https://github.com/jchu-hk/school-admin-system/releases) |
| 🐛 问题跟踪 | [Issues](https://github.com/jchu-hk/school-admin-system/issues) |
| 📖 API文档 | [Swagger UI](http://localhost:3000/api/docs) |
| 📊 数据库设计 | [DB-SCHEMA.md](./DB-SCHEMA.md) |
| 🏗️ 架构设计 | [SPEC-SYSTEM-DESIGN.md](./SPEC-SYSTEM-DESIGN.md) |
| ✅ 功能规格 | [SPEC-COMPLETE.md](./SPEC-COMPLETE.md) |
| 📋 PM工作流程 | [PM-WORKFLOW.md](./PM-WORKFLOW.md) |

---

## 🎯 当前版本

**v1.5.x** (开发中)

| 项目 | 内容 |
|------|------|
| 版本号 | v1.5.x |
| 状态 | 🟡 开发中 |
| 最新Commit | `0712ea2` |

### 本周更新 (2026-06-25)
| Issue | 描述 | 状态 |
|-------|------|------|
| #136 | About页面空白修复 | ✅ 已合并 |
| #134 | 学生编辑保存修复 | ✅ 已合并 |
| #135 | 班级筛选器修复 | ✅ 已合并 |

### 本周完成 (2026-06-24)
| Issue | 描述 | 状态 |
|-------|------|------|
| #132 | OPS系统维护文档 | ✅ 完成 |
| #133 | 自动化回归测试框架 | ✅ 完成 |

### 完整更新日志
👉 [查看所有版本](https://github.com/jchu-hk/school-admin-system/releases)

---

## 🧪 测试环境

### 当前可用环境

| 环境 | URL | 状态 | 最后验证 |
|------|-----|------|----------|
| **测试环境** | https://hockey-deviant-brooks-litigation.trycloudflare.com | ✅ 正常 | 2026-06-25 |

### 环境状态
| 组件 | 状态 | 备注 |
|------|------|------|
| 前端 | ✅ 正常 | |
| 后端API | ✅ 正常 | |
| PostgreSQL | ✅ 正常 | |
| Redis | ✅ 正常 | |
| Prometheus | ✅ 正常 | |
| Grafana | ✅ 正常 | |
| Kafka | 🔄 启动中 | |

---

## 👤 测试账号

| 角色 | 用户名 | 密码 | OTP |
|------|--------|------|-----|
| 系统管理员 | admin | Admin123! | ✅ 需要 |
| 校务人员 | staff1 | Admin123! | ❌ |
| 教师 | teacher1 | Admin123! | ✅ 需要 |
| 家长 | parent1 | Admin123! | ❌ |
| 学生 | student1 | Admin123! | ❌ |

---

## 📊 项目状态

### 缺陷统计 (本周)

| 状态 | 数量 | 说明 |
|------|------|------|
| 🔴 新增Open | 0 | |
| ✅ 已关闭 | 6 | #134, #135, #136, #132, #133 |
| 🟡 进行中 | 1 | 成绩管理 (#42) |

### Open Issues

| # | 描述 | 优先级 | 模块 |
|---|------|--------|------|
| #42 | 学生成绩管理 | P2 | mod-new |
| #43-46 | 考试/课程/文档管理 | P2 | mod-new |
| #54-56 | AI功能 | P3 | mod-ai |
| #47-48 | 学校信息/通讯录 | P2 | mod-cycl |

### 最近修复

| Issue | 描述 | 日期 | 验证状态 |
|-------|------|------|----------|
| #136 | About页面空白 | 2026-06-25 | ⚠️ 待QA验证 |
| #134 | 学生编辑保存 | 2026-06-25 | ⚠️ 待QA验证 |
| #135 | 班级筛选器 | 2026-06-25 | ⚠️ 待QA验证 |

---

## 📚 文档库

| 文档 | 说明 | 最后更新 |
|------|------|----------|
| [PM-WORKFLOW.md](./PM-WORKFLOW.md) | PM工作流程规范 | 2026-06-25 |
| [PROJECT-WIKI.md](./PROJECT-WIKI.md) | 项目Wiki | 2026-06-25 |
| [SPEC-COMPLETE.md](./SPEC-COMPLETE.md) | 功能规格 | v1.2.0 |
| [DB-SCHEMA.md](./DB-SCHEMA.md) | 数据库Schema | v1.5.1 |
| [OPS.md](./OPS.md) | 运维手册 | 2026-06-24 |

---

## 🔧 开发指南

### 本地开发
```bash
git clone https://github.com/jchu-hk/school-admin-system.git
cd school-admin-system
docker-compose -f infra/docker-compose.yml up -d
```

### 测试命令
```bash
pnpm test          # 单元测试
pnpm test:e2e     # E2E测试
```

---

*此页面由PM Agent持续维护*
