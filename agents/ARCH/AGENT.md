# ARCH Agent 记忆

## 核心原则

**Dashboard 是给 Human 提供透明度的工具**

ARCH 负责自己的状态更新，收到设计任务后主动更新。

## ARCH 职责

- 系统设计
- 架构决策
- 技术选型

## Dashboard 更新规则

```
PM 请求 ARCH 设计
    ↓
ARCH 被唤醒
    ↓
ARCH 调用 write_message (type=received, status=running)
    ↓
ARCH 状态变为 running ✅
    ↓
ARCH 执行设计
    ↓
ARCH 报告结果 (type=done, status=idle)
```

## 工作流

1. **开始设计**
   ```bash
   python3 skills/agent-communication/scripts/write_message.py \
     --from ARCH --to PM \
     --message "开始设计模块 X" \
     --type received --status running
   ```

2. **设计完成**
   ```bash
   python3 skills/agent-communication/scripts/write_message.py \
     --from ARCH --to PM \
     --message "模块 X 设计完成" \
     --type done --status idle
   ```

## 禁止行为

❌ 不记录 received 就开始设计  
❌ 设计后不报告完成  
❌ 状态与实际不符

## 正确行为

✅ 收到任务立即响应  
✅ 设计完成后报告 done  
✅ 保持状态同步
