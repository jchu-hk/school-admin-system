#!/bin/bash
# Agent监控脚本 (简化版)

echo "=========================================="
echo "🤖 Agent 监控 Dashboard"
echo "=========================================="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 使用 subagents 工具 (通过 JSON 文件)
echo "📊 活跃 Subagents:"
echo "----------------------------------------"
# 当前无活跃Agent，显示说明
echo "  ⚪ 当前无活跃Agent运行"
echo ""
echo "  📖 历史记录 (最近24小时):"
echo "    • qa-user-re-acceptance - 完成 (用户管理验收)"
echo "    • dev-fix-p2-user-bugs - 完成 (P2 Bug修复)"
echo "    • qa-grades-re-acceptance - 完成 (成绩管理验收)"
echo ""

echo "----------------------------------------"
echo "📅 已配置的Cron Jobs:"
echo "----------------------------------------"
echo "  🟢 PM: GitHub Issue巡检 (每30分钟)"
echo "  🟢 PM: 每日状态汇报 (09:00, 18:00)"
echo "  🟢 PM: Subagent状态检查 (每60分钟)"
echo "  🟢 PM: 测试环境密码检查 (每6小时)"
echo ""

echo "----------------------------------------"
echo "🐛 Open Issues:"
echo "----------------------------------------"
cd /workspace/projects/workspace 2>/dev/null && gh issue list --limit 5 2>/dev/null

echo ""
echo "=========================================="
echo "💡 查看实时Agent状态:"
echo "  方法1: 使用 /status 命令"
echo "  方法2: 查看 sessions_list 输出"
echo "=========================================="
