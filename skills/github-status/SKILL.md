---
name: github-status
description: "Update GitHub Issue status (labels, assignee, close) for multi-agent workflow. Agent calls this to sync task status."
metadata: { "openclaw": { "emoji": "🔄" } }
---

# GitHub Status Skill

Update GitHub Issue status for multi-agent coordination. This is the **source of truth** - Dashboard reads from GitHub.

## Workflow

```
Agent starts work → update GitHub (labels/assignee) → Dashboard reads GitHub
```

## Commands

### 1. Start Work (Agent开始)

```bash
python scripts/github_status.py --action start --issue 165 --agent DEV --message "修复数据库表"
```

**Updates**:
- Add `in-progress` label
- Set assignee to agent label (dev/qa/devops/etc)

### 2. Done (Agent完成)

```bash
python scripts/github_status.py --action done --issue 165 --agent DEV --comment "修复完成"
```

**Updates**:
- Close Issue
- Add `passed` label (optional)
- Remove `in-progress` label

### 3. Fail (Agent失败)

```bash
python scripts/github_status.py --action fail --issue 165 --agent DEV --comment "需要数据库管理员权限"
```

**Updates**:
- Add `failed` label
- Remove `in-progress` label

### 4. Assign (PM派发)

```bash
python scripts/github_status.py --action assign --issue 165 --agent DEV --comment "请修复此问题"
```

**Updates**:
- Set assignee
- Add `dev` label

### 5. QA Verify (QA验收)

```bash
python scripts/github_status.py --action verify --issue 165 --agent QA --comment "验收通过"
```

**Updates**:
- Add `ready-for-review` or `passed` label

## Agent → GitHub Label Mapping

| Agent | GitHub Label |
|-------|--------------|
| DEV | `dev` |
| QA | `qa` |
| DEVOPS | `devops` |
| CHECKER | `checker` |
| ARCH | `arch` |
| REQ | `req` |

## Status Labels

| Label | Meaning |
|-------|---------|
| `in-progress` | Agent正在处理 |
| `dev` | 分配给DEV |
| `qa` | 分配给QA |
| `devops` | 分配给DEVOPS |
| `ready-for-review` | 待审查 |
| `passed` | 已通过 |
| `failed` | 失败 |
| `p0`/`p1`/`p2`/`p3` | 优先级 |

## Example: Full Workflow

```bash
# 1. PM发现Issue
python scripts/github_status.py --action assign --issue 164 --agent DEV --comment "请修复"

# 2. DEV开始工作
python scripts/github_status.py --action start --issue 164 --agent DEV

# 3. DEV完成
python scripts/github_status.py --action done --issue 164 --agent DEV --comment "已修复"

# 4. QA验收
python scripts/github_status.py --action verify --issue 164 --agent QA --comment "通过"
```

## Integration with Dashboard

Dashboard reads GitHub events and labels to infer status:
- `in-progress` label → Agent is running
- Issue closed → Work done
- `failed` label → Work failed

## Combined with multi-agent-dashboard Skill

```bash
# Agent工作时调用
python scripts/github_status.py --action start --issue 165 --agent DEV

# Dashboard Skill自动读取GitHub更新状态
python scripts/multi-agent-dashboard/scripts/update_dashboard.py --repo owner/repo
```