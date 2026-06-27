#!/usr/bin/env python3
"""
Project Admin - 生成自包含的 multi-agent-dashboard.html
数据直接嵌入，无 CORS 问题
"""

import json
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional

REPO_PATH = "/workspace/projects/workspace"
GITHUB_REPO = "jchu-hk/school-admin-system"

AGENT_CONFIG = {
    "PM": {"icon": "🧑💼", "color": "#fbbf24", "keywords": ["pm:", "PM:", "pm", "PM"]},
    "DEV": {"icon": "🤖", "color": "#60a5fa", "keywords": ["dev:", "DEV:", "feat(", "fix(", "refactor(", "chore("]},
    "QA": {"icon": "🔍", "color": "#4ade80", "keywords": ["qa:", "QA:", "test", "测试", "验收"]},
    "DEVOPS": {"icon": "🔧", "color": "#f97316", "keywords": ["devops:", "DEVOPS:", "ops:", "OPS:", "deploy", "部署"]},
    "CHECKER": {"icon": "✓", "color": "#a855f7", "keywords": ["checker:", "CHECKER:", "review", "审查"]},
    "ARCH": {"icon": "🏗️", "color": "#6b7280", "keywords": ["arch:", "ARCH:", "design", "设计"]},
    "REQ": {"icon": "📝", "color": "#ec4899", "keywords": ["req:", "REQ:", "spec", "需求"]},
}


def gh(cmd: List[str]) -> Optional[str]:
    try:
        r = subprocess.run(cmd, cwd=REPO_PATH, capture_output=True, text=True, timeout=30)
        return r.stdout if r.returncode == 0 else None
    except:
        return None


def get_in_progress_issues() -> List[Dict]:
    out = gh(["gh", "issue", "list", "--repo", GITHUB_REPO, "--state", "open",
              "--label", "in-progress", "--json", "number,title,labels,author,createdAt", "--limit", "50"])
    return json.loads(out) if out else []


def get_recent_commits(limit=20) -> List[Dict]:
    out = gh(["gh", "api", f"repos/{GITHUB_REPO}/commits?per_page={limit}"])
    if out:
        raw = json.loads(out)
        return [{"sha": c["sha"][:7], "message": c["commit"]["message"],
                 "date": c["commit"]["author"]["date"]} for c in raw]
    return []


def get_open_count() -> int:
    out = gh(["gh", "issue", "list", "--repo", GITHUB_REPO, "--state", "open",
              "--json", "number", "--limit", "100"])
    return len(json.loads(out)) if out else 0


def infer_status(issues: List[Dict], commits: List[Dict]) -> Dict[str, Dict]:
    """从 issue labels 推断 Agent 状态"""
    default_tasks = {"PM": "调度中枢", "DEV": "开发实现", "QA": "质量验收",
                     "DEVOPS": "运维部署", "CHECKER": "代码审查",
                     "ARCH": "架构设计", "REQ": "需求分析"}
    status = {a: {"status": "idle", "task": default_tasks[a]} for a in AGENT_CONFIG}

    # Label 映射：label name -> Agent
    label_to_agent = {
        "dev": "DEV", "qa": "QA", "arch": "ARCH",
        "req": "REQ", "devops": "DEVOPS", "checker": "CHECKER"
    }

    for issue in issues:
        labels = [l.get("name", "") for l in issue.get("labels", [])]
        for label in labels:
            if label in label_to_agent:
                agent = label_to_agent[label]
                status[agent] = {"status": "running", "task": f"处理 #{issue.get('number')} - {issue.get('title', '')[:30]}"}
                break

    now = datetime.now(timezone.utc)
    for commit in commits:
        msg = commit.get("message", "")
        for agent, cfg in AGENT_CONFIG.items():
            if status[agent]["status"] != "running" and any(kw in msg for kw in cfg["keywords"]):
                dt = datetime.fromisoformat(commit["date"].replace('Z', '+00:00'))
                if dt > now - timedelta(minutes=30):
                    status[agent]["task"] = f"上次: {commit['sha']}"
                    break

    return status


