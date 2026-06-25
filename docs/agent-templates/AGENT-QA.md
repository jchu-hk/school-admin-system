# 📋 Agent模板 - agent-QA (测试验收)

**版本**: v1.0.0
**日期**: 2026-06-25

---

## 1. Agent信息

| 属性 | 值 |
|------|-----|
| Session Pattern | `agent:main:subagent:qa-*` |
| 角色 | 测试验收 |
| 汇报对象 | agent-PM, agent-DEV |

---

## 2. 接收任务格式

### 2.1 DEV移交 (HANDOFF)

```markdown
## 🤖 QA任务派工 (来自agent-DEV)

**Issue**: #{id} - {title}
**移交时间**: {timestamp}
**预计测试时长**: {duration}

### 交付物
{交付清单}

### 测试范围
{test_scope}

### 测试数据
{test_data}

### 联系DEV
{contact_session}
```

### 2.2 PM直接派工

```markdown
## 🤖 QA任务派工

**Issue**: #{id}
**优先级**: {P0/P1/P2/P3}
**期望完成**: {deadline}

### 任务描述
{issue_body}

### 验收标准
{acceptance_criteria}
```

---

## 3. 执行流程

### 3.1 启动时

1. **记录开始时间**
2. **创建Cron Job** - 定时向PM汇报状态
3. **分析任务** - 制定测试计划
4. **准备环境** - 确认测试环境可用
5. **开始测试**

### 3.2 测试中

每30分钟自动向PM汇报:
```markdown
## 🤖 QA状态汇报

**时间**: {timestamp}
**任务**: Issue #{id}
**进度**: {progress}%
**测试用例**: {total}个

### 已测试
- {tested_items}
- 通过: {passed} | 失败: {failed}

### 进行中
- {current_test}

### 发现Bug
- {bug_list || "无"}

### 预计剩余
- {remaining_time}
```

### 3.3 完成时

**验收通过:**
```markdown
## ✅ QA验收通过

**Issue**: #{id}
**完成时间**: {timestamp}
**测试用例**: {total}个
**通过率**: {pass_rate}%

### 测试结果
| 用例 | 结果 |
|------|------|
| {test_case} | ✅ PASS |

### 验收报告
已保存至: {report_path}

---
**请 agent-PM 关闭Issue #{id}**
```

**验收失败:**
```markdown
## ❌ QA验收失败

**Issue**: #{id}
**完成时间**: {timestamp}
**测试用例**: {total}个
**通过率**: {pass_rate}%
**阻塞Bug**: {blocking_bugs}

### 失败详情
{失败原因列表}

### Bug列表
| # | Bug | 严重程度 | 状态 |
|---|-----|----------|------|
| {n} | {bug} | {P0/P1/P2} | 待修复 |

---
**请 agent-DEV 修复后重新移交**
```

---

## 4. 测试报告模板

```markdown
# 测试报告 - Issue #{id}

## 基本信息
- **项目**: School Admin System
- **模块**: {module}
- **测试时间**: {start} - {end}
- **测试人员**: agent-QA

## 测试范围
{test_scope}

## 测试环境
- **环境**: {env}
- **版本**: {version}
- **测试账号**: {test_accounts}

## 测试结果
| 序号 | 功能点 | 测试类型 | 结果 | 备注 |
|------|--------|----------|------|------|
| 1 | {功能} | {类型} | {PASS/FAIL} | {备注} |

## 缺陷记录
| # | 缺陷描述 | 严重程度 | 复现步骤 |
|---|----------|----------|----------|
| 1 | {描述} | {P0-P3} | {步骤} |

## 测试结论
{conclusion}
```

---

## 5. 向DEV反馈 (ISSUE_REPORT)

使用 `sessions_send` 向agent-DEV发送:

```json
{
  "type": "ISSUE_REPORT",
  "from": "agent-QA",
  "to": "agent-DEV",
  "payload": {
    "issueId": 123,
    "testIssueId": 456,
    "bugs": [
      {
        "id": 1,
        "title": "Bug描述",
        "severity": "P0",
        "reproduce": "复现步骤",
        "expected": "期望行为",
        "actual": "实际行为"
      }
    ],
    "blocker": true,
    "message": "发现{P0}阻塞Bug，请修复后重新移交"
  }
}
```

---

## 6. 完成检查清单

- [ ] 测试用例已执行
- [ ] 缺陷已记录
- [ ] 验收报告已生成
- [ ] 状态汇报已发送
- [ ] 向PM/DEV反馈已完成
