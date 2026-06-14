# GitHub项目管理平台使用规范

**创建**: 2026-06-14
**目的**: 以GitHub为唯一项目管理平台

---

## 1. GitHub作为唯一真相来源

### 为什么用GitHub？

| 优势 | 说明 |
|------|------|
| 统一入口 | 所有工作、代码、文档在一个平台 |
| 自动化 | CI/CD、Actions自动触发 |
| 追踪完整 | 每次提交、每个PR都有记录 |
| 协作方便 | 团队成员、Agent都能访问 |
| 权限管理 | 细粒度权限控制 |

---

## 2. Issue管理

### Issue类型模板

#### Bug报告
```markdown
---
name: Bug报告
about: 报告系统缺陷
title: '[Bug] '
labels: bug, 
---

## Bug描述
[清晰描述问题]

## 复现步骤
1. 
2. 
3. 

## 预期行为
[应该怎样]

## 实际行为
[实际怎样]

## 环境信息
- 浏览器: 
- 系统: 
- 版本: 

## 截图/日志
[如果有]

## 严重性
- [ ] P0: 核心功能不可用
- [ ] P1: 重要功能受影响
- [ ] P2: 一般问题
- [ ] P3: 优化建议
```

#### 功能请求
```markdown
---
name: 功能请求
about: 提出新功能需求
title: '[Feature] '
labels: enhancement, 
---

## 概述
[简要描述功能]

## 用户故事
作为 [用户类型]，我希望 [功能]，以便 [价值]。

## 接受标准 (AC)
- [ ] 
- [ ] 

## 设计稿/参考
[如果有]

## 优先级
- [ ] P0
- [ ] P1
- [ ] P2
- [ ] P3

## 依赖项
- [ ] 
```

#### 任务
```markdown
---
name: 任务
about: 一般工作项
title: '[Task] '
labels: task, 
---

## 任务描述
[需要做什么]

## 执行步骤
1. 
2. 

## 完成标准
[怎样算完成]

## 预估工时
X小时
```

---

## 3. Labels标签体系

### 类型标签
```yaml
bug:          缺陷报告
enhancement:  功能增强
task:         任务
documentation: 文档
```

### 优先级标签
```yaml
p0:  P0-阻塞核心流程（4小时内处理）
p1:  P1-影响重要功能（1天内处理）
p2:  P2-一般需求（3天内处理）
p3:  P3-优化建议（按迭代）
```

### 模块标签
```yaml
mod-daily:    日常事务模块
mod-cycl:     周期性事务
mod-fin:      财务模块
mod-user:     用户权限模块
mod-ai:       AI功能模块
mod-int:      集成模块
mod-ops:      运维模块
```

### 角色标签
```yaml
pm:           PM角色任务
req:          需求分析
arch:         架构设计
backend:      后端开发
frontend:     前端开发
qa:           测试
review:       代码审查
devops:       运维部署
ops:          生产维护
```

### 状态标签
```yaml
in-progress:  进行中
blocked:      阻塞
needs-review: 需要审查
testing:      测试中
done:         已完成
wont-fix:     不会修复
```

---

## 4. Project Board工作流

### 列定义

| 列名 | 含义 | 自动规则 |
|------|------|----------|
| 📥 Backlog | 待处理 | 新Issue自动进入 |
| 🔨 Ready | 准备开始 | 需求/设计完成 |
| 🚧 In Progress | 开发中 | PR创建时移动 |
| 🧪 Testing | 测试中 | 合并到main后 |
| ✅ Done | 已完成 | Issue关闭时 |
| ❌ Blocked | 阻塞 | 添加blocked标签时 |

### Issue生命周期

```
创建Issue → 分配标签 → 放入Backlog
    ↓
评审优先级 → 移入Ready
    ↓
DEV接任务 → 移入In Progress → 开发 → PR
    ↓
合并代码 → 移入Testing → QA测试
    ↓
测试通过 → 移入Done → Issue关闭
```

---

## 5. GitHub Actions自动化

### 自动工作流

#### 进度追踪
```yaml
name: Project Status Update
on:
  issues:
    types: [opened, closed, labeled]
  pull_request:
    types: [merged]

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: 更新Issue状态
        run: |
          # 根据标签和状态更新Project
          echo "Issue状态已更新"
```

#### 每日报告
```yaml
name: Daily Standup Report
on:
  schedule:
    - cron: '0 2 * * *'  # 每天02:00 UTC
```

---

## 6. 使用命令

### 创建Issue
```bash
# 创建Bug
gh issue create --title "[Bug] 请假列表加载慢" --body "..." --label bug

# 创建功能
gh issue create --title "[Feature] 添加导出功能" --body "..." --label enhancement

# 带模板
gh issue create --template bug_report.md
```

### 管理Issue
```bash
# 查看我的任务
gh issue list --assignee @me

# 按标签筛选
gh issue list --label p0
gh issue list --label backend

# 按状态筛选
gh issue list --state open
gh issue list --state closed

# 分配
gh issue edit 123 --add-assignee username
```

### 里程碑管理
```bash
# 创建里程碑
gh milestone create "v0.3.0"

# 查看里程碑
gh milestone list

# 将Issue加入里程碑
gh issue edit 123 --milestone "v0.3.0"
```

---

## 7. GitHub Wiki

### Wiki页面结构

```
Home
├── 快速开始
│   ├── 环境搭建
│   ├── 开发规范
│   └── 部署指南
├── 项目规范
│   ├── Issue管理
│   ├── PR流程
│   └── 代码审查
├── 模块文档
│   ├── 日常事务
│   ├── 财务模块
│   └── AI功能
├── 运维手册
│   ├── 备份恢复
│   ├── 监控告警
│   └── 灾难恢复
└── 团队
    ├── 角色职责
    └── 会议记录
```

---

## 8. 报告机制

### 自动生成报告

| 报告 | 触发 | 内容 |
|------|------|------|
| 每日Standup | 定时 (02:00) | Issue进度、阻塞 |
| Sprint总结 | 每周一 | 完成率、遗留 |
| 发布报告 | Tag推送 | 变更内容 |
| 项目健康度 | 每月 | 指标仪表板 |

### 报告模板
```markdown
## 📊 [日期] 项目状态报告

### 完成情况
| 模块 | Issue数 | 完成率 |
|------|---------|--------|

### 进行中
| Issue | 负责人 | 进度 |

### 阻塞项
| Issue | 问题 | 解决方案 |

### 下一步
1. 
2. 
```

---

## 9. 权限与角色

### GitHub权限
```yaml
Owner:       完全控制
Admin:      管理设置、成员
Maintain:   管理Issue、PR
Write:      推送代码
Triage:     管理Issue（不能编辑代码）
Read:       只读
```

### AI团队成员
```yaml
AI Agents:   Write权限（推送代码、创建Issue）
Human PM:   Admin权限
Human Dev:  Maintain权限
Stakeholder: Triage权限（查看、评论）
```

---

## 10. 最佳实践

### Issue命名
```
[类型] 简短描述

示例:
[Bug] 登录按钮点击无反应
[Feature] 添加批量导出功能
[Task] 优化数据库查询性能
```

### PR命名
```
type(scope): 简短描述

示例:
feat(finance): 添加学费管理API
fix(auth): 修复OTP验证问题
docs(readme): 更新快速开始文档
```

### 提交信息
```
<type>(<scope>): <subject>

<body>

<footer>

示例:
fix(permission): resolve undefined userRoles

问题: getMyPendingApprovals方法中userRoles未定义
解决: 使用可选链操作符?.安全访问
```

---

*更新时间: 2026-06-14 10:30*