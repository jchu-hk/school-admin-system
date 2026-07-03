# Agent Communication Skill

Record and track communication between agents with automatic Dashboard updates.

## Overview

This Skill provides a unified messaging system for Multi-Agent workflows:
- Agents call this Skill when they send messages to each other
- **Agent status is delivered together with the message** (via `--status` parameter)
- Messages are logged to `agent-messages.json`
- Dashboard is automatically updated after each message

## ⚠️ Important: Agent Status = Message + Status

The `--status` parameter delivers the agent's state to the Dashboard **at the same time** as the message:

| When | Use | Dashboard Effect |
|------|-----|------------------|
| PM spawns Agent | `--status running` | Agent shows 🟢 running |
| Agent accepts task | (no status) | Message logged only |
| Agent completes | `--status idle` | Agent shows ⚪ idle |

**Example: PM spawns DEVOPS**
```bash
# This delivers BOTH:
# 1. Message: "PM → DEVOPS: 分配任务"
# 2. Status: DEVOPS becomes "running"
python3 skills/agent-communication/scripts/write_message.py \
  --from PM \
  --to DEVOPS \
  --message "配置 Cloudflare Named Tunnel" \
  --type assign \
  --status running
```

## Usage

### Record a message

```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from PM \
  --to DEVOPS \
  --message "检查 tunnel 状态" \
  --type assign \
  --status running
```

### Parameters

| Parameter | Required | Options | Description |
|-----------|----------|---------|-------------|
| `--from` | ✅ | PM/DEV/QA/DEVOPS/CHECKER/ARCH/REQ | Sender agent |
| `--to` | ✅ | Same as above | Receiver agent |
| `--message` | ✅ | Any text | Message content |
| `--type` | ❌ | assign/received/done/failed/passed/info | Message type |
| `--status` | ❌ | running/idle/done/failed | **Agent state (delivers to Dashboard)** |

## Message Types

| Type | Use Case |
|------|----------|
| `assign` | PM assigns task to agent |
| `received` | Agent acknowledges task |
| `done` | Agent completes task |
| `failed` | Agent reports failure |

## Agent Status Values

| Status | Dashboard | Use When |
|--------|-----------|----------|
| `running` | 🟢 Green | Agent starts working |
| `idle` | ⚪ Gray | Agent finishes/completes |
| `done` | ✅ Green | Task completed successfully |
| `failed` | 🔴 Red | Task failed |

## Workflow

```
1. PM spawns Agent
   → write_message --from PM --to DEVOPS --status running
   → Dashboard: DEVOPS shows "running" ✅

2. Agent receives task
   → write_message --from DEVOPS --to PM --type received
   → Message logged, no status change

3. Agent completes task
   → write_message --from DEVOPS --to PM --type done --status idle
   → Dashboard: DEVOPS shows "idle" ✅
```

## Example: Complete Agent Workflow

### PM spawns DEVOPS for tunnel setup

```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to DEVOPS \
  --message "配置 Cloudflare Named Tunnel" \
  --type assign --status running
```

**Result in Dashboard:**
```
🟢 DEVOPS: running - 配置 Cloudflare Named Tunnel
```

### DEVOPS reports progress

```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from DEVOPS --to PM \
  --message "已创建 Named Tunnel，等待 DNS 传播" \
  --type info
```

### DEVOPS completes task

```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from DEVOPS --to PM \
  --message "Named Tunnel 配置完成" \
  --type done --status idle
```

**Result in Dashboard:**
```
⚪ DEVOPS: idle - Named Tunnel 配置完成
```

## Dashboard

Dashboard URL: https://jchu-hk.github.io/school-admin-system/multi-agent-dashboard.html

The Dashboard shows:
- Real-time agent status (from `--status` parameter)
- Message stream (from all agent communications)
- Last updated timestamp

## Files

| File | Location | Description |
|------|----------|-------------|
| `write_message.py` | `scripts/` | Main script |
| `agent-messages.json` | `agents/project-admin/logs/` | Message log |

## Benefits

1. **Zero Token** - Pure Python script, no LLM calls
2. **Real-time** - Dashboard updates immediately
3. **Status + Message** - Both delivered together
4. **Traceable** - Full communication history

## Related Skills

- `multi-agent-dashboard` - Visualizes agent messages and status
- `github-status` - Updates GitHub Issues
- `healthcheck` - Environment monitoring

## Version

- v1.0.0 (2026-06-29): Initial release
- v1.1.0 (2026-06-29): Added explicit status delivery documentation
- v1.2.0 (2026-07-03): Added standard task prompt template for subagents

---

## 🏷️ Standard Task Prompt Template (必须嵌入每个 Spawn)

**每个 subagent 的 task 必须包含以下三个步骤，PM 在 spawn 时必须嵌入：**

```markdown
## 你的任务
[具体任务描述]

---

## ⚠️ 必须遵守的通信规则

### 任务开始时
完成以下步骤后再开始工作：

```bash
# 1. 记录任务接收
python3 skills/agent-communication/scripts/write_message.py \
  --from QA --to PM \
  --message "[Issue #XXX] 开始验收: [具体测试内容]" \
  --type received
```

### 任务完成时
报告结果：

```bash
# 成功完成
python3 skills/agent-communication/scripts/write_message.py \
  --from QA --to PM \
  --message "[Issue #XXX] 验收通过: [测试结果摘要]" \
  --type passed --status idle

# 或：失败/阻塞
python3 skills/agent-communication/scripts/write_message.py \
  --from QA --to PM \
  --message "[Issue #XXX] 验收失败: [失败原因]" \
  --type failed --status idle
```

**禁止**：
- ❌ 不写 received 消息就开始工作
- ❌ 工作完成后不写 passed/failed 消息
- ❌ 不调用 write_message 直接结束
```

### 使用方法

PM 在调用 `sessions_spawn` 时，把上述模板嵌入 task 的最前面。例如：

```python
sessions_spawn(
  runtime="subagent",
  task="""
## ⚠️ 必须遵守的通信规则（先读这里！）
[write_message 模板内容]

## 你的任务
[实际任务描述]
"""
)
```

### 为什么需要模板？

- Subagent **不会自动**调用 write_message
- Subagent **不会主动**读 SKILL.md
- **Task prompt 是唯一的约束来源**
- 没有模板 = 没有消息 = Dashboard 空白 = PM 失去可见性

### 验证

Spawn 后检查 agent-messages.json，确认 subagent 已写入 received 消息。