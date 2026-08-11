#!/usr/bin/env python3
"""
增强版 Project Admin - 从 GitHub Issues + Commits 推断 Agent 状态
不依赖心跳文件
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import re

# 配置
DASHBOARD_FILE = "/workspace/projects/workspace/multi-agent-dashboard.html"
REPO_PATH = "/workspace/projects/workspace"
GITHUB_REPO = "jchu-hk/school-admin-system"
# Agent 分配关键词
AGENT_KEYWORDS = {
    "PM": ["pm:", "PM:", "pm", "PM"],
    "DEV": ["dev:", "DEV:", "feat(", "fix(", "refactor(", "chore("],
    "QA": ["qa:", "QA:", "test", "测试", "验收"],
    "DEVOPS": ["devops:", "DEVOPS:", "ops:", "OPS:", "deploy", "deployed", "部署"],
    "CHECKER": ["checker:", "CHECKER:", "review", "审查"],
    "ARCH": ["arch:", "ARCH:", "design", "设计"],
    "REQ": ["req:", "REQ:", "spec", "需求"],
}


class GitHubAPI:
    """GitHub API调用"""

    @staticmethod
    def run_gh_command(cmd: List[str]) -> Optional[str]:
        """运行gh命令"""
        try:
            result = subprocess.run(
                cmd,
                cwd=REPO_PATH,
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0:
                return result.stdout
            return None
        except subprocess.TimeoutExpired:
            return None

    @staticmethod
    def get_in_progress_issues() -> List[Dict]:
        """获取所有 in-progress Issues"""
        output = GitHubAPI.run_gh_command([
            "gh", "issue", "list",
            "--repo", GITHUB_REPO,
            "--state", "open",
            "--search", "label:in-progress",
            "--json", "number,title,labels,author,createdAt,assignees",
            "--limit", "50"
        ])
        if output:
            try:
                return json.loads(output)
            except:
                pass
        return []

    @staticmethod
    def get_recent_commits(limit: int = 20) -> List[Dict]:
        """获取最近commits"""
        output = GitHubAPI.run_gh_command([
            "gh", "api", f"repos/{GITHUB_REPO}/commits",
            "--paginate=false",
            "--field", f"per_page={limit}"
        ])
        if output:
            try:
                commits = json.loads(output)
                return [{"sha": c["sha"][:7], "message": c["commit"]["message"], "date": c["commit"]["author"]["date"]} for c in commits]
            except:
                pass
        return []

    @staticmethod
    def get_open_issues() -> List[Dict]:
        """获取所有 open Issues"""
        output = GitHubAPI.run_gh_command([
            "gh", "issue", "list",
            "--repo", GITHUB_REPO,
            "--state", "open",
            "--json", "number,title,labels,author,createdAt",
            "--limit", "100"
        ])
        if output:
            try:
                return json.loads(output)
            except:
                pass
        return []


class DashboardUpdater:
    """Dashboard 更新器"""

    @staticmethod
    def get_current_dashboard() -> str:
        """读取当前 Dashboard"""
        try:
            return Path(DASHBOARD_FILE).read_text(encoding='utf-8')
        except:
            return ""

    @staticmethod
    def infer_agent_status_from_issues_and_commits(issues: List[Dict], commits: List[Dict]) -> Dict[str, Dict]:
        """从 Issues 和 Commits 推断 Agent 状态"""
        agent_status = {
            "PM": {"status": "idle", "task": "调度中枢", "last_activity": None},
            "DEV": {"status": "idle", "task": "开发实现", "last_activity": None},
            "QA": {"status": "idle", "task": "质量验收", "last_activity": None},
            "DEVOPS": {"status": "idle", "task": "运维部署", "last_activity": None},
            "CHECKER": {"status": "idle", "task": "代码审查", "last_activity": None},
            "ARCH": {"status": "idle", "task": "架构设计", "last_activity": None},
            "REQ": {"status": "idle", "task": "需求分析", "last_activity": None},
        }

        # 从 Issues 推断
        for issue in issues:
            labels = [l["name"] for l in issue["labels"]]
            title = issue["title"].lower()

            # 判断负责的 Agent
            agent = None
            for a, keywords in AGENT_KEYWORDS.items():
                if any(kw.lower() in title for kw in keywords):
                    agent = a
                    break

            if agent:
                agent_status[agent]["status"] = "running"
                agent_status[agent]["task"] = f"处理 #{issue['number']}"
                agent_status[agent]["last_activity"] = issue["createdAt"]

        # 从最近 Commits 推断（补充）
        now = datetime.now(timezone.utc)
        for commit in commits:
            msg = commit["message"]
            for agent, keywords in AGENT_KEYWORDS.items():
                if any(kw in msg for kw in keywords):
                    commit_date = datetime.fromisoformat(commit["date"].replace('Z', '+00:00'))
                    if commit_date > now - timedelta(minutes=30):
                        if agent_status[agent]["status"] != "running":
                            agent_status[agent]["status"] = "idle"
                            agent_status[agent]["task"] = f"上次: {commit['sha']}"
                            agent_status[agent]["last_activity"] = commit_date
                    break

        return agent_status

    @staticmethod
    def update_agent_status(html: str, agent_status: Dict[str, Dict]) -> str:
        """更新 Agent 状态部分"""
        now = datetime.now(timezone.utc)

        # 生成 agents JSON
        agents_json = []
        agent_icons = {
            "PM": {"icon": "🧑💼", "color": "#fbbf24"},
            "DEV": {"icon": "🤖", "color": "#60a5fa"},
            "QA": {"icon": "🔍", "color": "#4ade80"},
            "DEVOPS": {"icon": "🔧", "color": "#f97316"},
            "CHECKER": {"icon": "✓", "color": "#a855f7"},
            "ARCH": {"icon": "🏗️", "color": "#6b7280"},
            "REQ": {"icon": "📝", "color": "#ec4899"},
        }

        for agent, data in agent_status.items():
            icon_data = agent_icons.get(agent, {"icon": "❓", "color": "#6b7280"})
            agents_json.append({
                "icon": icon_data["icon"],
                "name": agent,
                "status": data["status"],
                "task": data["task"],
                "color": icon_data["color"]
            })

        # 替换 agents 数组
        import re
        pattern = r'"agents":\s*\[.*?\]'
        new_agents = f'"agents": {json.dumps(agents_json, ensure_ascii=False)}'
        html = re.sub(pattern, new_agents, html, flags=re.DOTALL)

        return html

    @staticmethod
    def update_timestamp(html: str) -> str:
        """更新时间戳"""
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        # Match both real timestamp and $(date) placeholder
        html = re.sub(r'"lastUpdate":\s*"[^"]*"', f'"lastUpdate": "{now}"', html)
        return html

    @staticmethod
    def save_dashboard(html: str):
        """保存 Dashboard 并同步到 nginx /agents"""
        Path(DASHBOARD_FILE).write_text(html, encoding='utf-8')
        # 同步到 nginx /agents 路径，确保单一数据源
        agents_html = "/var/www/html/agents.html"
        try:
            Path(agents_html).write_text(html, encoding='utf-8')
        except PermissionError:
            subprocess.run(["sudo", "cp", DASHBOARD_FILE, agents_html], check=False, timeout=10)

    @staticmethod
    def commit_and_push():
        """提交并推送到 GitHub"""
        try:
            subprocess.run(
                ["git", "add", "multi-agent-dashboard.html"],
                cwd=REPO_PATH,
                check=True,
                timeout=30
            )
            subprocess.run(
                ["git", "commit", "-m", "chore: update multi-agent-dashboard (auto)"],
                cwd=REPO_PATH,
                check=True,
                timeout=30
            )
            subprocess.run(
                ["git", "push"],
                cwd=REPO_PATH,
                check=True,
                timeout=60
            )
            return True
        except:
            return False

    @staticmethod
    def is_dashboard_changed(new_html: str) -> bool:
        """检查 Dashboard 是否有变化"""
        try:
            old_html = Path(DASHBOARD_FILE).read_text(encoding='utf-8')
            return old_html != new_html
        except:
            return True


def main():
    """主流程"""
    print(f"=== Project Admin Starting ===")
    print(f"Time: {datetime.now(timezone.utc).isoformat()}")

    # 1. 获取 GitHub 数据
    issues = GitHubAPI.get_in_progress_issues()
    print(f"📊 Found {len(issues)} in-progress issues")

    commits = GitHubAPI.get_recent_commits(limit=20)
    print(f"📊 Commits: {len(commits)}")

    open_issues = GitHubAPI.get_open_issues()
    print(f"📊 Open issues: {len(open_issues)}")

    # 2. 推断 Agent 状态
    agent_status = DashboardUpdater.infer_agent_status_from_issues_and_commits(issues, commits)

    # 3. 更新 Dashboard
    print("\n=== Updating Dashboard ===")
    html = DashboardUpdater.get_current_dashboard()
    if not html:
        print("❌ Dashboard file not found")
        return

    html = DashboardUpdater.update_agent_status(html, agent_status)
    html = DashboardUpdater.update_timestamp(html)

    if DashboardUpdater.is_dashboard_changed(html):
        DashboardUpdater.save_dashboard(html)
        print("✅ Dashboard updated")

        # 自动提交（仅在上午或晚上，避免频繁提交）
        hour = datetime.now().hour
        if hour in [9, 18]:
            if DashboardUpdater.commit_and_push():
                print("✅ Committed and pushed")
            else:
                print("⚠️ Failed to commit/push")
        else:
            print("ℹ️ Dashboard updated, waiting for scheduled commit")
    else:
        print("ℹ️ Dashboard unchanged")

    print("\n=== Project Admin Completed ===")

    # 输出状态摘要
    print("\n🤖 Agent Status:")
    for agent, data in agent_status.items():
        status_icon = "🔄" if data["status"] == "running" else "💤"
        print(f"  {status_icon} {agent}: {data['status']} - {data['task']}")


if __name__ == "__main__":
    main()