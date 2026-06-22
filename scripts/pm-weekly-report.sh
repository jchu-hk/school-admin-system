#!/bin/bash
# PM Weekly Report Script (Fixed)
# 生成周报并更新PM-PROJECT-PLAN.md
# 用法: ./scripts/pm-weekly-report.sh

cd /workspace/projects/workspace

WEEK_START=$(date -d "last monday" '+%Y-%m-%d')
WEEK_END=$(date -d "today" '+%Y-%m-%d')

echo "========================================"
echo "PM Weekly Report - $WEEK_START to $WEEK_END"
echo "========================================"
echo ""

# 1. Issue统计
echo "📊 Issue Statistics:"
echo "----------------------------------------"
echo "Total Open Issues:"
TOTAL_OPEN=$(gh issue list --repo jchu-hk/school-admin-system --state open --json number,title,labels 2>/dev/null | python3 -c "
import sys, json
try:
    issues = json.load(sys.stdin)
    print(len(issues))
except:
    print(0)
")
echo "  Total: $TOTAL_OPEN"
echo ""
echo "Closed This Week:"
CLOSED_COUNT=$(gh issue list --repo jchu-hk/school-admin-system --state closed --since="$WEEK_START" --json number,title 2>/dev/null | python3 -c "
import sys, json
try:
    issues = json.load(sys.stdin)
    print(len(issues))
except:
    print(0)
")
echo "  Total closed: $CLOSED_COUNT"
echo ""

# 2. 提交统计
echo "📊 Commit Statistics:"
echo "----------------------------------------"
COMMITS_THIS_WEEK=$(git log --since="$WEEK_START" --until="tomorrow" --oneline 2>/dev/null | wc -l)
echo "Commits this week: $COMMITS_THIS_WEEK"
echo ""

# 3. 分支统计
echo "📊 Branch Statistics:"
echo "----------------------------------------"
FEATURE_BRANCHES=$(git branch -r 2>/dev/null | grep "feature\|bugfix" | wc -l)
echo "Total feature/bugfix branches: $FEATURE_BRANCHES"
echo ""
echo "Old branches (>3 days):"
git branch -r 2>/dev/null | grep "feature\|bugfix" | while read branch; do
  last_commit_date=$(git log -1 --format=%cd --date=short "$branch" 2>/dev/null)
  if [ -n "$last_commit_date" ]; then
    days=$(($(date +%s) - $(date -d "$last_commit_date" +%s)) / 86400)
    if [ "$days" -gt 3 ]; then
      echo "  $branch ($days days)"
    fi
  fi
done
echo ""

# 4. 模块完成度
echo "📊 Module Completion:"
echo "----------------------------------------"
grep -A20 "## 🎯 核心模块完成度" /workspace/projects/workspace/HEARTBEAT.md 2>/dev/null | grep -E "^\|.*\|" | tail -10
echo ""

echo "========================================"
echo "Weekly Report Generated"
echo "========================================"
echo ""
echo "Please review and update PM-PROJECT-PLAN.md"