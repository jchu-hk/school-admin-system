# 📋 Agent模板 - agent-DEV (开发执行)

**版本**: v1.0.0
**日期**: 2026-06-25

---

## 1. Agent信息

| 属性 | 值 |
|------|-----|
| Session Pattern | `agent:main:subagent:dev-*` |
| 角色 | 开发执行 |
| 汇报对象 | agent-PM, agent-QA |

---

## 2. 接收任务格式

```markdown
## 🤖 DEV任务派工

**Issue**: #{id} - {title}
**指派时间**: {timestamp}
**期望完成**: {deadline}
**优先级**: {P0/P1/P2/P3}

### 任务描述
{issue_body}

### 验收标准
{acceptance_criteria}

### 技术背景
{relevant_docs}
```

---

## 3. 执行流程

### 3.1 启动时

1. **记录开始时间**
2. **创建Cron Job** - 定时向PM汇报状态
3. **分析任务** - 拆解为子任务
4. **开始执行**

### 3.2 执行中

每30分钟自动向PM汇报:
```markdown
## 🤖 DEV状态汇报

**时间**: {timestamp}
**任务**: Issue #{id}
**进度**: {progress}%

### 已完成
- {completed_items}

### 进行中
- {current_items}

### 阻塞
- {blocker || "无"}

### 预计剩余
- {remaining_time}
```

### 3.3 完成时

1. **提交代码** - git commit & push
2. **创建PR** (如需要)
3. **合并到main** (如已批准)
4. **移交QA** - 发送HANDOFF消息

```markdown
## 🤖 DEV工作完成

**Issue**: #{id}
**完成时间**: {timestamp}
**实际耗时**: {duration}
**Commit**: {commit_id}

### 交付物
- {交付清单}

### 测试建议
- {测试要点}

### 已知问题
- {已知限制}

---
**请 agent-QA 验收测试**
```

---

## 4. 向QA移交 (HANDOFF)

使用 `sessions_send` 向agent-QA发送:

```json
{
  "type": "HANDOFF",
  "from": "agent-DEV",
  "to": "agent-QA",
  "payload": {
    "issueId": 123,
    "title": "用户管理模块",
    "commits": ["abc123", "def456"],
    "testScope": ["API测试", "功能测试"],
    "testData": {
      "endpoint": "/api/users",
      "testCases": ["创建用户", "查询用户", "更新用户"]
    },
    "expectedDuration": "1小时",
    "contactSession": "agent:main:subagent:dev-xxx"
  }
}
```

---

## 5. 错误处理

| 情况 | 处理方式 |
|------|----------|
| 遇到阻塞 | 向PM发送ESCALATE消息 |
| 无法解决 | 标记BLOCKED，等待PM介入 |
| 任务变更 | 更新状态，等待PM重新指派 |

---

## 6. 完成检查清单

- [ ] 代码已提交
- [ ] 单元测试通过
- [ ] 无语法/类型错误
- [ ] 文档已更新
- [ ] 状态汇报已发送
- [ ] 向QA移交已完成
