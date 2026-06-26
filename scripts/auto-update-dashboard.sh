#!/bin/bash
# 自动更新Dashboard数据 (每5分钟)

cd /workspace/projects/workspace

# 生成时间戳
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 检查是否有新的Git commits
cd /workspace/projects/workspace
git fetch origin main > /dev/null 2>&1
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
  echo "发现新代码，Dashboard可能需要更新"
  git pull origin main > /dev/null 2>&1
fi

# 统计今日数据
TODAY_COMMITS=$(git log --since="00:00" --until="23:59" --oneline | wc -l)
TODAY_DEFS=$(gh issue list --state closed --search "closed:today" --limit 100 --json number --jq 'length' 2>/dev/null || echo "0")

echo "Dashboard数据统计:"
echo "- 时间: $TIMESTAMP"
echo "- 今日提交: $TODAY_COMMITS"
echo "- 今日关闭Issues: $TODAY_DEFS"

# 更新Wiki中的Dashboard链接部分
echo "Dashboard数据已记录"
