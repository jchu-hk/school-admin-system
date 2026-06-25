#!/bin/bash
# Wiki自动同步脚本
# 由PM Cron Job调用

REPO_DIR="/workspace/projects/workspace"
WIKI_FILE="$REPO_DIR/docs/school-admin-system/PROJECT-WIKI.md"

cd "$REPO_DIR"

# 获取最新数据
echo "=== 同步Wiki数据 ==="

# 1. 获取Open Issues数量
OPEN_ISSUES=$(gh issue list --state open --json number --jq 'length')
echo "Open Issues: $OPEN_ISSUES"

# 2. 获取本周关闭的Issues
CLOSED_THIS_WEEK=$(gh issue list --state closed --json number,closedAt --jq '.[] | select(.closedAt > "2026-06-24T00:00:00Z") | .number')
echo "本周关闭: $CLOSED_THIS_WEEK"

# 3. 获取最新Commit
LATEST_COMMIT=$(git log --oneline -1 --format='%h')
echo "Latest Commit: $LATEST_COMMIT"

# 4. 检查Docker容器状态
FRONTEND_STATUS=$(docker ps --filter name=school-admin-frontend --format "{{.Status}}" 2>/dev/null)
BACKEND_STATUS=$(docker ps --filter name=school-admin-backend --format "{{.Status}}" 2>/dev/null)
echo "Frontend: $FRONTEND_STATUS"
echo "Backend: $BACKEND_STATUS"

# 5. 提交Wiki更新
git add "$WIKI_FILE"
if git diff --cached --quiet; then
    echo "Wiki无变化"
else
    git commit -m "pm: auto-sync PROJECT-WIKI - $(date '+%Y-%m-%d %H:%M')"
    git push origin main
    echo "Wiki已更新"
fi

echo "=== 同步完成 ==="
