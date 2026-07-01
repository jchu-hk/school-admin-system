# Agent Dashboard Skill

## 理念

**简单、透明、可自动化**

- Agent调用skill更新状态 → Dashboard自动显示
- 不需要心跳、不需要inference
- 零token成本（纯脚本）

## 核心原则

1. **状态+消息 = Dashboard更新**
   - Agent接收任务 → 调用skill → status: running
   - Agent完成任务 → 调用skill → status: idle
   - 消息自动记录

2. **单一真相来源**
   - `agent-status.json` = Agent状态
   - `agent-messages.json` = 通信记录
   - Dashboard = 基于上面两个文件生成

3. **零token**
   - 都是脚本执行
   - 没有LLM推理

## 使用方法

### Agent接收任务
```bash
python3 skills/agent-dashboard/scripts/agent_status.py \
  --agent QA \
  --status running \
  --task "验收Issue #155"
```

### Agent完成任务
```bash
python3 skills/agent-dashboard/scripts/agent_status.py \
  --agent QA \
  --status idle \
  --task "验收Issue #155完成"
```

### Dashboard自动更新
- 状态更新 → agent-status.json
- 消息追加 → agent-messages.json  
- Dashboard生成 → multi-agent-dashboard.html
- 自动push到GitHub

## Workflow

```
Agent接收任务
    ↓
调用 agent_status.py --status running
    ↓
    ↓  → 更新 agent-status.json
    ↓  → 追加到 agent-messages.json
    ↓  → 重新生成 Dashboard HTML
    ↓  → Push to GitHub
    ↓
Dashboard显示: Agent running ✅

Agent完成任务
    ↓
调用 agent_status.py --status idle
    ↓
    → 更新 agent-status.json
    → 追加到 agent-messages.json
    → 重新生成 Dashboard HTML
    → Push to GitHub

Dashboard显示: Agent idle ✅
```

## 文件结构

```
skills/agent-dashboard/
├── SKILL.md                    # 本文档
└── scripts/
    └── agent_status.py         # 状态更新脚本

agents/project-admin/logs/
├── agent-status.json           # Agent状态
├── agent-messages.json         # 通信记录
└── agent-status-history.json   # 历史记录（可选）

workspace/
└── multi-agent-dashboard.html  # Dashboard（自动生成）
```

## 优势

| 特性 | 传统方案 | Agent Dashboard Skill |
|------|----------|----------------------|
| 状态来源 | 心跳+inference+GitHub | 直接写入 |
| Token成本 | 高（多次LLM调用） | 零 |
| 准确性 | 依赖推断 | 精确 |
| 复杂度 | 高（多层） | 低（单层） |
| 调试 | 困难 | 简单 |

## 集成

所有Agent在任务开始/结束时调用：
```python
# Python
subprocess.run([
    "python3", "skills/agent-dashboard/scripts/agent_status.py",
    "--agent", "QA",
    "--status", "running",
    "--task", "验收Issue #155"
])
```

## PM工作流

```
PM 派发任务
    ↓
DEV 接收 → agent_status.py --agent DEV --status running
    ↓
DEV 完成 → agent_status.py --agent DEV --status idle
    ↓
PM 派发QA → QA 接收 → agent_status.py --agent QA --status running
    ↓
QA 完成 → agent_status.py --agent QA --status idle
    ↓
Dashboard全程可见 ✅
```
