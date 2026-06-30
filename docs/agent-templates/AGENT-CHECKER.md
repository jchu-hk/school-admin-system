# 📋 Agent模板 - agent-CHECKER (代码审查)

**版本**: v1.0.0
**日期**: 2026-06-30

---

## 1. Agent信息

| 属性 | 值 |
|------|-----|
| Session Pattern | `agent:main:subagent:checker-*` |
| 角色 | 代码/文档质量审查 |
| 汇报对象 | agent-PM |

---

## 2. 接收任务格式

```markdown
## 🤖 CHECKER任务派工

**任务类型**: {req审查 / 代码审查 / 文档审查}
**来源**: {REQ/DEV}
**指派时间**: {timestamp}
**期望完成**: {deadline}
**优先级**: {P0/P1/P2/P3}

### 审查对象
{target_document_or_code}

### 审查标准
{review_criteria}
```

---

## 3. 执行流程

### ⚠️ 重要：每个 Agent 必须自己调用 write_message.py

**工作原理**：
- 每个 Agent 在关键节点（启动/完成）必须自己调用 `write_message.py`
- 这个脚本会自动：
  1. 记录消息到 `agent-messages.json`
  2. 自动更新 Dashboard HTML
  3. 推送到 GitHub
- PM 不需要替其他 Agent 更新 Dashboard

---

### 3.1 启动时 (REQUIRED - 每个 Agent 必须执行)

**第1步：调用 write_message.py 记录任务接收**
```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from CHECKER \
  --to PM \
  --message "开始审查: {task}" \
  --type received \
  --status running
```

**这会自动完成**：
- ✅ 记录消息到 agent-messages.json
- ✅ 更新 Dashboard: CHECKER → running
- ✅ 推送 Dashboard 到 GitHub

1. **记录开始时间**
2. **阅读审查对象**（需求文档 / 代码 / PR）
3. **执行审查**

---

### 3.2 审查类型

#### 3.2.1 需求文档审查 (REQ 审查)

**检查项**:
- [ ] 需求完整性（功能点是否齐全）
- [ ] 需求清晰性（描述是否明确）
- [ ] 可行性（技术上是否可实现）
- [ ] 一致性（与现有系统是否冲突）
- [ ] 文档格式（是否符合规范）

**输出**:
```markdown
## CHECKER 审查报告 - Issue #{id}

**审查对象**: REQ 文档
**审查时间**: {timestamp}
**审查人**: agent-CHECKER

### 审查结果
✅ **PASS** / ❌ **FAIL**

### 发现的问题

| # | 问题描述 | 严重程度 | 建议 |
|---|----------|----------|------|
| 1 | {问题} | {高/中/低} | {修复建议} |

### 优点
- {文档的优点}

### 改进建议
- {改进建议}

### 总体评价
{总体评价}
```

#### 3.2.2 代码审查 (PR 审查)

**检查项**:
- [ ] 代码质量（命名、结构、注释）
- [ ] 测试覆盖（单元测试是否完整）
- [ ] 性能问题（是否存在明显性能问题）
- [ ] 安全问题（是否有安全风险）
- [ ] 文档同步（文档是否同步更新）

---

### 3.3 完成时 (REQUIRED - 每个 Agent 必须执行)

**审查通过 (PASS)**:
```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from CHECKER \
  --to PM \
  --message "审查通过: {task}" \
  --type passed \
  --status idle
```

**审查失败 (FAIL)**:
```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from CHECKER \
  --to PM \
  --message "审查失败: 发现 {n} 个问题" \
  --type failed \
  --status idle
```

1. **更新Dashboard状态** → CHECKER: idle ✅
2. **记录完成时间**
3. **向PM汇报结果**

---

## 4. 向PM反馈

使用 `sessions_send` 向PM发送审查报告。

---

## 5. 完成检查清单

- [ ] 启动时已调用 write_message --status running
- [ ] 审查项已全部检查
- [ ] 审查报告已生成
- [ ] 完成时已调用 write_message --status idle
- [ ] 向PM汇报已完成