#!/bin/bash
# =============================================================================
# 每日集成脚本 - Daily Integration Script
# =============================================================================
# 用途: 每天19:00自动执行以下操作:
#   1. 收集当天所有commits
#   2. 重建后端Docker镜像
#   3. 重建前端并部署
#   4. 生成综合报告
#   5. 创建GitHub Release
#
# 执行时间: 每天 19:00
# Cron: 0 19 * * * /workspace/projects/workspace/scripts/daily-integrate.sh
# =============================================================================

set -e

# 配置
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M)
WORKSPACE="/workspace/projects/workspace"
BACKEND_DIR="$WORKSPACE/apps/backend"
FRONTEND_DIR="$WORKSPACE/school-admin-frontend"
REPORT_DIR="$WORKSPACE/docs/pm"
LOG_FILE="$WORKSPACE/logs/daily-integrate.log"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$TIME]${NC} $1"
}

error() {
    echo -e "${RED}[$TIME ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$TIME WARNING]${NC} $1"
}

# 创建日志目录
mkdir -p "$WORKSPACE/logs"

log "=========================================="
log "  每日集成开始 - $DATE $TIME"
log "=========================================="

cd "$WORKSPACE"

# =============================================================================
# 1. 收集当天commits并分析
# =============================================================================
log "1. 收集当天Commits..."

COMMITS=$(git log --since="$DATE 00:00" --oneline --no-walk --reverse | wc -l)
log "   当天Commits: $COMMITS"

if [ "$COMMITS" -eq 0 ]; then
    warn "没有新的Commits，跳过集成"
    exit 0
fi

# 获取commits列表
git log --since="$DATE 00:00" --format="|%h|%an|%s" --no-walk --reverse > /tmp/commits.txt

# =============================================================================
# 2. TypeScript编译检查
# =============================================================================
log "2. TypeScript编译检查..."

cd "$BACKEND_DIR"
npx tsc -p tsconfig.build.json > /tmp/tsc.log 2>&1

if [ $? -ne 0 ]; then
    error "TypeScript编译失败!"
    tail -10 /tmp/tsc.log
    exit 1
fi

log "   TypeScript编译通过 ✅"

# =============================================================================
# 3. 重建后端Docker镜像
# =============================================================================
log "3. 重建后端Docker镜像..."

cd "$WORKSPACE"
docker build -f "$BACKEND_DIR/Dockerfile" -t school-admin-backend:latest . > /tmp/docker-backend.log 2>&1

if [ $? -ne 0 ]; then
    error "后端Docker构建失败!"
    tail -10 /tmp/docker-backend.log
    exit 1
fi

log "   后端镜像构建成功 ✅"

# =============================================================================
# 4. 部署后端
# =============================================================================
log "4. 部署后端..."

docker stop infra-backend 2>/dev/null || true
docker rm infra-backend 2>/dev/null || true

docker run -d \
    --name infra-backend \
    --network school-admin-network \
    -p 3000:3000 \
    -e DB_HOST=school-admin-postgres \
    -e DB_USER=school_admin \
    -e DB_PASSWORD=school_admin123 \
    -e REDIS_HOST=school-admin-redis \
    school-admin-backend:latest > /dev/null 2>&1

sleep 8

# 验证后端
HEALTH=$(curl -s http://localhost:3000/api/health | jq -r '.status' 2>/dev/null || echo "error")
if [ "$HEALTH" = "ok" ]; then
    log "   后端部署成功 ✅"
else
    error "后端健康检查失败!"
    exit 1
fi

# =============================================================================
# 5. 重建前端
# =============================================================================
log "5. 重建前端..."

cd "$FRONTEND_DIR"
npm run build > /tmp/npm-build.log 2>&1

if [ $? -ne 0 ]; then
    error "前端构建失败!"
    tail -10 /tmp/npm-build.log
    exit 1
fi

log "   前端构建成功 ✅"

# =============================================================================
# 6. 部署前端
# =============================================================================
log "6. 部署前端..."

docker cp "$FRONTEND_DIR/dist/." school-admin-frontend:/usr/share/nginx/html/.

log "   前端部署成功 ✅"

# =============================================================================
# 7. 生成综合报告
# =============================================================================
log "7. 生成综合报告..."

REPORT_FILE="$REPORT_DIR/DAILY-REPORT-$DATE.md"

cat > "$REPORT_FILE" << 'REPORT'
# 📊 每日集成报告

REPORT

echo "**生成时间**: $DATE $TIME" >> "$REPORT_FILE"
echo "**版本**: $(git describe --tags --abbrev=0 2>/dev/null || echo 'v0.0.0')" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "## 📋 今日Commits" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo '| Commit | 作者 | 描述 |' >> "$REPORT_FILE"
echo '|--------|------|------|' >> "$REPORT_FILE"

while IFS='|' read -r hash author msg; do
    if [ -n "$hash" ] && [ "$hash" != "Commit" ]; then
        echo "| \`$hash\` | $author | $msg |" >> "$REPORT_FILE"
    fi
done < /tmp/commits.txt

echo "" >> "$REPORT_FILE"
echo "## 📊 模块状态" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| 模块 | DEV | QA | CHECKER | 状态 |" >> "$REPORT_FILE"
echo "|------|-----|-----|---------|------|" >> "$REPORT_FILE"

# 从HEARTBEAT.md读取模块状态
grep -E "^| " "$WORKSPACE/HEARTBEAT.md" | head -20 >> "$REPORT_FILE" 2>/dev/null || true

echo "" >> "$REPORT_FILE"
echo "## 🌐 测试环境" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- **URL**: https://sculpture-vat-million-freeze.trycloudflare.com" >> "$REPORT_FILE"
echo "- **后端**: 运行中 ✅" >> "$REPORT_FILE"
echo "- **前端**: 已部署 ✅" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "*此报告由每日集成脚本自动生成*" >> "$REPORT_FILE"

log "   报告已生成: $REPORT_FILE"

# =============================================================================
# 8. 提交报告
# =============================================================================
log "8. 提交到Git..."

git add -A
git commit -m "docs: 每日集成报告 $DATE" --allow-empty > /dev/null 2>&1 || true
git push > /dev/null 2>&1 || true

# =============================================================================
# 9. 更新HEARTBEAT.md
# =============================================================================
log "9. 更新HEARTBEAT.md..."

CURRENT_TIME="$DATE $TIME"
sed -i "s/\*\*更新时间\*\*:.*/\*\*更新时间\*\*: $CURRENT_TIME/" "$WORKSPACE/HEARTBEAT.md"

git add "$WORKSPACE/HEARTBEAT.md"
git commit -m "update: HEARTBEAT.md - $DATE $TIME" --allow-empty > /dev/null 2>&1 || true
git push > /dev/null 2>&1 || true

# =============================================================================
# 完成
# =============================================================================
log "=========================================="
log "  每日集成完成 - $DATE $TIME"
log "=========================================="
log ""
log "  📊 Commits: $COMMITS"
log "  📦 后端: 已部署"
log "  🌐 前端: 已部署"
log "  📝 报告: $REPORT_FILE"
log ""

# 发送通知（如果有飞书webhook）
if [ -n "$FEISHU_WEBHOOK" ]; then
    curl -s -X POST "$FEISHU_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"msg_type\":\"text\",\"content\":{\"text\":\"✅ 每日集成完成\\n日期: $DATE\\nCommits: $COMMITS\\n测试环境: https://sculpture-vat-million-freeze.trycloudflare.com\"}}" > /dev/null 2>&1 || true
fi

exit 0
