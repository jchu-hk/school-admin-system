# 📅 每日集成流程规范

**版本**: v1.0
**更新**: 2026-06-19
**执行时间**: 每天 19:00

---

## 1. 概述

每日集成是确保代码质量和快速迭代的关键流程。每天19:00自动执行以下操作：

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 收集Commits | 汇总当天所有提交 |
| 2 | TypeScript检查 | 确保编译通过 |
| 3 | 构建Docker镜像 | 后端 + 前端 |
| 4 | 部署测试环境 | 云端 + Docker |
| 5 | 生成报告 | 综合状态报告 |
| 6 | 提交文档 | 更新状态 |

---

## 2. 自动化脚本

### 脚本位置
```bash
/workspace/projects/workspace/scripts/daily-integrate.sh
```

### 执行方式

**方式1: Cron定时执行**
```bash
# 编辑crontab
crontab -e

# 添加以下行 (每天19:00执行)
0 19 * * * /workspace/projects/workspace/scripts/daily-integrate.sh >> /workspace/projects/workspace/logs/cron.log 2>&1
```

**方式2: 手动执行**
```bash
cd /workspace/projects/workspace
./scripts/daily-integrate.sh
```

**方式3: PM自主触发**
```
PM可随时说: "执行每日集成"
```

---

## 3. 脚本功能

### 3.1 收集Commits
```bash
git log --since="$(date +%Y-%m-%d) 00:00" --oneline
```
- 收集当天所有commits
- 统计数量
- 生成变更列表

### 3.2 TypeScript编译检查
```bash
npx tsc -p apps/backend/tsconfig.build.json
```
- 确保后端代码无编译错误
- 检查DTO、Service、Entity类型一致性

### 3.3 Docker镜像构建

**后端**:
```bash
docker build -f apps/backend/Dockerfile -t school-admin-backend:latest .
```

**前端**:
```bash
cd school-admin-frontend
npm run build
docker cp dist/. school-admin-frontend:/usr/share/nginx/html/
```

### 3.4 测试环境部署

| 组件 | 部署方式 | 验证 |
|------|----------|------|
| 后端 | Docker | `curl http://localhost:3000/api/health` |
| 前端 | nginx | Cloudflare Tunnel |
| 数据库 | 现有容器 | 自动 |

### 3.5 综合报告

报告包含：
- 当天Commits列表
- 每个模块的开发状态
- QA验收状态
- CHECKER审查状态
- Bug修复记录
- 测试环境状态

---

## 4. 报告模板

```markdown
# 📊 每日集成报告 - YYYY-MM-DD

**生成时间**: HH:MM
**版本**: vX.Y.Z

---

## 📋 今日Commits

| Commit | 作者 | 描述 |
|--------|------|------|
| `abc123` | Agent | 功能描述 |

---

## 📊 模块状态

| 模块 | DEV | QA | CHECKER | 状态 |
|------|-----|-----|---------|------|
| 用户管理 | ✅ | ✅ | ✅ | 完成 |
| ... | | | | |

---

## 🌐 测试环境

- **URL**: https://sculpture-vat-million-freeze.trycloudflare.com
- **后端**: 运行中 ✅
- **前端**: 已部署 ✅

---

## 🐛 Bug修复

| # | 描述 | 状态 |
|---|------|------|
| #XX | 描述 | ✅ |

---

*此报告由每日集成脚本自动生成*
```

---

## 5. 交付物检查清单

### 5.1 代码交付
- [ ] 所有commits已推送
- [ ] TypeScript编译通过
- [ ] Docker镜像已构建
- [ ] 测试环境已更新

### 5.2 文档交付
- [ ] HEARTBEAT.md已更新
- [ ] 每日报告已生成
- [ ] GitHub已同步

### 5.3 通知
- [ ] 飞书通知已发送（如配置）
- [ ] PM收到完成报告

---

## 6. 角色职责

### PM
- 监控集成执行
- 处理异常情况
- 审批重大发布

### DEVOPS
- 维护CI/CD流水线
- 监控Docker镜像
- 确保云端可用

### CHECKER
- 审查新增代码
- 验证集成结果
- 签署发布

### QA
- 验收测试
- 更新测试状态
- 报告Bug

---

## 7. 异常处理

### 编译失败
```
1. 停止集成
2. 通知相关开发者
3. 修复后重新执行
```

### 部署失败
```
1. 检查Docker状态
2. 查看错误日志
3. 重试部署
```

### 测试环境不可用
```
1. 检查云端状态
2. 重启Cloudflare Tunnel
3. 通知PM
```

---

## 8. 相关文档

- `docs/pm/PROJECT-DASHBOARD.md` - 项目全景看板
- `docs/pm/DAILY-REPORT-YYYYMMDD.md` - 每日报告
- `HEARTBEAT.md` - 状态跟踪

---

## 9. 版本历史

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| v1.0 | 2026-06-19 | 初始版本 |
