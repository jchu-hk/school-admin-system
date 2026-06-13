#!/bin/bash
set -e

echo "🔧 继续精确修复 backend 的 ESLint 错误..."

cd apps/backend

# 1) 修复 role.service.ts 中的未使用 typeorm 导入（严格路径）
echo "Fixing role.service.ts (typeorm unused imports)..."
sed -i 's/IsNull,//g' src/modules/role/services/role.service.ts
sed -i 's/LessThan,//g' src/modules/role/services/role.service.ts
sed -i 's/MoreThan,//g' src/modules/role/services/role.service.ts

# 2) 修复 permission-approval.controller.ts 中的 Delete（严格路径）
echo "Fixing permission-approval.controller.ts (Delete unused import)..."
sed -i 's/Delete,//g' src/modules/permission-approval/permission-approval.controller.ts

# 3) 修复 otp.services.ts 中的 LessThan（严格路径）
echo "Fixing otp.service.ts (LessThan unused import)..."
sed -i 's/LessThan,//g' src/modules/otp/services/otp.service.ts

echo "✅ 修复完成（逐文件，严格路径）。"

# 验证修复
cd ../..
pnpm lint 2>&1 | tail -20