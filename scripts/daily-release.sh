#!/bin/bash
# Daily Release Script - 每日19:00执行
# 功能: 检查新commit并发布Release

cd /workspace/projects/workspace

# 获取最新commit
LATEST=$(git log -1 --format="%H")
LATEST_MSG=$(git log -1 --format="%s")

# 获取上一个Release tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)
LAST_COMMIT=$(git rev-parse $LAST_TAG 2>/dev/null)

# 检查是否有新commit
if [ "$LATEST" != "$LAST_COMMIT" ]; then
    echo "发现新commit: $LATEST_MSG"
    
    # 获取新commit列表
    NEW_COMMITS=$(git log $LAST_TAG..HEAD --oneline)
    
    # 生成版本号
    VERSION="v$(date +%Y.%m.%d)"
    
    # 创建tag
    git tag -f $VERSION
    
    # 推送
    git push origin $VERSION --force
    
    # 创建Release
    gh release create $VERSION \
      --title "$VERSION - Daily Release" \
      --notes "## $VERSION Daily Release

### 变更内容
$NEW_COMMITS

### 发布时间
$(date '+%Y-%m-%d %H:%M:%S')"
    
    echo "✅ Release $VERSION 已发布"
else
    echo "无新commit，跳过发布"
fi
