#!/bin/bash
# Agent Project Admin Coordinator
# 接收 PM 指令，协调 Agent 工作流程，更新 GitHub 和 Dashboard

set -euo pipefail

REPO_PATH="/workspace/projects/workspace"
GITHUB_REPO="jchu-hk/school-admin-system"
DASHBOARD_STATE_FILE="$REPO_PATH/agents/project-admin/dashboard-state.json"

# Agent 对应的预定义 label
declare -A AGENT_LABELS
AGENT_LABELS[DEV]="dev"
AGENT_LABELS[QA]="qa"
AGENT_LABELS[DEVOPS]="devops"
AGENT_LABELS[CHECKER]="checker"
AGENT_LABELS[ARCH]="arch"
AGENT_LABELS[REQ]="req"

usage() {
    cat <<EOF
Usage: $0 <command> <args>

Commands:
  assign <issue-number> <agent>        派发工作给 Agent
  complete <issue-number>              Agent 完成工作
  pass <issue-number> <reviewer>       验收通过
  fail <issue-number> <reviewer> <reason> 验收失败

Example:
  $0 assign 41 DEV
  $0 complete 41
  $0 pass 41 QA
  $0 fail 41 QA "功能不完整"
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
            local label="${AGENT_LABELS[$agent]:-$agent}"
            gh issue edit "$issue" --add-label "in-progress" --add-label "$label"
            ;;
        ready_for_review)
            gh issue edit "$issue" --remove-label "in-progress" --add-label "ready-for-review"
            ;;
        pass_review)
            gh issue edit "$issue" --remove-label "ready-for-review" --remove-label "qa" --add-label "passed"
            gh issue comment "$issue" --body "✅ 验收通过"
            gh issue close "$issue"
            ;;
        fail_review)
            local reason=$1
            gh issue edit "$issue" --remove-label "ready-for-review" --remove-label "qa" --add-label "failed" --add-label "dev"
            gh issue comment "$issue" --body "❌ 验收失败: $reason"
            ;;
    esac
}

update_dashboard_agent_status() {
    local agent=$1
    local status=$2
    local task=$3

    log "Dashboard update: $agent=$status task=$task"

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

command=${1:-}
shift || usage

case "$command" in
    assign)
        [ $# -ne 2 ] && usage
        issue_number=$1
        agent=$2

        log "Assign #$issue_number to $agent"
        github_update_issue "$issue_number" assign_agent "$agent"
        update_dashboard_agent_status "$agent" "running" "处理 #$issue_number"
        log "Assignment complete: #$issue_number → $agent"
        ;;

    complete)
        [ $# -ne 1 ] && usage
        issue_number=$1

        log "Complete #$issue_number"
        github_update_issue "$issue_number" ready_for_review
        update_dashboard_agent_status "DEV" "idle" "完成 #$issue_number"
        log "Work complete: #$issue_number ready for review"
        ;;

    pass)
        [ $# -ne 2 ] && usage
        issue_number=$1
        reviewer=$2

        log "Pass #$issue_number by $reviewer"
        github_update_issue "$issue_number" pass_review
        update_dashboard_agent_status "$reviewer" "idle" "验收通过 #$issue_number"

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
        github_update_issue "$issue_number" fail_review "$reason"
        update_dashboard_agent_status "$reviewer" "idle" "验收失败 #$issue_number"
        update_dashboard_agent_status "DEV" "running" "修复 #$issue_number"

        cd "$REPO_PATH"
        git add agents/project-admin/dashboard-state.json
        git commit -m "chore: dashboard update after #$issue_number fail (auto)"
        git push

        log "Issue #$issue_number failed, returned to DEV"
        ;;

    *)
        usage
        ;;
esac

log "Command completed: $command"