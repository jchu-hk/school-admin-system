# PM Workflow Bug Report

## Date
2026-07-01 09:31

## Problem
Dashboard显示 PM → DEV 消息，但DEV状态为idle，没有启动工作。

## Root Cause
PM在派发任务时，只写了消息到 `agent-messages.json`，但**没有执行 `sessions_spawn` 启动DEV agent**。

## Expected Workflow
```
PM 派发任务
    ↓
1. 写消息: PM → DEV: "任务描述"
    ↓
2. Spawn DEV: sessions_spawn(..., agent="DEV", task="...")
    ↓
3. DEV 接收: 写消息 DEV → PM: "received"
    ↓
4. DEV 工作: 写心跳 /tmp/agent-heartbeat-DEV.json
    ↓
5. DEV 完成: 写消息 DEV → PM: "done"
    ↓
6. PM 关闭Issue
```

## Actual Workflow (Broken)
```
PM 派发任务
    ↓
1. 写消息: PM → DEV: "任务描述" ✅
    ↓
2. Spawn DEV: ❌ 没有执行
    ↓
3. DEV 接收: ❌ DEV没启动
    ↓
4. DEV 工作: ❌ 没有工作
    ↓
5. DEV 完成: ❌ 没有完成
```

## Evidence
- Dashboard: 显示 PM → DEV 消息 ✅
- DEV Status: idle (等待任务) ❌ 应该是running
- Heartbeat Files: `/tmp/agent-heartbeat-*.json` 不存在 ❌
- Issue Assignee: 无 ❌

## Impact
- 所有PM派发的任务都不会实际执行
- DEV/QA/CHECKER agent永远不会被启动
- Dashboard显示误导信息

## Fix Required
修改 PM workflow，在 `write_message.py` 调用后立即执行：
```python
sessions_spawn(
  agent_id="DEV",  # 或从消息目标推断
  task="Issue #193: 修复课程管理Failed to fetch错误",
  sessionTarget="isolated"
)
```

## Related Files
- `/workspace/projects/workspace/agents/project-admin/AGENT.json` - PM workflow定义
- `/workspace/projects/workspace/skills/agent-communication/scripts/write_message.py` - 消息写入脚本