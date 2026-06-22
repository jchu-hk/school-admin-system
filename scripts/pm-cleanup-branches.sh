#!/bin/bash
# PM Branch Cleanup Script
# 清理超过3天且无待提交的abandoned branches
# 用法: ./scripts/pm-cleanup-branches.sh

cd /workspace/projects/workspace

echo "========================================"
echo "PM Branch Cleanup - $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# 设置dry-run模式（默认false，设置为true只显示不删除）
DRY_RUN=false

# 遍历所有feature/bugfix分支
git branch -r | grep "feature\|bugfix" | while read branch; do
  # 移除origin/前缀获取本地分支名
  local_branch=${branch#origin/}
  
  # 获取分支最后提交日期
  last_commit_date=$(git log -1 --format=%cd --date=short "$branch" 2>/dev/null)
  
  # 计算天数差
  if [ -n "$last_commit_date" ]; then
    days=$(( ($(date +%s) - $(date -d "$last_commit_date" +%s)) / 86400 ))
    
    # 检查是否有待合并的commits
    pending_commits=$(git log --oneline origin/main..$branch | wc -l)
    
    # 如果超过3天且无待提交，认为是abandoned
    if [ "$days" -gt 3 ] && [ "$pending_commits" -eq 0 ]; then
      echo "🗑️  ABANDONED: $branch ($days days, 0 pending commits)"
      
      if [ "$DRY_RUN" = "true" ]; then
        echo "   (DRY RUN: Would delete remote branch)"
      else
        # 删除远程分支
        echo "   Deleting remote branch..."
        git push origin --delete "$local_branch" 2>&1 | grep -v "Everything up-to-date"
        echo "   ✅ Deleted"
      fi
    elif [ "$days" -gt 3 ]; then
      echo "⚠️  WARNING: $branch ($days days, $pending_commits pending commits)"
      echo "   Review and merge immediately!"
    fi
  fi
done

echo ""
echo "========================================"
echo "Branch Cleanup Complete"
echo "========================================"
echo ""
echo "Summary:"
echo "- Abandoned branches (0 pending, >3 days): Deleted"
echo "- Active branches (with pending work): Needs attention"
echo ""
echo "Next Actions:"
echo "1. Review active branches with pending work"
echo "2. Merge to main or continue development"
echo "3. Delete obsolete branches manually"