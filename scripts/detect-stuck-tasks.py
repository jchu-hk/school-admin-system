#!/usr/bin/env python3
"""
Detect stuck tasks and alert PM
Run this as part of PM Patrol or heartbeat
"""
import json
import glob
from datetime import datetime, timezone, timedelta
from pathlib import Path

REPO_PATH = Path("/workspace/projects/workspace")
STUCK_THRESHOLD_HOURS = 2  # 无心跳视为 stuck
RUNNING_STUCK_HOURS = 4    # running 状态无进展视为 stuck

def check_heartbeat_files():
    """Check for agents with outdated heartbeats"""
    stuck = []
    now = datetime.now(timezone.utc)
    
    for filepath in glob.glob("/tmp/agent-heartbeat-*.json"):
        try:
            with open(filepath) as f:
                data = json.load(f)
            
            agent_id = data.get("agent_id", "unknown")
            status = data.get("status", "unknown")
            timestamp_str = data.get("timestamp", "")
            
            if timestamp_str:
                hb_time = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                hours_ago = (now - hb_time).total_seconds() / 3600
                
                if hours_ago > STUCK_THRESHOLD_HOURS:
                    stuck.append({
                        "type": "heartbeat_timeout",
                        "agent": agent_id,
                        "status": status,
                        "hours_since_update": round(hours_ago, 1),
                        "file": filepath
                    })
        except Exception as e:
            print(f"⚠️ Error reading {filepath}: {e}")
    
    return stuck

def check_agent_status():
    """Check agent-status.json for running agents with no progress"""
    stuck = []
    now = datetime.now(timezone.utc)
    
    status_file = REPO_PATH / "agents/project-admin/logs/agent-status.json"
    if not status_file.exists():
        return stuck
    
    try:
        with open(status_file) as f:
            data = json.load(f)
        
        for agent_id, agent_data in data.get("agents", {}).items():
            if agent_data.get("status") == "running":
                last_update_str = agent_data.get("lastUpdate", "")
                if last_update_str:
                    try:
                        last_update = datetime.fromisoformat(last_update_str.replace("Z", "+00:00"))
                        hours_ago = (now - last_update).total_seconds() / 3600
                        
                        if hours_ago > RUNNING_STUCK_HOURS:
                            stuck.append({
                                "type": "running_no_progress",
                                "agent": agent_id,
                                "task": agent_data.get("task", "unknown"),
                                "hours_since_update": round(hours_ago, 1)
                            })
                    except:
                        pass
    except Exception as e:
        print(f"⚠️ Error reading status file: {e}")
    
    return stuck

def check_missing_heartbeats():
    """Check for agents marked running but no heartbeat file"""
    stuck = []
    
    status_file = REPO_PATH / "agents/project-admin/logs/agent-status.json"
    if not status_file.exists():
        return stuck
    
    try:
        with open(status_file) as f:
            data = json.load(f)
        
        # Get list of heartbeat files
        heartbeat_agents = set()
        for filepath in glob.glob("/tmp/agent-heartbeat-*.json"):
            try:
                with open(filepath) as f:
                    hb_data = json.load(f)
                heartbeat_agents.add(hb_data.get("agent_id"))
            except:
                pass
        
        # Check running agents without heartbeats
        for agent_id, agent_data in data.get("agents", {}).items():
            if agent_data.get("status") == "running" and agent_id not in heartbeat_agents:
                stuck.append({
                    "type": "no_heartbeat_file",
                    "agent": agent_id,
                    "task": agent_data.get("task", "unknown"),
                    "issue": "Agent marked running but no heartbeat file exists"
                })
    except Exception as e:
        print(f"⚠️ Error in missing heartbeat check: {e}")
    
    return stuck

def main():
    """Main detection logic"""
    all_stuck = []
    
    # Run all checks
    all_stuck.extend(check_heartbeat_files())
    all_stuck.extend(check_agent_status())
    all_stuck.extend(check_missing_heartbeats())
    
    # Remove duplicates (same agent)
    seen_agents = set()
    unique_stuck = []
    for item in all_stuck:
        if item["agent"] not in seen_agents:
            seen_agents.add(item["agent"])
            unique_stuck.append(item)
    
    # Output results
    if unique_stuck:
        print("🚨 STUCK TASKS DETECTED:\n")
        for item in unique_stuck:
            print(f"Agent: {item['agent']}")
            print(f"Type: {item['type']}")
            if 'hours_since_update' in item:
                print(f"Hours since update: {item['hours_since_update']}")
            if 'task' in item:
                print(f"Task: {item['task'][:60]}...")
            print()
        
        # Write alert file for PM to pick up
        alert_file = "/tmp/pm-stuck-tasks-alert.json"
        with open(alert_file, 'w') as f:
            json.dump({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "stuck_tasks": unique_stuck,
                "count": len(unique_stuck)
            }, f, indent=2)
        
        print(f"📄 Alert written to: {alert_file}")
        print("📋 PM should execute: docs/PM-STUCK-TASK-PROCESS.md")
        return 1
    else:
        print("✅ No stuck tasks detected")
        # Clear any old alert
        alert_file = "/tmp/pm-stuck-tasks-alert.json"
        if Path(alert_file).exists():
            Path(alert_file).unlink()
        return 0

if __name__ == "__main__":
    exit(main())
