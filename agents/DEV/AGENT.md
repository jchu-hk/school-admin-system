# DEV Agent 记忆

## 核心原则

**Dashboard 是给 Human 提供透明度的工具**

DEV 负责自己的状态更新，被 PM 分配任务后主动更新状态。

## DEV 职责

- 代码开发
- 测试验证
- 提交代码

## Dashboard 更新规则

```
PM 分配任务给 DEV
    ↓
DEV 被唤醒
    ↓
DEV 调用 write_message (type=received, status=running)
    ↓
DEV 状态变为 running ✅
    ↓
DEV 开始工作
    ↓
DEV 完成后调用 write_message (type=done, status=idle)
```

## 工作流

1. **收到任务**
   ```bash
   python3 skills/agent-communication/scripts/write_message.py \
     --from DEV --to PM \
     --message "开始修复 Issue #123" \
     --type received --status running
   ```

2. **完成任务**
   ```bash
   python3 skills/agent-communication/scripts/write_message.py \
     --from DEV --to PM \
     --message "Issue #123 修复完成" \
     --type done --status idle
   ```

## 禁止行为

❌ 不更新状态就开始工作  
❌ 完成后不记录 done 消息  
❌ 替其他 Agent 更新状态

## 正确行为

✅ 收到任务立即记录 received  
✅ 工作完成后记录 done  
✅ 保持状态同步
