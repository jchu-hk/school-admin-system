#!/bin/bash
# ============================================================
# 启动 school-admin-backend 容器（粘合 docker run 部署方式）
# 修复 Issue #309: 挂载宿主机备份目录 /var/backups/school_admin
#   （宿主目录已 chown 为 nestjs:1001 可写），并设置 BACKUP_DIR。
# 使用方法: sudo bash infra/run-backend.sh [IMAGE_TAG]
#   默认镜像: school-admin-backend:v1.5.7
# ============================================================
set -euo pipefail

IMAGE_TAG="${1:-school-admin-backend:v1.5.7}"
CONTAINER_NAME="school-admin-backend"
NETWORK="school-admin-network"
BACKUP_HOST_DIR="/var/backups/school_admin"

# 确保宿主机备份目录存在且属主为容器运行用户 nestjs(1001)
if [ ! -d "${BACKUP_HOST_DIR}" ]; then
  mkdir -p "${BACKUP_HOST_DIR}"
fi
if [ "$(stat -c '%u' "${BACKUP_HOST_DIR}")" != "1001" ]; then
  echo "设置备份目录属主为 nestjs(1001): ${BACKUP_HOST_DIR}"
  chown 1001:1001 "${BACKUP_HOST_DIR}"
  chmod 0750 "${BACKUP_HOST_DIR}"
fi

echo "启动 ${CONTAINER_NAME} (镜像 ${IMAGE_TAG})..."

# 删除已存在的同名容器（如果存在）
if docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
  echo "移除旧容器 ${CONTAINER_NAME}..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null
fi

docker run -d \
  --name "${CONTAINER_NAME}" \
  --network "${NETWORK}" \
  -p 3000:3000 \
  --restart unless-stopped \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e APP_NAME=SmartSchoolAdmin \
  -e TZ=Asia/Hong_Kong \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_USER=school_admin \
  -e DB_PASSWORD=school_admin123 \
  -e DB_NAME=school_admin \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  -e JWT_SECRET=change-me-in-production \
  -e JWT_EXPIRES_IN=7d \
  -e OPA_URL=http://opa:8181 \
  -e NOTIFICATION_CHANNEL=mock \
  -e COZE_API_KEY= \
  -e COZE_BOT_ID= \
  -e LOG_LEVEL=INFO \
  -e BACKUP_DIR=/var/backups/school_admin \
  -v "${BACKUP_HOST_DIR}:/var/backups/school_admin" \
  "${IMAGE_TAG}" \
  node apps/backend/dist/main.js

echo "✅ ${CONTAINER_NAME} 已启动。"
echo "备份目录: ${BACKUP_HOST_DIR} (nestJS 可写)"
