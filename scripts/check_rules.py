#!/usr/bin/env python3
"""
PM Agent 规则检查脚本
每次 spawn subagent 前自动运行，确保规则被遵守。

Usage:
  python3 scripts/check_rules.py spawn --agent DEV --message "任务描述"
  python3 scripts/check_rules.py verify
"""

import sys
import json
from pathlib import Path
from datetime import datetime, timezone

WORKSPACE = Path("/workspace/projects/workspace")
MESSAGE_FILE = WORKSPACE / "agents/project-admin/logs/agent-messages.json"
LAST_MSG_FILE = WORKSPACE / "agents/project-admin/logs/last_spawn_check.json"

def check_last_message():
    """检查最近一次 spawn 是否已记录"""
    if not MESSAGE_FILE.exists():
        return False, "agent-messages.json 不存在"
    
    messages = json.loads(MESSAGE_FILE.read_text())
    if not messages:
        return False, "没有消息记录"
    
    last_msg = messages[-1]
    last_time = last_msg.get("timestamp", "")
    last_type = last_msg.get("type", "")
    
    return True, f"最后消息: {last_type} at {last_time}"

def log_spawn(agent: str, message: str):
    """记录一次 spawn 操作"""
    if not MESSAGE_FILE.exists():
        MESSAGE_FILE.parent.mkdir(parents=True, exist_ok=True)
        MESSAGE_FILE.write_text("[]")
    
    messages = json.loads(MESSAGE_FILE.read_text())
    
    new_msg = {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "from": "PM",
        "to": agent,
        "message": message[:100],
        "type": "spawn_check",
        "agent_status": {
            "agent": "PM",
            "status": "running",
            "task": message[:50]
        }
    }
    
    messages.append(new_msg)
    messages = messages[-200:]  # Keep last 200
    
    MESSAGE_FILE.write_text(json.dumps(messages, ensure_ascii=False, indent=2))
    
    return new_msg

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "spawn":
        if len(sys.argv) < 4:
            print("用法: check_rules.py spawn <AGENT> <MESSAGE>")
            sys.exit(1)
        
        agent = sys.argv[2]
        message = sys.argv[3]
        
        # 记录这次 spawn
        msg = log_spawn(agent, message)
        print(f"✅ Spawn 已记录: PM → {agent}")
        print(f"   消息: {message[:60]}...")
        print(f"   时间: {msg['timestamp']}")
        
        # 自动触发 dashboard 更新
        import subprocess
        result = subprocess.run(
            ["python3", str(WORKSPACE / "skills/multi-agent-dashboard/scripts/update_dashboard.py")],
            capture_output=True, text=True, timeout=120,
            cwd=str(WORKSPACE)
        )
        if result.returncode == 0:
            print("✅ Dashboard 已更新")
        else:
            print(f"⚠️ Dashboard 更新失败: {result.stderr[:100]}")
    
    elif command == "verify":
        ok, info = check_last_message()
        if ok:
            print(f"✅ {info}")
        else:
            print(f"⚠️ {info}")
    
    else:
        print(f"未知命令: {command}")
        print(__doc__)
        sys.exit(1)

if __name__ == "__main__":
    main()
