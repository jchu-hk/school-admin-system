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
        "QA": "🔍", "CHECKER": "✓", "ARCH": "🏗️", "REQ": "📝"
    }

    agents_html = ""
    for agent in ["PM", "DEVOPS", "DEV", "QA", "CHECKER", "ARCH", "REQ"]:
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

    messages_html = ""
    for m in reversed(messages[-20:]):
        mtype = m.get("type", "default")
        utc_time = datetime.fromisoformat(m["timestamp"].replace("Z", "+00:00"))
        gmt8 = utc_time.astimezone(timezone(timedelta(hours=8)))
        time_str = gmt8.strftime("%H:%M")
        messages_html += f'''<div class="message-item msg-{mtype}">
    <div class="message-time">{time_str}</div>
    <div class="message-content">{m['from']} → {m['to']}: {m['message'][:55]}</div>
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
</style>
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
<div class="message-list">{messages_html}</div>
</div>

<div class="refresh">Updated: {now} (GMT+8)</div>
</div>
</body>
</html>'''

    DASHBOARD_FILE.write_text(html)


def main():
    parser = argparse.ArgumentParser(description="Agent Status Update")
    parser.add_argument("--agent", required=True, choices=["PM", "DEV", "QA", "DEVOPS", "CHECKER", "ARCH", "REQ"],
                       help="Agent name")
    parser.add_argument("--status", required=True, choices=["running", "idle", "terminated"],
                       help="New status: running/idle/terminated")
    parser.add_argument("--task", required=True, help="Task description")
    parser.add_argument("--to", default="PM", help="Message recipient (default: PM)")
    args = parser.parse_args()

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
