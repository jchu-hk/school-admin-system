#!/bin/bash
# PM状态页更新脚本
# 仅在状态变化或有重要里程碑时更新
# 不主动推送，状态页供用户自愿查看

WORKSPACE="/workspace/projects/workspace"
STATUS_ISSUE=91  # 状态跟踪issue编号

cd "$WORKSPACE"

# 获取当前时间
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M')

# 读取上次状态
LAST_STATUS_FILE="/tmp/pm_last_status.json"
if [ -f "$LAST_STATUS_FILE" ]; then
    LAST_STATUS=$(cat "$LAST_STATUS_FILE")
else
    LAST_STATUS="{}"
fi

# 获取当前git commit
CURRENT_COMMIT=$(git -C "$WORKSPACE" log -1 --oneline --format="%h %s")

# 检查是否有新commit
if echo "$LAST_STATUS" | grep -q "\"commit\":\"$CURRENT_COMMIT\""; then
    # 状态无变化，退出
    exit 0
fi

# 状态变化，更新GitHub Issue
echo "状态变化: $CURRENT_COMMIT"

# 构建更新内容
STATUS_UPDATE="**最后更新**: $CURRENT_TIME

**当前进度**: $CURRENT_COMMIT

**运行中**: $(ps aux | grep -c '[n]ode.*openclaw' ) 个进程"

# 更新issue comment（静默）
gh issue comment $STATUS_ISSUE --body "$STATUS_UPDATE" 2>/dev/null

# 保存状态
echo "{\"commit\":\"$CURRENT_COMMIT\",\"time\":\"$CURRENT_TIME\"}" > "$LAST_STATUS_FILE"
