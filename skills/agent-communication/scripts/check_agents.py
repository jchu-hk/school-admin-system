#!/usr/bin/env python3
"""
Token-less subagent status check
检查活跃的subagent状态，不需要调用模型
"""
import os
import json
import glob
from datetime import datetime, timezone

HEARTBEAT_DIR = "/tmp"
MAX_AGE_MINUTES = 120  # 2小时无更新视为超时

def check_agents():
    """检查所有agent心跳状态"""
    heartbeat_files = glob.glob(f"{HEARTBEAT_DIR}/agent-heartbeat-*.json")
    
    issues = []
    now = datetime.now(timezone.utc)
    
    for filepath in heartbeat_files:
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            
            agent_id = data.get('agent_id', 'unknown')
            status = data.get('status', 'unknown')
            message = data.get('message', '')
            timestamp_str = data.get('timestamp', '')
            
            # 解析时间戳
            if timestamp_str:
                heartbeat_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                age_minutes = (now - heartbeat_time).total_seconds() / 60
                
                # 检查是否超时
                if age_minutes > MAX_AGE_MINUTES:
                    issues.append(f"⚠️ {agent_id}: 超时 {age_minutes:.0f}分钟 - {message}")
                elif status == 'failed':
                    issues.append(f"❌ {agent_id}: 失败 - {message}")
                elif status == 'blocked':
                    issues.append(f"🚫 {agent_id}: 阻塞 - {message}")
        except Exception as e:
            issues.append(f"⚠️ 读取 {filepath} 失败: {e}")
    
    return issues

def main():
    issues = check_agents()
    
    if issues:
        print("## 🤖 Subagent状态检查发现问题:\n")
        for issue in issues:
            print(issue)
        print(f"\n发现 {len(issues)} 个问题需要处理")
        return 1  # 有问题的返回非零状态
    else:
        # 无问题，静默完成
        print("HEARTBEAT_OK - 所有agent正常")
        return 0

if __name__ == "__main__":
    exit(main())
