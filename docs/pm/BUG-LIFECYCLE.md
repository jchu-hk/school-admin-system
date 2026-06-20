# Bug生命周期管理规范

**版本**: v1.0
**创建**: 2026-06-20
**作者**: PM

---

## 1. 目的

标准化Bug从发现到关闭的完整生命周期，确保：
- 信息透明，PM/QA/DEV都能追踪状态
- 根因清晰，避免同类问题重复发生
- 责任明确，每个环节有人负责

---

## 2. Bug Issue模板

### 2.1 创建Issue

```markdown
## 问题描述
[清晰描述问题]

## 复现步骤
1. 登录系统
2. 点击xxx
3. 出现xxx错误

## 预期行为
[期望的结果]

## 实际行为
[实际发生的情况]

## 优先级
P0/P1/P2

## 截图/日志
[如有]
```

### 2.2 根因分析

```markdown
## 根因分析

**根本原因**: 
[找出真正的技术原因]

**问题位置**: 
[具体文件、行号、函数]

**代码/配置问题**:
```typescript
// 有问题的代码
xxx
```

**修复方案**:
```typescript
// 修复后的代码
xxx
```
```

### 2.3 状态更新

```markdown
## 当前状态
- [ ] Open
- [x] In Progress (谁在做)
- [ ] Verified (QA确认)
- [x] Closed

## 工作记录
| 时间 | 人 | 操作 |
|------|-----|------|
| 2026-06-20 | DEV | 修复完成 |
| 2026-06-20 | QA | 验证通过 |
```

---

## 3. 角色职责

### PM
- 创建Issue并分配优先级
- 跟踪状态，更新记录
- 协调资源，处理阻塞
- 最终验收，关闭Issue

### DEV
- 接收Issue，分析根因
- 实施修复，提交代码
- 更新Issue，记录修复方案

### QA
- 验证修复是否有效
- 更新测试结果
- 确认Bug真正关闭

### CHECKER
- 审查修复方案
- 确保没有副作用
- 签署Code Review

---

## 4. 状态流转

```
     ┌─────────┐
     │  OPEN   │ ← Bug被发现
     └────┬────┘
          │
          ▼
┌─────────────────┐
│  IN PROGRESS    │ ← DEV开始处理
│  (分配给某人)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌─────────┐
│ FIXED  │  │ WONTFIX │
│        │  │         │ ← 经讨论不修
└───┬────┘  └────┬────┘
    │            │
    ▼            ▼
┌──────────┐  ┌─────────┐
│ VERIFIED │  │ CLOSED  │
│ (QA通过) │  │         │
└────┬─────┘  └─────────┘
     │
     ▼
┌─────────┐
│ CLOSED  │ ← Bug关闭
└─────────┘
```

---

## 5. 标签使用

| 标签 | 说明 | 颜色 |
|------|------|------|
| p0 | 最高优先级，影响核心功能 | 红色 |
| p1 | 高优先级，功能可用性 | 橙色 |
| p2 | 中优先级，体验问题 | 黄色 |
| bug | Bug类型 | 红色 |
| frontend | 前端问题 | 蓝色 |
| backend | 后端问题 | 紫色 |
| verified-fixed | 已验证修复 | 绿色 |
| wontfix | 不修复 | 灰色 |
| need-info | 需要更多信息 | 黄色 |

---

## 6. GitHub Workflow

### 6.1 创建Bug
```bash
gh issue create --title "Bug: xxx" \
  --body "$(cat bug-template.md)" \
  --label "bug,p0"
```

### 6.2 分配
```bash
gh issue edit $ISSUE_NUMBER --assignee "@me"
```

### 6.3 更新状态
```bash
# 添加评论记录根因
gh issue comment $ISSUE_NUMBER --body "$(cat analysis.md)"

# 修复后标记
gh issue add-label $ISSUE_NUMBER "verified-fixed"

# 关闭
gh issue close $ISSUE_NUMBER --comment "已修复并验证"
```

---

## 7. 检查清单

关闭Bug前必须确认：
- [ ] 根因已记录
- [ ] 修复代码已提交
- [ ] QA验证通过
- [ ] 无副作用
- [ ] 相关文档已更新

---

## 8. 拒绝无效Bug

以下情况可标记 `wontfix`:
- 不是Bug，是设计如此
- 无法复现
- 修复成本太高，收益太低
- 已有替代方案

---

## 9. 复发处理

如果已关闭的Bug重新出现：
```bash
# 重新打开Issue
gh issue reopen $ISSUE_NUMBER

# 添加复发记录
gh issue comment $ISSUE_NUMBER --body "Bug复发，原因：xxx"
```

---

## 10. 相关文档

- HEARTBEAT.md - 项目状态跟踪
- PROJECT-DASHBOARD.md - 项目全景
- DAILY-INTEGRATION.md - 每日集成流程

---

**版本历史**

| 版本 | 日期 | 修改 |
|------|------|------|
| v1.0 | 2026-06-20 | 初始版本 |
