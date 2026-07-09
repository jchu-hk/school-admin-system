#!/usr/bin/env python3
"""
Validate that agent messages follow the correct format and include proper dashboard updates.

This script checks:
1. Message format validity
2. Agent status consistency
3. Dashboard sync status

Usage: python validate-agent-messages.py
"""
import json
from datetime import datetime, timezone
from pathlib import Path

WORKSPACE = Path("/workspace/projects/workspace")
MESSAGE_FILE = WORKSPACE / "agents/project-admin/logs/agent-messages.json"
STATUS_FILE = WORKSPACE / "agents/project-admin/logs/agent-status.json"

def load_json(file_path):
    try:
        return json.loads(file_path.read_text()) if file_path.exists() else {}
    except:
        return {}

def validate_messages():
    """Check all messages for consistency."""
    messages = load_json(MESSAGE_FILE).get("messages", [])
    if isinstance(messages, list):
        # Handle array format
        messages = messages
    elif isinstance(messages, dict):
        messages = []
    
    agent_status = load_json(STATUS_FILE).get("agents", {})
    
    issues = []
    
    for i, msg in enumerate(messages[-50:]):  # Check last 50
        # Check required fields
        required_fields = ["timestamp", "from", "to", "message"]
        missing = [f for f in required_fields if f not in msg]
        if missing:
            issues.append(f"Message #{i}: Missing fields: {missing}")
        
        # Check agent_status consistency
        if "agent_status" in msg:
            agent = msg["agent_status"].get("agent")
            status = msg["agent_status"].get("status")
            
            if agent in agent_status:
                current_status = agent_status[agent].get("status")
                if current_status != status:
                    issues.append(
                        f"Message #{i}: {agent} status mismatch - "
                        f"message says '{status}' but dashboard shows '{current_status}'"
                    )
    
    return issues

def main():
    issues = validate_messages()
    
    if issues:
        print(f"⚠️ Found {len(issues)} issues:\n")
        for issue in issues[:10]:  # Show first 10
            print(f"  - {issue}")
        print(f"\n... and {len(issues) - 10} more" if len(issues) > 10 else "")
        return 1
    else:
        print("✅ All messages are valid")
        print(f"✅ Checked last 50 messages in {MESSAGE_FILE}")
        return 0

if __name__ == "__main__":
    exit(main())