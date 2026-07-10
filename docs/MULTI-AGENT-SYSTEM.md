# 🏢 多Agent协作系统架构

**版本**: v1.0.0
**日期**: 2026-06-25
**状态**: 已实施

---

## 1. 架构概述

本系统采用多Agent协作模式，实现任务的自动流转和状态同步。

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           agent-PM (调度中枢)                            │
│  • 任务分配    • 状态监控    • 流程协调    • 决策审批    • 汇报用户         │
└─────────────────────────────────────────────────────────────────────────┘
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   agent-DEV     │         │   agent-QA      │         │   agent-REQ     │
│   开发执行       │         │   测试验收      │         │   需求分析      │
└─────────────────┘         └─────────────────┘         └─────────────────┘
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              ┌───────────┐   ┌───────────┐   ┌───────────┐
              │ agent-    │   │ agent-    │   │ agent-    │
              │ DEVOPS    │   │ CHECKER   │   │ ARCH      │
              │ 部署运维   │   │ 代码审查   │   │ 架构设计   │
              └───────────┘   └───────────┘   └───────────┘
                    │
                    ▼
              ┌───────────┐
              │ agent-    │
              │ OPS       │
              │ 系统监控   │
              └───────────┘
```

---

## 2. Agent职责矩阵

| Agent | Session Key | 输入 | 输出 | 汇报对象 |
|-------|-------------|------|------|----------|
| **agent-PM** | `agent:main:main` | 所有Agent状态 | 决策、派工 | 用户 |
| **agent-DEV** | `agent:main:subagent:dev-*` | PM派工 | 代码、PR | PM, QA |
| **agent-QA** | `agent:main:subagent:qa-*` | DEV交付 | 测试报告 | PM, DEV |
| **agent-DEVOPS** | `agent:main:subagent:devops-*` | PR合并 | 部署状态 | PM |
| **agent-CHECKER** | `agent:main:subagent:checker-*` | PR创建 | 审查报告 | DEV, PM |
| **agent-ARCH** | `agent:main:subagent:arch-*` | REQ需求文档 | 技术方案、DB设计、API设计 | PM, DEV |
| **agent-REQ** | `agent:main:subagent:req-*` | 用户需求 | 功能规格、用户故事 | PM, ARCH |
| **agent-OPS** | `agent:main:subagent:ops-*` | 系统监控、告警 | 监控报告、故障报告 | PM |

---

## 3. 工作流转

### 3.1 标准开发流程

```
用户需求
    │
    ▼
agent-REQ ──需求规格──→ agent-PM
                             │
                             ▼
                      ┌──────────────┐
                      │  分配任务     │
                      └──────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │  agent-DEV    │
                      │  (开发执行)    │
                      └──────────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
              agent-CHECKER      agent-DEVOPS
              (Code Review)        (CI/CD)
                    │                 │
                    └────────┬────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │  agent-QA    │
                      │  (验收测试)   │
                      └──────────────┘
                             │
                             ▼
                      agent-PM ──→ 用户汇报
```

### 3.2 Bug修复流程

```
Bug报告 ──→ agent-PM ──→ agent-DEV ──→ agent-QA ──→ agent-PM
                      │                                    │
                      ◄────────── 失败则退回DEV ◄─────────┘