def build_html(agent_status: Dict, stats: Dict) -> str:
    agents_json = json.dumps([
        {"icon": AGENT_CONFIG[a]["icon"], "name": a,
         "status": s["status"], "task": s["task"],
         "color": AGENT_CONFIG[a]["color"]}
        for a, s in agent_status.items()
    ], ensure_ascii=False)

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Agent 实时看板</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e0e0e0; padding: 20px; min-height: 100vh
        }}
        .container {{ max-width: 1400px; margin: 0 auto }}
        h1 {{ text-align: center; color: #4ade80; margin-bottom: 30px; font-size: 2em }}
        .dashboard {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px }}
        .card {{ background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.1) }}
        .card h2 {{ color: #4ade80; margin-bottom: 15px; font-size: 1.2em }}
        .agent-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px }}
        .agent {{ background: rgba(0,0,0,0.3); border-radius: 10px; padding: 15px; text-align: center; border: 2px solid rgba(255,255,255,0.1); transition: all 0.3s }}
        .agent.running {{ border-color: #4ade80; box-shadow: 0 0 20px rgba(74,222,128,0.3) }}
        .agent-icon {{ font-size: 2.5em; margin-bottom: 10px }}
        .agent-name {{ font-weight: bold; font-size: 1.1em; margin-bottom: 5px }}
        .agent-status {{ margin-bottom: 5px; font-size: 0.9em }}
        .agent-task {{ font-size: 0.85em; color: #9ca3af }}
        .stat-item {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1) }}
        .stat-item:last-child {{ border-bottom: none }}
        .refresh-info {{ text-align: center; margin-top: 30px; color: #9ca3af; font-size: 0.9em }}
        .refresh-btn {{ background: rgba(74,222,128,0.2); color: #4ade80; border: 1px solid #4ade80; padding: 5px 15px; border-radius: 5px; cursor: pointer; margin-left: 10px }}
        .refresh-btn:hover {{ background: rgba(74,222,128,0.3) }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Multi-Agent 实时看板</h1>
        <div class="dashboard">
            <div class="card"><h2>👥 Agents 状态</h2><div class="agent-grid" id="agents"></div></div>
            <div class="card"><h2>📊 统计</h2><div id="stats"></div></div>
        </div>
        <div class="refresh-info">
            <span>🔄 自动刷新: 300秒</span>
            <span>|</span>
            <span>最后更新: <span id="lastUpdate"></span></span>
            <span>|</span>
            <button class="refresh-btn" onclick="location.reload()">刷新页面</button>
        </div>
    </div>
    <script>
        const STATE = {agents_json};
        const STATS = {{
            "openIssues": {stats['openIssues']},
            "commits": {stats['commits']},
            "todayCommits": {stats['todayCommits']},
            "recentActivity": {stats['recentActivity']}
        }};

        document.getElementById('agents').innerHTML = STATE.map(a => `
            <div class="agent ${{a.status === 'running' ? 'running' : ''}}">
                <div class="agent-icon">${{a.icon}}</div>
                <div class="agent-name" style="color:${{a.color}}">${{a.name}}</div>
                <div class="agent-status">${{a.status === 'running' ? '🟢 运行中' : '⏸️ 空闲'}}</div>
                <div class="agent-task">${{a.task}}</div>
            </div>
        `).join('');

        document.getElementById('stats').innerHTML = [
            ['📌 Open Issues', STATS.openIssues],
            ['📝 Commits (最近)', STATS.commits],
            ['📅 今日 Commits', STATS.todayCommits],
            ['🕐 7天活跃', STATS.recentActivity]
        ].map(([label, val]) => `<div class="stat-item"><span>${{label}}</span><span>${{val}}</span></div>`).join('');

        document.getElementById('lastUpdate').textContent = '{now_str}';
    </script>
</body>
</html>"""


def main():
    print(f"=== Project Admin === {datetime.now().isoformat()}")

    issues = get_in_progress_issues()
    commits = get_recent_commits()
    open_count = get_open_count()
    print(f"📊 In-progress issues: {len(issues)}, Open: {open_count}, Commits: {len(commits)}")

    status = infer_status(issues, commits)
    print("\n🤖 Agent Status:")
    for a, s in status.items():
        print(f"  {'🔄' if s['status']=='running' else '💤'} {a}: {s['status']} - {s['task']}")

    now = datetime.now(timezone.utc)
    today_str = datetime.now().strftime("%Y-%m-%d")
    stats = {
        "openIssues": open_count,
        "commits": len(commits),
        "todayCommits": len([c for c in commits if c["date"].startswith(today_str)]),
        "recentActivity": len([c for c in commits if datetime.fromisoformat(c["date"].replace('Z', '+00:00')) > now - timedelta(days=7)])
    }

    html = build_html(status, stats)
    Path(f"{REPO_PATH}/multi-agent-dashboard.html").write_text(html, encoding='utf-8')
    print(f"\n✅ Dashboard HTML written")

    try:
        subprocess.run(["git", "add", "multi-agent-dashboard.html"], cwd=REPO_PATH, check=True, timeout=30)
        subprocess.run(["git", "commit", "-m", f"chore: update multi-agent-dashboard.html ({datetime.now().strftime('%H:%M')})"],
                       cwd=REPO_PATH, check=True, timeout=30)
        subprocess.run(["git", "push"], cwd=REPO_PATH, check=True, timeout=60)
        print("✅ Pushed to GitHub")
    except Exception as e:
        print(f"⚠️ Push failed: {e}")

    print("=== Done ===")


if __name__ == "__main__":
    main()
