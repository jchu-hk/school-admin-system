# Agent Communication Skill

Record and track communication between agents with automatic Dashboard updates.

## Overview

This Skill provides a unified messaging system for Multi-Agent workflows:
- Agents call this Skill when they send messages to each other
- Messages are logged to `agent-messages.json`
- Dashboard is automatically updated after each message

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
| `--status` | ❌ | running/idle/done/failed | Agent status |

### Message Types

| Type | Use Case |
|------|----------|
| `assign` | PM assigns task to agent |
| `received` | Agent acknowledges task |
| `done` | Agent completes task |
| `failed` | Agent reports failure |

## Workflow

```
PM spawns Agent
→ PM calls write_message (type=assign, status=running)

Agent receives task
→ Agent calls write_message (type=received)

Agent completes task
→ Agent calls write_message (type=done, status=idle)

Dashboard auto-updates after each message
```

## Dashboard

Dashboard URL: https://jchu-hk.github.io/school-admin-system/multi-agent-dashboard.html

## Version

- v1.0.0 (2026-06-29): Initial release