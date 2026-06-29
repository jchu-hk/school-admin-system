#!/usr/bin/env python3
"""
Write agent message to unified message log.
This should be called by ALL agents when they communicate.

Usage:
  python write_agent_message.py --from PM --to DEVOPS --message "派发任务: healthcheck" --type assign
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

MESSAGE_FILE = Path("/workspace/projects/workspace/agents/project-admin/logs/agent-messages.json")

def write_message(from_agent: str, to_agent: str, message: str, msg_type: str = "default", status: str = None):
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
    
    args = parser.parse_args()
    
    msg = write_message(args.from_agent, args.to_agent, args.message, args.msg_type, args.agent_status)
    
    # Also print for visibility
    print(f"Timestamp: {msg['timestamp']}")
    print(f"Type: {msg['type']}")

if __name__ == "__main__":
    main()