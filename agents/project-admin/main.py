#!/usr/bin/env python3
"""
增强版 Project Admin - 从 GitHub Issues + Commits 推断 Agent 状态
生成 dashboard-state.json 供 Dashboard HTML 读取
"""

import json
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional

# 配置
DASHBOARD_STATE_FILE = "/workspace/projects/workspace/agents/project-admin/dashboard-state.json"
REPO_PATH = "/workspace/projects/workspace"
GITHUB_REPO = "jchu-hk/school-admin-system"

# Agent 图标和颜色
AGENT_CONFIG = {
    "PM": {"icon": "🧑💼", "color": "#fbbf24", "keywords": ["pm:", "PM:", "pm", "PM"]},
    "DEV": {"icon": "🤖", "color": "#60a5fa", "keywords": ["dev:", "DEV:", "feat(", "fix(", "refactor(", "chore("]},
    "QA": {"icon": "🔍", "color": "#4ade80", "keywords": ["qa:", "QA:", "test", "测试", "验收"]},
    "DEVOPS": {"icon": "🔧", "color": "#f97316", "keywords": ["devops:", "DEVOPS:", "ops:", "OPS:", "deploy", "部署"]},
    "CHECKER": {"icon": "✓", "color": "#a855f7", "keywords": ["checker:", "CHECKER:", "review", "审查"]},
    "ARCH": {"icon": "🏗️", "color": "#6b7280", "keywords": ["arch:", "ARCH:", "design", "设计"]},
    "REQ": {"icon": "📝", "color": "#ec4899", "keywords": ["req:", "REQ:", "spec", "需求"]},
}


class GitHubAPI:
    """GitHub API调用"""

    @staticmethod
    def run_gh_command(cmd: List[str]) -> Optional[str]:
        """运行gh命令"""
        try:
            result = subprocess.run(
                cmd, cwd=REPO_PATH, capture_output=True, text=True, timeout=30
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
            "gh", "issue", "list", "--repo", GITHUB_REPO, "--state", "open",
            "--search", "label:in-progress",
            "--json", "number,title,labels,author,createdAt",
            "--limit", "50"
        ])
        return json.loads(output) if output else []

    @staticmethod
    def get_recent_commits(limit: int = 20) -> List[Dict]:
        """获取最近commits"""
        output = GitHubAPI.run_gh_command([
            "gh", "api", "repos/{}/commits?per_page={}".format(GITHUB_REPO, limit)
        ])
        if output:
            commits = json.loads(output)
            return [{"sha": c["sha"][:7], "message": c["commit"]["message"], "date": c["commit"]["author"]["date"]} for c in commits]
        return []

    @staticmethod
    def get_open_issues() -> List[Dict]:
        """获取所有 open Issues"""
        output = GitHubAPI.run_gh_command([
            "gh", "issue", "list", "--repo", GITHUB_REPO, "--state", "open",
            "--json", "number,title,labels",
            "--limit", "100"
        ])
        return json.loads(output) if output else []


class AgentStatusInferencer:
    """Agent 状态推断器"""

    @staticmethod
    def infer_from_issues_and_commits(issues: List[Dict], commits: List[Dict]) -> Dict[str, Dict]:
        """从 Issues 和 Commits 推断 Agent 状态"""
        agent_status = {agent: {"status": "idle", "task": "空闲"} for agent in AGENT_CONFIG}

        # 从 Issues 推断活跃 Agent
        for issue in issues:
            title_lower = issue.get("title", "").lower()
            for agent, config in AGENT_CONFIG.items():
                if any(kw.lower() in title_lower for kw in config["keywords"]):
                    agent_status[agent]["status"] = "running"
                    agent_status[agent]["task"] = f"处理 #{issue.get('number')}"
                    break

        # 从最近 Commits 推断最近活跃
        now = datetime.now(timezone.utc)
        for commit in commits:
            msg = commit.get("message", "")
            commit_date = datetime.fromisoformat(commit["date"].replace('Z', '+00:00'))
            if commit_date > now - timedelta(minutes=30):
                for agent, config in AGENT_CONFIG.items():
                    if agent_status[agent]["status"] != "running" and any(kw in msg for kw in config["keywords"]):
                        agent_status[agent]["task"] = f"上次: {commit['sha']}"
                        break

        # 更新任务描述（空闲时显示默认任务）
        default_tasks = {
            "PM": "调度中枢",
            "DEV": "开发实现",
            "QA": "质量验收",
            "DEVOPS": "运维部署",
            "CHECKER": "代码审查",
            "ARCH": "架构设计",
            "REQ": "需求分析"
        }
        for agent, data in agent_status.items():
            if data["status"] == "idle" and "上次:" not in data["task"]:
                data["task"] = default_tasks.get(agent, "空闲")

        return agent_status


def main():
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
    agent_status = AgentStatusInferencer.infer_from_issues_and_commits(issues, commits)

    # 3. 生成 dashboard-state.json
    print("\n=== Generating Dashboard State ===")
    state = {
        "agents": [
            {
                "icon": AGENT_CONFIG[agent]["icon"],
                "name": agent,
                "status": data["status"],
                "task": data["task"],
                "color": AGENT_CONFIG[agent]["color"]
            }
            for agent, data in agent_status.items()
        ],
        "stats": {
            "openIssues": len(open_issues),
            "commits": len(commits),
            "todayCommits": len([c for c in commits if c["date"].startswith(datetime.now().strftime("%Y-%m-%d"))]),
            "recentActivity": len([c for c in commits if datetime.fromisoformat(c["date"].replace('Z', '+00:00')) > datetime.now(timezone.utc) - timedelta(days=7)])
        },
        "messages": [],  # 可扩展
        "lastUpdate": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "generatedAt": datetime.now(timezone.utc).isoformat()
    }

    Path(DASHBOARD_STATE_FILE).write_text(json.dumps(state, indent=2, ensure_ascii=False))
    print(f"✅ Dashboard state saved: {DASHBOARD_STATE_FILE}")

    # 4. 提交到 GitHub（上午9点或晚上6点）
    hour = datetime.now().hour
    if hour in [9, 18]:
        try:
            subprocess.run(["git", "add", "agents/project-admin/dashboard-state.json"], cwd=REPO_PATH, check=True, timeout=30)
            subprocess.run(["git", "commit", "-m", "chore: update dashboard-state.json (auto)"], cwd=REPO_PATH, check=True, timeout=30)
            subprocess.run(["git", "push"], cwd=REPO_PATH, check=True, timeout=60)
            print("✅ Committed and pushed")
        except Exception as e:
            print(f"⚠️ Failed to commit/push: {e}")
    else:
        print("ℹ️ State updated, waiting for scheduled commit")

    print("\n=== Project Admin Completed ===")

    # 输出状态摘要
    print("\n🤖 Agent Status:")
    for agent, data in agent_status.items():
        status_icon = "🔄" if data["status"] == "running" else "💤"
        print(f"  {status_icon} {agent}: {data['status']} - {data['task']}")


if __name__ == "__main__":
    main()