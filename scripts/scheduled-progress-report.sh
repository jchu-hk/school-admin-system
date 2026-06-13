#!/bin/bash
# PM定时报告触发脚本
# 每2小时触发一次进度报告检查

LOG_FILE="/tmp/pm-cron.log"
WORKSPACE="/workspace/projects/workspace"
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
CURRENT_HOUR=$(date '+%H')
CURRENT_MIN=$(date '+%M')

echo "[$CURRENT_TIME] PM Cron触发 - 当前时间: $CURRENT_HOUR:$CURRENT_MIN" >> "$LOG_FILE"

# 定义报告时间点 (HH:MM)
REPORT_TIMES=("10:00" "14:00" "18:00" "22:00")

# 检查当前时间是否接近报告时间（前后5分钟内）
for report_time in "${REPORT_TIMES[@]}"; do
    report_hour=$(echo $report_time | cut -d: -f1)
    report_min=$(echo $report_time | cut -d: -f2)
    
    # 将时间转换为分钟进行比较
    current_total=$((10#$CURRENT_HOUR * 60 + 10#$CURRENT_MIN))
    report_total=$((10#$report_hour * 60 + 10#$report_min))
    
    diff=$((current_total - report_total))
    
    # 如果在报告时间后5分钟内，触发报告
    if [ $diff -ge 0 ] && [ $diff -le 5 ]; then
        echo "[$CURRENT_TIME] 触发 $report_time 报告" >> "$LOG_FILE"
        
        # 创建报告标记文件，避免重复触发
        MARKER_FILE="/tmp/pm-report-$report_hour"
        
        if [ -f "$MARKER_FILE" ]; then
            marker_time=$(stat -c %Y "$MARKER_FILE" 2>/dev/null || stat -f %m "$MARKER_FILE" 2>/dev/null)
            current_timestamp=$(date +%s)
            hours_since=$(( (current_timestamp - marker_time) / 3600 ))
            
            if [ $hours_since -lt 4 ]; then
                echo "[$CURRENT_TIME] 报告已在最近4小时内触发，跳过" >> "$LOG_FILE"
                continue
            fi
        fi
        
        # 更新标记文件
        touch "$MARKER_FILE"
        
        # 通过OpenClaw触发报告
        # 注意：cron环境无法直接调用openclaw，需要其他机制
        echo "[$CURRENT_TIME] 需要PM手动执行报告生成" >> "$LOG_FILE"
        echo "[$CURRENT_TIME] 请检查HEARTBEAT.md并生成$report_time报告" >> "$LOG_FILE"
        
        # 创建提醒文件
        echo "PM报告提醒: $report_time 报告待生成" > "$WORKSPACE/docs/pm/.report-reminder-$report_hour"
        
        break
    fi
done

echo "[$CURRENT_TIME] Cron执行完成" >> "$LOG_FILE"