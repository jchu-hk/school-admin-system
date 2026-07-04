# Agent Communication Skill

Record and track communication between agents with automatic Dashboard and GitHub Issue updates.

## Overview

This Skill provides a unified messaging system for Multi-Agent workflows:
- **Agent status** → written to `agent-status.json` (Dashboard source of truth)
- **Messages** → logged to `agent-messages.json`
- **GitHub Issue labels** → auto-updated based on message type (no more forgetting `in-progress`)
- **Dashboard** → auto-refreshed after every message

## 🎯 One Command, Three Things Done

When PM spawns an agent, one `write_message` call handles everything:

```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to DEV \
  --message "[Issue #199] 新增学生页面字段未更新" \
  --type assign --status running
```

**Automatically:**
1. ✅ Writes to `agent-messages.json`
2. ✅ Updates `agent-status.json` (DEV → running)
3. ✅ Adds `in-progress` + `dev` labels to GitHub Issue #199
4. ✅ Refreshes the Dashboard HTML

---

## GitHub Issue Label Automation

The script auto-detects Issue numbers (`#NNN`) from the message text and updates labels:

| Message Type | GitHub Labels Added | GitHub Labels Removed |
|---|---|---|
| `assign` | `in-progress`, `dev`/`qa`/etc. | — |
| `passed` / `done` | `ready-for-review` | `in-progress` |
| `failed` | — | `in-progress`, Issue **closed** |

**No need to manually run `gh issue edit --add-label in-progress` anymore.**

---

## Usage

### PM spawns a task (triggers: status + labels + dashboard)

```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from PM --to DEV \
  --message "[Issue #199] 新增学生页面字段未更新" \
  --type assign --status running
```

### DEV acknowledges task (triggers: message log only)

```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from DEV --to PM \
  --message "[Issue #199] 开始修复" \
  --type received
```

### DEV completes (triggers: status + labels + dashboard)

```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from DEV --to PM \
  --message "[Issue #199] 修复完成，提交: abc1234" \
  --type passed --status idle
```

### DEV fails (triggers: status + labels + close + dashboard)

```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from DEV --to PM \
  --message "[Issue #199] 修复失败: 缺少依赖包" \
  --type failed --status idle
```

---

## Parameters

| Parameter | Required | Options | Effect |
|---|---|---|---|
| `--from` | ✅ | PM/DEV/QA/DEVOPS/CHECKER/ARCH/REQ | Sender agent |
| `--to` | ✅ | Any | Receiver agent |
| `--message` | ✅ | Any text | Message content (extracts `#NNN` for label sync) |
| `--type` | ❌ | assign/received/done/failed/passed/info | Triggers GitHub label rules |
| `--status` | ❌ | running/idle | Updates Dashboard agent status |
| `--no-auto-update` | ❌ | flag | Skip Dashboard refresh |
| `--no-github` | ❌ | flag | Skip GitHub label sync |

---

## Message Types

| Type | Use Case | GitHub Effect |
|---|---|---|
| `assign` | PM assigns task | Adds `in-progress` + agent label |
| `received` | Agent acknowledges | None (message only) |
| `passed` | Agent completes successfully | Removes `in-progress`, adds `ready-for-review` |
| `done` | Alias for passed | Same as passed |
| `failed` | Agent hits blocking error | Removes `in-progress`, closes Issue |
| `info` | Progress update | None (message only) |

---

## Agent Status Values

| Status | Dashboard | Use When |
|---|---|---|
| `running` | 🟢 Green | Agent starts working |
| `idle` | ⚪ Gray | Agent finishes / unblocks |

---

## Dashboard

Dashboard URL: https://jchu-hk.github.io/school-admin-system/multi-agent-dashboard.html

---

## Files

| File | Location | Description |
|---|---|---|
| `write_message.py` | `scripts/` | Main script (v1.3) |
| `agent-messages.json` | `agents/project-admin/logs/` | Message log |
| `agent-status.json` | `agents/project-admin/logs/` | Dashboard agent status |
| `update_dashboard.py` | `skills/multi-agent-dashboard/scripts/` | Dashboard HTML updater |

---

## ⚠️ Standard Task Prompt Template (must embed in every spawn)

Every subagent task prompt MUST include this at the start:

```markdown
## ⚠️ 必须遵守的通信规则

### 任务开始时（先执行，再工作！）
```bash
python3 skills/agent-communication/scripts/write_message.py \
  --from DEV --to PM \
  --message "[Issue #XXX] 开始修复: [具体问题]" \
  --type received
```

### 任务完成时
```bash
# 成功
python3 skills/agent-communication/scripts/write_message.py \
  --from DEV --to PM \
  --message "[Issue #XXX] 修复完成: [commit-url]" \
  --type passed --status idle

# 失败/阻塞
python3 skills/agent-communication/scripts/write_message.py \
  --from DEV --to PM \
  --message "[Issue #XXX] 失败: [原因]" \
  --type failed --status idle
```

**禁止：**
- ❌ 不写 received 就开始工作
- ❌ 不写 passed/failed 就退出
- ❌ 不调用 write_message 直接结束 session
```

---

## Changelog

| Version | Date | Change |
|---|---|---|
| v1.3.0 | 2026-07-04 | Auto GitHub Issue label sync: `--type assign` → `in-progress` + agent label, `--type passed` → `ready-for-review`, `--type failed` → close. |
| v1.2.0 | 2026-07-03 | Added standard task prompt template for subagents |
| v1.1.0 | 2026-06-29 | Added explicit status delivery documentation |
| v1.0.0 | 2026-06-29 | Initial release |
