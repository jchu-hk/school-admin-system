#!/usr/bin/env python3
"""
生成自包含的 multi-agent-dashboard.html
包含最新 dashboard-state.json 数据，无 CORS 问题
"""

import json
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

REPO_PATH = "/workspace/projects/workspace"
DASHBOARD_STATE_FILE = f"{REPO_PATH}/agents/project-admin/dashboard-state.json"
DASHBOARD_HTML_FILE = f"{REPO_PATH}/multi-agent-dashboard.html"
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


def get_github_data():
    """从 GitHub 获取数据"""
    issues = []
    commits = []
    try:
        # Issues
        r = subprocess.run(
            ["gh", "issue", "list", "--repo", GITHUB_REPO, "--state", "open",
             "--label", "in-progress", "--json", "number,title,labels,author,createdAt", "--limit", "50"],
            cwd=REPO_PATH, capture_output=True, text=True, timeout=30
        )
        if r.returncode == 0:
            issues = json.loads(r.stdout)

        # Commits
        r = subprocess.run(
            ["gh", "api", f"repos/{GITHUB_REPO}/commits?per_page=20"],
            cwd=REPO_PATH, capture_output=True, text=True, timeout=30
        )
        if r.returncode == 0:
            raw = json.loads(r.stdout)
            commits = [{"sha": c["sha"][:7], "message": c["commit"]["message"],
                       "date": c["commit"]["author"]["date"]} for c in raw]

        # Open issues count
        r = subprocess.run(
            ["gh", "issue", "list", "--repo", GITHUB_REPO, "--state", "open",
             "--json", "number", "--limit", "100"],
            cwd=REPO_PATH, capture_output=True, text=True, timeout=30
        )
        open_count = 0
        if r.returncode == 0:
            open_count = len(json.loads(r.stdout))
    except Exception as e:
        print(f"⚠️ GitHub fetch failed: {e}")
        return None, None, 0

    return issues, commits, open_count


def infer_status(issues, commits):
    """推断 Agent 状态"""
    status = {a: {"status": "idle", "task": t} for a, t in
              [("PM","调度中枢"),("DEV","开发实现"),("QA","质量验收"),
               ("DEVOPS","运维部署"),("CHECKER","代码审查"),
               ("ARCH","架构设计"),("REQ","需求分析")]}

    for issue in (issues or []):
        title = issue.get("title", "").lower()
        for agent, cfg in AGENT_CONFIG.items():
            if any(kw.lower() in title for kw in cfg["keywords"]):
                status[agent] = {"status": "running", "task": f"处理 #{issue.get('number')}"}
                break

    now = datetime.now(timezone.utc)
    for commit in (commits or []):
        msg = commit.get("message", "")
        for agent, cfg in AGENT_CONFIG.items():
            if status[agent]["status"] != "running" and any(kw in msg for kw in cfg["keywords"]):
                dt = datetime.fromisoformat(commit["date"].replace('Z', '+00:00'))
                if dt > now - timedelta(minutes=30):
                    status[agent]["task"] = f"上次: {commit['sha']}"
                    break

    return status