```

---

## 4. 通信协议

### 4.1 消息格式

```json
{
  "protocol": "AGENT_MSG",
  "version": "1.0",
  "from": "agent-DEV",
  "to": "agent-PM",
  "type": "STATUS_UPDATE",
  "payload": {
    "taskId": "#123",
    "issueId": 123,
    "status": "IN_PROGRESS",
    "progress": 50,
    "message": "完成用户模块开发，正在测试",
    "completed": ["功能A", "功能B"],
    "remaining": ["功能C"],
    "blocker": null,
    "timestamp": "2026-06-25T22:00:00+08:00"
  }
}
```

### 4.2 消息类型

| Type | 方向 | 用途 | 触发条件 |
|------|------|------|----------|
| `TASK_ASSIGN` | PM→Agent | 派发任务 | PM主动派工 |
| `STATUS_UPDATE` | Agent→PM | 状态汇报 | 每30分钟/关键节点 |
| `WORK_COMPLETE` | Agent→PM | 工作完成 | 任务完成时 |
| `WORK_FAILED` | Agent→PM | 工作失败 | 遇到阻塞时 |
| `HANDOFF` | DEV→QA | 移交测试 | DEV完成开发 |
| `ISSUE_REPORT` | QA→DEV | Bug报告 | QA发现Bug |
| `ESCALATE` | Agent→PM | 升级决策 | 需要人工介入 |
| `HEARTBEAT` | Agent→PM | 存活心跳 | 每5分钟 |

### 4.3 状态枚举

| Status | 描述 |
|--------|------|
| `PENDING` | 待处理 |
| `IN_PROGRESS` | 进行中 |
| `BLOCKED` | 阻塞 |
| `COMPLETE` | 完成 |
| `CANCELLED` | 取消 |
| `FAILED` | 失败 |

---

## 5. 定时汇报机制

### 5.1 汇报频率

| Agent | 汇报频率 | 触发方式 |
|-------|----------|----------|
| agent-DEV | 每30分钟 | Cron Job |
| agent-QA | 每30分钟 | Cron Job |
| agent-DEVOPS | 每15分钟 | Cron Job |
| agent-OPS | 每5分钟 | Cron Job |

### 5.2 汇报内容

```markdown
## 🤖 {Agent} 状态汇报

**时间**: {timestamp}
**任务**: {taskName}
**Issue**: #{id}

### 进度
- 当前: {progress}%
- 完成项: {completed}
- 剩余项: {remaining}

### 阻塞
- {blocker || "无"}

### 预计
- 剩余时间: {remainingTime}
```

---

## 6. 自动派工规则

| 条件 | 动作 |
|------|------|
| DEV完成开发 | 自动派工QA验收 |
| QA验收失败 | 自动派工DEV修复 |
| PR创建 | 自动派工CHECKER审查 |
| PR合并 | 自动派工DEVOPS部署 |
| 新需求Issue | 自动派工REQ分析 |
| 系统告警 | 自动派工OPS处理 |

---

## 7. Issue生命周期

```
创建 ──→ 指派 ──→ 进行中 ──→ 待Review ──→ 待测试 ──→ 完成
  │         │           │           │           │         │
  ▼         ▼           ▼           ▼           ▼         ▼
REQ分析   DEV/QA      DEV开发     CHECKER     QA测试    关闭
                   ◄─────────────────────────────────────
                              (失败则退回)
```

---

## 8. 验收标准

### 8.1 DEV交付标准

- [ ] 代码提交到main分支
- [ ] 单元测试通过
- [ ] CI/CD通过
- [ ] 无P0/P1阻塞Bug
- [ ] 文档已同步

### 8.2 QA验收标准

- [ ] 功能测试通过
- [ ] 回归测试通过
- [ ] 无P0/P1缺陷
- [ ] 验收报告已生成

### 8.3 自动化检查

- [ ] Cron Job正常运行
- [ ] 状态汇报及时
- [ ] Issue自动更新
- [ ] 派工自动触发

---

## 9. 监控指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 平均交付周期 | < 24小时 | - |
| 自动化覆盖率 | > 80% | - |
| 派工响应时间 | < 5分钟 | - |
| 状态更新及时率 | > 95% | - |

---

## 10. 升级路径

### Level 1: 核心三角 (已实施)
- agent-PM
- agent-DEV
- agent-QA

### Level 2: 扩展角色 (下一步)
- agent-DEVOPS
- agent-CHECKER

### Level 3: 高级角色
- agent-REQ
- agent-ARCH
- agent-OPS
