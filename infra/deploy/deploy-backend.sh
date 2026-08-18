#!/bin/bash
# ============================================================
# deploy-backend.sh — 后端无重建热更新部署脚本（Docker Hub 受限兼容）
# CR-20260714-001 Phase 5 T25
# ============================================================
# 背景约束（必须遵守）：
#   - Docker Hub 在中国网络受限，无法执行 `docker build`（RUN 阶段拉镜像/apt 失败）。
#   - 现有生产部署方式为 **docker cp + docker exec** 更新运行中的容器，本脚本遵循该约束，
#     不在本地拉取新基础镜像，只更新编译产物后重启容器进程。
#
# 部署流程：
#   1. 编译 backend 生产产物（npm run build → dist/）
#   2. docker cp 将编译产物拷入运行中容器 school-admin-backend
#   3. docker restart 重启容器，使新代码生效（容器 command 固定为 node apps/backend/dist/main.js）
#   4. 健康检查验证 + 版本日志
#
# 用法：  sudo bash infra/deploy/deploy-backend.sh [IMAGE_TAG]
#   默认目标镜像/容器: school-admin-backend:v1.5.9
#
# 前置：
#   - 容器已由 infra/run-backend.sh 启动
#   - 若本次变更含 DB schema，请先执行 infra/deploy/migrate-db.sh（迁移需授权）
#   - 部署前确认已执行 APP_NAME 等运行所需环境变量（见 infra/deploy/ENV-VARS.md）
# ============================================================
set -euo pipefail

CONTAINER_NAME="school-admin-backend"
IMAGE_TAG="${1:-school-admin-backend:v1.5.9}"
APP_DIR="apps/backend"
COMPILED_DIR="dist"

# 0) 前置检查
if ! command -v docker >/dev/null 2>&1; then
  echo "✗ 未找到 docker 命令" >&2; exit 1
fi
if ! docker ps --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
  echo "✗ 容器 ${CONTAINER_NAME} 未运行，请先用 infra/run-backend.sh 启动" >&2
  exit 1
fi

echo "==> 目标容器: ${CONTAINER_NAME} (镜像 ${IMAGE_TAG})"
echo "==> 编译 backend 生产产物..."
(cd "${APP_DIR}" && npm run build)

echo "==> docker cp 编译产物到容器（无镜像重建）..."
docker cp "${APP_DIR}/${COMPILED_DIR}" "${CONTAINER_NAME}":/app/apps/backend/dist

echo "==> 重启容器加载新代码..."
docker restart "${CONTAINER_NAME}"

echo "==> 等待健康检查..."
HEALTH_OK=0
for i in $(seq 1 30); do
  if curl -fsS "http://localhost:3000/api/health" >/dev/null 2>&1; then
    HEALTH_OK=1
    echo "✅ 健康检查通过"
    break
  fi
  sleep 3
done
if [ "${HEALTH_OK}" != "1" ]; then
  echo "✗ 健康检查未通过，请查看日志: docker logs ${CONTAINER_NAME}" >&2
  exit 1
fi

echo "==> 最近日志（尾部）..."
docker logs --tail 20 "${CONTAINER_NAME}"

echo "✅ deploy-backend.sh 完成 — ${CONTAINER_NAME} 已更新到最新编译产物"
