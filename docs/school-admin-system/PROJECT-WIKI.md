# 智慧校园管理系统 - 项目Wiki

> 静态常查阅资料集成页 | **版本**: v1.5.x | **最后更新**: 2026-06-25

---

## 🔗 核心链接

| 资源 | 链接 |
|------|------|
| 📦 Releases | [github.com/.../releases](https://github.com/jchu-hk/school-admin-system/releases) |
| 🐛 Issues | [github.com/.../issues](https://github.com/jchu-hk/school-admin-system/issues) |
| 📖 API文档 | Swagger UI (测试环境) |
| 📋 PM流程 | [PM-WORKFLOW.md](./PM-WORKFLOW.md) |

---

## 🧪 测试环境

**当前环境**: https://hockey-deviant-brooks-litigation.trycloudflare.com

> ⚠️ 环境变更请更新此链接

### 监控Dashboard
| 资源 | URL | 说明 |
|------|-----|------|
| Grafana | https://school-admin-monitor.trycloudflare.com (待配置) | 系统监控、性能指标 |
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

## 🚀 PM工作队列

| Issue | 描述 | 状态 | 下一步 |
|-------|------|------|--------|
| #138 | 成绩管理QA验收 | ✅ 已完成 | - |
| #42 | 学生成绩管理 | ✅ 已完成 | - |
| #39 | 用户管理开发 | ✅ 准备就绪 | 立即启动 |
| #143 | P0: teacher_id列 | ✅ 已修复 | - |
| #144 | P0: 外键约束 | ✅ 已修复 | - |

*此页面在版本发布或重大变更时更新*
