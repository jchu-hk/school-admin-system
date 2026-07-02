#!/usr/bin/env python3
"""
Update multi-agent dashboard from local agent-status.json and agent-messages.json.
This is the primary data source - no GitHub API dependency.

Usage: python update_dashboard.py
"""

import json
from pathlib import Path
from datetime import datetime, timezone, timedelta

REPO_PATH = Path("/workspace/projects/workspace")

def read_agent_status() -> dict:
    """Read agent status from agent-status.json AND agent-messages.json"""
    status = {"agents": {}}
    
    # Method 1: Read from agent-status.json
    status_file = REPO_PATH / "agents/project-admin/logs/agent-status.json"
    if status_file.exists():
        status = json.loads(status_file.read_text())
    
    # Method 2: Read latest agent_status from agent-messages.json (takes priority if newer)
    msg_file = REPO_PATH / "agents/project-admin/logs/agent-messages.json"
    if msg_file.exists():
        messages = json.loads(msg_file.read_text())
        
        # Get latest agent_status for each agent from messages
        for m in reversed(messages[-50:]):  # Check last 50 messages
            agent_status = m.get("agent_status")
            # Handle both dict and string formats
            if isinstance(agent_status, dict):
                agent_name = agent_status.get("agent", "")
                agent_state = agent_status.get("status", "idle")
                task = agent_status.get("task", "等待任务")
            elif isinstance(agent_status, str):
                agent_name = agent_status
                agent_state = "idle"
                task = "等待任务"
            else:
                continue
                
                # Update if not set OR if this message is newer
                if agent_name and agent_name in status["agents"]:
                    current_last_update = status["agents"].get(agent_name, {}).get("lastUpdate", "")
                    msg_time = m.get("timestamp", "")
                    # Use message timestamp as it's more reliable
                    status["agents"][agent_name] = {
                        "status": agent_state,
                        "task": task[:50],
                        "lastUpdate": msg_time
                    }
    
    # Ensure all agents exist
    for agent in ["PM", "DEVOPS", "DEV", "QA", "CHECKER", "ARCH", "REQ", "UI_DESIGNER"]:
        if agent not in status["agents"]:
            status["agents"][agent] = {"status": "idle", "task": "等待任务", "lastUpdate": ""}
    
    return status

def read_agent_messages(hours: int = 72) -> list:
    """Read and filter agent messages from agent-messages.json"""
    msg_file = REPO_PATH / "agents/project-admin/logs/agent-messages.json"
    if not msg_file.exists():
        return []
    
    messages = json.loads(msg_file.read_text())
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    # Filter by time AND agent-to-agent only (no system)
    filtered = []
    for m in messages:
        created = datetime.fromisoformat(m["timestamp"].replace("Z", "+00:00"))
        if created < cutoff:
            continue
        # Only agent-to-agent messages
        if m["to"].lower() in ["system", ""] or m["from"].lower() in ["system"]:
            continue
        filtered.append(m)
    
    return filtered

def build_html(status: dict, messages: list) -> str:
    """Build dashboard HTML"""
    
    # Agent icons
    icons = {
        "PM": "🧑💼", "DEVOPS": "🔧", "DEV": "🤖",
        "QA": "🔍", "CHECKER": "✓", "ARCH": "🏗️", "REQ": "📝"
    }
    
    # Build agents HTML
    agents_html = ""
    for agent in ["PM", "DEVOPS", "DEV", "QA", "CHECKER", "ARCH", "REQ"]:
        agent_data = status.get("agents", {}).get(agent, {"status": "idle", "task": "等待任务"})
        s = agent_data["status"]
        task = agent_data["task"]
        running = "running" if s == "running" else ""
        agents_html += f'''<div class="agent{' running' if running else ''}">
            <div class="agent-icon">{icons.get(agent, "❓")}</div>
            <div class="agent-name">{agent}</div>
            <div class="agent-task">{task[:30]}</div>
            <span class="status-badge {'status-running' if running else 'status-idle'}">{s}</span>
        </div>'''
    
    # Build messages HTML with GMT+8 time (newest first)
    messages_html = ""
    for m in reversed(messages[-20:]):  # Last 20 messages, reversed to show newest first
        mtype = m.get("type", "default")
        utc_time = datetime.fromisoformat(m["timestamp"].replace("Z", "+00:00"))
        gmt8 = utc_time + timedelta(hours=8)
        time_str = gmt8.strftime("%H:%M")
        messages_html += f'''<div class="message-item msg-{mtype}">
            <div class="message-time">{time_str}</div>
            <div class="message-content">{m['from']} → {m['to']}: {m['message'][:60]}</div>
        </div>'''
    
    if not messages_html:
        messages_html = '<div class="message-item msg-default">暂无消息</div>'
    
    now_gmt8 = datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d %H:%M:%S")
    
    return f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Agent Dashboard</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box }}
        body {{ font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #e0e0e0; padding: 20px }}
        .container {{ max-width: 1400px; margin: 0 auto }}
        h1 {{ text-align: center; color: #4ade80; margin-bottom: 20px }}
        .card {{ background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px }}
        .agent-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px }}
        .agent {{ background: rgba(0,0,0,0.3); border-radius: 10px; padding: 12px; text-align: center; border: 2px solid rgba(255,255,255,0.1) }}
        .agent.running {{ border-color: #4ade80; box-shadow: 0 0 15px rgba(74,222,128,0.3) }}
        .agent-icon {{ font-size: 1.6em }}
        .agent-name {{ font-weight: bold; font-size: 0.9em }}
        .agent-task {{ font-size: 0.75em; color: #9ca3af }}
        .status-badge {{ padding: 2px 6px; border-radius: 3px; font-size: 0.7em }}
        .status-running {{ background: #4ade80; color: #1a1a2e }}
        .status-idle {{ background: rgba(255,255,255,0.1); color: #9ca3af }}
        .message-list {{ max-height: 400px; overflow-y: auto }}
        .message-item {{ background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px; margin-bottom: 8px; border-left: 3px solid }}
        .msg-done {{ border-left-color: #4ade80 }}
        .msg-assign {{ border-left-color: #fbbf24 }}
        .msg-received {{ border-left-color: #60a5fa }}
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
            <h2 style="color:#4ade80;margin-bottom:15px">💬 Agent Messages</h2>
            <div class="message-list">{messages_html}</div>
        </div>
        
        <div class="refresh">Updated: {now_gmt8} (GMT+8) | Source: agent-status.json</div>
    </div>
</body>
</html>'''

def update_dashboard():
    """Main function to update dashboard"""
    status = read_agent_status()
    messages = read_agent_messages(hours=72)
    
    html = build_html(status, messages)
    
    dashboard_path = REPO_PATH / "multi-agent-dashboard.html"
    dashboard_path.write_text(html)
    print(f"✅ Dashboard written: {len(messages)} messages, {len(status.get('agents', {}))} agents")
    
    # Auto-commit and push
    import subprocess
    try:
        subprocess.run(["git", "add", "multi-agent-dashboard.html"], cwd=REPO_PATH, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", f"skill: dashboard update {datetime.now().strftime('%H:%M')}"], cwd=REPO_PATH, check=True, capture_output=True)
        subprocess.run(["git", "push", "origin", "main"], cwd=REPO_PATH, check=True, capture_output=True)
        print("✅ Pushed to GitHub")
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Git: {e}")

if __name__ == "__main__":
    update_dashboard()
