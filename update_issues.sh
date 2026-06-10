#!/bin/bash
# 批量更新Issues #30-56 的标签和指派

# P1 核心功能（8个）
echo "Processing P1 Core Features..."
gh issue edit 30 --add-label "p1,attendance,mod-daily" --add-assignee DEV1
gh issue edit 31 --add-label "p1,leave,mod-daily" --add-assignee DEV2
gh issue edit 32 --add-label "p1,inquiry,mod-daily" --add-assignee DEV3
gh issue edit 33 --add-label "p1,finance,mod-fin" --add-assignee DEV1
gh issue edit 34 --add-label "p1,finance,mod-fin" --add-assignee DEV2
gh issue edit 35 --add-label "p1,fee,mod-fin" --add-assignee DEV3
gh issue edit 36 --add-label "p1,lunch,mod-daily" --add-assignee DEV1
gh issue edit 37 --add-label "p1,bus,mod-daily" --add-assignee DEV2

echo "P1 Core Features completed."

# P2 增强功能（14个）
echo "Processing P2 Enhancement Features..."
gh issue edit 38 --add-label "p2,dashboard,mod-daily" --add-assignee DEV3
gh issue edit 39 --add-label "p2,user,mod-user" --add-assignee DEV1
gh issue edit 40 --add-label "p2,user,mod-user" --add-assignee DEV2
gh issue edit 41 --add-label "p2,student,mod-new" --add-assignee DEV3
gh issue edit 42 --add-label "p2,grades,mod-new" --add-assignee DEV1
gh issue edit 43 --add-label "p2,exam,mod-new" --add-assignee DEV2
gh issue edit 44 --add-label "p2,course,mod-new" --add-assignee DEV3
gh issue edit 45 --add-label "p2,grades,mod-new" --add-assignee DEV1
gh issue edit 46 --add-label "p2,document,mod-new" --add-assignee DEV2
gh issue edit 47 --add-label "p2,admin,mod-cycl" --add-assignee DEV3
gh issue edit 48 --add-label "p2,admin,mod-cycl" --add-assignee DEV1
gh issue edit 49 --add-label "p2,bus,mod-daily" --add-assignee DEV2
gh issue edit 50 --add-label "p2,asset,mod-fin" --add-assignee DEV3
gh issue edit 51 --add-label "p2,asset,mod-fin" --add-assignee DEV1

echo "P2 Enhancement Features completed."

# P3 优化功能（10个）
echo "Processing P3 Optimization Features..."
gh issue edit 52 --add-label "p3,ai,mod-ai" --add-assignee DEV2
gh issue edit 53 --add-label "p3,ai,mod-ai" --add-assignee DEV3
gh issue edit 54 --add-label "p3,ai,mod-ai" --add-assignee DEV1
gh issue edit 55 --add-label "p3,automation,mod-ai" --add-assignee DEV2
gh issue edit 56 --add-label "p3,automation,mod-ai" --add-assignee DEV3

echo "P3 Optimization Features completed."

echo "All Issues updated successfully!"