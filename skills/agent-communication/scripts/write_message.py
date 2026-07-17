#!/usr/bin/env python3
"""
Write agent message to unified message log + auto-update GitHub Issue labels.

Usage:
  python write_message.py --from PM --to DEV --message "Fix Issue #199" --type assign --status running

Features:
- Writes to agent-messages.json
- Writes to agent-status.json (Dashboard source of truth)
- Auto-updates GitHub Issue labels:
    --type assign + --status running  → adds in-progress label
    --type passed/failed/done          → removes in-progress, closes if failed
- Auto-updates Dashboard after each message
"""

import argparse
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# Workspace root
WORKSPACE = Path("/workspace/projects/workspace")
GITHUB_REPO = "jchu-hk/school-admin-system"
MESSAGE_FILE = WORKSPACE / "agents/project-admin/logs/agent-messages.json"
STATUS_FILE = WORKSPACE / "agents/project-admin/logs/agent-status.json"
DASHBOARD_SCRIPT = WORKSPACE / "skills/multi-agent-dashboard/scripts/update_dashboard.py"

# Known agent labels on GitHub
GITHUB_AGENT_LABELS = {
    "PM": "pm",
    "DEV": "dev",
    "QA": "qa",
    "DEVOPS": "devops",
    "CHECKER": "checker",
    "ARCH": "arch",
    "REQ": "req",
}


# ---------------------------------------------------------------------------
# GitHub Issue helpers
# ---------------------------------------------------------------------------

def run_gh(args: list, timeout: int = 30) -> Optional[str]:
    """Run a gh command; return stdout or None on failure."""
    try:
        result = subprocess.run(
            ["gh"] + args,
            cwd=str(WORKSPACE),
            capture_output=True, text=True, timeout=timeout
        )
        return result.stdout if result.returncode == 0 else None
    except Exception:
        return None


def extract_issue_numbers(message: str) -> list[int]:
    """Extract all Issue numbers from a message string."""
    return [int(m) for m in re.findall(r'#(\d+)', message)]


def update_github_issue_labels(issue_number: int, msg_type: str, from_agent: str, to_agent: str, message: str) -> None:
    """Auto-update GitHub Issue labels based on message type and agent."""

    labels_to_add = []
    labels_to_remove = []

    if msg_type == "assign":
        labels_to_add.append("in-progress")
        # Label = the agent who WILL DO the work (to_agent), not sender (from_agent)
        agent_label = GITHUB_AGENT_LABELS.get(to_agent)
        if agent_label:
            labels_to_add.append(agent_label)

    elif msg_type in ("passed", "done"):
        labels_to_remove.append("in-progress")
        labels_to_add.append("ready-for-review")

    elif msg_type == "failed":
        labels_to_remove.append("in-progress")

    if labels_to_add:
        labels_str = ",".join(labels_to_add)
        run_gh(["issue", "edit", str(issue_number),
                 "--repo", GITHUB_REPO,
                 "--add-label", labels_str])
        print(f"  🏷️  Added labels: {labels_str}")

    if labels_to_remove:
        labels_str = ",".join(labels_to_remove)
        run_gh(["issue", "edit", str(issue_number),
                 "--repo", GITHUB_REPO,
                 "--remove-label", labels_str])
        print(f"  🏷️  Removed labels: {labels_str}")

    if msg_type == "failed":
        run_gh(["issue", "close", str(issue_number), "--repo", GITHUB_REPO])
        print(f"  🔴 Closed Issue #{issue_number}")


def sync_issue_labels_for_message(from_agent: str, to_agent: str, msg_type: str, message: str) -> None:
    """Extract issue numbers from message and update GitHub labels accordingly."""
    if from_agent not in GITHUB_AGENT_LABELS:
        return
    issue_numbers = extract_issue_numbers(message)
    for issue_number in issue_numbers:
        update_github_issue_labels(issue_number, msg_type, from_agent, to_agent, message)


# ---------------------------------------------------------------------------
# Agent status file
# ---------------------------------------------------------------------------

