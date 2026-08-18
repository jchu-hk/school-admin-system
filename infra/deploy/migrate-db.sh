#!/bin/bash
# ============================================================
# migrate-db.sh — 生产库 TypeORM 迁移执行脚本
# CR-20260714-001 Phase 5 T25
# ============================================================
# 功能：
#   1. 编译 backend（生产构建）
#   2. 通过 docker cp 将编译产物与迁移脚本拷入运行中容器（兼容 Docker Hub 受限场景，
#      无需 docker build 拉镜像）
#   3. 在容器内执行 TypeORM migration:run（幂等，migrations 表保证只执行一次）
#   4. 打印迁移执行结果
#
# 用法：  sudo bash infra/deploy/migrate-db.sh [IMAGE_TAG]
#   默认容器: school-admin-backend（需已运行旧版本镜像）
#
# 幂等性说明：
#   - TypeORM migration runner 以数据库 migrations 表记录已执行迁移，天然幂等。
#   - 新迁移 1782530900000-CreateQrAttendanceAndPortalLeaveTables.ts 额外使用
#     CREATE TABLE IF NOT EXISTS / INDEX IF NOT EXISTS / DO $$ IF NOT EXISTS 约束，
#     对已在 dev 环境 synchronize 建过表的库也能安全重复执行。
#
# 注意：本脚本触发迁移会修改数据库 schema，需 PM + 人类授权后方可对生产执行（T28）。
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
if [ ! -d "${APP_DIR}/${COMPILED_DIR}" ]; then
  echo "✗ 未找到编译产物 ${APP_DIR}/${COMPILED_DIR}，请先构建" >&2
  exit 1
fi

echo "==> 目标容器: ${CONTAINER_NAME} (镜像 ${IMAGE_TAG})"
echo "==> 编译 backend 生产产物..."
(cd "${APP_DIR}" && npm run build)

echo "==> 拷贝编译产物 + 迁移文件到容器（docker cp，无需重拉镜像）..."
docker cp "${APP_DIR}/${COMPILED_DIR}" "${CONTAINER_NAME}":/app/apps/backend/dist

# 可选：校验迁移文件已进入容器
docker exec "${CONTAINER_NAME}" sh -c "ls apps/backend/dist/migrations/1782530900000* 2>/dev/null" \
  || { echo "✗ 迁移文件未拷贝成功" >&2; exit 1; }

echo "==> 在容器内执行 TypeORM migration:run ..."
# 容器内通过 typeorm CLI 运行（pnpm monorepo：cli.js 位于 apps/backend/node_modules/typeorm/cli.js）
# 使用编译后的 dist/data-source.js 作为 dataSource
docker exec -w /app/apps/backend "${CONTAINER_NAME}" \
  node node_modules/typeorm/cli.js migration:run --dataSource dist/data-source.js

echo "==> 迁移执行完成，验证当前已应用迁移列表..."
docker exec -w /app/apps/backend "${CONTAINER_NAME}" \
  node node_modules/typeorm/cli.js migration:show --dataSource dist/data-source.js || true

echo "✅ migrate-db.sh 完成"
