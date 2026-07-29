#!/usr/bin/env python3
"""
Simple Agent Dashboard - Status Update

Agent calls this when:
1. Receives task → status: running
2. Completes task → status: idle
3. Unexpected termination → status: terminated (Parent agent sets this)

Usage:
    python3 agent_status.py --agent QA --status running --task "验收Issue #155"
    python3 agent_status.py --agent QA --status idle --task "验收完成"
    python3 agent_status.py --agent QA --status terminated --task "超时终止"

Features:
- Updates agent-status.json (single source of truth)
- Appends to agent-messages.json (communication log)
- Auto-commits to GitHub
- Zero token cost (pure script)
"""

import argparse
import json
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path

WORKSPACE = Path("/workspace/projects/workspace")
STATUS_FILE = WORKSPACE / "agents/project-admin/logs/agent-status.json"
MESSAGE_FILE = WORKSPACE / "agents/project-admin/logs/agent-messages.json"
DASHBOARD_FILE = WORKSPACE / "multi-agent-dashboard.html"


def load_status() -> dict:
    """Load current agent status"""
    if STATUS_FILE.exists():
        return json.loads(STATUS_FILE.read_text())
    return {"agents": {}}


def save_status(status: dict):
    """Save agent status"""
    STATUS_FILE.write_text(json.dumps(status, indent=2, ensure_ascii=False))


def append_message(agent: str, status: str, task: str):
    """Append to message log"""
    messages = []
    if MESSAGE_FILE.exists():
        messages = json.loads(MESSAGE_FILE.read_text())

    msg_types = {
        "done": "done",
        "running": "received",
        "terminated": "failed"
    }
    msg_type = msg_types.get(status, "default")
    
    msg_texts = {
        "done": f"{agent}: 完成 - {task}",
        "running": f"{agent}: 接收 - {task}",
        "terminated": f"{agent}: 超时终止 - {task}"
    }
    msg = msg_texts.get(status, f"{agent}: {task}")

    messages.append({
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "from": agent,
        "to": "PM",
        "message": msg,
        "type": msg_type
    })

    # Keep last 100 messages
    messages = messages[-100:]
    MESSAGE_FILE.write_text(json.dumps(messages, indent=2, ensure_ascii=False))


