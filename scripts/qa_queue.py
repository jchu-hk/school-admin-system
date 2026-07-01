#!/usr/bin/env python3
"""
QA Queue Manager - PM管控的QA验收队列

用法:
    python3 scripts/qa_queue.py --list
    python3 scripts/qa_queue.py --add 155 --title "学生编辑Modal问题"
    python3 scripts/qa_queue.py --update 155 --status passed
    python3 scripts/qa_queue.py --assign-qa
    python3 scripts/qa_queue.py --stats
"""

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

WORKSPACE = Path("/workspace/projects/workspace")
QUEUE_FILE = WORKSPACE / "qa-queue.json"


def load_queue():
    """加载队列"""
    if QUEUE_FILE.exists():
        with open(QUEUE_FILE, 'r') as f:
            return json.load(f)
    return {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "pending_qa": [],
        "qa_in_progress": [],
        "qa_passed": [],
        "qa_failed": []
    }


def save_queue(queue):
    """保存队列"""
    queue["last_updated"] = datetime.now(timezone.utc).isoformat()
    with open(QUEUE_FILE, 'w') as f:
        json.dump(queue, f, indent=2, ensure_ascii=False)


def list_queue(queue):
    """显示队列"""
    print("\n📋 QA验收队列状态")
    print("=" * 60)
    print(f"最后更新: {queue['last_updated']}")
    print()

    # Pending
    print(f"⏳ 待验收 ({len(queue['pending_qa'])}):")
    if queue['pending_qa']:
        for item in queue['pending_qa']:
            print(f"   - #{item['issue']}: {item['title']}")
            print(f"     DEV完成于: {item.get('dev_done_at', 'N/A')}")
    else:
        print("   (无)")

    # In Progress
    print(f"\n🔄 验收中 ({len(queue['qa_in_progress'])}):")
    if queue['qa_in_progress']:
        for item in queue['qa_in_progress']:
            print(f"   - #{item['issue']}: {item['title']}")
            print(f"     QA开始于: {item.get('qa_started_at', 'N/A')}")
    else:
        print("   (无)")

    # Passed
    print(f"\n✅ 已通过 ({len(queue['qa_passed'])}):")
    if queue['qa_passed']:
        for item in queue['qa_passed']:
            print(f"   - #{item['issue']}: {item['title']}")
    else:
        print("   (无)")

    # Failed
    print(f"\n❌ 失败 ({len(queue['qa_failed'])}):")
    if queue['qa_failed']:
        for item in queue['qa_failed']:
            print(f"   - #{item['issue']}: {item['title']}")
            print(f"     原因: {item.get('reason', 'N/A')}")
    else:
        print("   (无)")

    print()
    return queue


def stats(queue):
    """显示统计"""
    total = (len(queue['pending_qa']) + len(queue['qa_in_progress']) +
             len(queue['qa_passed']) + len(queue['qa_failed']))

    print("\n📊 QA队列统计")
    print("=" * 60)
    print(f"总数: {total}")
    print(f"  ⏳ 待验收: {len(queue['pending_qa'])}")
    print(f"  🔄 验收中: {len(queue['qa_in_progress'])}")
    print(f"  ✅ 已通过: {len(queue['qa_passed'])}")
    print(f"  ❌ 失败: {len(queue['qa_failed'])}")
    print()

    # 判断是否应该派发QA
    should_assign = len(queue['pending_qa']) >= 5 or (
        len(queue['pending_qa']) > 0 and
        len(queue['qa_in_progress']) == 0
    )

    if should_assign:
        print("💡 建议: 可以派发QA验收")
        if len(queue['pending_qa']) >= 5:
            print(f"   原因: 待验收Issue >= 5 ({len(queue['pending_qa'])}个)")
        else:
            print("   原因: 无进行中的QA，且有待验收Issue")
    else:
        print("⏸️  暂缓: 继续累积Issue")
        print(f"   当前待验收: {len(queue['pending_qa'])} (需要 >= 5)")

    print()


def add_to_queue(issue_id, title, queue):
    """添加Issue到队列"""
    # 检查是否已存在
    for item in queue['pending_qa'] + queue['qa_in_progress']:
        if item['issue'] == issue_id:
            print(f"⚠️  Issue #{issue_id} 已在队列中")
            return

    queue['pending_qa'].append({
        "issue": issue_id,
        "title": title,
        "dev_done_at": datetime.now(timezone.utc).isoformat(),
        "added_at": datetime.now(timezone.utc).isoformat()
    })
    save_queue(queue)
    print(f"✅ Issue #{issue_id} 已添加到待验收队列")
    print(f"   标题: {title}")


def update_status(issue_id, status, queue, reason=None):
    """更新Issue状态"""
    statuses = {
        "passed": "qa_passed",
        "failed": "qa_failed",
        "in_progress": "qa_in_progress"
    }

    if status not in statuses:
        print(f"❌ 无效状态: {status}")
        return

    target_list = statuses[status]

    # 从pending找到并移动
    for item in queue['pending_qa']:
        if item['issue'] == issue_id:
            queue['pending_qa'].remove(item)
            item['status'] = status
            item['updated_at'] = datetime.now(timezone.utc).isoformat()
            if reason:
                item['reason'] = reason
            queue[target_list].append(item)
            save_queue(queue)
            print(f"✅ Issue #{issue_id} 已标记为 {status}")
            return

    # 从in_progress移动
    for item in queue['qa_in_progress']:
        if item['issue'] == issue_id:
            queue['qa_in_progress'].remove(item)
            item['status'] = status
            item['updated_at'] = datetime.now(timezone.utc).isoformat()
            if reason:
                item['reason'] = reason
            queue[target_list].append(item)
            save_queue(queue)
            print(f"✅ Issue #{issue_id} 已标记为 {status}")
            return

    print(f"⚠️  Issue #{issue_id} 不在队列中")


def assign_qa(queue):
    """派发QA验收"""
    if not queue['pending_qa']:
        print("❌ 没有待验收的Issue")
        return

    # 移动所有pending到in_progress
    for item in queue['pending_qa']:
        item['qa_started_at'] = datetime.now(timezone.utc).isoformat()
        item['status'] = 'in_progress'

    queue['qa_in_progress'].extend(queue['pending_qa'])
    queue['pending_qa'] = []
    save_queue(queue)

    print(f"✅ 已派发QA验收，共 {len(queue['qa_in_progress'])} 个Issue:")
    for item in queue['qa_in_progress']:
        print(f"   - #{item['issue']}: {item['title']}")


def main():
    parser = argparse.ArgumentParser(description="QA队列管理")
    parser.add_argument("--list", action="store_true", help="显示队列")
    parser.add_argument("--stats", action="store_true", help="显示统计")
    parser.add_argument("--add", type=int, help="添加Issue到队列")
    parser.add_argument("--title", help="Issue标题")
    parser.add_argument("--update", type=int, help="更新Issue状态")
    parser.add_argument("--status", choices=["passed", "failed", "in_progress"],
                       help="新状态")
    parser.add_argument("--reason", help="失败原因")
    parser.add_argument("--assign-qa", action="store_true", help="派发QA验收")

    args = parser.parse_args()
    queue = load_queue()

    if args.list:
        list_queue(queue)
    elif args.stats:
        stats(queue)
    elif args.add:
        if not args.title:
            print("❌ 需要提供 --title")
            return
        add_to_queue(args.add, args.title, queue)
    elif args.update:
        if not args.status:
            print("❌ 需要提供 --status")
            return
        update_status(args.update, args.status, queue, args.reason)
    elif args.assign_qa:
        assign_qa(queue)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()