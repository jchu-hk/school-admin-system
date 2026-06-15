#!/bin/bash
# PM全自动监控脚本 v2
# 每5分钟运行，从GitHub实时获取数据
# 不依赖记忆上下文

WORKSPACE="/workspace/projects/workspace"
STATUS_ISSUE=93

cd "$WORKSPACE"

CURRENT_TIME=$(date '+%Y-%m-%d %H:%M')

# ===== 从GitHub实时获取数据 =====

# 1. CI状态
CI_RESULT=$(gh run list --limit 1 --json status,conclusion 2>/dev/null)
CI_STATUS=$(echo "$CI_RESULT" | jq -r '.[0] | if .conclusion == "success" then "✅ 通过" elif .conclusion == "failure" then "❌ 失败" else "🔄 运行中" end')

# 2. Open PRs
OPEN_PR_COUNT=$(gh pr list --state open --json number 2>/dev/null | jq '. | length')
PENDING_REVIEW_PRS=$(gh pr list --state open --limit 10 --json number,title 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$PENDING_REVIEW_PRS" ] && PENDING_REVIEW_PRS="无待审PR"

# 3. Issue看板（按标签分类）
# In Progress
IN_PROGRESS=$(gh issue list --state open --label "in-progress" --json number,title --limit 10 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$IN_PROGRESS" ] && IN_PROGRESS="无"

# Ready for Review
READY_FOR_REVIEW=$(gh issue list --state open --label "ready-for-review" --json number,title --limit 10 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$READY_FOR_REVIEW" ] && READY_FOR_REVIEW="无"

# P0 Issues
P0_ISSUES=$(gh issue list --state open --label p0 --json number,title --limit 5 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$P0_ISSUES" ] && P0_ISSUES="无P0阻塞"

# P1 Issues
P1_ISSUES=$(gh issue list --state open --label p1 --json number,title --limit 5 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$P1_ISSUES" ] && P1_ISSUES="无P1紧急"

# 4. 待开发Backlog（不含已分配的）
BACKLOG=$(gh issue list --state open --label "backend,frontend" --json number,title --limit 10 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$BACKLOG" ] && BACKLOG="无待开发任务"

# 5. 已完成（今日）
TODAY=$(date '+%Y-%m-%d')
COMPLETED_TODAY=$(gh issue list --state closed --since="${TODAY}T00:00:00Z" --json number,title --limit 5 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$COMPLETED_TODAY" ] && COMPLETED_TODAY="今日无完成"

# 6. 最近提交
RECENT_COMMITS=$(git log --oneline -5 --format="• %h %s")

# 7. 统计数据
TOTAL_ISSUES=$(gh issue list --state all --json number 2>/dev/null | jq '. | length' 2>/dev/null || echo "?")
OPEN_ISSUES=$(gh issue list --state open --json number 2>/dev/null | jq '. | length' 2>/dev/null || echo "?")
CLOSED_ISSUES=$(gh issue list --state closed --json number 2>/dev/null | jq '. | length' 2>/dev/null || echo "?")

# 8. 版本信息
CURRENT_VERSION=$(git describe --tags 2>/dev/null || echo "v0.2.1")
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

# 9. DEVOPS任务
DEVOPS_TASKS=$(gh issue list --state open --label "ops,devops" --json number,title --limit 5 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$DEVOPS_TASKS" ] && DEVOPS_TASKS="无"

# ===== 构建状态页 =====
STATUS_BODY="## 📊 PM状态页 [自动更新]

**最后更新**: $CURRENT_TIME
**数据来源**: GitHub实时

---

### 🛠️ CI/CD状态

| 检查项 | 状态 |
|--------|------|
| GitHub Actions | $CI_STATUS |
| 当前分支 | $CURRENT_BRANCH |

---

### 🔄 进行中 (In Progress)

$IN_PROGRESS

---

### 👀 待审核 (Ready for Review)

$READY_FOR_REVIEW

---

### ⚠️ P0 阻塞

$P0_ISSUES

---

### 🔥 P1 紧急

$P1_ISSUES

---

### 🔀 待审PR

$PENDING_REVIEW_PRS
**Open PR数量**: $OPEN_PR_COUNT

---

### ⚙️ DEVOPS任务

$DEVOPS_TASKS

---

### 📋 待办 (Backlog)

$BACKLOG

---

### ✅ 今日完成

$COMPLETED_TODAY

---

### 📈 Git提交

$RECENT_COMMITS

---

### 📊 统计

| 指标 | 数值 |
|------|------|
| 总Issue | $TOTAL_ISSUES |
| Open Issue | $OPEN_ISSUES |
| Closed Issue | $CLOSED_ISSUES |
| Open PR | $OPEN_PR_COUNT |

---

### 🎯 版本

**当前**: $CURRENT_VERSION

---

*自动监控 · 每5分钟更新 · 数据来源: GitHub*"

# 更新Issue
gh issue comment $STATUS_ISSUE --body "$STATUS_BODY"

# 保存状态
echo "{\"time\":\"$CURRENT_TIME\"}" > /tmp/pm_monitor_status.json

echo "PM监控更新完成"