def build_dashboard(status: dict, messages: list):
    """Build simple dashboard HTML"""
    icons = {
        "PM": "🧑💼", "DEVOPS": "🔧", "DEV": "🤖",
        "QA": "🔍", "CHECKER": "✓", "ARCH": "🏗️", "REQ": "📝",
        "UI_DESIGNER": "🎨"
    }

    agents_html = ""
    for agent in ["PM", "DEVOPS", "DEV", "QA", "CHECKER", "ARCH", "REQ", "UI_DESIGNER"]:
        agent_data = status.get("agents", {}).get(agent, {"status": "idle", "task": "等待任务"})
        agent_status = agent_data.get("status", "idle")
        task = agent_data.get("task", "等待任务")
        
        agent_class = agent_status if agent_status in ["running", "terminated"] else ""
        agent_style = f"agent {' running' if agent_status == 'running' else ''}{' terminated' if agent_status == 'terminated' else ''}"

        agents_html += f'''<div class="{agent_style.strip()}">
    <div class="agent-icon">{icons.get(agent, "❓")}</div>
    <div class="agent-name">{agent}</div>
    <div class="agent-task">{task[:35]}</div>
    <span class="status-badge status-{agent_status}">{agent_status}</span>
</div>'''

    # Split messages into T (today) and T-1 (yesterday) tabs
    gmt8 = timezone(timedelta(hours=8))
    now_gmt8 = datetime.now(gmt8)
    today_str = now_gmt8.strftime("%Y-%m-%d")
    yesterday_str = (now_gmt8 - timedelta(days=1)).strftime("%Y-%m-%d")
    today_label = now_gmt8.strftime("%m/%d")
    yesterday_label = (now_gmt8 - timedelta(days=1)).strftime("%m/%d")

    today_msgs = []
    yesterday_msgs = []
    for m in messages:
        utc_time = datetime.fromisoformat(m["timestamp"].replace("Z", "+00:00"))
        msg_gmt8 = utc_time.astimezone(gmt8)
        msg_date = msg_gmt8.strftime("%Y-%m-%d")
        if msg_date == today_str:
            today_msgs.append(m)
        elif msg_date == yesterday_str:
            yesterday_msgs.append(m)

    def render_msg_list(msgs):
        html = ""
        for m in reversed(msgs[-15:]):
            mtype = m.get("type", "default")
            utc_time = datetime.fromisoformat(m["timestamp"].replace("Z", "+00:00"))
            gmt8_time = utc_time.astimezone(timezone(timedelta(hours=8)))
            time_str = gmt8_time.strftime("%H:%M")
            html += f'''<div class="message-item msg-{mtype}">
    <div class="message-time">{time_str}</div>
    <div class="message-content">{m['from']} → {m['to']}: {m['message'][:55]}</div>
</div>'''
        return html

    messages_html = f'''<div class="tabs">
  <button class="tab active" onclick="switchTab('today')">📅 T 今日 ({today_label})</button>
  <button class="tab" onclick="switchTab('yesterday')">📅 T-1 昨日 ({yesterday_label})</button>
</div>
<div class="tab-content active" id="tab-today">
<div class="message-list">{render_msg_list(today_msgs) if today_msgs else '<p style="text-align:center;color:#6b7280;padding:20px">暂无今日消息</p>'}</div>
</div>
<div class="tab-content" id="tab-yesterday" style="display:none">
<div class="message-list">{render_msg_list(yesterday_msgs) if yesterday_msgs else '<p style="text-align:center;color:#6b7280;padding:20px">暂无昨日消息</p>'}</div>
</div>'''

    now = datetime.now().astimezone(timezone(timedelta(hours=8))).strftime("%Y-%m-%d %H:%M:%S")

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Multi-Agent Dashboard</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box }}
body {{ font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #e0e0e0; padding: 20px }}
.container {{ max-width: 1200px; margin: 0 auto }}
h1 {{ text-align: center; color: #4ade80; margin-bottom: 20px }}
.card {{ background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px }}
.agent-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px }}
.agent {{ background: rgba(0,0,0,0.3); border-radius: 10px; padding: 12px; text-align: center; border: 2px solid rgba(255,255,255,0.1) }}
.agent.running {{ border-color: #4ade80; box-shadow: 0 0 15px rgba(74,222,128,0.3) }}
.agent.terminated {{ border-color: #ef4444; opacity: 0.7 }}
.agent-icon {{ font-size: 1.6em }}
.agent-name {{ font-weight: bold; font-size: 0.9em }}
.agent-task {{ font-size: 0.75em; color: #9ca3af }}
.status-badge {{ padding: 2px 6px; border-radius: 3px; font-size: 0.7em }}
.status-running {{ background: #4ade80; color: #1a1a2e }}
.status-idle {{ background: rgba(255,255,255,0.1); color: #9ca3af }}
.status-terminated {{ background: #ef4444; color: white }}
.message-list {{ max-height: 400px; overflow-y: auto }}
.message-item {{ background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px; margin-bottom: 8px; border-left: 3px solid }}
.msg-done {{ border-left-color: #4ade80 }}
.msg-received {{ border-left-color: #60a5fa }}
.msg-failed {{ border-left-color: #ef4444 }}
.msg-default {{ border-left-color: #6b7280 }}
.refresh {{ text-align: center; color: #6b7280; font-size: 0.8em; margin-top: 20px }}
.tabs {{ display: flex; gap: 8px; margin-bottom: 12px }}
.tab {{ padding: 6px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); color: #9ca3af; cursor: pointer; font-size: 0.85em; transition: all 0.2s }}
.tab:hover {{ background: rgba(255,255,255,0.1); color: #e0e0e0 }}
.tab.active {{ background: rgba(74,222,128,0.15); border-color: #4ade80; color: #4ade80; font-weight: bold }}
.tab-content {{ display: none }}
.tab-content.active {{ display: block }}
</style>
<script>
function switchTab(tab) {{ document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); event.target.classList.add('active'); document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active')); document.getElementById('tab-' + tab).classList.add('active'); }}
</script>
</head>
<body>
<div class="container">
<h1>🤖 Multi-Agent Dashboard <span style="font-size:0.6em;color:#6b7280">(GMT+8)</span></h1>

<div class="card">
<h2 style="color:#4ade80;margin-bottom:15px">👥 Agents</h2>
<div class="agent-grid">{agents_html}</div>
</div>

<div class="card">
<h2 style="color:#4ade80;margin-bottom:15px">💬 Messages</h2>
{messages_html}
</div>

<div class="refresh">Updated: {now} (GMT+8)</div>
</div>
</body>
</html>'''

    DASHBOARD_FILE.write_text(html)


def rebuild_dashboard():
    """Rebuild dashboard from existing data without changing status (used by cron/wrappers)"""
    status = load_status()
    messages = []
    if MESSAGE_FILE.exists():
        messages = json.loads(MESSAGE_FILE.read_text())
    build_dashboard(status, messages)
    try:
        subprocess.run(["git", "add", "multi-agent-dashboard.html"], cwd=WORKSPACE, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "chore: dashboard rebuild"], cwd=WORKSPACE, check=True, capture_output=True)
        subprocess.run(["git", "push", "origin", "main"], cwd=WORKSPACE, check=True, capture_output=True)
    except:
        pass
    print("✅ Dashboard rebuilt and pushed")


def main():
    parser = argparse.ArgumentParser(description="Agent Status Update")
    parser.add_argument("--agent", choices=["PM", "DEV", "QA", "DEVOPS", "CHECKER", "ARCH", "REQ"],
                       help="Agent name")
    parser.add_argument("--status", choices=["running", "idle", "terminated"],
                       help="New status: running/idle/terminated")
    parser.add_argument("--task", help="Task description")
    parser.add_argument("--rebuild", action="store_true",
                       help="Just rebuild dashboard from existing data (no status change)")
    parser.add_argument("--to", default="PM", help="Message recipient (default: PM)")
    args = parser.parse_args()

    # --rebuild mode: just regenerate HTML from existing data
    if args.rebuild:
        rebuild_dashboard()
        return

    # Status update mode: requires agent/status/task
    if not args.agent or not args.status or not args.task:
        parser.error("Either --rebuild or --agent/--status/--task required")

    # 1. Update status
    status = load_status()
    status["agents"][args.agent] = {
        "status": args.status,
        "task": args.task,
        "lastUpdate": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    save_status(status)

    # 2. Append message
    append_message(args.agent, args.status, args.task)

    # 3. Load messages for dashboard
    messages = []
    if MESSAGE_FILE.exists():
        messages = json.loads(MESSAGE_FILE.read_text())

    # 4. Build dashboard
    build_dashboard(status, messages)

    # 5. Push to GitHub
    try:
        subprocess.run(["git", "add", "."], cwd=WORKSPACE, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", f"chore: {args.agent} {args.status} - {args.task[:30]}"],
                     cwd=WORKSPACE, check=True, capture_output=True)
        subprocess.run(["git", "push", "origin", "main"], cwd=WORKSPACE, check=True, capture_output=True)
    except:
        pass

    print(f"✅ {args.agent} → {args.status}: {args.task}")
    print(f"✅ Dashboard updated")


if __name__ == "__main__":
    main()
