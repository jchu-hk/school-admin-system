/**
 * ABAC Module — ABAC 细粒度权限控制模块
 *
 * 提供:
 * - AbacService: OPA 规则引擎交互服务
 * - AbacGuard: NestJS 权限守卫
 * - AbacController: 管理 API（策略热更新、审计查询）
 *
 * 集成方式:
 * ```typescript
 * // 方式1: 全局注册（所有接口都受 ABAC 保护）
 * app.module.ts:
 *   import { AbacModule } from './modules/abac/abac.module';
 *   AbacModule.register()
 *
 * // 方式2: 在需要的模块中导入
 * @Module({
 *   imports: [AbacModule],
 * })
 * export class StudentModule {}
 *
 * // 方式3: 在控制器中单独使用 Guard
 * @Controller('students')
 * @UseGuards(RbacGuard, AbacGuard)  // RBAC 初筛 + ABAC 细筛
 * export class StudentController {}
 * ```
 */

import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AbacService } from './abac.service';
import { AbacController } from './abac.controller';

@Global()
@Module({
  controllers: [AbacController],
  providers: [
    AbacService,
    // 注册为全局守卫（可选，全局启用 ABAC）
  ],
  exports: [AbacService],
})
export class AbacModule {}
