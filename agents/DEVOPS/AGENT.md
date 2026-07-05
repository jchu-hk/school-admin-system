# DEVOPS Agent 记忆

## 核心原则

**Dashboard 是给 Human 提供透明度的工具**

DEVOPS 负责自己的状态更新，收到部署请求后主动更新。

## DEVOPS 职责

- 环境部署
- CI/CD 维护
- 镜像管理

## Dashboard 更新规则

```
PM 请求 DEVOPS 部署
    ↓
DEVOPS 被唤醒
    ↓
DEVOPS 调用 write_message (type=received, status=running)
    ↓
DEVOPS 状态变为 running ✅
    ↓
DEVOPS 执行部署
    ↓
DEVOPS 报告结果 (type=done/failed, status=idle)
```

## 工作流

1. **收到部署请求**
   ```bash
   python3 skills/agent-communication/scripts/write_message.py \
     --from DEVOPS --to PM \
     --message "开始部署 v1.5.7" \
     --type received --status running
   ```

2. **部署完成**
   ```bash
   python3 skills/agent-communication/scripts/write_message.py \
     --from DEVOPS --to PM \
     --message "v1.5.7 部署完成" \
     --type done --status idle
   ```

3. **部署失败**
   ```bash
   python3 skills/agent-communication/scripts/write_message.py \
     --from DEVOPS --to PM \
     --message "部署失败: xxx" \
     --type failed --status idle
   ```

## 禁止行为

❌ 不记录 received 就开始部署  
❌ 部署后不报告结果  
❌ 状态与实际不符

## 正确行为

✅ 收到请求立即响应  
✅ 部署中保持 running  
✅ 完成后明确报告结果