def write_agent_status(agent: str, status: str, task: str) -> None:
    """Update agent-status.json — this is what the Dashboard reads as source of truth."""
    if STATUS_FILE.exists():
        data = json.loads(STATUS_FILE.read_text())
    else:
        data = {"agents": {}}

    data.setdefault("agents", {})
    data["agents"][agent] = {
        "status": status,
        "task": task[:80],
        "lastUpdate": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    STATUS_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2))


# ---------------------------------------------------------------------------
# Main message writer
# ---------------------------------------------------------------------------

def write_message(
    from_agent: str,
    to_agent: str,
    message: str,
    msg_type: str = "default",
    status: str = None,
    auto_update_dashboard: bool = True,
) -> dict:
    """Write message to unified log + trigger GitHub/Dashboard updates."""

    messages = json.loads(MESSAGE_FILE.read_text()) if MESSAGE_FILE.exists() else []

    new_msg = {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "from": from_agent,
        "to": to_agent,
        "message": message,
        "type": msg_type,
    }

    if status:
        # Each agent always updates its OWN status.
        # PM does NOT set recipient's status — the recipient agent
        # calls write_message itself when it starts/finishes work.
        # This ensures the message log reflects real agent activity.
        new_msg["agent_status"] = {
            "agent": from_agent,
            "status": status,
            "task": message[:80],
        }
        write_agent_status(from_agent, status, message)

    # Auto-update GitHub Issue labels
    sync_issue_labels_for_message(from_agent, to_agent, msg_type, message)

    messages.append(new_msg)
    messages = messages[-100:]

    MESSAGE_FILE.write_text(json.dumps(messages, ensure_ascii=False, indent=2))
    print(f"✅ Message logged: {from_agent} → {to_agent}: {message[:50]}")

    if auto_update_dashboard and DASHBOARD_SCRIPT.exists():
        try:
            result = subprocess.run(
                ["python3", str(DASHBOARD_SCRIPT)],
                capture_output=True, text=True, timeout=60,
                cwd=str(WORKSPACE)
            )
            if result.returncode == 0:
                print("✅ Dashboard auto-updated")
            else:
                print(f"⚠️  Dashboard update failed: {result.stderr[:100]}")
        except subprocess.CalledProcessError as e:
            stderr = e.stderr.decode() if isinstance(e.stderr, bytes) else (e.stderr or '')
            print(f"❌ Dashboard UPDATE FAILED (exit {e.returncode})")
            print(f"   stderr: {stderr[:150]}")
        except Exception as e:
            print(f"⚠️  Dashboard auto-update error: {type(e).__name__}: {e}")
    elif auto_update_dashboard:
        print(f"⚠️  Dashboard script not found: {DASHBOARD_SCRIPT}")

    return new_msg


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Write agent message to unified log + auto-update GitHub labels + Dashboard"
    )
    parser.add_argument(
        "--from", dest="from_agent", required=True,
        choices=list(GITHUB_AGENT_LABELS.keys()),
        help="Sender agent"
    )
    parser.add_argument("--to", dest="to_agent", required=True, help="Receiver agent")
    parser.add_argument("--message", required=True, help="Message content")
    parser.add_argument(
        "--type", dest="msg_type", default="default",
        choices=["assign", "received", "done", "failed", "passed", "info", "default"],
        help="Message type (triggers GitHub label updates)"
    )
    parser.add_argument(
        "--status", dest="agent_status", default=None,
        choices=["running", "idle"],
        help="Agent status (updates Dashboard + adds in-progress label)"
    )
    parser.add_argument(
        "--no-auto-update", dest="no_auto_update", action="store_true",
        help="Skip Dashboard auto-update"
    )
    parser.add_argument(
        "--no-github", dest="no_github", action="store_true",
        help="Skip GitHub Issue label sync"
    )

    args = parser.parse_args()

    msg = write_message(
        args.from_agent,
        args.to_agent,
        args.message,
        args.msg_type,
        args.agent_status,
        auto_update_dashboard=not args.no_auto_update,
    )

    print(f"Timestamp: {msg['timestamp']}")
    print(f"Type: {msg['type']}")


if __name__ == "__main__":
    main()
