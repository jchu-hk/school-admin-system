#!/usr/bin/env python3
"""
Force-reset an agent's status and log a PM reset message.

Purpose: When an agent's task is terminated unexpectedly (crash, timeout, etc.),
the agent cannot call write_message.py itself to set --status idle. PM uses this
script as a safety valve to correct the Dashboard.

Usage:
  python3 reset_agent.py --agent QA --reason "Task terminated unexpectedly"

Effects:
  - Sets the agent's status to "idle" and task to a reset message
  - Logs a special message: PM → SYSTEM: "Reset {AGENT}: {reason}"
  - Re-generates the Dashboard
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

WORKSPACE = Path("/workspace/projects/workspace")
STATUS_FILE = WORKSPACE / "agents/project-admin/logs/agent-status.json"
MESSAGE_FILE = WORKSPACE / "agents/project-admin/logs/agent-messages.json"
DASHBOARD_SCRIPT = WORKSPACE / "skills/multi-agent-dashboard/scripts/update_dashboard.py"

KNOWN_AGENTS = ["PM", "DEVOPS", "DEV", "QA", "CHECKER", "ARCH", "REQ", "UI_DESIGNER"]


def reset_agent(agent: str, reason: str):
    """Force-reset agent status + log a reset message."""
    if agent not in KNOWN_AGENTS:
        print(f"❌ Unknown agent: {agent}. Known: {', '.join(KNOWN_AGENTS)}")
        sys.exit(1)

    # 1. Update agent-status.json
    if STATUS_FILE.exists():
        data = json.loads(STATUS_FILE.read_text())
    else:
        data = {"agents": {}}

    data.setdefault("agents", {})
    data["agents"][agent] = {
        "status": "idle",
        "task": f"[PM RESET] {agent} 状态已重置: {reason}",
        "lastUpdate": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    STATUS_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"✅ Status reset: {agent} → idle")

    # 2. Log a reset message
    messages = json.loads(MESSAGE_FILE.read_text()) if MESSAGE_FILE.exists() else []

    reset_msg = {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "from": "PM",
        "to": "SYSTEM",
        "message": f"🔄 PM Reset {agent}: {reason}",
        "type": "reset",
    }
    messages.append(reset_msg)
    messages = messages[-100:]
    MESSAGE_FILE.write_text(json.dumps(messages, ensure_ascii=False, indent=2))
    print(f"✅ Reset message logged: PM → SYSTEM: Reset {agent}: {reason}")

    # 3. Trigger Dashboard update
    if DASHBOARD_SCRIPT.exists():
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
        except Exception as e:
            print(f"⚠️  Dashboard auto-update error: {type(e).__name__}: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Force-reset an agent's Dashboard status and log a PM reset message."
    )
    parser.add_argument("--agent", required=True, help="Agent to reset")
    parser.add_argument("--reason", default="Task terminated unexpectedly",
                        help="Reason for the reset")
    args = parser.parse_args()
    reset_agent(args.agent, args.reason)


if __name__ == "__main__":
    main()
