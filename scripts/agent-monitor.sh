#!/bin/bash
# Agent监控脚本 - 显示当前活跃的Agent

OPENCLAW_URL="${OPENCLAW_URL:-http://localhost:5000}"
OUTPUT_FORMAT="${1:-text}"

echo "=========================================="
echo "🤖 Agent 监控 Dashboard"
echo "=========================================="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 检查subagents状态
echo "📊 活跃 Subagents:"
echo "----------------------------------------"
subagents=$(openclaw subagents list 2>/dev/null || echo '{"active": [], "recent": []}')

echo "$subagents" | python3 -c "
import sys, json
data = json.load(sys.stdin)
active = data.get('active', [])
recent = data.get('recent', [])

if active:
    print(f'\n  🟢 正在运行 ({len(active)}个):')
    for a in active:
        print(f'    • {a.get(\"taskName\", \"Unknown\")}')
        print(f'      运行时间: {a.get(\"runtime\", \"N/A\")}')
        print(f'      Token: {a.get(\"totalTokens\", 0):,}')
        print()
else:
    print('  ⚪ 无活跃Agent')

if recent:
    print(f'\n  🕐 最近完成 ({len(recent)}个):')
    for r in recent:
        print(f'    • {r.get(\"taskName\", \"Unknown\")} - {r.get(\"status\", \"done\")}')
"

echo ""
echo "----------------------------------------"

# 检查Cron Jobs
echo "📅 已配置的Cron Jobs:"
echo "----------------------------------------"
openclaw cron list 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
jobs = data.get('jobs', [])

if jobs:
    for j in jobs:
        name = j.get('name', 'Unknown')
        enabled = '🟢' if j.get('enabled') else '🔴'
        schedule = j.get('scheduleKind', 'unknown')
        print(f'  {enabled} {name} ({schedule})')
else:
    print('  ⚪ 无配置任务')
"

echo ""
echo "----------------------------------------"

# 检查Open Issues
echo "🐛 Open Issues (最近5个):"
echo "----------------------------------------"
cd /workspace/projects/workspace 2>/dev/null && gh issue list --limit 5 2>/dev/null || echo "  ⚠️ 无法获取Issues"

echo ""
echo "=========================================="
echo "使用方式:"
echo "  ./scripts/agent-monitor.sh [text|json]"
echo "=========================================="
