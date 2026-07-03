#!/bin/bash
# AI 团队自动发布脚本
# 使用方法: ./scripts/release.sh v1.5.7 "Bug fixes for #197 and #198"

set -e  # 遇到错误立即退出

VERSION=$1
MESSAGE=${2:-"Release $VERSION"}
WORKSPACE=$(dirname "$0")/..

# 检查参数
if [ -z "$VERSION" ]; then
  echo "❌ 错误: 必须指定版本号"
  echo "用法: $0 <version> [message]"
  echo "示例: $0 v1.5.7 'Bug fixes for #197 and #198'"
  exit 1
fi

echo "🚀 开始发布流程: $VERSION"
echo "   描述: $MESSAGE"
echo ""

cd "$WORKSPACE"

# Step 1: 检查是否有未提交的变更
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  警告: 存在未提交的变更"
  git status --short
  read -p "是否继续？(y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 发布取消"
    exit 1
  fi
fi

# Step 2: 更新前端 version.json
echo "📝 Step 1/7: 更新前端 version.json"
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_DATE=$(date +%Y-%m-%d)

cat > school-admin-frontend/public/version.json <<EOF
{
  "version": "$VERSION",
  "buildDate": "$CURRENT_DATE",
  "gitCommit": "$CURRENT_COMMIT",
  "gitBranch": "main",
  "changelog": [
    {
      "version": "$VERSION",
      "date": "$CURRENT_DATE",
      "changes": [
        "$MESSAGE"
      ]
    }
  ]
}
EOF
echo "✅ version.json 已更新"

# Step 3: 提交变更
echo "📝 Step 2/7: 提交变更"
git add school-admin-frontend/public/version.json CHANGELOG.md
git commit -m "chore: prepare release $VERSION - $MESSAGE" || {
  echo "⚠️  没有新的变更需要提交"
}
echo "✅ 变更已提交"

# Step 4: 推送到远程
echo "📝 Step 3/7: 推送到远程仓库"
git push
echo "✅ 推送完成"

# Step 5: 创建 Git Tag
echo "📝 Step 4/7: 创建 Git Tag $VERSION"
git tag -a "$VERSION" -m "Release $VERSION - $MESSAGE"
git push origin "$VERSION"
echo "✅ Tag 已创建并推送"

# Step 6: 创建 GitHub Release
echo "📝 Step 5/7: 创建 GitHub Release"
gh release create "$VERSION" \
  --title "$VERSION - $MESSAGE" \
  --notes "## $MESSAGE

详见 [CHANGELOG.md](https://github.com/jchu-hk/school-admin-system/blob/main/CHANGELOG.md)

---
🤖 Released by AI Team" || {
  echo "⚠️  GitHub Release 可能已存在，跳过"
}
echo "✅ GitHub Release 已创建"

# Step 7: 构建 Docker 镜像
echo "📝 Step 6/7: 构建 Docker 镜像"
docker build -f apps/backend/Dockerfile \
  -t school-admin-backend:latest \
  -t "school-admin-backend:$VERSION" \
  . || {
  echo "❌ Docker 构建失败"
  exit 1
}
echo "✅ Docker 镜像已构建"

# Step 8: 验证
echo "📝 Step 7/7: 验证发布"
echo ""
echo "📋 发布摘要:"
echo "   版本: $VERSION"
echo "   Commit: $CURRENT_COMMIT"
echo "   日期: $CURRENT_DATE"
echo "   Docker: school-admin-backend:$VERSION"
echo ""
echo "🔗 链接:"
echo "   GitHub Release: https://github.com/jchu-hk/school-admin-system/releases/tag/$VERSION"
echo "   Commit: https://github.com/jchu-hk/school-admin-system/commit/$CURRENT_COMMIT"
echo ""

# 可选: 部署到测试环境
read -p "是否部署到测试环境？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🚀 部署到测试环境..."
  docker compose -f infra/docker-compose.yml up -d backend
  sleep 5
  curl -s http://localhost:3000/api/health && echo "✅ 部署成功" || echo "❌ 部署失败"
fi

echo ""
echo "🎉 发布完成！"
echo "   下一步: 通知团队 / 更新 PROJECT-WIKI"