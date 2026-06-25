# 智慧校园管理系统 - 项目Wiki

> 📌 **最后更新**: 2026-06-25

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

---

## 🎯 当前版本

**v1.5.x** (开发中)

| 项目 | 内容 |
|------|------|
| 版本号 | v1.5.x |
| 状态 | 🟡 开发中 |
| 发布日期 | TBD |

### 更新内容 (v1.5.x)
- [ ] 缺陷修复: About页面空白 (#136)
- [ ] 缺陷修复: 学生管理班级筛选器 (#135)
- [ ] 缺陷修复: 学生编辑保存 (#134)
- [ ] 自动化回归测试框架 (#133)
- [ ] OPS系统维护文档 (#132)

### 完整更新日志
👉 [查看所有版本](https://github.com/jchu-hk/school-admin-system/releases)

---

## 🧪 测试环境

### 当前可用环境

| 环境 | URL | 状态 | 最后验证 |
|------|-----|------|----------|
| **测试环境** | https://hockey-deviant-brooks-litigation.trycloudflare.com | ✅ 正常 | 2026-06-25 |

### 环境配置

| 组件 | 端口 | 状态 |
|------|------|------|
| 前端 | 8080 | ✅ |
| 后端API | 3000 | ✅ |
| PostgreSQL | 5432 | ✅ |
| Redis | 6379 | ✅ |
| Prometheus | 9091 | ✅ |
| Grafana | 3001 | ✅ |

---

## 👤 测试账号

| 角色 | 用户名 | 密码 | OTP | 说明 |
|------|--------|------|-----|------|
| 系统管理员 | admin | Admin123! | ✅ 需要 | 最高权限 |
| 校务人员 | staff1 | Admin123! | ❌ | 日常管理 |
| 教师 | teacher1 | Admin123! | ✅ 需要 | 教学管理 |
| 家长 | parent1 | Admin123! | ❌ | 家长门户 |
| 学生 | student1 | Admin123! | ❌ | 学生门户 |

### 测试数据

| 数据类型 | 数量 | 说明 |
|---------|------|------|
| 班级 | 7个 | 1A, 2A, 中一A/B, 中二A/B, 中三A |
| 用户 | 33个 | 包含各类角色 |
| 今日出勤 | 5条 | present×4, late×1 |

---

## 📊 项目状态

### 缺陷统计

| 状态 | 数量 | 说明 |
|------|------|------|
| 🔴 Open | TBD | 待处理 |
| 🟡 In Progress | TBD | 处理中 |
| ✅ Closed (本周) | 3 | #134, #135, #136 |

### 模块完成度

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
| 成绩管理 | 40% | 🔄 开发中 |

---

## 📚 文档库

### 开发文档
| 文档 | 说明 | 状态 |
|------|------|------|
| [SPEC-COMPLETE.md](./SPEC-COMPLETE.md) | 功能规格说明书 | ✅ |
| [SPEC-SYSTEM-DESIGN.md](./SPEC-SYSTEM-DESIGN.md) | 系统架构设计 | ✅ |
| [API-DESIGN.md](./API-DESIGN.md) | API设计文档 | ✅ |
| [DB-SCHEMA.md](./DB-SCHEMA.md) | 数据库Schema | ✅ |
| [DATA-DICTIONARY.md](./DATA-DICTIONARY.md) | 数据字典 | ✅ |

### 运维文档
| 文档 | 说明 | 状态 |
|------|------|------|
| [OPS.md](./OPS.md) | 运维手册 | ✅ |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 部署指南 | 🔄 待完善 |

### PM文档
| 文档 | 说明 | 状态 |
|------|------|------|
| [PM-WORKFLOW.md](./PM-WORKFLOW.md) | PM工作流程 | ✅ |
| [AGENTS.md](../AGENTS.md) | Agent工作规范 | ✅ |

---

## 🔧 开发指南

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/jchu-hk/school-admin-system.git
cd school-admin-system

# 启动开发环境
docker-compose -f infra/docker-compose.yml up -d

# 运行测试
pnpm test

# 运行E2E测试
pnpm test:e2e
```

### 代码规范

- 遵循 TypeScript 最佳实践
- 所有API需有 Swagger 文档注释
- 提交前运行 lint 检查
- 新功能需有对应测试用例

---

## 📞 联系与支持

- **Owner**: jchu-hk
- **仓库**: https://github.com/jchu-hk/school-admin-system
- **讨论**: https://github.com/jchu-hk/school-admin-system/discussions

---

*此页面由PM Agent自动维护*
