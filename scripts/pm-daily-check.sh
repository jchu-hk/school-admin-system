#!/bin/bash
# PM Daily Check Script
# 检查分支积压、Issues、容器健康、最近提交
# 用法: ./scripts/pm-daily-check.sh

cd /workspace/projects/workspace

echo "========================================"
echo "PM Daily Check - $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# 1. 检查Feature分支积压（超过3天）
echo "📌 Feature Branch Status (> 3 days):"
echo "----------------------------------------"
git branch -r | grep "feature\|bugfix" | while read branch; do
  # 获取分支最后提交日期
  last_commit_date=$(git log -1 --format=%cd --date=short "$branch" 2>/dev/null)
  # 计算天数差
  if [ -n "$last_commit_date" ]; then
    days=$(( ($(date +%s) - $(date -d "$last_commit_date" +%s)) / 86400 ))
    if [ "$days" -gt 3 ]; then
      echo "⚠️  WARNING: $branch ($days days old, last commit: $last_commit_date)"
      # 列出该分支的未合并commit
      echo "   Commits: $(git log --oneline origin/main..$branch | wc -l) pending"
    fi
  fi
done
echo ""

# 2. 检查P0/P1 Issues
echo "📌 P0/P1 Issues Status:"
echo "----------------------------------------"
gh issue list --repo jchu-hk/school-admin-system --label "p0,p1" --state open --json number,title,labels 2>/dev/null | python3 -c "
import sys, json
issues = json.load(sys.stdin)
p0 = [i for i in issues if any(l['name'] == 'p0' for l in i['labels'])]
p1 = [i for i in issues if any(l['name'] == 'p1' for l in i['labels'])]
print(f'P0 Critical: {len(p0)} issues')
for i in p0:
    print(f'  🔴 #{i[\"number\"]} - {i[\"title\"]}')
print(f'\\nP1 High: {len(p1)} issues')
for i in p1:
    print(f'  🟠 #{i[\"number\"]} - {i[\"title\"]}')"
echo ""

# 3. 检查容器健康
echo "📌 Container Health Status:"
echo "----------------------------------------"
docker ps --format "{{.Names}}: {{.Status}}" | while read line; do
  if echo "$line" | grep -v "Up"; then
    echo "⚠️  WARNING: $line"
  else
    echo "✅ $line"
  fi
done
echo ""

# 4. 检查最近提交（24小时）
echo "📌 Recent Commits (24 hours):"
echo "----------------------------------------"
git log --oneline --since="1 day ago"
echo ""

# 5. 检查模块完成度（从HEARTBEAT.md读取）
echo "📌 Module Completion Status:"
echo "----------------------------------------"
grep -A20 "## 🎯 核心模块完成度" /workspace/projects/workspace/HEARTBEAT.md | grep -E "^\|.*\|" | tail -20
echo ""

# 6. 检查是否有待处理的PR
echo "📌 Pull Requests Status:"
echo "----------------------------------------"
gh pr list --repo jchu-hk/school-admin-system --state open 2>/dev/null || echo "No PRs or gh CLI not available"
echo ""

echo "========================================"
echo "Daily Check Complete"
echo "========================================"
echo ""
echo "Next Actions (if any WARNINGs found):"
echo "1. Review and merge/delete old branches"
echo "2. Assign P0/P1 issues to DEV team"
echo "3. Restart unhealthy containers"
echo "4. Update PM-PROJECT-PLAN.md"