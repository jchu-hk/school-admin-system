#!/bin/bash
# Agent Project Admin Coordinator
# 接收 PM 指令，协调 Agent 工作流程，更新 GitHub 和 Dashboard

set -euo pipefail

REPO_PATH="/workspace/projects/workspace"
GITHUB_REPO="jchu-hk/school-admin-system"
DASHBOARD_STATE_FILE="$REPO_PATH/agents/project-admin/dashboard-state.json"

usage() {
    cat <<EOF
Usage: $0 <command> <args>

Commands:
  assign <issue-number> <agent>        派发工作给 Agent
  complete <issue-number>              Agent 完成工作
  pass <issue-number> <reviewer>       验收通过
  fail <issue-number> <reviewer> <reason> 验收失败

Example:
  $0 assign 165 DEV
  $0 complete 165
  $0 pass 165 QA
  $0 fail 165 QA "功能不完整"
EOF
    exit 1
}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> /tmp/coordinator.log
}

github_update_issue() {
    local issue=$1
    local action=$2
    shift 2

    log "GitHub update: #$issue $action $*"

    cd "$REPO_PATH"
    case "$action" in
        assign_agent)
            local agent=$1
            gh issue edit "$issue" --add-label "in-progress" --add-label "agent:$agent"
            ;;
        ready_for_review)
            gh issue edit "$issue" --remove-label "in-progress" --add-label "ready-for-review"
            ;;
        pass_review)
            gh issue edit "$issue" --remove-label "ready-for-review" --add-label "passed" --comment "✅ 验收通过"
            gh issue close "$issue"
            ;;
        fail_review)
            local reason=$1
            gh issue edit "$issue" --remove-label "ready-for-review" --add-label "failed" --comment "❌ 验收失败: $reason"
            ;;
    esac
}

update_dashboard_agent_status() {
    local agent=$1
    local status=$2
    local task=$3

    log "Dashboard update: $agent=$status task=$task"

    # 使用 Python 更新 dashboard-state.json
    python3 <<EOF
import json
from pathlib import Path

state_file = Path('$DASHBOARD_STATE_FILE')
state = json.loads(state_file.read_text(encoding='utf-8'))

for agent_obj in state['agents']:
    if agent_obj['name'] == '$agent':
        agent_obj['status'] = '$status'
        agent_obj['task'] = '$task'
        break

state['lastUpdate'] = '$(date "+%Y-%m-%d %H:%M:%S")'
state['generatedAt'] = '$(date -u "+%Y-%m-%dT%H:%M:%S.000Z")'

state_file.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding='utf-8')
EOF
}

notify_agent() {
    local agent=$1
    local message=$2

    log "Notify $agent: $message"

    # 通过 sessions_send 通知 Agent
    cd "$REPO_PATH"
    # agent-PM 调用 coordinator，这里不需要再次通知 PM
    # Agent 会检查 GitHub Issue 状态
}

# === 命令处理 ===

command=${1:-}
shift || usage

case "$command" in
    assign)
        [ $# -ne 2 ] && usage
        issue_number=$1
        agent=$2

        log "Assign #$issue_number to $agent"

        # 1. 更新 GitHub Issue
        github_update_issue "$issue_number" assign_agent "$agent"

        # 2. 更新 Dashboard
        update_dashboard_agent_status "$agent" "running" "处理 #$issue_number"

        # 3. 通知 Agent（Agent 检查 GitHub）
        log "Assignment complete: #$issue_number → $agent"
        ;;

    complete)
        [ $# -ne 1 ] && usage
        issue_number=$1

        log "Complete #$issue_number"

        # 1. 更新 GitHub Issue
        github_update_issue "$issue_number" ready_for_review

        # 2. 更新 Dashboard（DEV idle）
        update_dashboard_agent_status "DEV" "idle" "完成 #$issue_number"

        # 3. 自动派发 QA（需要在 PM 层触发）
        log "Work complete: #$issue_number ready for review"
        ;;

    pass)
        [ $# -ne 2 ] && usage
        issue_number=$1
        reviewer=$2

        log "Pass #$issue_number by $reviewer"

        # 1. 更新 GitHub Issue
        github_update_issue "$issue_number" pass_review

        # 2. 更新 Dashboard（reviewer idle）
        update_dashboard_agent_status "$reviewer" "idle" "验收通过 #$issue_number"

        # 3. 提交 Dashboard 更新
        cd "$REPO_PATH"
        git add agents/project-admin/dashboard-state.json
        git commit -m "chore: dashboard update after #$issue_number pass (auto)"
        git push

        log "Issue #$issue_number passed and closed"
        ;;

    fail)
        [ $# -lt 2 ] && usage
        issue_number=$1
        reviewer=$2
        reason=${3:-"未提供原因"}

        log "Fail #$issue_number by $reviewer: $reason"

        # 1. 更新 GitHub Issue
        github_update_issue "$issue_number" fail_review "$reason"

        # 2. 更新 Dashboard（reviewer idle，DEV 重新工作）
        local current_agent=$(gh issue view "$issue_number" --json assignees -q '.assignees[].login')
        update_dashboard_agent_status "$reviewer" "idle" "验收失败 #$issue_number"
        update_dashboard_agent_status "$current_agent" "running" "修复 #$issue_number"

        log "Issue #$issue_number failed, returned to $current_agent"
        ;;

    *)
        usage
        ;;
esac

log "Command completed: $command"