# Parent-Child Agent Coordination

## 核心原则

**Parent agent负责追踪child的完成，超时后主动处理。**

```
Parent spawns child
    ↓
Parent calls sessions_yield (等待completion event)
    ↓
┌─────────────────────────────────────────┐
│ 收到completion event?                   │
│   ↓ Yes                                │
│   → 处理child结果                       │
│   → 更新dashboard                      │
└─────────────────────────────────────────┘
         ↓ No (超时)
┌─────────────────────────────────────────┐
│ 1. 检查subagent状态                     │
│ 2. 更新dashboard: "terminated"         │
│ 3. 决定下一步:                          │
│    - 重新派发?                          │
│    - 手动处理?                          │
│    - 检查进度?                          │
└─────────────────────────────────────────┘
```

## 实现

### 1. Spawn时记录
```python
# Parent调用
child_session = sessions_spawn(
    task="验收Issue #155",
    timeout_seconds=600,  # 10分钟
    expected_agent="QA"
)

# 记录到文件
spawn_log = {
    "child_session": child_session,
    "parent_agent": "PM",
    "expected_agent": "QA",
    "task": "验收Issue #155",
    "spawn_time": now(),
    "timeout_seconds": 600,
    "status": "waiting"
}
```

### 2. 等待completion event
```python
# Parent调用sessions_yield
sessions_yield(timeout=600)  # 等10分钟

# 收到event → 处理结果
# 没收到 → 超时处理
```

### 3. 超时处理
```python
# 检查subagent状态
subagents = subagents(action="list")

if subagent_still_running:
    # Child还活着，只是慢
    → 更新dashboard: "QA执行中，预计X分钟"
    → 延长等待时间
    
else:
    # Child已终止/失败
    → 更新dashboard: "QA terminated unexpectedly"
    → 更新QA队列: failed
    → 决定下一步:
       - 重新派发?
       - 手动处理?
       - 检查进度?
```

## Dashboard状态

| 状态 | 含义 |
|------|------|
| `running` | Agent工作中 |
| `waiting` | Parent等待completion |
| `terminated` | 超时终止，需处理 |
| `idle` | 任务完成 |

## PM超时处理决策

```
超时检测
    ↓
┌─────────────────┬─────────────────┐
│ 任务紧急?       │ 任务可拆分?      │
└────────┬────────┴────────┬────────┘
         ↓                  ↓
    ┌─────────┐       ┌─────────┐
    │ 立即重派 │       │ 检查进度 │
    │ 到新Agent│       │ 再决定   │
    └─────────┘       └─────────┘
```

## 代码示例

```python
def spawn_with_timeout(parent, child_task, timeout_seconds=600):
    """Spawn child with timeout tracking"""
    
    # 1. Spawn
    child = sessions_spawn(task=child_task)
    
    # 2. 记录spawn
    record_spawn(parent, child, timeout_seconds)
    
    # 3. 等待 (在下一个turn)
    # sessions_yield() 会等待completion event
    
    return child

def handle_timeout(spawn_record):
    """处理超时"""
    
    # 1. 检查subagent
    active = subagents(action="list")["active"]
    
    if any(s["taskName"] == spawn_record["task"] for s in active):
        # 还活着，延长等待
        return "extended"
    
    # 2. 更新dashboard
    call_skill("--agent", spawn_record["expected_agent"], 
               "--status", "terminated",
               "--task", f"任务超时终止: {spawn_record['task']}")
    
    # 3. 更新QA队列
    mark_qa_failed(spawn_record["task"])
    
    # 4. 通知PM
    notify_pm(f"{spawn_record['expected_agent']} terminated unexpectedly")
    
    return "terminated"
```

## PM心跳检查

PM每5分钟检查所有spawn记录：
```python
def pm_heartbeat():
    spawns = load_spawn_records()
    
    for spawn in spawns:
        if spawn["status"] == "waiting":
            elapsed = now() - spawn["spawn_time"]
            
            if elapsed > spawn["timeout_seconds"]:
                handle_timeout(spawn)
```

## Workflow集成

```
PM spawns QA
    ↓
sessions_yield(timeout=600)
    ↓
    ┌──────────────────────┐
    │ 收到completion event │
    │ → PM处理结果         │
    │ → 更新dashboard idle  │
    │ → 更新QA队列 passed  │
    └──────────────────────┘
         或超时
    ┌──────────────────────┐
    │ handle_timeout()     │
    │ → 检查subagent       │
    │ → dashboard terminated│
    │ → 决定下一步         │
    └──────────────────────┘
```
