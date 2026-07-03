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
TZ_GMT8 = timezone(timedelta(hours=8))


def read_agent_status() -> dict:
    """Read agent status ONLY from agent-status.json (source of truth).

    We intentionally do NOT infer status from agent-messages.json because
    old agent_status fields in that file can overwrite newer 'idle' entries
    (the file is append-only, so stale 'running' entries can appear last).
    """
    status_file = REPO_PATH / "agents/project-admin/logs/agent-status.json"
    if not status_file.exists():
        return {"agents": {}}

    status = json.loads(status_file.read_text())

    # Ensure all known agents exist
    for agent in ["PM", "DEVOPS", "DEV", "QA", "CHECKER", "ARCH", "REQ", "UI_DESIGNER"]:
        if agent not in status.get("agents", {}):
            status["agents"][agent] = {"status": "idle", "task": "等待任务", "lastUpdate": ""}

    return status


def read_agent_messages(hours: int = 72) -> list:
    """Read and filter agent messages from agent-messages.json"""
    msg_file = REPO_PATH / "agents/project-admin/logs/agent-messages.json"
    if not msg_file.exists():
        return []

    messages = json.loads(msg_file.read_text())
    cutoff = datetime.now(TZ_GMT8) - timedelta(hours=hours)

    filtered = []
    for m in messages:
        created = datetime.fromisoformat(m["timestamp"].replace("Z", "+00:00")).astimezone(TZ_GMT8)
        if created < cutoff:
            continue
        if m["to"].lower() in ["system", ""] or m["from"].lower() in ["system"]:
            continue
        filtered.append({**m, "_dt": created})

    return filtered


def _build_msg_items(msgs: list) -> str:
    """Render a list of messages into HTML list items."""
    if not msgs:
        return '<div class="message-item msg-default">暂无消息</div>'
    html = ""
    for m in msgs:
        dt = m["_dt"]
        mtype = m.get("type", "default")
        time_str = dt.strftime("%H:%M")
        html += (
            f'<div class="message-item msg-{mtype}">'
            f'<div class="message-time">{time_str}</div>'
            f'<div class="message-content">'
            f'{m["from"]} \u2192 {m["to"]}: {m["message"][:60]}'
            f'</div></div>'
        )
    return html


def _build_agents_html(status: dict) -> str:
    icons = {
        "PM": "🧑💼", "DEVOPS": "🔧", "DEV": "🤖",
        "QA": "🔍", "CHECKER": "✓", "ARCH": "🏗️",
        "REQ": "📝", "UI_DESIGNER": "🎨"
    }
    html = ""
    for agent in ["PM", "DEVOPS", "DEV", "QA", "CHECKER", "ARCH", "REQ", "UI_DESIGNER"]:
        data = status.get("agents", {}).get(agent, {"status": "idle", "task": "等待任务"})
        s = data["status"]
        task = data["task"]
        running = " running" if s == "running" else ""
        badge_class = "status-running" if s == "running" else "status-idle"
        html += (
            f'<div class="agent{running}">'
            f'<div class="agent-icon">{icons.get(agent, "❓")}</div>'
            f'<div class="agent-name">{agent}</div>'
            f'<div class="agent-task">{task[:30]}</div>'
            f'<span class="status-badge {badge_class}">{s}</span>'
            f'</div>'
        )
    return html


def _build_tab_html(messages: list) -> str:
    """Build T / T-1 tab panel."""
    now = datetime.now(TZ_GMT8)
    today_str = now.strftime("%Y-%m-%d")
    yesterday_str = (now - timedelta(days=1)).strftime("%Y-%m-%d")

    today_msgs, yesterday_msgs = [], []
    for m in reversed(messages):          # newest first
        dt: datetime = m["_dt"]
        date_str = dt.strftime("%Y-%m-%d")
        if date_str == today_str:
            today_msgs.append(m)
        elif date_str == yesterday_str:
            yesterday_msgs.append(m)

    return _build_msg_items(today_msgs), _build_msg_items(yesterday_msgs)


