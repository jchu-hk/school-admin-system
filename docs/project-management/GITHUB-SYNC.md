# 🎯 项目管理总览 - GitHub同步

**版本**: v1.0
**更新时间**: 2026-06-10 22:23
**同步方式**: GitHub Issues + KANBAN-BOARD.md + 流程文档

---

## 📊 GitHub作为单一项目管理平台

### 同步规则

| 内容 | GitHub位置 | 同步方式 |
|------|------------|----------|
| 任务状态 | GitHub Issues | 自动同步 |
| 看板 | KANBAN-BOARD.md | 手动更新+推送 |
| 流程 | docs/process/ | 文档管理 |
| 报告 | docs/pm/ | 自动生成 |
| QA报告 | qa_report/ | 完成后提交 |

---

## 🔄 Git同步流程

### 每日工作流

```bash
# 1. 每天开始 - 拉取最新状态
git pull origin main

# 2. 更新自己的任务状态
git add .
git commit -m "[角色] 更新任务状态"
git push origin main

# 3. 完成任务 - 创建PR或直接提交
git checkout -b feature/xxx
# ... 开发工作 ...
git push origin feature/xxx
# 创建PR请求合并
```

---

## 📋 Issue与看板同步规则

### Issue状态 = 真实任务状态

| Issue状态 | 看板位置 | 说明 |
|-----------|----------|------|
| OPEN | Backlog/In Progress | 待处理/进行中 |
| CLOSED | Done | 已完成 |

### 同步命令

```bash
# 查看所有进行中的任务
gh issue list --state open --limit 50

# 查看某个人的任务
gh issue list --assignee "@username" --state open

# 按标签筛选
gh issue list --label "p1,mod-daily" --state open
```

---

## 🎯 GitHub Project管理 (通过Issue实现)

### 角色分配 (通过Label+Title)

| 角色 | 查看命令 |
|------|----------|
| DEV1 | `gh issue list --label "@DEV1"` |
| DEV2 | `gh issue list --label "@DEV2"` |
| DEV3 | `gh issue list --label "@DEV3"` |
| QA1 | `gh issue list --label "@QA1"` |
| QA2 | `gh issue list --label "@QA2"` |
| PM | `gh issue list --label "@PM"` |

### 优先级管理 (通过Label)

| 优先级 | Label | 说明 |
|--------|-------|------|
| P0 | `p0` | 最高优先级 |
| P1 | `p1` | 高优先级 |
| P2 | `p2` | 中优先级 |
| P3 | `p3` | 低优先级 |

### 模块分类 (通过Label)

| 模块 | Label | 说明 |
|------|-------|------|
| 日常管理 | `mod-daily` | 出勤/请假/查询等 |
| 财务管理 | `mod-fin` | 学费/费用/奖学金 |
| 用户管理 | `mod-user` | 用户/权限/角色 |
| 基础架构 | `mod-infra` | 部署/监控/日志 |

---

## 📊 快速查询命令

### PM日常查询

```bash
# 查看所有进行中任务
gh issue list --state open

# 查看超时任务
gh issue list --state open --search "超时"

# 查看今日创建的任务
gh issue list --state open --created 2026-06-10

# 查看某个人的所有任务
gh issue list --assignee "@username"

# 查看P1优先级任务
gh issue list --label "p1" --state open

# 查看特定模块任务
gh issue list --label "mod-daily" --state open
```

### 团队成员查询

```bash
# DEV1 - 查看分配给我的任务
gh issue list --search "DEV1" --state open

# QA - 查看待验收任务
gh issue list --label "testing" --state open

# DEVOPS - 查看待部署任务
gh issue list --search "部署" --state open
```

---

## 🔔 通知机制

### 通过Issue评论通知

| 动作 | 自动通知 |
|------|----------|
| 创建Issue | @提及相关人员 |
| 评论Issue | 自动通知参与者 |
| 关闭Issue | 通知assignee |
| 更新标签 | 触发项目状态变更 |

### 升级机制

| 超时 | 自动行动 |
|------|----------|
| 1小时无响应 | 添加评论提醒 |
| 2小时无响应 | @提及角色 |
| 4小时无响应 | 创建升级Issue |
| 8小时无响应 | PM介入处理 |

---

## 📝 汇报文档同步

### 文档目录结构

```
docs/
├── pm/                          # PM文档
│   ├── PM-FOLLOW-UP-*.md        # 跟进记录
│   ├── PM-COORDINATION-*.md     # 协调记录
│   └── reports/                 # 进度报告
├── process/                     # 流程文档
│   ├── PHASE2-WORKFLOW.md       # 开发流程
│   └── ...
└── ...
```

### 自动同步

```bash
# 所有文档变更通过git同步
git add .
git commit -m "[类型] 描述"
git push origin main
```

---

## ✅ 已建立的Git同步约定

### Commit Message格式

```
[类型] 简短描述

类型:
- feat: 新功能
- fix: 缺陷修复
- docs: 文档更新
- style: 格式调整
- refactor: 重构
- test: 测试相关
- chore: 维护任务
```

### 分支命名约定

```
feature/模块名-功能名     # 功能开发
bugfix/问题编号           # 缺陷修复
hotfix/紧急问题           # 紧急修复
release/版本号           # 发布分支
```

---

## 🎓 团队培训

### GitHub项目管理速成

**查看任务**:
```bash
gh issue list --state open --limit 20
```

**更新状态**:
```bash
# 关闭完成的任务
gh issue close <issue-number>

# 添加评论
gh issue comment <issue-number> --body "状态更新..."

# 更新标签
gh issue edit <issue-number> --add-label "done"
```

**创建任务**:
```bash
gh issue create --title "标题" --body "描述" --label "p1"
```

---

## 📞 GitHub通知设置建议

团队成员应在GitHub设置中开启:

1. **Email Notifications**: 所有提到你的Issue/PR
2. **Participating**: 你参与的Issue评论
3. **Watching**: 你负责的仓库
4. **Slack/Discord集成** (如可用): 实时推送

---

**项目管理完全基于GitHub，KANBAN-BOARD.md作为可视化的状态汇总。**
