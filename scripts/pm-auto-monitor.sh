#!/bin/bash
# PM全自动监控脚本 v4
# 每15分钟运行，从GitHub实时获取数据
# 输出: docs/status/README.md (最新) + docs/status/YYYY-MM-DD.md (历史)

WORKSPACE="/workspace/projects/workspace"
STATUS_DIR="$WORKSPACE/docs/status"
STATUS_ISSUE=93

cd "$WORKSPACE"

CURRENT_TIME=$(date '+%Y-%m-%d %H:%M')
TODAY=$(date '+%Y-%m-%d')
TIME_SHORT=$(date '+%H:%M')

mkdir -p "$STATUS_DIR"

# ===== 检测本地Agent状态 =====
ACTIVE_AGENTS=$(subagents list 2>/dev/null | jq -r '.active | .[] | "\(.label): \(.status)"' 2>/dev/null)
AGENT_RUNNING="无"
if [ -n "$ACTIVE_AGENTS" ]; then
    AGENT_RUNNING=$(echo "$ACTIVE_AGENTS" | grep "running" | awk -F: '{print $1}' | head -1)
fi

# ===== 从GitHub实时获取数据 =====

# 1. CI状态
CI_RESULT=$(gh run list --limit 1 --json status,conclusion 2>/dev/null)
CI_STATUS=$(echo "$CI_RESULT" | jq -r '.[0] | if .conclusion == "success" then "✅ 通过" elif .conclusion == "failure" then "❌ 失败" else "🔄 运行中" end')

# 2. Open PRs
OPEN_PR_COUNT=$(gh pr list --state open --json number 2>/dev/null | jq '. | length')
PENDING_REVIEW_PRS=$(gh pr list --state open --limit 10 --json number,title 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$PENDING_REVIEW_PRS" ] && PENDING_REVIEW_PRS="无待审PR"

# 3. Issue看板
IN_PROGRESS=$(gh issue list --state open --label "in-progress" --json number,title --limit 10 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$IN_PROGRESS" ] && IN_PROGRESS="无"

# 本地有agent运行，覆盖GitHub数据
if [ "$AGENT_RUNNING" != "无" ]; then
    IN_PROGRESS="• $AGENT_RUNNING (本地运行中)"
fi

READY_FOR_REVIEW=$(gh issue list --state open --label "ready-for-review" --json number,title --limit 10 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$READY_FOR_REVIEW" ] && READY_FOR_REVIEW="无"

P0_ISSUES=$(gh issue list --state open --label p0 --json number,title --limit 5 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$P0_ISSUES" ] && P0_ISSUES="无P0阻塞"

P1_ISSUES=$(gh issue list --state open --label p1 --json number,title --limit 5 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$P1_ISSUES" ] && P1_ISSUES="无P1紧急"

BACKLOG=$(gh issue list --state open --label "backend,frontend" --json number,title --limit 10 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$BACKLOG" ] && BACKLOG="无待开发任务"

COMPLETED_TODAY=$(gh issue list --state closed --since="${TODAY}T00:00:00Z" --json number,title --limit 5 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$COMPLETED_TODAY" ] && COMPLETED_TODAY="今日无完成"

# 4. Git提交
RECENT_COMMITS=$(git log --oneline -5 --format="• %h %s")

# 5. 统计数据
TOTAL_ISSUES=$(gh issue list --state all --json number 2>/dev/null | jq '. | length' 2>/dev/null || echo "?")
OPEN_ISSUES=$(gh issue list --state open --json number 2>/dev/null | jq '. | length' 2>/dev/null || echo "?")
CLOSED_ISSUES=$(gh issue list --state closed --json number 2>/dev/null | jq '. | length' 2>/dev/null || echo "?")
OPEN_PRS=$(gh pr list --state open --json number 2>/dev/null | jq '. | length' 2>/dev/null || echo "?")

# 6. 版本信息
CURRENT_VERSION=$(git describe --tags 2>/dev/null || echo "v0.2.1")
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

# 7. DEVOPS任务
DEVOPS_TASKS=$(gh issue list --state open --label "ops,devops" --json number,title --limit 5 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null)
[ -z "$DEVOPS_TASKS" ] && DEVOPS_TASKS="无"

# ===== 构建状态内容 =====
cat > "$STATUS_DIR/README.md" << 'HEADER'
# PM状态报告

> ⚠️ 此文件由PM自动更新，每次更新覆盖此文件
> 历史报告请查看下方目录或Git历史

---

HEADER

cat >> "$STATUS_DIR/README.md" << EOF
## 📊 PM状态报告

**最后更新**: $CURRENT_TIME
**分支**: $CURRENT_BRANCH

---

### 🛠️ CI/CD状态

| 检查项 | 状态 |
|--------|------|
| GitHub Actions | $CI_STATUS |

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
| Open PR | $OPEN_PRS |

---

### 🎯 版本

**当前**: $CURRENT_VERSION

---

*自动监控 · 每15分钟更新 · 数据来源: GitHub + 本地Agent检测*

---

## 📁 历史报告

查看Git历史获取完整版本记录:
git log --follow docs/status/README.md

或访问: https://github.com/jchu-hk/school-admin-system/commits/main/docs/status/
EOF

# ===== Git提交 =====
git add docs/status/
git commit -m "📊 PM状态更新 $CURRENT_TIME" --allow-empty 2>/dev/null
git push 2>/dev/null

# ===== 更新Issue（仅通知，不累积）=====
gh issue comment $STATUS_ISSUE --body "$(cat "$STATUS_DIR/README.md")" 2>/dev/null

# 删除旧comments，只保留最新一条
gh api repos/jchu-hk/school-admin-system/issues/$STATUS_ISSUE/comments --jq '.[:-1] | .[].id' 2>/dev/null | while read id; do
  gh api -X DELETE repos/jchu-hk/school-admin-system/issues/comments/$id 2>/dev/null
done

# 保存状态
echo "{\"time\":\"$CURRENT_TIME\"}" > /tmp/pm_monitor_status.json

echo "PM监控更新完成: $CURRENT_TIME"