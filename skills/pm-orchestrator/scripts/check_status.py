#!/usr/bin/env python3
"""
PM Orchestrator - Status Check Script

Check if agent is working on assigned task:
1. Check heartbeat file /tmp/agent-heartbeat-{AGENT}-{ISSUE}.json
2. Check latest message in agent-messages.json
3. Alert if timeout exceeded

Usage:
    python3 check_status.py --agent DEV --issue 193 --timeout-minutes 30
    python3 check_status.py --all  # Check all active tasks
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Paths
WORKSPACE = Path("/workspace/projects/workspace")
LOGS_DIR = WORKSPACE / "agents/project-admin/logs"
HEARTBEAT_DIR = Path("/tmp")

DEFAULT_TIMEOUT_MINUTES = 60


def read_heartbeat(agent: str, issue_id: str) -> dict:
    """Read heartbeat file for agent-issue combination"""
    heartbeat_file = HEARTBEAT_DIR / f"agent-heartbeat-{agent}-{issue_id}.json"

    if not heartbeat_file.exists():
        return {"status": "no_heartbeat", "message": "No heartbeat file found"}

    try:
        with open(heartbeat_file, 'r') as f:
            return json.load(f)
    except:
        return {"status": "error", "message": "Failed to read heartbeat"}


def read_latest_message(to_agent: str, limit: int = 10) -> list:
    """Read latest messages from agent-messages.json"""
    msg_file = LOGS_DIR / "agent-messages.json"

    if not msg_file.exists():
        return []

    try:
        with open(msg_file, 'r') as f:
            all_messages = json.load(f)

        # Filter messages to this agent
        filtered = [m for m in all_messages if m.get("to") == to_agent]

        # Return last N messages
        return filtered[-limit:]
    except:
        return []


def check_timeout(heartbeat_data: dict, timeout_minutes: int) -> bool:
    """Check if heartbeat is stale (timeout exceeded)"""

    if heartbeat_data.get("status") in ["done", "failed"]:
        return False  # Task completed, no timeout

    timestamp_str = heartbeat_data.get("timestamp")
    if not timestamp_str:
        return True  # No timestamp = stale

    try:
        timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        age = datetime.now(timezone.utc) - timestamp

        if age > timedelta(minutes=timeout_minutes):
            return True  # Timeout exceeded
    except:
        return True  # Parse error = stale

    return False  # Fresh heartbeat


def format_status_icon(status: str) -> str:
    """Get emoji for status"""
    icons = {
        "running": "🟢",
        "done": "✅",
        "failed": "❌",
        "idle": "💤",
        "no_heartbeat": "⚠️",
        "error": "🔴"
    }
    return icons.get(status, "❓")


def check_agent_status(agent: str, issue_id: int, timeout_minutes: int):
    """Check status of a single agent on an issue"""

    print(f"\n🔍 Checking: {agent} on Issue #{issue_id}")
    print("-" * 50)

    # Check heartbeat
    heartbeat = read_heartbeat(agent, issue_id)
    status = heartbeat.get("status", "unknown")
    message = heartbeat.get("message", "")
    timestamp = heartbeat.get("timestamp", "")

    print(f"Status: {format_status_icon(status)} {status}")
    print(f"Message: {message}")

    if timestamp:
        try:
            dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            age = datetime.now(timezone.utc) - dt
            print(f"Age: {age}")

            # Check timeout
            if check_timeout(heartbeat, timeout_minutes):
                print(f"⚠️  TIMEOUT: Exceeded {timeout_minutes} minutes!")
                return "timeout"
        except:
            pass

    # Check latest messages
    messages = read_latest_message(agent, limit=3)
    if messages:
        print(f"\nLatest messages ({len(messages)}):")
        for msg in messages[-3:]:
            msg_time = msg.get("timestamp", "")[-8:-3]  # Extract HH:MM
            msg_type = msg.get("type", "unknown")
            msg_text = msg.get("message", "")[:60]
            print(f"  [{msg_time}] {msg_type}: {msg_text}...")

    # Determine overall status
    if status == "done":
        return "done"
    elif status == "failed":
        return "failed"
    elif heartbeat.get("status") == "no_heartbeat":
        return "no_heartbeat"
    elif check_timeout(heartbeat, timeout_minutes):
        return "timeout"
    else:
        return "running"


def check_all_active_tasks(timeout_minutes: int):
    """Check all agents with heartbeat files"""

    print("🔍 Checking all active tasks...")

    heartbeat_files = list(HEARTBEAT_DIR.glob("agent-heartbeat-*.json"))

    if not heartbeat_files:
        print("ℹ️  No active tasks (no heartbeat files)")
        return

    results = []

    for hb_file in heartbeat_files:
        # Parse filename: agent-heartbeat-{AGENT}-{ISSUE}.json
        parts = hb_file.stem.split("-")
        if len(parts) >= 4:
            agent = parts[2]
            issue_id = parts[3]

            result = check_agent_status(agent, issue_id, timeout_minutes)
            results.append((agent, issue_id, result))

    # Summary
    print("\n" + "=" * 50)
    print("📊 Summary")
    print("=" * 50)

    by_status = {}
    for agent, issue_id, result in results:
        by_status.setdefault(result, []).append(f"{agent}#{issue_id}")

    for status, items in by_status.items():
        print(f"{format_status_icon(status)} {status.upper()}: {len(items)}")
        for item in items:
            print(f"    - {item}")


def main():
    parser = argparse.ArgumentParser(description="PM Orchestrator - Status Check")
    parser.add_argument("--agent", help="Agent name (e.g., DEV, QA)")
    parser.add_argument("--issue", type=int, help="GitHub Issue number")
    parser.add_argument("--timeout-minutes", type=int, default=DEFAULT_TIMEOUT_MINUTES,
                        help="Timeout threshold (default: 60)")
    parser.add_argument("--all", action="store_true", help="Check all active tasks")
    parser.add_argument("--test", action="store_true", help="Test mode")

    args = parser.parse_args()

    if args.test:
        print("🧪 TEST MODE")
        test_heartbeat = {
            "agent_id": "DEV",
            "issue_id": "193",
            "status": "running",
            "message": "Testing heartbeat",
            "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=65)).isoformat()
        }

        test_file = HEARTBEAT_DIR / "agent-heartbeat-DEV-193.json"
        with open(test_file, 'w') as f:
            json.dump(test_heartbeat, f)

        result = check_agent_status("DEV", 193, 60)
        print(f"\nTest result: {result}")
        return

    if args.all:
        check_all_active_tasks(args.timeout_minutes)
    elif args.agent and args.issue:
        result = check_agent_status(args.agent, args.issue, args.timeout_minutes)
        print(f"\nOverall status: {result}")

        if result == "timeout":
            print("⚠️  Action: Consider escalating or checking on agent")
            sys.exit(1)
    else:
        print("❌ Please specify --all OR (--agent AND --issue)")
        sys.exit(1)


if __name__ == "__main__":
    main()