def build_html(status: dict, messages: list) -> str:
    now_gmt8 = datetime.now(TZ_GMT8).strftime("%Y-%m-%d %H:%M:%S")
    agents_html = _build_agents_html(status)
    today_html, yesterday_html = _build_tab_html(messages)

    # JS — all braces escaped as {{}} so they are literal in the f-string
    js = (
        "var _btns=document.querySelectorAll('.tab-btn');"
        "function showTab(id){"
        "var ps=document.querySelectorAll('.tab-panel');"
        "for(var i=0;i<ps.length;i++)ps[i].classList.remove('active');"
        "for(var i=0;i<_btns.length;i++)_btns[i].classList.remove('active');"
        "document.getElementById('tab-'+id).classList.add('active');"
        "for(var i=0;i<_btns.length;i++){"
        "var oc=_btns[i].getAttribute('onclick')||'';"
        "if(oc.indexOf(id)>=0){_btns[i].classList.add('active');break}"
        "}"
        "}"
    )

    return (
"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Agent Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box }
        body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #e0e0e0; padding: 20px }
        .container { max-width: 1400px; margin: 0 auto }
        h1 { text-align: center; color: #4ade80; margin-bottom: 20px }
        .card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px }
        .agent-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px }
        .agent { background: rgba(0,0,0,0.3); border-radius: 10px; padding: 12px; text-align: center; border: 2px solid rgba(255,255,255,0.1) }
        .agent.running { border-color: #4ade80; box-shadow: 0 0 15px rgba(74,222,128,0.3) }
        .agent-icon { font-size: 1.6em }
        .agent-name { font-weight: bold; font-size: 0.9em }
        .agent-task { font-size: 0.75em; color: #9ca3af }
        .status-badge { padding: 2px 6px; border-radius: 3px; font-size: 0.7em }
        .status-running { background: #4ade80; color: #1a1a2e }
        .status-idle { background: rgba(255,255,255,0.1); color: #9ca3af }
        .tab-bar { display: flex; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px }
        .tab-btn { padding: 6px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); color: #9ca3af; cursor: pointer; font-size: 0.85em; transition: all 0.2s }
        .tab-btn.active { background: rgba(74,222,128,0.2); border-color: #4ade80; color: #4ade80; font-weight: bold }
        .tab-btn:hover:not(.active) { background: rgba(255,255,255,0.1); color: #e0e0e0 }
        .tab-panel { display: none }
        .tab-panel.active { display: block }
        .message-list { max-height: 360px; overflow-y: auto }
        .message-item { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px; margin-bottom: 8px; border-left: 3px solid }
        .msg-done { border-left-color: #4ade80 }
        .msg-assign { border-left-color: #fbbf24 }
        .msg-received { border-left-color: #60a5fa }
        .msg-default { border-left-color: #6b7280 }
        .msg-passed { border-left-color: #a78bfa }
        .msg-failed { border-left-color: #f87171 }
        .message-time { font-size: 0.75em; color: #6b7280; margin-bottom: 4px }
        .message-content { font-size: 0.85em; line-height: 1.4 }
        .refresh { text-align: center; color: #6b7280; font-size: 0.8em; margin-top: 20px }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Multi-Agent Dashboard <span style="font-size:0.6em;color:#6b7280">(GMT+8)</span></h1>

        <div class="card">
            <h2 style="color:#4ade80;margin-bottom:15px">👥 Agents</h2>
            <div class="agent-grid">"""
    + agents_html +
"""</div>
        </div>

        <div class="card">
            <h2 style="color:#4ade80;margin-bottom:15px">💬 Agent Messages</h2>
            <div class="tab-bar">
                <button class="tab-btn active" id="btn-t0" onclick="showTab('t0')">📅 T 今日</button>
                <button class="tab-btn" id="btn-t1" onclick="showTab('t1')">📅 T-1 昨日</button>
            </div>
            <div id="tab-t0" class="tab-panel active">
                <div class="message-list">"""
    + today_html +
"""</div>
            </div>
            <div id="tab-t1" class="tab-panel">
                <div class="message-list">"""
    + yesterday_html +
"""</div>
            </div>
        </div>

        <div class="refresh">Updated: """
    + now_gmt8 +
""" (GMT+8) | Source: agent-status.json</div>
    </div>
    <script>"""
    + js +
"""</script>
</body>
</html>"""
    )


def update_dashboard():
    status = read_agent_status()
    messages = read_agent_messages(hours=72)
    html = build_html(status, messages)

    dashboard_path = REPO_PATH / "docs" / "multi-agent-dashboard.html"
    dashboard_path.write_text(html)
    print(f"✅ Dashboard written: {len(messages)} messages, {len(status.get('agents', {}))} agents")

    import subprocess
    try:
        subprocess.run(["git", "add", "docs/multi-agent-dashboard.html"], cwd=REPO_PATH, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "skill: dashboard update " + datetime.now().strftime("%H:%M")], cwd=REPO_PATH, check=True, capture_output=True)
        subprocess.run(["git", "push", "origin", "main"], cwd=REPO_PATH, check=True, capture_output=True)
        print("✅ Pushed to GitHub")
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Git: {e}")


if __name__ == "__main__":
    update_dashboard()
