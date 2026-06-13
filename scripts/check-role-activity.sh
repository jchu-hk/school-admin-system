#!/bin/bash
# 检查AI团队角色活动状态
# 12h警告, 24h严重, 36h危机

ROLE_REPORTS="/workspace/projects/workspace/docs/pm/role-reports"
ALERT_LOG="/workspace/projects/workspace/docs/pm/activity-alerts.log"

# 角色报告间隔（小时）
declare -A ROLE_INTERVALS=(
    ["DEV1"]=4
    ["DEV2"]=4
    ["DEV3"]=4
    ["DEV-FRONTEND"]=4
    ["QA1"]=4
    ["QA2"]=4
    ["CHECKER"]=4
    ["DEVOPS"]=2
)

# 角色报警阈值（小时）
declare -A ROLE_THRESHOLDS=(
    ["DEV1"]=12
    ["DEV2"]=12
    ["DEV3"]=12
    ["DEV-FRONTEND"]=12
    ["QA1"]=12
    ["QA2"]=12
    ["CHECKER"]=8
    ["DEVOPS"]=6
)

echo "=== AI Team Activity Check $(date '+%Y-%m-%d %H:%M:%S') ===" | tee -a "$ALERT_LOG"

for role in "${!ROLE_INTERVALS[@]}"; do
    interval=${ROLE_INTERVALS[$role]}
    threshold=${ROLE_THRESHOLDS[$role]}

    # 查找最新报告
    latest_report=$(ls -t ${ROLE_REPORTS}/${role}*.md 2>/dev/null | head -1)

    if [ -z "$latest_report" ]; then
        # 无报告记录
        echo "🔴 $role - 无报告记录 (严重)" | tee -a "$ALERT_LOG"
        continue
    fi

    # 计算报告时间
    report_time=$(stat -c %Y "$latest_report" 2>/dev/null || stat -f %m "$latest_report" 2>/dev/null)
    current_time=$(date +%s)
    hours_ago=$(( (current_time - report_time) / 3600 ))

    # 判断报警级别
    if [ $hours_ago -gt $((threshold * 3)) ]; then
        # 危机 (3倍阈值)
        echo "⚫ $role - ${hours_ago}小时无报告 (危机 - 需要36h报告，实际${hours_ago}h)" | tee -a "$ALERT_LOG"
        echo "⚠️ 行动: 立即通知PM + 用户，考虑角色替换" | tee -a "$ALERT_LOG"
    elif [ $hours_ago -gt $((threshold * 2)) ]; then
        # 严重 (2倍阈值)
        echo "🔴 $role - ${hours_ago}小时无报告 (严重 - 需要${threshold * 2}h报告，实际${hours_ago}h)" | tee -a "$ALERT_LOG"
        echo "⚠️ 行动: 立即通知PM + WeChat用户" | tee -a "$ALERT_LOG"
    elif [ $hours_ago -gt $threshold ]; then
        # 警告 (1倍阈值)
        echo "🟡 $role - ${hours_ago}小时无报告 (警告 - 需要${threshold}h报告，实际${hours_ago}h)" | tee -a "$ALERT_LOG"
        echo "⚠️ 行动: 提醒角色提交报告" | tee -a "$ALERT_LOG"
    else
        # 正常
        echo "🟢 $role - ${hours_ago}小时前报告 (正常 - 间隔${interval}h)" | tee -a "$ALERT_LOG"
    fi
done

echo "=== Check Complete ===" | tee -a "$ALERT_LOG"
echo "" | tee -a "$ALERT_LOG"