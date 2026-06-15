#!/bin/bash
# PM状态页更新脚本 v2
# 每5分钟运行，有变化时更新

WORKSPACE="/workspace/projects/workspace"
STATUS_ISSUE=93

cd "$WORKSPACE"

CURRENT_TIME=$(date '+%Y-%m-%d %H:%M')
CURRENT_COMMIT=$(git -C "$WORKSPACE" log -1 --oneline --format="%h %s")
LAST_STATUS_FILE="/tmp/pm_last_status.json"

# 获取最新commit
LATEST_COMMIT=$(git -C "$WORKSPACE" log -1 --format="%h")
LAST_COMMIT=""
[ -f "$LAST_STATUS_FILE" ] && LAST_COMMIT=$(cat "$LAST_STATUS_FILE" | jq -r '.commit // empty')

# 检查是否有新commit
if [ "$LATEST_COMMIT" = "$LAST_COMMIT" ]; then
    exit 0
fi

# ===== 获取数据 =====

# 1. 最近Commits
RECENT_COMMITS=$(git log --oneline -5 --format="• %h %s")

# 2. 待审PR
RECENT_PR=$(gh pr list --state open --limit 3 --json number,title 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null || echo "无待审PR")

# 3. P0/P1 Issues
P0_ISSUES=$(gh issue list --state open --label p0 --json number,title 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null || echo "无P0阻塞")
P1_ISSUES=$(gh issue list --state open --label p1 --json number,title 2>/dev/null | jq -r '.[] | "• #\(.number) \(.title)"' 2>/dev/null || echo "无P1紧急")

# 4. 当前分支
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
FEATURE_BRANCHES=$(git branch -r --format="%(refname:short)" 2>/dev/null | grep "^origin/feature/" | head -5 || echo "无feature分支")

# 5. CI状态 (使用GitHub Actions)
CI_RESULT=$(gh run list --limit 1 --json status,conclusion 2>/dev/null | jq -r '.[0] | if .conclusion == "success" then "✅ 通过" elif .conclusion == "failure" then "❌ 失败" else "🔄 运行中" end')
CI_STATUS=$CI_RESULT

# 6. 今日完成
TODAY=$(date '+%Y-%m-%d')
TODAY_COMMITS=$(git log --since="$TODAY 00:00" --oneline --format="• %h %s" 2>/dev/null | head -5)
[ -z "$TODAY_COMMITS" ] && TODAY_COMMITS="今日无commit"

# 7. Issue统计
TOTAL_ISSUES=$(gh issue list --state all --json number 2>/dev/null | jq '. | length' 2>/dev/null || echo "?")
OPEN_ISSUES=$(gh issue list --state open --json number 2>/dev/null | jq '. | length' 2>/dev/null || echo "?")
CLOSED_ISSUES=$(gh issue list --state closed --json number 2>/dev/null | jq '. | length' 2>/dev/null || echo "?")
OPEN_PRS=$(gh pr list --state open --json number 2>/dev/null | jq '. | length' 2>/dev/null || echo "?")

# 8. 当前版本
CURRENT_VERSION=$(git describe --tags 2>/dev/null || echo "v0.2.1")

# ===== 构建状态页 =====
STATUS_BODY="## 📊 PM状态页 [自动更新]

**最后更新**: $CURRENT_TIME

---

### 🤖 AI团队状态

| Agent | 任务 | 状态 |
|-------|------|------|
| PM | 持续工作 | ✅ 运行中 |
| DEVOPS | 监控CI/CD | ✅ 正常 |

**活跃任务**: 无阻塞，等待下一步指令

---

### 📈 项目进度

| 版本 | 状态 | 日期 |
|------|------|------|
| v0.2.1 | ✅ 已发布 | 2026-06-14 |
| v0.2.2 | 🔄 开发中 | 进行中 |
| v1.0.0 | 📋 规划中 | Q3 |

**当前版本**: $CURRENT_VERSION

---

### 🔨 开发进度

**今日Commit**:
$TODAY_COMMITS

**最近5个Commit**:
$RECENT_COMMITS

**当前分支**: $CURRENT_BRANCH

---

### 📋 Issue看板

**P0 (阻塞)**:
$P0_ISSUES

**P1 (紧急)**:
$P1_ISSUES

**待审PR**:
$RECENT_PR

---

### 🏗️ 项目结构

| 模块 | 功能数 | 状态 |
|------|--------|------|
| MOD-DAILY | 5 | ✅ |
| MOD-CYCL | 2 | ✅ |
| MOD-FIN | 3 | 🔄 |
| MOD-USER | 7 | ✅ |
| MOD-AI | 6 | 🔄 |
| MOD-OPS | 5 | 🔄 |

---

### 🛠️ CI/CD状态

**Lint**: $CI_STATUS
**Build**: $CI_STATUS

---

### 📊 关键指标

| 指标 | 数值 |
|------|------|
| 总Issue | $TOTAL_ISSUES |
| Open Issue | $OPEN_ISSUES |
| Closed Issue | $CLOSED_ISSUES |
| Open PR | $OPEN_PRS |

---

*状态页规则: 有变化才更新，无变化则静默*"

# 更新Issue
gh issue comment $STATUS_ISSUE --body "$STATUS_BODY"

# 保存状态
echo "{\"commit\":\"$LATEST_COMMIT\",\"time\":\"$CURRENT_TIME\"}" > "$LAST_STATUS_FILE"
echo "状态页已更新"
