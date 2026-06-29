#!/usr/bin/env python3
"""
Write agent message to unified message log.
This should be called by ALL agents when they communicate.

Usage:
  python write_agent_message.py --from PM --to DEVOPS --message "派发任务: healthcheck" --type assign

Features:
- Writes to agent-messages.json
- Auto-updates dashboard after each message
"""

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

MESSAGE_FILE = Path("/workspace/projects/workspace/agents/project-admin/logs/agent-messages.json")
SKILL_DIR = Path("/workspace/projects/workspace/skills/multi-agent-dashboard/scripts")

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
    if auto_update_dashboard:
        try:
            result = subprocess.run(
                ["python3", str(SKILL_DIR / "update_dashboard.py"), "--repo", "jchu-hk/school-admin-system"],
                capture_output=True, text=True, timeout=60,
                cwd=str(SKILL_DIR.parent.parent)
            )
            if result.returncode == 0:
                print("✅ Dashboard auto-updated")
            else:
                print(f"⚠️ Dashboard update failed: {result.stderr[:100]}")
        except Exception as e:
            print(f"⚠️ Dashboard auto-update error: {e}")
    
    return new_msg

def main():
    parser = argparse.ArgumentParser(description="Write agent message to unified log")
    parser.add_argument("--from", dest="from_agent", required=True, help="Sender agent (PM/DEV/QA/DEVOPS/etc)")
    parser.add_argument("--to", dest="to_agent", required=True, help="Receiver agent")
    parser.add_argument("--message", required=True, help="Message content")
    parser.add_argument("--type", dest="msg_type", default="default", 
                        choices=["assign", "received", "done", "failed", "passed", "info", "default"],
                        help="Message type")
    parser.add_argument("--status", dest="agent_status", default=None,
                        choices=["running", "idle", "done", "failed"],
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