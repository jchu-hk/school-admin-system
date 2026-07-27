#!/usr/bin/env python3
"""
PM Patrol Script - 零Token消耗巡检
纯脚本逻辑，无LLM调用

逻辑：
1. 检查GitHub pending/open/blocked 任务
2. 检查 in-progress 任务的阻塞原因
3. 如果有需要关注的任务 → 发送微信通知PM
4. 如果无问题 → 仅日志记录，结束
"""

import os
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# 配置
REPO = "jchu-hk/school-admin-system"
HEARTBEAT_DIR = Path("/tmp")
LOG_FILE = HEARTBEAT_DIR / "patrol.log"

def log(msg):
    """写日志"""
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def gh_api(endpoint):
    """调用GitHub API"""
    try:
        result = subprocess.run(
            ["gh", "api", endpoint],
            capture_output=True, text=True, timeout=30
        )
        return json.loads(result.stdout) if result.returncode == 0 else []
    except:
        return []

def check_in_progress_issues():
    """检查in-progress的issues"""
    issues = gh_api(f"repos/{REPO}/issues?state=open&labels=in-progress")
    return issues

def check_pending_issues():
    """检查 pending confirmation / waiting 的 issues"""
    # 查找没有 in-progress 但有特定标签的 issues
    waiting_labels = ["waiting-for-confirmation", "needs-review", "blocked"]
    waiting = []
    for label in waiting_labels:
        issues = gh_api(f"repos/{REPO}/issues?state=open&labels={label}")
        waiting.extend(issues)
    return waiting

def check_recently_created():
    """检查最近24小时创建的open issues"""
    from datetime import timedelta
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    issues = gh_api(f"repos/{REPO}/issues?state=open&since={yesterday}T00:00:00Z")
    return [i for i in issues if 'pull_request' not in i]

def check_test_env():
    """检查测试环境健康"""
    endpoints = [
        ("backend", "http://localhost:3000/api/health"),
        ("frontend", "http://localhost:8080"),
    ]
    results = []
    for name, url in endpoints:
        try:
            r = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", url],
                capture_output=True, text=True, timeout=5
            )
            status = "OK" if r.stdout.strip() == "200" else f"HTTP {r.stdout.strip()}"
            results.append(f"{name}:{status}")
        except:
            results.append(f"{name}:ERROR")
    return results

def check_docker_containers():
    """检查关键容器状态"""
    containers = ["school-admin-backend", "school-admin-postgres"]
    results = []
    for c in containers:
        r = subprocess.run(
            ["docker", "ps", "--filter", f"name={c}", "--format", "{{.Status}}"],
            capture_output=True, text=True, timeout=5
        )
        status = r.stdout.strip() or "STOPPED"
        results.append(f"{c}:{status}")
    return results

def check_open_issues_count():
    """检查open issues统计"""
    # 使用 --jq "length" 统计总数（排除PR）
    # 注意：--paginate 会合并所有页面，length 计算合并后数组长度
    result = subprocess.run(
        ["gh", "api", f"repos/{REPO}/issues",
         "--paginate",
         "--jq", "[.[] | select(.pull_request == null)] | length"],
        capture_output=True, text=True, timeout=30
    )
    try:
        total_count = int(result.stdout.strip())
    except (ValueError, TypeError) as e:
        log(f"⚠️ 无法解析issue数量: {e}, stdout={result.stdout[:200]}, stderr={result.stderr[:200]}")
        total_count = 0
    
    return total_count

def check_p0_p1_issues():
    """检查是否有open的P0/P1 issues — 无论什么状态都应告警"""
    all_urgent = []
    for priority in ["p0", "p1"]:
        issues = gh_api(f"repos/{REPO}/issues?state=open&labels={priority}")
        all_urgent.extend(issues)
    return all_urgent

def check_recently_closed_p0():
    """检查最近24小时关闭的P0 issues — 快速修复可能已关闭但PM应知情"""
    from datetime import timedelta
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    issues = gh_api(
        f"repos/{REPO}/issues?state=closed&labels=p0&since={yesterday}T00:00:00Z&per_page=50"
    )
    return [i for i in issues if 'pull_request' not in i]

def main():
    log("=" * 50)
    log("PM Patrol 开始")
    
    concerns = []
    
    # 1. 检查 in-progress 任务
    in_progress = check_in_progress_issues()
    log(f"In-progress issues: {len(in_progress)}")
    if in_progress:
        for i in in_progress[:5]:
            concerns.append(f"🔄 #{i['number']}: {i['title'][:40]}")
    
    # 2. 检查等待确认的任务
    waiting = check_pending_issues()
    log(f"Waiting/Blocked issues: {len(waiting)}")
    if waiting:
        for i in waiting[:5]:
            concerns.append(f"⏳ #{i['number']}: {i['title'][:40]}")
    
    # 3. 检查最近24小时创建的
    recent = check_recently_created()
    log(f"Recently created (24h): {len(recent)}")
    if recent:
        for i in recent[:3]:
            concerns.append(f"🆕 #{i['number']}: {i['title'][:40]}")
    
    # 4. 【新增】检查P0/P1 open issues — 任何P0/P1都应告警
    urgent = check_p0_p1_issues()
    log(f"P0/P1 open issues: {len(urgent)}")
    if urgent:
        for i in urgent[:10]:
            labels = [l['name'] for l in i.get('labels', [])]
            prio = [l for l in labels if l in ('p0', 'p1')]
            concerns.append(f"🚨 [{','.join(prio)}] #{i['number']}: {i['title'][:40]}")
    
    # 5. 【新增】检查最近关闭的P0 — PM应知情
    closed_p0 = check_recently_closed_p0()
    log(f"Recently closed P0 (24h): {len(closed_p0)}")
    if closed_p0:
        for i in closed_p0[:5]:
            concerns.append(f"✅ [已关闭P0] #{i['number']}: {i['title'][:40]}")
    
    # 6. 检查open issues总数
    open_count = check_open_issues_count()
    log(f"Total open issues: {open_count}")
    
    # 7. 检查测试环境
    env_status = check_test_env()
    log(f"测试环境: {', '.join(env_status)}")
    
    containers = check_docker_containers()
    log(f"容器: {', '.join(containers)}")
    
    # 8. 判断是否需要通知
    log("=" * 50)
    if concerns:
        log(f"⚠️ 发现 {len(concerns)} 个需要关注的任务")
        # 写入告警文件
        alert = {
            "agent_id": "PM",
            "status": "patrol_alert",
            "message": f"PM Patrol 发现 {len(concerns)} 个需要关注的任务",
            "timestamp": datetime.now().isoformat(),
            "concerns": concerns,
            "open_count": open_count,
            "env_status": env_status
        }
        (HEARTBEAT_DIR / "patrol-alert.json").write_text(json.dumps(alert, ensure_ascii=False))
        log("已写入告警文件")
        return 1  # 有问题，返回非0
    else:
        log("✅ 无需关注的问题")
        log("PM Patrol 结束")
        return 0

if __name__ == "__main__":
    sys.exit(main())