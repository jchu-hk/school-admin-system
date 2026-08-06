#!/bin/bash
# PM Spawn Wrapper — enforces write_message assign BEFORE spawning any agent
# Usage:
#   bash scripts/pm-spawn.sh --agent QA --issues "295,296,297" --task "验证P0修复"
#   bash scripts/pm-spawn.sh --agent DEV --issues "299" --task "修复学生页面bug"
#
# This script:
#   1. Runs write_message --type assign → logs + GitHub labels + Dashboard
#   2. Outputs a ready-to-use spawn task template with communication rules embedded
#   3. The PM copies the template into sessions_spawn(task=...)

set -euo pipefail

WORKSPACE="/workspace/projects/workspace"
WRITE_MSG="$WORKSPACE/skills/agent-communication/scripts/write_message.py"

# === Parse args ===
AGENT=""
ISSUES=""
TASK=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2 ;;
    --issues) ISSUES="$2"; shift 2 ;;
    --task) TASK="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$AGENT" || -z "$ISSUES" || -z "$TASK" ]]; then
  echo "Usage: bash scripts/pm-spawn.sh --agent <AGENT> --issues <ISSUES> --task <TASK>"
  echo "Example: bash scripts/pm-spawn.sh --agent QA --issues '295,296,297' --task '验证P0修复'"
  exit 1
fi

# Map agent to role label
declare -A ROLE_LABELS=(
  [DEV]="Developer — 编码、修复、构建、部署"
  [QA]="QA — 独立测试验收，不修改代码"
  [DEVOPS]="DevOps — CI/CD、基础设施、部署"
  [CHECKER]="Checker — 代码审查、规范检查"
  [ARCH]="Architect — 系统设计、技术决策"
  [REQ]="Requirements — 需求分析、功能规格"
)

ROLE_DESC="${ROLE_LABELS[$AGENT]:-$AGENT}"

# Format issue list
ISSUE_LIST=$(echo "$ISSUES" | sed 's/,/, #/g' | sed 's/^/#/')

# === Step 1: Write PM assign message ===
echo "============================================"
echo "📋 PM → $AGENT: assign message"
echo "============================================"
python3 "$WRITE_MSG" \
  --from PM --to "$AGENT" \
  --message "[$ISSUE_LIST] $TASK" \
  --type assign --status running
echo ""

# === Step 2: Agent-specific task templates ===
echo "============================================"
echo "📋 SPAWN TASK — 复制以下内容到 sessions_spawn(task=...)"
echo "============================================"
echo ""

# Build the spawn task
cat <<SPAWN_TASK
## ⚠️ 必须遵守的通信规则

### 任务开始时（先执行，再工作！）
\`\`\`bash
python3 skills/agent-communication/scripts/write_message.py \\
  --from $AGENT --to PM \\
  --message "[$ISSUE_LIST] 开始: $TASK" \\
  --type received --status running
\`\`\`

### 任务完成时
\`\`\`bash
# 成功
python3 skills/agent-communication/scripts/write_message.py \\
  --from $AGENT --to PM \\
  --message "[$ISSUE_LIST] 完成: \$COMMIT_OR_DETAIL" \\
  --type passed --status idle

# 失败/阻塞
python3 skills/agent-communication/scripts/write_message.py \\
  --from $AGENT --to PM \\
  --message "[$ISSUE_LIST] 失败: \$REASON" \\
  --type failed --status idle
\`\`\`

**禁止：**
- ❌ 不写 received 就开始工作
- ❌ 不写 passed/failed 就退出
- ❌ 不调用 write_message 直接结束 session

---

## Role: $AGENT Agent

$ROLE_DESC

## Task: $TASK

Issues: $ISSUE_LIST

## Requirements
SPAWN_TASK

# Add agent-specific requirements
case "$AGENT" in
  QA)
    cat <<QA_TASK
1. 独立验证每个 Issue 的修复（不信任DEV的测试结果）
2. 测试环境: https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/
3. 登录: testuser (system_admin)
4. 每个 Issue 单独报告 PASS/FAIL
5. 完成汇总: X/Y PASS, Z/Y FAIL
QA_TASK
    ;;
  DEV)
    cat <<DEV_TASK
1. 分析根因 → 写 Issue comment
2. 编码修复 → 自测
3. 构建 + 部署到测试环境
4. 每个 Issue 单独报告修复详情
DEV_TASK
    ;;
  DEVOPS)
    cat <<DEVOPS_TASK
1. 检查当前部署状态
2. 执行部署/CI修复
3. 验证部署结果
DEVOPS_TASK
    ;;
  CHECKER)
    cat <<CHECKER_TASK
1. 代码审查
2. 规范检查
3. 报告审查结果
CHECKER_TASK
    ;;
esac

echo ""
echo "--- 模板结束 ---"
echo ""
echo "============================================"
echo "📊 Dashboard: https://aade13aa-91de-4793-9a07-a613f42a5cc4.dev.coze.site/school-admin/multi-agent-dashboard.html"
echo "============================================"
