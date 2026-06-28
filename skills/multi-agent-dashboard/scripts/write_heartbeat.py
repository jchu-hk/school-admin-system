#!/usr/bin/env python3
"""
Write heartbeat file for agent tracking.
Usage: python write_heartbeat.py --agent DEV --issue 164 --status running --message "正在修复"
"""

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

HEARTBEAT_DIR = "/tmp"

def write_heartbeat(agent: str, issue_id: str, status: str, message: str):
    """Write heartbeat file"""
    
    filename = f"agent-heartbeat-{agent}-{issue_id}.json"
    filepath = Path(HEARTBEAT_DIR) / filename
    
    data = {
        "agent_id": agent,
        "issue_id": issue_id,
        "status": status,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Done/failed → delete heartbeat (task complete)
    if status in ("done", "failed"):
        if filepath.exists():
            filepath.unlink()
            print(f"✅ Heartbeat removed: {filename} (status: {status})")
        return
    
    # Running → write/update heartbeat
    filepath.write_text(json.dumps(data, indent=2))
    print(f"✅ Heartbeat written: {filename}")
    print(f"   Agent: {agent}, Issue: #{issue_id}, Status: {status}")
    print(f"   Message: {message}")

def main():
    parser = argparse.ArgumentParser(description="Write agent heartbeat")
    parser.add_argument("--agent", required=True, help="Agent name (PM/DEV/QA/DEVOPS/CHECKER/ARCH/REQ)")
    parser.add_argument("--issue", required=True, help="Issue ID")
    parser.add_argument("--status", required=True, choices=["running", "done", "failed"], help="Status")
    parser.add_argument("--message", required=True, help="Status message")
    
    args = parser.parse_args()
    write_heartbeat(args.agent, args.issue, args.status, args.message)

if __name__ == "__main__":
    main()