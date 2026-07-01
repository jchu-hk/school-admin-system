#!/usr/bin/env python3
"""
PM Orchestrator - Task Assignment Script

Ensures tasks are properly assigned:
1. Write message to agent-messages.json
2. Spawn the target agent (CRITICAL STEP - AI PM often forgets this)
3. Update GitHub Issue labels
4. Log all actions for audit trail

Usage:
    python3 assign_task.py --from PM --to DEV --issue 193 --message "Fix bug" --spawn
    python3 assign_task.py --from PM --to QA --issue 193 --message "Test fix" --spawn --priority p0
"""

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# Paths
WORKSPACE = Path("/workspace/projects/workspace")
AGENT_COMM_DIR = WORKSPACE / "skills/agent-communication"
LOGS_DIR = WORKSPACE / "agents/project-admin/logs"
HEARTBEAT_DIR = Path("/tmp")

# Ensure logs directory exists
LOGS_DIR.mkdir(parents=True, exist_ok=True)


def log_action(action: str, details: dict):
    """Log action to pm-orchestrator.log"""
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "details": details
    }
    log_file = LOGS_DIR / "pm-orchestrator.log"

    logs = []
    if log_file.exists():
        with open(log_file, 'r') as f:
            try:
                logs = json.load(f)
            except:
                logs = []

    logs.append(log_entry)

    with open(log_file, 'w') as f:
        json.dump(logs[-100:], f, indent=2)  # Keep last 100 logs

    print(f"📝 Log: {action} - {details}")


def write_message(from_agent: str, to_agent: str, message: str,
                  msg_type: str = "assign", status: str = "running"):
    """Write message using agent-communication skill"""
    write_msg_script = AGENT_COMM_DIR / "scripts/write_message.py"

    if not write_msg_script.exists():
        print(f"❌ Error: {write_msg_script} not found")
        sys.exit(1)

    cmd = [
        sys.executable, str(write_msg_script),
        "--from", from_agent,
        "--to", to_agent,
        "--message", message,
        "--type", msg_type,
        "--status", status
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            print(f"❌ Error writing message: {result.stderr}")
            log_action("write_message_failed", {
                "from": from_agent,
                "to": to_agent,
                "error": result.stderr
            })
            sys.exit(1)

        print(f"✅ Message written: {from_agent} → {to_agent}")
        log_action("message_written", {
            "from": from_agent,
            "to": to_agent,
            "message": message[:50]
        })
    except subprocess.TimeoutExpired:
        print("❌ Timeout writing message")
        sys.exit(1)


def spawn_agent(target_agent: str, task: str, issue_id: str):
    """Spawn the target agent - CRITICAL STEP"""

    # Read message file to confirm spawn
    spawn_msg = f"Spawned {target_agent} to work on Issue #{issue_id}: {task[:50]}"

    # Note: We can't directly call sessions_spawn from a script
    # Instead, we write a spawn request that PM (or orchestrator) will execute
    spawn_request_file = WORKSPACE / "tmp/spawn-request.json"

    spawn_request = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "target_agent": target_agent,
        "task": task,
        "issue_id": issue_id,
        "status": "pending"
    }

    with open(spawn_request_file, 'w') as f:
        json.dump(spawn_request, f, indent=2)

    print(f"🚀 Spawn request written: {target_agent} will work on Issue #{issue_id}")
    log_action("spawn_requested", {
        "agent": target_agent,
        "issue": issue_id,
        "task": task[:50]
    })

    # Also update heartbeat for PM to show it's managing this task
    heartbeat_file = HEARTBEAT_DIR / f"agent-heartbeat-PM-{issue_id}.json"
    heartbeat_data = {
        "agent_id": "PM",
        "issue_id": issue_id,
        "status": "running",
        "message": f"Coordinating {target_agent} to fix Issue #{issue_id}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    with open(heartbeat_file, 'w') as f:
        json.dump(heartbeat_data, f, indent=2)


def update_github_issue(issue_id: str, assignee: str = None, label: str = "in-progress"):
    """Update GitHub Issue with labels and assignee (if valid user)"""

    # Add in-progress label
    try:
        cmd = ["gh", "issue", "edit", str(issue_id), "--add-label", label]
        subprocess.run(cmd, capture_output=True, timeout=30)
        print(f"✅ Issue #{issue_id} labeled: {label}")
    except:
        print(f"⚠️  Could not add label to Issue #{issue_id}")

    # Note: assignee only works for real GitHub users, not agent names
    # We'll skip assignee assignment for agents

    log_action("issue_updated", {
        "issue": issue_id,
        "label": label
    })


def main():
    parser = argparse.ArgumentParser(description="PM Orchestrator - Task Assignment")
    parser.add_argument("--from", required=True, dest="from_agent", help="Assigning agent (e.g., PM)")
    parser.add_argument("--to", required=True, dest="to_agent", help="Target agent (e.g., DEV, QA)")
    parser.add_argument("--issue", type=int, required=True, help="GitHub Issue number")
    parser.add_argument("--message", required=True, help="Task description")
    parser.add_argument("--priority", default="p2", help="Priority level (p0, p1, p2, p3)")
    parser.add_argument("--spawn", action="store_true", help="Spawn target agent (CRITICAL)")
    parser.add_argument("--dry-run", action="store_true", help="Don't actually spawn, just show what would happen")
    parser.add_argument("--test", action="store_true", help="Test mode - use test files")

    args = parser.parse_args()

    if args.test:
        print("🧪 TEST MODE - Not actually spawning")
        print(f"Would assign: {args.from_agent} → {args.to_agent}")
        print(f"Issue: #{args.issue}")
        print(f"Task: {args.message}")
        print(f"Priority: {args.priority}")
        print(f"Spawn: {args.spawn}")
        return

    print(f"\n🎯 PM Orchestrator - Task Assignment")
    print(f"{'=' * 50}")
    print(f"From: {args.from_agent}")
    print(f"To: {args.to_agent}")
    print(f"Issue: #{args.issue}")
    print(f"Task: {args.message}")
    print(f"Priority: {args.priority}")
    print(f"Spawn: {args.spawn}")
    print(f"{'=' * 50}\n")

    # Step 1: Write message to agent-messages.json
    task_msg = f"Issue #{args.issue} [{args.priority.upper()}]: {args.message}"
    write_message(args.from_agent, args.to_agent, task_msg, "assign", "running")

    # Step 2: Update GitHub Issue
    update_github_issue(args.issue, label="in-progress")

    # Step 3: Spawn target agent (CRITICAL STEP)
    if args.spawn:
        spawn_agent(args.to_agent, task_msg, args.issue)

    print(f"\n✅ Task assignment complete!")
    print(f"📊 Dashboard will update automatically\n")


if __name__ == "__main__":
    main()