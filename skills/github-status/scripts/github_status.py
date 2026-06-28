#!/usr/bin/env python3
"""
Update GitHub Issue status for multi-agent workflow.
Usage: python github_status.py --action start --issue 165 --agent DEV
"""

import argparse
import subprocess
import sys
from pathlib import Path
from datetime import datetime

REPO_PATH = "/workspace/projects/workspace"
REPO = "jchu-hk/school-admin-system"

AGENT_TO_LABEL = {
    "DEV": "dev",
    "QA": "qa",
    "DEVOPS": "devops",
    "CHECKER": "checker",
    "ARCH": "arch",
    "REQ": "req",
    "PM": None,
}

LABEL_COLORS = {
    "dev": "蓝色",
    "qa": "绿色",
    "devops": "橙色",
    "checker": "紫色",
    "arch": "灰色",
    "req": "粉色",
    "in-progress": "蓝色",
    "ready-for-review": "黄色",
    "passed": "绿色",
    "failed": "红色",
}

def gh(args, check=True):
    """Run gh command"""
    cmd = ["gh", "issue", *args, "--repo", REPO]
    r = subprocess.run(cmd, cwd=REPO_PATH, capture_output=True, text=True)
    if r.returncode != 0 and check:
        print(f"❌ Error: {r.stderr}")
        return None
    return r

def add_labels(issue_num, labels):
    """Add labels to issue"""
    if not labels:
        return
    label_str = ",".join(labels)
    gh(["edit", str(issue_num), "--add-label", label_str])
    print(f"  + Label: {label_str}")

def remove_labels(issue_num, labels):
    """Remove labels from issue"""
    if not labels:
        return
    for label in labels:
        gh(["edit", str(issue_num), "--remove-label", label], check=False)
        print(f"  - Label: {label}")

def close_issue(issue_num, comment):
    """Close issue with comment"""
    if comment:
        gh(["comment", str(issue_num), "--body", f"✅ {comment} ({datetime.now().strftime('%H:%M')})"])
    gh(["close", str(issue_num)])
    print(f"  🔒 Closed #{issue_num}")

def action_start(issue_num, agent, message):
    """Start work on issue"""
    agent_label = AGENT_TO_LABEL.get(agent, "")
    
    print(f"🚀 Starting work on #{issue_num}")
    print(f"   Agent: {agent}")
    print(f"   Message: {message}")
    
    # Add in-progress and agent label
    labels_to_add = ["in-progress"]
    if agent_label:
        labels_to_add.append(agent_label)
    
    add_labels(issue_num, labels_to_add)
    print(f"✅ Status updated")

def action_done(issue_num, agent, comment):
    """Mark issue as done"""
    agent_label = AGENT_TO_LABEL.get(agent, "")
    
    print(f"✅ Completing #{issue_num}")
    print(f"   Agent: {agent}")
    if comment:
        print(f"   Comment: {comment}")
    
    # Remove in-progress, add passed
    remove_labels(issue_num, ["in-progress"])
    add_labels(issue_num, ["passed"])
    
    # Close issue
    close_issue(issue_num, comment or f"{agent}完成修复")
    print(f"✅ Done!")

def action_fail(issue_num, agent, comment):
    """Mark issue as failed"""
    print(f"❌ Failing #{issue_num}")
    print(f"   Agent: {agent}")
    print(f"   Reason: {comment}")
    
    remove_labels(issue_num, ["in-progress"])
    add_labels(issue_num, ["failed"])
    
    if comment:
        gh(["comment", str(issue_num), "--body", f"❌ {comment} ({datetime.now().strftime('%H:%M')})"])
    
    print(f"⚠️ Marked as failed")

def action_assign(issue_num, agent, comment):
    """Assign issue to agent"""
    agent_label = AGENT_TO_LABEL.get(agent, "")
    
    print(f"📋 Assigning #{issue_num}")
    print(f"   To: {agent}")
    if comment:
        print(f"   Comment: {comment}")
    
    if agent_label:
        add_labels(issue_num, [agent_label])
    
    # Add comment
    if comment:
        msg = f"📌 {comment}"
        if agent_label:
            msg += f" [Assigned to {agent}]"
        gh(["comment", str(issue_num), "--body", msg])
    
    print(f"✅ Assigned")

def action_verify(issue_num, agent, comment):
    """QA verify issue"""
    print(f"🔍 Verifying #{issue_num}")
    print(f"   QA: {agent}")
    if comment:
        print(f"   Comment: {comment}")
    
    remove_labels(issue_num, ["in-progress"])
    add_labels(issue_num, ["ready-for-review", "passed"])
    
    if comment:
        gh(["comment", str(issue_num), "--body", f"✅ QA验证: {comment} ({datetime.now().strftime('%H:%M')})"])
    
    print(f"✅ Verified")

def main():
    parser = argparse.ArgumentParser(description="Update GitHub Issue status for multi-agent workflow")
    parser.add_argument("--action", required=True, 
                       choices=["start", "done", "fail", "assign", "verify"],
                       help="Action to perform")
    parser.add_argument("--issue", required=True, help="Issue number")
    parser.add_argument("--agent", required=True, 
                       choices=["PM", "DEV", "QA", "DEVOPS", "CHECKER", "ARCH", "REQ"],
                       help="Agent performing action")
    parser.add_argument("--message", help="Status message")
    parser.add_argument("--comment", help="Comment for issue")
    
    args = parser.parse_args()
    
    print(f"\n{'='*50}")
    print(f"GitHub Status Update")
    print(f"{'='*50}")
    print(f"Action: {args.action}")
    print(f"Issue: #{args.issue}")
    print(f"Agent: {args.agent}")
    print()
    
    if args.action == "start":
        action_start(args.issue, args.agent, args.message or "开始工作")
    elif args.action == "done":
        action_done(args.issue, args.agent, args.comment or f"{args.agent}完成")
    elif args.action == "fail":
        action_fail(args.issue, args.agent, args.comment or "任务失败")
    elif args.action == "assign":
        action_assign(args.issue, args.agent, args.comment or f"分配给{args.agent}")
    elif args.action == "verify":
        action_verify(args.issue, args.agent, args.comment or "QA验证通过")
    
    print(f"\n✅ Done at {datetime.now().strftime('%H:%M:%S')}")

if __name__ == "__main__":
    main()