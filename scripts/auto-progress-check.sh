#!/bin/bash
# Project Progress Automation Script
# 自动化进度检查与状态更新脚本

WORKSPACE="/workspace/projects/workspace"
GITHUB_REPO="jchu-hk/school-admin-system"
WEBHOOK_URL="${WECHAT_WEBHOOK_URL:-}"  # 可设置微信群webhook

# 获取当前时间
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M')
LOG_FILE="$WORKSPACE/logs/progress-$(date '+%Y%m%d').log"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_git_activity() {
    log "=== 检查Git提交活动 ==="
    cd "$WORKSPACE"
    
    # 今日提交
    TODAY_COMMITS=$(git log --all --oneline --since="00:00" --until="now" --format="%h %an %s" 2>/dev/null | wc -l)
    log "今日提交数: $TODAY_COMMITS"
    
    # 各分支最新提交
    for branch in main phase-3-abac phase-2-core-modules phase-4-deployment-v2; do
        LAST_COMMIT=$(git log -1 --oneline origin/$branch --format="%h %ar" 2>/dev/null)
        log "[$branch] $LAST_COMMIT"
    done
}

check_qa_status() {
    log "=== 检查QA状态 ==="
    
    # 检查超时Issue
    for issue_id in 62 63; do
        STATE=$(gh issue view $issue_id --json state --jq .state 2>/dev/null)
        COMMENTS=$(gh issue view $issue_id --json comments --jq '.comments | length' 2>/dev/null)
        log "Issue #$issue_id: 状态=$STATE, 评论数=$COMMENTS"
        
        if [ "$COMMENTS" -eq 0 ]; then
            log "${RED}警告: Issue #$issue_id 无任何评论，可能无人跟进${NC}"
        fi
    done
}

check_deployment_status() {
    log "=== 检查部署状态 ==="
    
    # 检查#64部署Issue
    DEPLOY_STATE=$(gh issue view 64 --json state --jq .state 2>/dev/null)
    log "部署Issue #64: $DEPLOY_STATE"
}

generate_report() {
    log "=== 生成进度报告 ==="
    
    REPORT="$WORKSPACE/docs/pm/reports/PROGRESS-$(date '+%Y%m%d-%H%M').md"
    mkdir -p "$(dirname $REPORT)"
    
    cat > "$REPORT" << EOF
# 项目进度报告 - $(date '+%Y-%m-%d %H:%M')

## 自动化检查

### Git活动
- 今日提交: $TODAY_COMMITS

### QA状态
$(gh issue view 62 --json title,state 2>/dev/null | jq -r '.state' > /dev/null && echo "- #62: $(gh issue view 62 --json state --jq .state)" || echo "- #62: 未找到")
$(gh issue view 63 --json title,state 2>/dev/null | jq -r '.state' > /dev/null && echo "- #63: $(gh issue view 63 --json state --jq .state)" || echo "- #63: 未找到")

### 部署状态
- #64: $(gh issue view 64 --json state --jq .state 2>/dev/null || echo "未找到")

---
*自动生成于 $(date '+%Y-%m-%d %H:%M:%S')*
EOF
    
    log "报告已生成: $REPORT"
}

# 主流程
log "${GREEN}=== 开始进度检查 ===${NC}"
check_git_activity
check_qa_status
check_deployment_status
generate_report

# 检查是否需要发送告警
if [ "$TODAY_COMMITS" -eq 0 ]; then
    log "${YELLOW}警告: 今日无任何代码提交${NC}"
fi

log "${GREEN}=== 检查完成 ===${NC}"
