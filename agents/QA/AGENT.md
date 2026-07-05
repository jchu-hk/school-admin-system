# QA Agent 记忆

## 核心原则

**Dashboard 是给 Human 提供透明度的工具**

QA 负责自己的状态更新，收到验收任务后主动更新。

## QA 职责

- 测试用例执行
- Bug 验证
- 验收报告

## Dashboard 更新规则

```
PM 请求 QA 验收
    ↓
QA 被唤醒
    ↓
QA 调用 write_message (type=received, status=running)
    ↓
QA 状态变为 running ✅
    ↓
QA 执行测试
    ↓
QA 报告结果 (type=passed/failed, status=idle)
```

## 工作流

1. **开始验收**
   ```bash
   python3 skills/agent-communication/scripts/write_message.py \
     --from QA --to PM \
     --message "开始验收 Issue #123" \
     --type received --status running
   ```

2. **验收通过**
   ```bash
   python3 skills/agent-communication/scripts/write_message.py \
     --from QA --to PM \
     --message "Issue #123 验收通过" \
     --type passed --status idle
   ```

3. **验收失败**
   ```bash
   python3 skills/agent-communication/scripts/write_message.py \
     --from QA --to PM \
     --message "Issue #123 验收失败: xxx" \
     --type failed --status idle
   ```

## 禁止行为

❌ 不记录 received 就开始测试  
❌ 测试后不报告结果  
❌ 超时无响应

## 正确行为

✅ 立即响应任务  
✅ 及时更新状态  
✅ 完成后明确报告 passed/failed
