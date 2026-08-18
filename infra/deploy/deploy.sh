#!/bin/bash
# ============================================================
# deploy.sh — CR-20260714-001 Phase 5 T25 生产发布编排脚本
# ============================================================
# 用法：
#   sudo bash infra/deploy/deploy.sh [IMAGE_TAG]
#   镜像默认: school-admin-backend:v1.5.9（T25 发布目标升级到 v2.0.0 时传入对应 tag）
#
# 流程：
#   1) migrate-db.sh     — 数据库迁移（含授权确认；T28 发布前需 PM + 人类授权）
#   2) deploy-backend.sh — 后端无重建热更新（docker cp + docker restart）
#
# 安全：
#   - 本脚本会调用 migrate-db.sh 修改生产 schema，执行时会先二次确认。
#   - Docker Hub 受限：全程不执行 docker build / 不拉取新基础镜像。
#   - 仅 DEVOPS 范围（部署/迁移/配置），不写业务代码。
# ============================================================
set -euo pipefail

IMAGE_TAG="${1:-school-admin-backend:v1.5.9}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================================"
echo " School Admin 生产发布 — ${IMAGE_TAG}"
echo "======================================================"

echo ""
echo ">>> Step 1/2: 数据库迁移"
echo ">>> 迁移会修改生产 schema（新增/migrate 表）。当前为 T25 产物准备，"
echo ">>> 需在 T28 由 PM + 人类授权后方可正式执行。"
read -p "是否立即执行数据库迁移？[y/N] " -r
if [[ "${REPLY:-}" =~ ^[Yy]$ ]]; then
  bash "${SCRIPT_DIR}/migrate-db.sh" "${IMAGE_TAG}"
else
  echo ">>> 跳过迁移（未授权）。迁移文件已就绪，可在 T28 单独执行:"
  echo "    sudo bash infra/deploy/migrate-db.sh ${IMAGE_TAG}"
fi

echo ""
echo ">>> Step 2/2: 后端热更新部署"
bash "${SCRIPT_DIR}/deploy-backend.sh" "${IMAGE_TAG}"

# 提示 env 核对
echo ""
echo ">>> 提示：请核对 infra/deploy/ENV-VARS.md 中生产必需变量"
echo "    （QR_SIGNING_MASTER_KEY / FRONTEND_URL / WEBHOOK_SECRET 当前缺失）"

echo ""
echo "✅ 发布编排完成"
