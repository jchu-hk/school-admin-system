#!/bin/bash
# Subagent Status Watchdog - Token-less check
# Only notifies when issues are found

HEARTBEAT_DIR="/tmp"
MAX_AGE_MINUTES=120
ISSUES_FOUND=0
ISSUES_MSG=""

# Check all heartbeat files
for file in "$HEARTBEAT_DIR"/agent-heartbeat-*.json; do
    [ -f "$file" ] || continue
    
    # Parse JSON (using Python for reliability)
    result=$(python3 << EOF 2>/dev/null
import json
import sys
from datetime import datetime, timezone

try:
    with open('$file', 'r') as f:
        data = json.load(f)
    
    agent_id = data.get('agent_id', 'unknown')
    status = data.get('status', 'unknown')
    message = data.get('message', '')
    timestamp_str = data.get('timestamp', '')
    
    if timestamp_str:
        heartbeat_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        age_minutes = (datetime.now(timezone.utc) - heartbeat_time).total_seconds() / 60
        
        if age_minutes > $MAX_AGE_MINUTES:
            print(f"TIMEOUT|{agent_id}|{age_minutes:.0f}|{message}")
        elif status == 'failed':
            print(f"FAILED|{agent_id}|0|{message}")
        elif status == 'blocked':
            print(f"BLOCKED|{agent_id}|0|{message}")
        else:
            print("OK")
    else:
        print("NO_TIMESTAMP")
except Exception as e:
    print(f"ERROR|{e}")
EOF
)
    
    if [ -n "$result" ] && [ "$result" != "OK" ] && [ "$result" != "NO_TIMESTAMP" ]; then
        IFS='|' read -r type agent age msg <<< "$result"
        case "$type" in
            TIMEOUT)
                ISSUES_MSG+="⚠️ $agent: 超时 ${age}分钟 - $msg\n"
                ;;
            FAILED)
                ISSUES_MSG+="❌ $agent: 失败 - $msg\n"
                ;;
            BLOCKED)
                ISSUES_MSG+="🚫 $agent: 阻塞 - $msg\n"
                ;;
            ERROR)
                ISSUES_MSG+="⚠️ 读取失败: $agent\n"
                ;;
        esac
        ISSUES_FOUND=1
    fi
done

# Only write alert file if issues found (PM heartbeat will pick this up)
if [ $ISSUES_FOUND -eq 1 ]; then
    echo -e "🚨 Subagent状态异常:\n$ISSUES_MSG" > /tmp/subagent-alert.txt
    echo "[$(date)] Issues found, written to /tmp/subagent-alert.txt" >> /tmp/subagent-watchdog.log
else
    # Clear any previous alert if all is well
    rm -f /tmp/subagent-alert.txt
    echo "[$(date)] All agents healthy" >> /tmp/subagent-watchdog.log
fi

exit 0
