#!/usr/bin/env python3
"""
Infer agent status from GitHub Events.
Even if agent forgets heartbeat, we can still track activity.

Usage: python infer_status.py --repo jchu-hk/school-admin-system
"""

import argparse
import json
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional

AGENT_CONFIG = {
    "PM": {"icon": "🧑💼", "color": "#fbbf24", "keywords": ["pm:", "chore:", "docs:", "update"]},
    "DEV": {"icon": "🤖", "color": "#60a5fa", "keywords": ["feat:", "fix:", "refactor:"]},
    "QA": {"icon": "🔍", "color": "#4ade80", "keywords": ["test:", "qa:", "verify"]},
    "DEVOPS": {"icon": "🔧", "color": "#f97316", "keywords": ["deploy:", "infra:", "ci"]},
    "CHECKER": {"icon": "✓", "color": "#a855f7", "keywords": ["review:", "audit:"]},
    "ARCH": {"icon": "🏗️", "color": "#6b7280", "keywords": ["arch:", "design:"]},
    "REQ": {"icon": "📝", "color": "#ec4899", "keywords": ["req:", "spec:"]},
}

def gh_api(endpoint: str, repo: str) -> Optional[List]:
    """Call GitHub API"""
    try:
        r = subprocess.run(
            ["gh", "api", f"repos/{repo}/{endpoint}"],
            capture_output=True, text=True, timeout=30
        )
        return json.loads(r.stdout) if r.returncode == 0 else None
    except:
        return None

def infer_from_commits(repo: str, hours: int = 1) -> Dict[str, Dict]:
    """Infer status from recent commits"""
    
    since = (datetime.now(timezone.utc) - timedelta(hours=hours)).strftime("%Y-%m-%dT%H:%M:%SZ")
    commits = gh_api(f"commits?since={since}&per_page=20", repo)
    
    if not commits:
        return {}
    
    status = {}
    
    for commit in commits:
        message = commit.get("commit", {}).get("message", "").lower()
        author = commit.get("commit", {}).get("author", {}).get("name", "")
        
        # Infer agent from commit message pattern
        for agent, config in AGENT_CONFIG.items():
            for keyword in config["keywords"]:
                if keyword in message:
                    status[agent] = {
                        "status": "running",
                        "task": f"Commit: {commit['sha'][:7]}",
                        "evidence": message[:50]
                    }
                    break
        
        # Dashboard update commits = PM activity (even if not labeled)
        if "dashboard" in message or "heartbeat" in message:
            status["PM"] = {
                "status": "running",
                "task": "Dashboard同步",
                "evidence": message[:50]
            }
    
    return status

def infer_from_issues(repo: str) -> Dict[str, Dict]:
    """Infer status from Issue labels and events"""
    
    # Method 1: Check open issues with labels (current state)
    label_to_agent = {
        "dev": "DEV", "qa": "QA", "devops": "DEVOPS",
        "checker": "CHECKER", "arch": "ARCH", "req": "REQ"
    }
    
    status = {}
    
    # Get open issues with in-progress label
    events = gh_api("issues/events?per_page=50", repo)
    if not events:
        return {}
    
    # Track which agents are active from recent events
    recent_cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
    
    for event in events:
        created = datetime.fromisoformat(event["created_at"].replace("Z", "+00:00"))
        if created < recent_cutoff:
            continue
        
        event_type = event.get("event", "")
        issue = event.get("issue", {})
        labels = [l.get("name", "") for l in issue.get("labels", [])]
        
        # Issue closed
        if event_type == "closed":
            status["PM"] = {
                "status": "done",
                "task": f"#{issue.get('number')} 已关闭",
                "evidence": f"Closed: {created.strftime('%H:%M')}"
            }
        
        # in-progress label = agent running
        if "in-progress" in labels:
            for label in labels:
                if label in label_to_agent:
                    agent = label_to_agent[label]
                    status[agent] = {
                        "status": "running",
                        "task": f"#{issue.get('number')} {issue.get('title', '')[:25]}",
                        "evidence": f"in-progress since {created.strftime('%H:%M')}"
                    }
    
    return status

def infer_from_heartbeat_files() -> Dict[str, Dict]:
    """Read heartbeat files from /tmp"""
    
    status = {}
    heartbeat_dir = Path("/tmp")
    
    for f in heartbeat_dir.glob("agent-heartbeat-*.json"):
        try:
            data = json.loads(f.read_text())
            agent = data.get("agent_id", "")
            timestamp = datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))
            
            # Check age (max 10 min)
            age_seconds = (datetime.now(timezone.utc) - timestamp).total_seconds()
            if age_seconds > 600:
                status[agent] = {"status": "stale", "task": data.get("message", ""), "evidence": "Heartbeat stale"}
            else:
                status[agent] = {
                    "status": data.get("status", "running"),
                    "task": data.get("message", ""),
                    "evidence": f"Heartbeat: {data.get('issue_id', '')}"
                }
        except:
            pass
    
    return status

def infer_status(repo: str) -> Dict[str, Dict]:
    """Combine all inference methods
    
    Priority: heartbeat files > agent-messages.json > GitHub Issues
    NOTE: Removed commit inference - use agent-communication skill instead
    """
    
    status = {}
    
    # 1. Heartbeat files (most reliable if present)
    heartbeat_status = infer_from_heartbeat_files()
    status.update(heartbeat_status)
    
    # 2. Agent-messages.json status field (from agent-communication skill)
    agent_msg_file = Path("/workspace/projects/workspace/agents/project-admin/logs/agent-messages.json")
    if agent_msg_file.exists():
        agent_messages = json.loads(agent_msg_file.read_text())
        for m in agent_messages:
            if "agent_status" in m:
                agent_info = m["agent_status"]
                agent_name = agent_info.get("agent", "")
                if agent_name and agent_name not in status:
                    status[agent_name] = {
                        "status": agent_info.get("status", "idle"),
                        "task": agent_info.get("task", ""),
                        "evidence": f"From message: {m.get('message', '')[:30]}"
                    }
    
    # 3. GitHub Issue events (in-progress labels)
    issue_status = infer_from_issues(repo)
    for agent, s in issue_status.items():
        if agent not in status:
            status[agent] = s
    
    # 4. Default: idle (only for agents with no status at all)
    for agent in AGENT_CONFIG:
        if agent not in status:
            status[agent] = {"status": "idle", "task": "等待任务", "evidence": "No activity recorded"}
    
    return status

def main():
    parser = argparse.ArgumentParser(description="Infer agent status from GitHub Events")
    parser.add_argument("--repo", required=True, help="GitHub repo (owner/name)")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    
    args = parser.parse_args()
    
    status = infer_status(args.repo)
    
    if args.json:
        print(json.dumps(status, indent=2, ensure_ascii=False))
    else:
        print("📊 Agent Status Inferred from GitHub Events")
        print("=" * 50)
        for agent, s in status.items():
            icon = AGENT_CONFIG[agent]["icon"]
            status_icon = "✅" if s["status"] == "running" else "💤" if s["status"] == "idle" else "⚠️"
            print(f"{icon} {agent}: {status_icon} {s['status']}")
            print(f"   Task: {s['task']}")
            if s['evidence']:
                print(f"   Evidence: {s['evidence']}")
            print()

if __name__ == "__main__":
    main()