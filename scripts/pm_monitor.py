#!/usr/bin/env python3
"""
PM主动监控脚本
每5分钟运行一次
检查:
1. 运行中的Agents状态
2. GitHub Issues状态
3. 待分配任务
4. 超时预警
"""

import os
import sys
import json
import subprocess
from datetime import datetime, timedelta

# 配置
REPO = 'jchu-hk/school-admin-system'
TOKEN = os.environ.get('GITHUB_TOKEN', '')

# 时间阈值 (分钟)
THRESHOLDS = {
    'p0': {'warning': 30, 'max': 120},
    'p1': {'warning': 60, 'max': 240},
    'p2': {'warning': 120, 'max': 480},
    'qa': {'warning': 30, 'max': 120},
    'checker': {'warning': 30, 'max': 120},
}

def run_cmd(cmd):
    """执行命令并返回结果"""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=30
        )
        return result.stdout.strip(), result.returncode
    except Exception as e:
        return str(e), 1

def get_github_issues(state='open', labels=''):
    """获取GitHub Issues"""
    cmd = f'gh issue list --repo {REPO} --state {state}'
    if labels:
        cmd += f' --label {labels}'
    output, _ = run_cmd(cmd)
    return output

def get_issue_details(issue_num):
    """获取Issue详情"""
    cmd = f'gh issue view {issue_num} --repo {REPO} --json number,title,labels,assignees,createdAt,updatedAt'
    output, _ = run_cmd(cmd)
    try:
        return json.loads(output) if output else {}
    except:
        return {}

def check_ready_for_review():
    """检查待验收的Issues"""
    print("\n🔔 Ready for Review (待QA验收):")
    output = get_github_issues(labels='ready-for-review')
    if output:
        for line in output.split('\n'):
            if line:
                parts = line.split('\t')
                if len(parts) >= 2:
                    print(f"  - #{parts[0]}: {parts[1]}")
        print("  → 需要分配QA进行验收")
    else:
        print("  ✓ 无待验收任务")

def check_passed_issues():
    """检查测试通过的Issues"""
    print("\n✅ Passed (待CHECKER审查):")
    output = get_github_issues(labels='passed')
    if output:
        for line in output.split('\n'):
            if line:
                parts = line.split('\t')
                if len(parts) >= 2:
                    print(f"  - #{parts[0]}: {parts[1]}")
        print("  → 需要分配CHECKER审查")
    else:
        print("  ✓ 无待审查任务")

def check_blocked_issues():
    """检查阻塞的Issues"""
    print("\n⚠️ Blocked (阻塞):")
    output = get_github_issues(labels='blocked')
    if output:
        for line in output.split('\n'):
            if line:
                parts = line.split('\t')
                if len(parts) >= 2:
                    print(f"  - #{parts[0]}: {parts[1]}")
        print("  → 需要PM协调解决")
    else:
        print("  ✓ 无阻塞任务")

def check_in_progress_issues():
    """检查进行中的Issues"""
    print("\n🚧 In Progress (进行中):")
    output = get_github_issues(labels='in-progress')
    if output:
        count = 0
        for line in output.split('\n'):
            if line:
                parts = line.split('\t')
                if len(parts) >= 2:
                    print(f"  - #{parts[0]}: {parts[1]}")
                    count += 1
        print(f"  共 {count} 个任务进行中")
    else:
        print("  ✓ 无进行中任务")

def check_pending_assignment():
    """检查待分配的任务"""
    print("\n📋 待分配任务:")
    output = get_github_issues(state='open')
    pending = []
    for line in output.split('\n'):
        if line:
            parts = line.split('\t')
            if len(parts) >= 2:
                issue_num = parts[0]
                title = parts[1]
                # 简单检查：没有in-progress或ready-for-review标签
                if 'in-progress' not in title and 'ready-for-review' not in title:
                    # 检查是否是P0/P1
                    if 'P0' in title or 'P1' in title:
                        pending.append(f"  - #{issue_num}: {title}")
    
    if pending:
        for p in pending[:5]:  # 最多显示5个
            print(p)
        if len(pending) > 5:
            print(f"  ... 还有 {len(pending) - 5} 个")
    else:
        print("  ✓ 所有P0/P1任务已分配")

def check_ci_status():
    """检查CI状态"""
    print("\n🔧 CI/CD状态:")
    cmd = f'gh run list --repo {REPO} --limit 3 --json status,conclusion,displayTitle'
    output, _ = run_cmd(cmd)
    try:
        if output:
            data = json.loads(output)
            for run in data:
                status = run.get('status', '')
                conclusion = run.get('conclusion', '')
                title = run.get('displayTitle', '')
                if conclusion == 'success':
                    print(f"  ✅ {title}")
                elif conclusion == 'failure':
                    print(f"  ❌ {title}")
                else:
                    print(f"  ⏳ {title} ({status})")
    except Exception as e:
        print(f"  无法获取CI状态: {e}")

def generate_summary():
    """生成汇总"""
    print("\n" + "="*50)
    print(f"📊 PM监控报告 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*50)
    
    # Open Issues统计
    output, _ = run_cmd(f"gh issue list --repo {REPO} --state open | wc -l")
    open_count = int(output) if output.isdigit() else 0
    
    output, _ = run_cmd(f"gh issue list --repo {REPO} --state closed --since '{datetime.now().strftime('%Y-%m-%d')}' | wc -l")
    closed_today = int(output) if output.isdigit() else 0
    
    print(f"\n📈 今日统计:")
    print(f"  - Open Issues: {open_count}")
    print(f"  - Closed Today: {closed_today}")

def main():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] PM监控检查开始...")
    
    try:
        # 1. 检查Issues状态
        check_ready_for_review()
        check_passed_issues()
        check_blocked_issues()
        check_in_progress_issues()
        check_pending_assignment()
        
        # 2. 检查CI状态
        check_ci_status()
        
        # 3. 生成汇总
        generate_summary()
        
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 检查完成")
        
    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
