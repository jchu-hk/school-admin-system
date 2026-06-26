#!/usr/bin/env python3
"""
Project Admin Agent - Agent Coordinator
功能: 协调Agent状态，更新Dashboard，跟踪任务进度
不使用LLM，纯脚本逻辑
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
import re

# 配置
HEARTBEAT_DIR = "/tmp"
DASHBOARD_FILE = "/workspace/projects/workspace/multi-agent-dashboard.html"
REPO_PATH = "/workspace/projects/workspace"
GITHUB_REPO = "jchu-hk/school-admin-system"
MAX_AGE_SECONDS = 600  # 10分钟无心跳视为挂起

# Agent列表
AGENT_ROLES = [
    {"id": "PM", "name": "PM", "task": "调度中枢"},
    {"id": "DEV", "name": "Dev Agent", "task": "开发实现"},
    {"id": "QA", "name": "QA Agent", "task": "质量验收"},
    {"id": "DEVOPS", "name": "Devops Agent", "task": "运维部署"},
    {"id": "CHECKER", "name": "Checker Agent", "task": "代码审查"},
    {"id": "ARCH", "name": "Arch Agent", "task": "架构设计"},
    {"id": "REQ", "name": "Req Agent", "task": "需求分析"},
    {"id": "PROJECT_ADMIN", "name": "Project Admin", "task": "中央协调者"},
]


class HeartbeatMonitor:
    """心跳文件监控"""

    @staticmethod
    def get_heartbeat_file(agent_id: str, issue_id: str) -> Path:
        return Path(HEARTBEAT_DIR) / f"agent-heartbeat-{agent_id}-{issue_id}.json"

    @staticmethod
    def write_heartbeat(agent_id: str, issue_id: str, status: str, message: str = ""):
        """写心跳文件"""
        file_path = HeartbeatMonitor.get_heartbeat_file(agent_id, issue_id)
        data = {
            "agent_id": agent_id,
            "issue_id": issue_id,
            "status": status,
            "message": message or status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        file_path.write_text(json.dumps(data, indent=2))

    @staticmethod
    def read_heartbeat(file_path: Path) -> Optional[Dict]:
        """读心跳文件"""
        if not file_path.exists():
            return None
        try:
            return json.loads(file_path.read_text())
        except:
            return None

    @staticmethod
    def get_all_heartbeats() -> List[Dict]:
        """获取所有心跳文件"""
        heartbeats = []
        for file_path in Path(HEARTBEAT_DIR).glob("agent-heartbeat-*.json"):
            heartbeat = HeartbeatMonitor.read_heartbeat(file_path)
            if heartbeat:
                # 计算年龄
                timestamp = datetime.fromisoformat(heartbeat["timestamp"])
                age_seconds = (datetime.now(timezone.utc) - timestamp).total_seconds()
                heartbeat["age_seconds"] = age_seconds
                heartbeat["is_stale"] = age_seconds > MAX_AGE_SECONDS
                heartbeats.append(heartbeat)
        return heartbeats


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
        except Exception as e:
            print(f"Error running gh command: {e}", file=sys.stderr)
            return None

    @staticmethod
    def get_in_progress_issues() -> List[Dict]:
        """获取所有in-progress的Issue"""
        output = GitHubAPI.run_gh_command([
            "gh", "issue", "list",
            "--limit", "100",
            "--label", "in-progress",
            "--json", "number,title,state,labels,assignees,url"
        ])
        if not output:
            return []
        return json.loads(output)

    @staticmethod
    def get_recent_commits(limit: int = 20) -> List[Dict]:
        """获取最近commits"""
        output = GitHubAPI.run_gh_command([
            "gh", "api",
            f"repos/{GITHUB_REPO}/commits",
            "--jq", ".[:20] | map({message, author: .author.login, date, url})"
        ])
        if not output:
            return []
        try:
            return json.loads(output)
        except:
            return []

    @staticmethod
    def get_open_issues() -> List[Dict]:
        """获取所有open issues"""
        output = GitHubAPI.run_gh_command([
            "gh", "issue", "list",
            "--limit", "20",
            "--state", "open",
            "--json", "number,title,state,labels,url"
        ])
        if not output:
            return []
        return json.loads(output)


class DashboardUpdater:
    """Dashboard更新器"""

    @staticmethod
    def get_current_dashboard() -> str:
        """读取当前Dashboard"""
        if not os.path.exists(DASHBOARD_FILE):
            raise FileNotFoundError(f"Dashboard file not found: {DASHBOARD_FILE}")
        return Path(DASHBOARD_FILE).read_text()

    @staticmethod
    def update_agent_status(html: str, heartbeats: List[Dict]) -> str:
        """更新Agent状态"""
        # 计算每个Agent的状态
        agent_status = {}
        for role in AGENT_ROLES:
            agent_id = role["id"]
            # 查找该Agent的最新心跳
            agent_heartbeats = [h for h in heartbeats if h["agent_id"] == agent_id]
            if agent_heartbeats:
                # 找最新的
                latest = max(agent_heartbeats, key=lambda x: x["age_seconds"])
                if not latest["is_stale"]:
                    agent_status[agent_id] = {
                        "status": "running",
                        "task": latest.get("message", role["task"])
                    }
                else:
                    agent_status[agent_id] = {
                        "status": "idle",
                        "task": role["task"]
                    }
            else:
                agent_status[agent_id] = {
                    "status": "idle",
                    "task": role["task"]
                }

        # 构建Agent状态HTML
        agent_cards_html = ""
        for role in AGENT_ROLES:
            agent_id = role["id"]
            status = agent_status[agent_id]
            status_emoji = "🟢" if status["status"] == "running" else "⏸️"
            status_text = "运行中" if status["status"] == "running" else "空闲"

            agent_cards_html += f'''
                <div class="agent-card">
                    <div class="agent-name">{role['name']}</div>
                    <div class="agent-status">
                        {status_emoji} {status_text}
                    </div>
                    <div class="agent-task">{status['task']}</div>
                </div>
            '''

        # 替换Agent状态部分
        # 查找 agent-cards 容器并替换
        pattern = r'(<div id="agent-cards">).*?(</div>\s*</div>\s*</div>)'
        replacement = f'\\1{agent_cards_html}\\2'
        return re.sub(pattern, replacement, html, flags=re.DOTALL)

    @staticmethod
    def update_stats(html: str, commits: List[Dict], issues: List[Dict]) -> str:
        """更新统计数据"""
        # 统计
        today_commits = len(commits)
        open_issues = len(issues)
        in_progress_issues = len([i for i in issues if any(l["name"] == "in-progress" for l in i["labels"])])

        # 替换统计数据
        html = re.sub(
            r'今日提交.*?<strong>(\d+)</strong>',
            f'今日提交 <strong>{today_commits}</strong>',
            html
        )
        html = re.sub(
            r'缺陷数.*?<strong>(\d+)</strong>',
            f'缺陷数 <strong>{open_issues}</strong>',
            html
        )

        return html

    @staticmethod
    def update_timestamp(html: str) -> str:
        """更新时间戳"""
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        return re.sub(
            r'最后更新.*?(\d{4}-\d{2}-\d{2}[^<]+)',
            f'最后更新 {now}',
            html
        )

    @staticmethod
    def save_dashboard(html: str):
        """保存Dashboard"""
        Path(DASHBOARD_FILE).write_text(html)
        print(f"✅ Dashboard updated: {DASHBOARD_FILE}")

    @staticmethod
    def commit_and_push():
        """提交并推送到GitHub (只提交Dashboard)"""
        os.chdir(REPO_PATH)
        try:
            # 只添加Dashboard文件
            subprocess.run(["git", "add", "multi-agent-dashboard.html"], check=True, timeout=10)
            # 检查是否有改动
            result = subprocess.run(["git", "diff", "--cached", "--name-only"],
                                  capture_output=True, text=True, timeout=10)
            if result.stdout.strip():
                subprocess.run([
                    "git", "commit", "-m",
                    f"chore: Update dashboard at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}"
                ], check=True, timeout=10)
                subprocess.run(["git", "push", "origin", "main"], check=True, timeout=30)
                print("✅ Dashboard committed and pushed to GitHub")
            else:
                print("ℹ️ Dashboard unchanged, skipping commit")
        except Exception as e:
            print(f"⚠️ Failed to commit/push: {e}")


class ProjectAdmin:
    """Project Admin主逻辑"""

    def __init__(self):
        self.heartbeat_monitor = HeartbeatMonitor()
        self.github_api = GitHubAPI()
        self.dashboard_updater = DashboardUpdater()

    def check_issues(self) -> List[Dict]:
        """检查Issue状态"""
        issues = self.github_api.get_in_progress_issues()
        print(f"📊 Found {len(issues)} in-progress issues")

        for issue in issues:
            issue_id = issue["number"]
            # 查找该Issue的心跳
            heartbeats = self.heartbeat_monitor.get_all_heartbeats()
            issue_heartbeats = [h for h in heartbeats if h["issue_id"] == str(issue_id)]

            if not issue_heartbeats:
                print(f"⚠️ Issue #{issue_id} has no heartbeat - may be stalled")
            else:
                latest = max(issue_heartbeats, key=lambda x: x["age_seconds"])
                if latest["is_stale"]:
                    print(f"⚠️ Issue #{issue_id} heartbeat stale (age: {latest['age_seconds']:.0f}s)")
                else:
                    print(f"✅ Issue #{issue_id} active (age: {latest['age_seconds']:.0f}s)")

        return issues

    def update_dashboard(self):
        """更新Dashboard"""
        print("\n=== Updating Dashboard ===")

        # 获取数据
        heartbeats = self.heartbeat_monitor.get_all_heartbeats()
        commits = self.github_api.get_recent_commits()
        issues = self.github_api.get_open_issues()

        print(f"📊 Heartbeats: {len(heartbeats)}, Commits: {len(commits)}, Issues: {len(issues)}")

        # 读取并更新Dashboard
        html = self.dashboard_updater.get_current_dashboard()
        # html = self.dashboard_updater.update_agent_status(html, heartbeats)  # 禁用 - 破坏HTML结构
        # html = self.dashboard_updater.update_stats(html, commits, issues)  # 禁用 - 破坏HTML结构
        html = self.dashboard_updater.update_timestamp(html)

        # 保存
        self.dashboard_updater.save_dashboard(html)
        self.dashboard_updater.commit_and_push()

    def run(self):
        """主运行逻辑"""
        print("=== Project Admin Starting ===")
        print(f"Time: {datetime.now(timezone.utc).isoformat()}")

        # 检查Issues
        self.check_issues()

        # 更新Dashboard
        self.update_dashboard()

        print("\n=== Project Admin Completed ===")


def main():
    """主入口"""
    import argparse

    parser = argparse.ArgumentParser(description="Project Admin Agent")
    parser.add_argument("--write-heartbeat", nargs=4, metavar=("AGENT_ID", "ISSUE_ID", "STATUS", "MESSAGE"),
                       help="Write heartbeat: AGENT_ID ISSUE_ID STATUS MESSAGE")
    args = parser.parse_args()

    if args.write_heartbeat:
        # 写心跳
        agent_id, issue_id, status, message = args.write_heartbeat
        HeartbeatMonitor.write_heartbeat(agent_id, issue_id, status, message)
        print(f"✅ Heartbeat written: {agent_id}/{issue_id} = {status}")
    else:
        # 运行主逻辑
        admin = ProjectAdmin()
        admin.run()


if __name__ == "__main__":
    main()