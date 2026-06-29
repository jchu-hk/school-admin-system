#!/usr/bin/env python3
"""
Update multi-agent dashboard from GitHub Events + heartbeat files.
Usage: python update_dashboard.py --repo jchu-hk/school-admin-system
"""

import argparse
import json
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import sys

sys.path.insert(0, str(Path(__file__).parent))
from infer_status import infer_status, AGENT_CONFIG

REPO_PATH = "/workspace/projects/workspace"

def gh_api(endpoint: str, repo: str) -> Optional[List]:
    try:
        r = subprocess.run(["gh", "api", f"repos/{repo}/{endpoint}"], capture_output=True, text=True, timeout=30)
        return json.loads(r.stdout) if r.returncode == 0 else None
    except:
        return None

def get_in_progress_issues(repo: str) -> List[Dict]:
    try:
        r = subprocess.run(["gh", "issue", "list", "--repo", repo, "--state", "open", "--label", "in-progress", "--json", "number,title,labels", "--limit", "50"], cwd=REPO_PATH, capture_output=True, text=True)
        return json.loads(r.stdout) if r.returncode == 0 else []
    except:
        return []

def get_open_count(repo: str) -> int:
    try:
        r = subprocess.run(["gh", "issue", "list", "--repo", repo, "--state", "open", "--json", "number", "--limit", "100"], cwd=REPO_PATH, capture_output=True, text=True)
        return len(json.loads(r.stdout)) if r.returncode == 0 else 0
    except:
        return 0

def get_recent_commits(repo: str, limit=10) -> List[Dict]:
    out = gh_api(f"commits?per_page={limit}", repo)
    if out:
        return [{"sha": c["sha"][:7], "message": c["commit"]["message"].split("\n")[0], "date": c["commit"]["author"]["date"]} for c in out]
    return []

def build_messages(repo: str, hours=48) -> List[Dict]:
    messages = []
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    # 1. Read from agent-messages.json (direct agent communication)
    agent_msg_file = Path(REPO_PATH) / "agents/project-admin/logs/agent-messages.json"
    if agent_msg_file.exists():
        agent_messages = json.loads(agent_msg_file.read_text())
        for m in agent_messages:
            created = datetime.fromisoformat(m["timestamp"].replace("Z", "+00:00"))
            if created >= cutoff:
                messages.append(m)
    
    # 2. Issue events (closed, assigned, labeled)
    events = gh_api("issues/events?per_page=100", repo)
    if events:
        for event in events:
            created = datetime.fromisoformat(event["created_at"].replace("Z", "+00:00"))
            if created < cutoff: continue
            
            etype = event.get("event", "")
            issue = event.get("issue", {})
            num = issue.get("number", "")
            labels = [l.get("name","") for l in issue.get("labels",[])]
            
            if etype == "closed":
                messages.append({"timestamp": event["created_at"], "from": "PM", "to": "system", "message": f"#{num} closed", "type": "done"})
            elif etype == "assigned":
                assignee = event.get("assignee", {}).get("login", "DEV")
                messages.append({"timestamp": event["created_at"], "from": "PM", "to": assignee.upper(), "message": f"派发任务 #{num}", "type": "assign"})
            elif etype == "labeled":
                label = event.get("label", {}).get("name", "")
                if "in-progress" in label:
                    messages.append({"timestamp": event["created_at"], "from": "system", "to": "PM", "message": f"#{num} in-progress", "type": "received"})
                elif "qa" in label.lower():
                    messages.append({"timestamp": event["created_at"], "from": "PM", "to": "QA", "message": f"PM→QA assign #{num}", "type": "assign"})
    
    # 2. Commit messages (parse for issue refs)
    commits = gh_api("commits?since=" + cutoff.strftime("%Y-%m-%dT%H:%M:%SZ") + "&per_page=100", repo)
    if commits:
        for commit in commits:
            msg = commit.get("commit", {}).get("message", "")
            sha = commit.get("sha", "")[:7]
            created = datetime.fromisoformat(commit["commit"]["author"]["date"].replace("Z", "+00:00"))
            
            # Detect agent from commit message
            agent = "DEV"
            if any(k in msg.lower() for k in ["pm:", "chore:", "docs:"]):
                agent = "PM"
            elif any(k in msg.lower() for k in ["test:", "qa:"]):
                agent = "QA"
            elif any(k in msg.lower() for k in ["deploy:", "infra:"]):
                agent = "DEVOPS"
            
            # Parse issue number from commit message
            import re
            issue_match = re.search(r'#(\d+)', msg)
            if issue_match:
                issue_num = issue_match.group(1)
                short_msg = msg.split('\n')[0][:50]
                messages.append({"timestamp": created.strftime("%Y-%m-%dT%H:%M:%SZ"), "from": agent, "to": "PM", "message": f"{sha}: {short_msg} (#{issue_num})", "type": "done"})
            else:
                short_msg = msg.split('\n')[0][:50]
                messages.append({"timestamp": created.strftime("%Y-%m-%dT%H:%M:%SZ"), "from": agent, "to": "system", "message": f"{sha}: {short_msg}", "type": "done"})
    
    # 3. Issue comments (dev->pm, qa->pm, etc)
    issues = gh_api("issues?state=all&per_page=30", repo)
    if issues:
        for issue in issues:
            comments = gh_api(f"issues/{issue.get('number')}/comments?per_page=10", repo)
            if comments:
                for comment in comments:
                    created = datetime.fromisoformat(comment["created_at"].replace("Z", "+00:00"))
                    if created < cutoff: continue
                    
                    user = comment.get("user", {}).get("login", "unknown").upper()
                    body = comment.get("body", "")[:40]
                    num = issue.get("number", "")
                    
                    messages.append({"timestamp": comment["created_at"], "from": user, "to": "PM", "message": f"comment #{num}: {body}", "type": "received"})
    
    messages.sort(key=lambda m: m["timestamp"], reverse=True)
    return messages[:50]

