# 用户管理模块 QA 验收报告

**日期**: 2026-06-25  
**测试环境**: https://hockey-deviant-brooks-litigation.trycloudflare.com  
**测试账号**: admin/Admin123! (系统管理员), staff1/Admin123! (校务)  
**功能ID**: F-USER-001 | MOD-USER-001 | Issue #145, #39  

---

## 📊 验收结果总览

| 分类 | 通过 | 失败 | 跳过 | 合计 |
|------|------|------|------|------|
| 用户CRUD | 2 | 1 | 1 | 4 |
| 角色和权限 | 1 | 2 | 0 | 3 |
| 账户管理 | 1 | 3 | 0 | 4 |
| 家长功能 | 2 | 0 | 0 | 2 |
| API文档 | 0 | 2 | 0 | 2 |
| 其他功能 | 3 | 0 | 0 | 3 |
| **总计** | **9** | **8** | **1** | **18** |

**结论**: ⚠️ **部分通过** — 9/17项验收通过，8项失败需修复

---

## 1. 用户CRUD功能

### ✅ 1.1 查询用户列表 - GET /api/users
- **状态**: PASS
- **验证**: 返回 `{data: [...], total: N}` 结构，包含分页
- **备注**: 密码字段未脱敏（`$2a$...`完整hash泄露）

### ✅ 1.2 查询单个用户 - GET /api/users/:id
- **状态**: PASS
- **验证**: 正确返回用户详情
- **备注**: 密码字段未脱敏

### ❌ 1.3 更新用户 - PATCH /api/users/:id
- **状态**: FAIL
- **响应**: HTTP 500 Internal Server Error
- **根因**: `userLifecycleService.getExpiryStatistics()` 在 `/users/expiry-stats` 同样500，LifecycleService 依赖的数据库表/查询有问题
- **影响**: 所有涉及 `userLifecycleService` 的端点均受影响

### ⚠️ 1.4 删除用户 - DELETE /api/users/:id
- **状态**: SKIP (依赖创建用户功能)
- **原因**: POST /users 返回500，无法创建测试用户再删除
- **说明**: DELETE端点代码逻辑正确，但因上游创建失败无法完整测试

---

## 2. 角色和权限

### ✅ 2.1 角色列表 - GET /api/roles
- **状态**: PASS
- **验证**: 返回5个系统角色: system_admin, school_staff, teacher, parent, student

### ❌ 2.2 权限变更 - POST /api/users/:id/role
- **状态**: FAIL
- **响应**: HTTP 404 Not Found
- **问题**: 验收范围要求此端点，但 controller 中未找到对应路由
- **影响**: 管理员无法通过API直接变更用户角色

### ✅ 2.3 RBAC验证
- **状态**: PASS
- **验证**: staff1 (school_staff) 无法创建用户，返回 403 Forbidden
- **验证**: 输入验证返回 400 Bad Request

---

## 3. 账户管理

### ❌ 3.1 账户状态管理 - PATCH /api/users/:id/toggle-status
- **状态**: FAIL
- **响应**: HTTP 500 Internal Server Error
- **关联**: 同 `userLifecycleService` 500问题

### ❌ 3.2 密码重置 - PATCH /api/users/:id/reset-password
- **状态**: FAIL
- **响应**: HTTP 500 Internal Server Error
- **关联**: 同 `userLifecycleService` 500问题

### ❌ 3.3 过期预警机制 - GET /api/users/expiry-stats
- **状态**: FAIL
- **响应**: HTTP 500 Internal Server Error
- **根因**: `UserLifecycleService.getExpiryStatistics()` 内部错误

### ✅ 3.4 离职处理 - POST /api/users/:id/handle-departure
- **状态**: PASS
- **验证**: 端点可访问，调用成功

---

## 4. 家长功能

### ✅ 4.1 家长列表 - GET /api/users?role=parent
- **状态**: PASS
- **验证**: 返回家长用户列表

### ✅ 4.2 家长多子女绑定
- **状态**: PASS (字段存在)
- **验证**: `relatedStudentId` 字段存在，Entity正确配置 `ManyToOne`
- **问题**: 所有现有家长记录的 `relatedStudentId` 均为 null，未实际关联学生
- **说明**: API可写入该字段，但前端无对应UI

