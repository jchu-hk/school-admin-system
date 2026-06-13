#!/bin/bash
# PM报告检查脚本 - 由PM在收到心跳时调用

WORKSPACE="/workspace/projects/workspace"
CURRENT_HOUR=$(date '+%H')
CURRENT_MIN=$(date '+%M')
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')

# 定义报告时间点
REPORT_HOURS=("10" "14" "18" "22")

# 检查是否到达报告时间（前后5分钟内）
for report_hour in "${REPORT_HOURS[@]}"; do
    # 检查是否在报告时间后5分钟内
    if [ "$CURRENT_HOUR" == "$report_hour" ] && [ "$CURRENT_MIN" -le "05" ]; then
        MARKER_FILE="/tmp/pm-report-sent-$report_hour-$(date '+%Y%m%d')"
        
        if [ ! -f "$MARKER_FILE" ]; then
            echo "REPORT_DUE:$report_hour:00"
            exit 0
        fi
    fi
done

echo "NO_REPORT_DUE"