def build_html(status: Dict, messages: List, commits: List, stats: Dict) -> str:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    agents_html = ""
    for agent, s in status.items():
        icon = AGENT_CONFIG[agent]["icon"]
        running = s["status"] == "running"
        agents_html += f'''<div class="agent{(' running' if running else '')}">
            <div class="agent-icon">{icon}</div>
            <div class="agent-name">{agent}</div>
            <div class="agent-task">{s['task'][:30]}</div>
            <span class="status-badge {('status-running' if running else 'status-idle')}">{s['status']}</span>
        </div>'''
    
    # Filter: only show Agent-to-Agent (skip system)
    agent_to_agent = [m for m in messages if m['to'] not in ['system', 'SYSTEM'] and m['from'] not in ['system', 'SYSTEM']]
    
    messages_html = ""
    for m in agent_to_agent:
        mtype = m.get("type", "default")
        # Convert UTC to GMT+8
        utc_time = datetime.fromisoformat(m['timestamp'].replace('Z', '+00:00'))
        gmt8_time = utc_time + timedelta(hours=8)
        time_str = gmt8_time.strftime('%H:%M')  # Just show hour:minute
        messages_html += f'''<div class="message-item msg-{mtype}">
            <div class="message-time">{time_str}</div>
            <div class="message-content">{m['from']} → {m['to']}: {m['message']}</div>
        </div>'''
    
    # 生成JSON供JavaScript使用 (已过滤，GMT+8时间)
    messages_for_js = []
    for m in agent_to_agent:
        utc_time = datetime.fromisoformat(m['timestamp'].replace('Z', '+00:00'))
        gmt8_time = utc_time + timedelta(hours=8)
        messages_for_js.append({
            "timestamp": gmt8_time.strftime('%Y-%m-%dT%H:%M:%S'),
            "from": m['from'],
            "to": m['to'],
            "message": m['message'],
            "type": m.get('type', 'default')
        })
    messages_json = json.dumps(messages_for_js, ensure_ascii=False)
    
    commits_html = ""
    for c in commits[:8]:
        commits_html += f'''<div class="commit-item">
            <span style="color:#60a5fa">{c['sha']}</span> {c['message'][:40]}
        </div>'''
    
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
        .message-filters {{ display: flex; gap: 8px; margin-bottom: 15px }}
        .filter-btn {{ background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #9ca3af; padding: 5px 12px; border-radius: 5px; cursor: pointer; font-size: 0.85em; transition: all 0.2s }}
        .filter-btn:hover, .filter-btn.active {{ background: rgba(74,222,128,0.2); border-color: #4ade80; color: #4ade80 }}
        .message-list {{ max-height: 400px; overflow-y: auto }}
        .message-item {{ background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px; margin-bottom: 8px; border-left: 3px solid }}
        .msg-done {{ border-left-color: #4ade80 }}
        .msg-assign {{ border-left-color: #fbbf24 }}
        .msg-received {{ border-left-color: #60a5fa }}
        .msg-info {{ border-left-color: #a855f7 }}
        .msg-default {{ border-left-color: #6b7280 }}
        .stat-item {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1) }}
        .stat-value {{ color: #4ade80 }}
        .commit-item {{ padding: 6px 0; font-size: 0.85em }}
        .refresh {{ text-align: center; color: #6b7280; font-size: 0.8em }}
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
            <h2 style="color:#4ade80;margin-bottom:15px">💬 Messages <span id="msgCount"></span></h2>
            <div class="message-filters">
                <button class="filter-btn active" onclick="setPeriod('today')">今天</button>
                <button class="filter-btn" onclick="setPeriod('yesterday')">昨天</button>
                <button class="filter-btn" onclick="setPeriod('2days')">过去2天</button>
                <button class="filter-btn" onclick="setPeriod('all')">全部</button>
            </div>
            <div class="message-list" id="messageList">{messages_html}</div>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
            <div class="card">
                <h2 style="color:#4ade80;margin-bottom:15px">📊 Stats</h2>
                <div class="stat-item"><span>Open</span><span class="stat-value">{stats['open']}</span></div>
                <div class="stat-item"><span>In Progress</span><span class="stat-value">{stats['in_progress']}</span></div>
                <div class="stat-item"><span>Today Commits</span><span class="stat-value">{stats['commits']}</span></div>
            </div>
            <div class="card">
                <h2 style="color:#4ade80;margin-bottom:15px">📝 Commits</h2>
                {commits_html}
            </div>
        </div>
        
        <div class="refresh">Refreshed: {now} | Source: GitHub Events</div>
    </div>
    <script>
    const ALL_MESSAGES = {messages_json};
    let currentPeriod = 'today';
    
    function setPeriod(period) {{
        currentPeriod = period;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        renderMessages();
    }}
    
    function renderMessages() {{
        const now = new Date();
        const filtered = ALL_MESSAGES.filter(m => {{
            const d = new Date(m.timestamp);
            const days = (now - d) / 86400000;
            if (currentPeriod === 'today') return days < 1;
            if (currentPeriod === 'yesterday') return days >= 1 && days < 2;
            if (currentPeriod === '2days') return days < 2;
            return true;
        }});
        document.getElementById('msgCount').textContent = `(${{filtered.length}} 条)`;
        document.getElementById('messageList').innerHTML = filtered.map(m => `
            <div class="message-item msg-${{m.type || 'default'}}">
                <div class="message-time">${{m.timestamp.substring(0,16)}}</div>
                <div class="message-content">${{m.from}} → ${{m.to}}: ${{m.message}}</div>
            </div>
        `).join('') || '<div style="color:#6b7280;text-align:center;padding:20px">暂无消息</div>';
    }}
    
    renderMessages();
    </script>
</body>
</html>'''

def update_dashboard(repo: str, branch: str = "main"):
    status = infer_status(repo)
    stats = {
        "open": get_open_count(repo),
        "in_progress": len(get_in_progress_issues(repo)),
        "commits": len(get_recent_commits(repo, 50))
    }
    messages = build_messages(repo)
    commits = get_recent_commits(repo, 10)
    html = build_html(status, messages, commits, stats)
    
    Path(REPO_PATH, "multi-agent-dashboard.html").write_text(html)
    print("✅ Dashboard written")
    
    try:
        # 确保在main分支
        subprocess.run(["git", "checkout", branch], cwd=REPO_PATH, check=True, capture_output=True)
        
        # 提交并推送
        subprocess.run(["git", "add", "multi-agent-dashboard.html"], cwd=REPO_PATH, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", f"skill: dashboard update {datetime.now().strftime('%H:%M')}"], cwd=REPO_PATH, check=True, capture_output=True)
        subprocess.run(["git", "push", "origin", branch], cwd=REPO_PATH, check=True, capture_output=True)
        print(f"✅ Pushed to {branch}")
    except Exception as e:
        print(f"⚠️ Git: {e}")
    
    return status

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--branch", default="main")
    args = parser.parse_args()
    
    print(f"=== Multi-Agent Dashboard Skill === {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    status = update_dashboard(args.repo, args.branch)
    
    for agent, s in status.items():
        icon = AGENT_CONFIG[agent]["icon"]
        print(f"{icon} {agent}: {s['status']} - {s['task'][:30]}")

if __name__ == "__main__":
    main()