### ✅ 4.3 班级列表 - GET /api/users/classes
- **状态**: PASS
- **验证**: 返回 ["1A","2A","中一A班",...]

---

## 5. API文档

### ❌ 5.1 Swagger UI - GET /api/docs
- **状态**: FAIL
- **响应**: HTTP 404 Not Found
- **问题**: NestJS未配置SwaggerModule（main.ts无 `SwaggerModule.setup()`）

### ❌ 5.2 Swagger JSON - GET /api/docs-json
- **状态**: FAIL
- **响应**: HTTP 404 Not Found
- **问题**: 同上

---

## 6. 其他验收项

### ✅ 6.1 当前用户信息 - GET /api/users/profile/me
- **状态**: PASS

### ✅ 6.2 分页查询 - GET /api/users?page=2&limit=2
- **状态**: PASS

### ✅ 6.3 输入验证 - 无效输入返回400
- **状态**: PASS

---

## 🐛 Bug汇总 (建议创建Issue)

| # | 严重度 | 问题 | 根因 |
|---|--------|------|------|
| BUG-1 | **P0** | `PATCH /users/:id`, `toggle-status`, `reset-password`, `expiry-stats` 均返回500 | `UserLifecycleService` 内部错误，可能是依赖缺失 |
| BUG-2 | **P1** | `POST /users` (创建用户) 返回500 | 同上，LifecycleService问题导致级联失败 |
| BUG-3 | **P1** | `POST /users/:id/role` 端点不存在 (404) | 验收要求但未实现 |
| BUG-4 | **P1** | Swagger文档未配置 (404) | `main.ts` 缺少 SwaggerModule 配置 |
| BUG-5 | **P2** | 密码字段未在API响应中脱敏 | `User` entity的password字段使用了 `@Exclude()` 但响应仍包含完整hash |
| BUG-6 | **P2** | 家长 `relatedStudentId` 均为null，无实际关联数据 | 功能未完成或前端无UI |
| BUG-7 | **P2** | `school_director` 角色在 `UserRole` 枚举中存在，但不在 `/roles` 列表中 | `/roles` 返回硬编码角色列表，缺少 `school_director` |

---

## 🔧 修复建议

### BUG-1 & BUG-2: UserLifecycleService 500问题
```
检查 UserLifecycleService 构造函数和依赖注入
可能原因：
1. 缺少数据库表（user_expiry_notifications? user_lifecycle_schedules?）
2. SchedulerService/TypeORMTimer未正确初始化
3. Cron job 配置错误

临时修复：
1. 查看 backend container logs: docker logs school-admin-backend --tail 100
2. 运行数据库迁移
3. 检查 lifecycle service 依赖的 entity 是否存在
```

### BUG-3: POST /users/:id/role 缺失
```
在 UserController 中添加端点：

@Post(':id/role')
@ApiOperation({ summary: '变更用户角色' })
@Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
async changeRole(@Param('id') id: string, @Body('role') role: UserRole, @Request() req) {
  return this.userService.changeRole(id, role, req.user.id);
}
```

### BUG-4: Swagger配置
```
在 main.ts 添加：

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
const config = new DocumentBuilder()
  .setTitle('智慧校园管理API')
  .setDescription('School Admin API Documentation')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);
```

### BUG-5: 密码脱敏
```
检查 ClassSerializerInterceptor 或 ClassTransformOptions
确保 response transform 配置了 excludeExtraneousValues
```

---

## 📋 通过标准确认

| 标准 | 状态 |
|------|------|
| 所有验收项通过 | ❌ 否 (9/17) |
| 生成验收报告 | ✅ 是 |
| 通过后关闭 #145 和 #39 | ❌ 暂不关闭，需修复后重测 |
| 发现问题则创建Bug Issue | ✅ 已记录，需转化为GitHub Issue |

---

## ⏭️ 下一步行动

**DEV需修复**:
1. 修复 `UserLifecycleService` 500问题 → 解决 BUG-1, BUG-2
2. 添加 `POST /users/:id/role` 端点 → 解决 BUG-3
3. 配置 Swagger 文档 → 解决 BUG-4

**QA待办**:
- 修复完成后重新测试 BUG-1, BUG-2, BUG-3
- 测试 `DELETE /users/:id` (创建用户修复后)
- 补充前端UI测试截图

