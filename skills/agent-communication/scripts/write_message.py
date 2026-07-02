#!/usr/bin/env python3
"""
Write agent message to unified message log.
This should be called by ALL agents when they communicate.

Usage:
  python write_message.py --from PM --to DEVOPS --message "派发任务" --type assign --status running

Features:
- Writes to agent-messages.json
- Auto-updates dashboard after each message (reads local files only)
- Agent status is tracked via --status parameter
"""

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

# Workspace root
WORKSPACE = Path("/workspace/projects/workspace")
MESSAGE_FILE = WORKSPACE / "agents/project-admin/logs/agent-messages.json"
DASHBOARD_SCRIPT = WORKSPACE / "skills/multi-agent-dashboard/scripts/update_dashboard.py"

def write_message(from_agent: str, to_agent: str, message: str, msg_type: str = "default", status: str = None, auto_update_dashboard: bool = True):
    """Write message to unified log"""
    
    # Read existing messages
    if MESSAGE_FILE.exists():
        messages = json.loads(MESSAGE_FILE.read_text())
    else:
        messages = []
    
    # Add new message
    new_msg = {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "from": from_agent,
        "to": to_agent,
        "message": message,
        "type": msg_type
    }
    
    # Add status if provided (for agent state tracking)
    if status:
        new_msg["agent_status"] = {
            "agent": from_agent,
            "status": status,
            "task": message[:50]
        }
    
    messages.append(new_msg)
    
    # Keep only last 100 messages (prevent file too large)
    messages = messages[-100:]
    
    # Write back
    MESSAGE_FILE.write_text(json.dumps(messages, ensure_ascii=False, indent=2))
    print(f"✅ Message logged: {from_agent} → {to_agent}: {message[:50]}")
    
    # Auto-update dashboard after writing message
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
                print(f"⚠️ Dashboard update failed: {result.stderr[:100]}")
        except Exception as e:
            print(f"⚠️ Dashboard auto-update error: {e}")
    elif auto_update_dashboard:
        print(f"⚠️ Dashboard script not found: {DASHBOARD_SCRIPT}")
    
    return new_msg

def main():
    parser = argparse.ArgumentParser(description="Write agent message to unified log")
    parser.add_argument("--from", dest="from_agent", required=True, 
                        choices=["PM", "DEV", "QA", "DEVOPS", "CHECKER", "ARCH", "REQ", "UI_DESIGNER"],
                        help="Sender agent")
    parser.add_argument("--to", dest="to_agent", required=True, help="Receiver agent (PM/DEV/QA/DEVOPS/CHECKER/ARCH/REQ/system)")
    parser.add_argument("--message", required=True, help="Message content")
    parser.add_argument("--type", dest="msg_type", default="default", 
                        choices=["assign", "received", "done", "failed", "passed", "info", "default"],
                        help="Message type")
    parser.add_argument("--status", dest="agent_status", default=None,
                        choices=["running", "idle"],
                        help="Agent status (optional, for state tracking)")
    parser.add_argument("--no-auto-update", dest="no_auto_update", action="store_true",
                        help="Skip dashboard auto-update")
    
    args = parser.parse_args()
    
    msg = write_message(
        args.from_agent, 
        args.to_agent, 
        args.message, 
        args.msg_type, 
        args.agent_status,
        auto_update_dashboard=not args.no_auto_update
    )
    
    print(f"Timestamp: {msg['timestamp']}")
    print(f"Type: {msg['type']}")

if __name__ == "__main__":
    main()