#!/bin/bash
set -e

echo "🔧 开始修复 backend 的 ESLint 错误..."

cd apps/backend

# 1) 删除明确的未使用 import（整行删除，避免跨行或部分匹配）
echo "Fixing unused imports..."

sed -i '/^import.*Between.*from '\''typeorm'\'';$/d' src/modules/abac/abac.service.ts
sed -i '/^import.*LessThan.*from '\''typeorm'\'';$/d' src/modules/abac/abac.service.ts
sed -i '/^import.*MoreThan.*from '\''typeorm'\'';$/d' src/modules/abac/abac.service.ts
sed -i '/^import.*IsNull.*from '\''typeorm'\'';$/d' src/modules/abac/abac.service.ts

sed -i '/^import.*APP_GUARD.*from.*@nestjs\/common/d' src/modules/abac/abac.module.ts
sed -i '/^import.*AbacGuard.*from.*\.\/abac\.guard/d' src/modules/abac/abac.module.ts

sed -i '/^import.*ManyToOne.*from.*typeorm/d' src/modules/user/class.entity.ts
sed -i '/^import.*JoinColumn.*from.*typeorm/d' src/modules/user/class.entity.ts

sed -i '/^import.*TypeOrmModule.*from.*@nestjs\/typeorm/d' src/modules/permission/permission.module.ts

sed -i '/^import.*Delete.*from.*@nestjs\/common/d' src/modules/permission-approval/permission-approval.controller.ts

echo "✅ Imports fixed"

# 2) 对未使用参数使用下划线前缀（不改逻辑，仅消除ESLint误报）
echo "Fixing unused parameters..."

sed -i 's/\buserId:\s*string\b/_userId: string/' src/modules/permission/services/permission.service.ts

sed -i 's/\buserId:\s*string\b/_userId: string/' src/modules/role/services/role.service.ts
sed -i 's/\broleName:\s*string\b/_roleName: string/' src/modules/role/services/role.service.ts

echo "✅ Parameters prefixed with underscore"

echo "✨ 已应用所有 lint 修复（逐文件精确操作）。"

# 验证修复（显示最新20行日志）
cd ../..
pnpm lint 2>&1 | tail -20