def build_html(agent_status, stats):
    """构建 HTML"""
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
            color: #e0e0e0;
            padding: 20px;
            min-height: 100vh
        }}
        .container {{ max-width: 1400px; margin: 0 auto }}
        h1 {{ text-align: center; color: #4ade80; margin-bottom: 30px; font-size: 2em }}
        .dashboard {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px
        }}
        .card {{
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1)
        }}
        .card h2 {{ color: #4ade80; margin-bottom: 15px; font-size: 1.2em }}
        .agent-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px
        }}
        .agent {{
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            border: 2px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease
        }}
        .agent.running {{
            border-color: #4ade80;
            box-shadow: 0 0 20px rgba(74, 222, 128, 0.3)
        }}
        .agent-icon {{ font-size: 2.5em; margin-bottom: 10px }}
        .agent-name {{ font-weight: bold; font-size: 1.1em; margin-bottom: 5px }}
        .agent-status {{ margin-bottom: 5px; font-size: 0.9em }}
        .agent-task {{ font-size: 0.85em; color: #9ca3af }}
        .stat-item {{
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1)
        }}
        .stat-item:last-child {{ border-bottom: none }}
        .refresh-info {{
            text-align: center;
            margin-top: 30px;
            color: #9ca3af;
            font-size: 0.9em
        }}
        .refresh-btn {{
            background: rgba(74, 222, 128, 0.2);
            color: #4ade80;
            border: 1px solid #4ade80;
            padding: 5px 15px;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 10px
        }}
        .refresh-btn:hover {{ background: rgba(74, 222, 128, 0.3) }}
        .error {{
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid #ef4444;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            text-align: center
        }}
        .loading {{ text-align: center; padding: 20px }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Multi-Agent 实时看板</h1>
        <div id="error"></div>
        <div class="dashboard">
            <div class="card">
                <h2>👥 Agents 状态</h2>
                <div class="agent-grid" id="agents"><div class="loading">加载中...</div></div>
            </div>
            <div class="card">
                <h2>📊 统计</h2>
                <div id="stats"><div class="loading">加载中...</div></div>
            </div>
        </div>
        <div class="refresh-info">
            <span>🔄 自动刷新: 300秒</span>
            <span>|</span>
            <span>最后更新: <span id="lastUpdate">--:--:--</span></span>
            <span>|</span>
            <button class="refresh-btn" onclick="location.reload()">刷新页面</button>
        </div>
    </div>

    <script>
        // 内嵌最新状态数据 (无 CORS 问题)
        const EMBEDDED_STATE = {agents_json};

        function render(state) {{
            if (!state) return;

            const agentsContainer = document.getElementById('agents');
            agentsContainer.innerHTML = state.agents.map(agent => `
                <div class="agent ${{agent.status === 'running' ? 'running' : ''}}">
                    <div class="agent-icon">${{agent.icon}}</div>
                    <div class="agent-name" style="color: ${{agent.color}}">${{agent.name}}</div>
                    <div class="agent-status">
                        ${{agent.status === 'running' ? '🟢 运行中' : '⏸️ 空闲'}}
                    </div>
                    <div class="agent-task">${{agent.task}}</div>
                </div>
            `).join('');

            const statsContainer = document.getElementById('stats');
            const stats = state.stats;
            statsContainer.innerHTML = `
                <div class="stat-item"><span>📌 Open Issues</span><span>${{stats.openIssues}}</span></div>
                <div class="stat-item"><span>📝 Commits (最近)</span><span>${{stats.commits}}</span></div>
                <div class="stat-item"><span>📅 今日 Commits</span><span>${{stats.todayCommits}}</span></div>
                <div class="stat-item"><span>🕐 7天活跃</span><span>${{stats.recentActivity}}</span></div>
            `;

            document.getElementById('lastUpdate').textContent = state.lastUpdate;
            document.getElementById('error').innerHTML = '';
        }}

        // 使用内嵌数据
        render(EMBEDDED_STATE);
    </script>
</body>
</html>"""


def main():
    print(f"=== Generate Dashboard HTML ===")
    print(f"Time: {datetime.now(timezone.utc).isoformat()}")

    # 1. 获取 GitHub 数据
    issues, commits, open_count = get_github_data()
    print(f"📊 Issues (in-progress): {len(issues)}, Open total: {open_count}")
    print(f"📊 Commits: {len(commits)}")

    # 2. 推断状态
    agent_status = infer_status(issues, commits)
    print("\n🤖 Agent Status:")
    for a, s in agent_status.items():
        icon = "🔄" if s["status"] == "running" else "💤"
        print(f"  {icon} {a}: {s['status']} - {s['task']}")

    # 3. 统计数据
    now = datetime.now(timezone.utc)
    today_str = datetime.now().strftime("%Y-%m-%d")
    stats = {
        "openIssues": open_count,
        "commits": len(commits),
        "todayCommits": len([c for c in commits if c["date"].startswith(today_str)]),
        "recentActivity": len([c for c in commits if datetime.fromisoformat(c["date"].replace('Z', '+00:00')) > now - timedelta(days=7)])
    }

    # 4. 生成 HTML
    html = build_html(agent_status, stats)
    Path(DASHBOARD_HTML_FILE).write_text(html, encoding='utf-8')
    print(f"\n✅ Dashboard HTML written: {DASHBOARD_HTML_FILE}")

    # 5. 提交并推送
    try:
        subprocess.run(["git", "add", "multi-agent-dashboard.html"], cwd=REPO_PATH, check=True, timeout=30)
        subprocess.run(["git", "commit", "-m", "chore: update multi-agent-dashboard.html with live data (auto)"],
                       cwd=REPO_PATH, check=True, timeout=30)
        subprocess.run(["git", "push"], cwd=REPO_PATH, check=True, timeout=60)
        print("✅ Committed and pushed")
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Git commit/push failed: {e}")

    print("=== Done ===")


if __name__ == "__main__":
    main()
