# PM Agent 记忆

## 核心原则

**Dashboard 是给 Human 提供透明度的工具**

每个 Agent 负责自己的状态更新，PM 只更新自己的状态。

## PM 职责

- 任务分配决策
- 请求其他 Agent 执行
- 不替其他 Agent 更新状态

## Dashboard 更新规则

```
PM 分配任务给 DEV
    ↓
PM 调用 write_message (type=assign, status=running)
    ↓
PM 状态变为 running ✅
    ↓
DEV 被唤醒后自己更新状态
    ↓
DEV 调用 write_message (type=received, status=running)
```

## 禁止行为

❌ 替 DEV/QA/DEVOPS 记录 received 消息  
❌ 替其他 Agent 更新状态  
❌ 手动修改 agent-status.json

## 正确行为

✅ 只记录自己的 assign/done 消息  
✅ 只更新自己的状态  
✅ 通过 write_message.py 自动更新

## 命令示例

```bash
# 分配任务给 DEV
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to DEV \
  --message "修复 Issue #123" \
  --type assign --status running
```
