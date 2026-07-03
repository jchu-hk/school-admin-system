---
name: multi-agent-dashboard
description: "Update multi-agent dashboard from GitHub Events. Track agent status, write heartbeat files, infer activity from commits/issues."
metadata: { "openclaw": { "emoji": "📊" } }
---

# Multi-Agent Dashboard Skill

Track multi-agent activity and update the shared dashboard. Use when coordinating multiple agents (DEV/QA/DEVOPS/etc).

## Triggers

- Agent starts/completes work
- PM assigns/reviews tasks
- Need to sync agent status to dashboard
- Cron heartbeat check (every 5 min)

## Workflow

```
Agent Activity → write-heartbeat → update-dashboard → GitHub Push
               ↘ infer-from-github-events (fallback)
```

## Commands

### 1. Write Heartbeat (Agent主动写)

```bash
python scripts/write_heartbeat.py \
  --agent DEV \
  --issue 164 \
  --status running \
  --message "正在修复数据库表"
```

### 2. Update Dashboard (更新Dashboard)

```bash
python scripts/update_dashboard.py \
  --repo jchu-hk/school-admin-system \
  --branch main
```

### 3. Infer Status from GitHub (自动推断)

```bash
python scripts/infer_status.py \
  --repo jchu-hk/school-admin-system
```

## Message Box — T / T-1 Tabs

The dashboard Message panel auto-splits messages into:

- **📅 T 今日** — messages from today (GMT+8, current day)
- **📅 T-1 昨日** — messages from the previous day

Timestamps in each tab show `HH:MM` only (no date needed — the tab label already tells you).

## Key Improvements vs Old Project-Admin

| Issue | Old | New |
|-------|-----|-----|
| PM forgets heartbeat | Dashboard shows idle (wrong) | Infer from GitHub Events (correct) |
| Message flow static | Last update yesterday | Auto-build from GitHub Events |
| Project-specific | Only this project | Reusable skill for any project |

## GitHub Events → Status Mapping

| GitHub Event | Agent | Status |
|--------------|-------|--------|
| Commit by PM session | PM | running |
| Issue closed by PM | PM | done |
| in-progress label on issue | DEV/QA/etc | running |
| Branch activity (feature/*) | DEV | running |

## Heartbeat File Location

```
/tmp/agent-heartbeat-{AGENT}-{ISSUE_ID}.json
```

Format:
```json
{
  "agent_id": "DEV",
  "issue_id": "164",
  "status": "running",
  "message": "正在修复数据库表",
  "timestamp": "2026-06-28T10:25:00Z"
}
```

## Message Flow Auto-Generation

Instead of static `agent-messages.json`, build from GitHub:

```python
# From Issue events
event: "closed" → message: "任务完成"
event: "assigned" → message: "派发任务"
event: "labeled" (in-progress) → message: "接收任务"

# From Commits
commit message contains "fix(#xxx)" → message: "修复完成"
commit by DEV session → message: "提交代码"
```

## Timeout Detection

- Heartbeat older than 10 min → mark as stale
- Notify PM via session message

## Dependencies

- `gh` CLI (GitHub API)
- Python 3
- Git

## Related

- AGENTS.md: PM强制心跳规则
- docs/MULTI-AGENT-SYSTEM.md: 协作架构# 1782691720
