# ABAC 系统使用指南

## 概述

ABAC (Attribute-Based Access Control) 是一个基于属性的细粒度权限控制系统，支持：

- **角色属性**: 用户角色（教师、家长、校务主任等）
- **资源属性**: 被访问资源的特性（班级ID、学生ID等）
- **环境属性**: 时间、星期等上下文信息
- **动作属性**: 操作类型（读取、创建、更新、删除等）

## 快速开始

### 1. 配置环境变量

创建 `.env` 文件，添加以下配置：

```bash
# OPA 配置（可选）
OPA_URL=http://localhost:8181
OPA_ENABLED=false

# ABAC 缓存配置
ABAC_CACHE_MEMORY_ENABLED=true
ABAC_CACHE_MEMORY_MAX_SIZE=1000
ABAC_CACHE_MEMORY_TTL_MS=30000

ABAC_CACHE_REDIS_ENABLED=false
ABAC_CACHE_REDIS_TTL_MS=60000
ABAC_CACHE_REDIS_PREFIX=abac:
```

### 2. 在模块中导入 ABAC

```typescript
import { AbacModule } from './modules/abac/abac.module';

@Module({
  imports: [AbacModule],
  // ...
})
export class StudentModule {}
```

### 3. 在控制器中使用 ABAC Guard

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AbacGuard, AbacResource, AbacAction } from '../modules/abac/abac.guard';

@Controller('students')
@UseGuards(AbacGuard)
export class StudentController {

  @Get(':id')
  @AbacResource('student')
  @AbacAction('read')
  async findOne(@Param('id') id: string) {
    // ...
  }
}
```

## 权限规则

### 1. 校务主任 (SCHOOL_DIRECTOR)

拥有所有资源的完整权限：

```typescript
{
  role: 'SCHOOL_DIRECTOR',
  action: 'any',  // read, create, update, delete, export, print
  resource: 'any' // 任何资源
}
```

### 2. 教师 (TEACHER)

只能查看和管理本班级的学生数据：

```typescript
{
  role: 'TEACHER',
  action: 'read',
  resource: 'student',
  user: { classIds: ['class-001', 'class-002'] },
  resourceData: { classId: 'class-001' }  // 必须匹配
}
```

### 3. 家长 (PARENT)

只能查看自己孩子的数据：

```typescript
{
  role: 'PARENT',
  action: 'read',
  resource: 'student',
  user: { relatedStudentIds: ['student-001', 'student-002'] },
  resourceData: { studentId: 'student-001' }  // 必须匹配
}
```

### 4. 财务人员 (FINANCE_STAFF)

工作时间限制（9:00-18:00，周一至周五）：

```typescript
{
  role: 'FINANCE_STAFF',
  action: 'read',
  resource: 'finance',
  currentTime: '10:00',  // 9:00-18:00
  weekday: 'Monday'      // Monday-Friday
}
```

### 5. 批量导出限制

只有校务主任可以执行批量导出：

```typescript
{
  role: 'TEACHER',
  action: 'export',  // 拒绝
  resource: 'student'
}
```

## API 端点

### 健康检查

```bash
GET /abac/health
```

响应：
```json
{
  "status": "ok",
  "opaEnabled": false,
  "version": null,
  "timestamp": "2026-06-13T12:00:00.000Z"
}
```

### 策略管理

```bash
# 获取策略元数据
GET /abac/policies

# 热更新策略
POST /abac/policies/reload
```

### 权限评估（调试用）

```bash
POST /abac/evaluate
Content-Type: application/json

{
  "input": {
    "role": "TEACHER",
    "action": "read",
    "resource": "student",
    "user": {
      "id": "teacher-001",
      "classIds": ["class-001"]
    },
    "resourceData": {
      "classId": "class-001"
    }
  }
}
```

响应：
```json
{
  "allow": true,
  "matchedPolicy": "school.authz.allow",
  "decisionTimeMs": 5,
  "evaluatedAt": "2026-06-13T12:00:00.000Z"
}
```

### 性能监控

```bash
# 获取缓存性能指标
GET /abac/metrics

# 重置缓存统计
POST /abac/metrics/reset
```

响应：
```json
{
  "hits": 8500,
  "misses": 1500,
  "sets": 1500,
  "deletes": 100,
  "evictions": 50,
  "currentSize": 950,
  "hitRate": 0.85,
  "timestamp": "2026-06-13T12:00:00.000Z"
}
```

## 装饰器

### @AbacResource()

指定资源类型：

```typescript
@AbacResource('student')
@Get(':id')
async findOne(@Param('id') id: string) {
  // ...
}
```

### @AbacAction()

指定操作类型：

```typescript
@AbacAction('read')
@Get(':id')
async findOne(@Param('id') id: string) {
  // ...
}

@AbacAction('create')
@Post()
async create(@Body() createStudentDto: CreateStudentDto) {
  // ...
}
```

### @AbacSkip()

跳过 ABAC 检查（公开接口）：

```typescript
@AbacSkip()
@Get('public/info')
async getPublicInfo() {
  // ...
}
```

### @AbacResourceData()

传递额外的资源数据：

```typescript
@AbacResourceData({ classId: 'params.classId' })
@Get('class/:classId/students')
async findByClass(@Param('classId') classId: string) {
  // ...
}
```

## 缓存策略

### 缓存层级

1. **内存缓存** (LRU, 30s TTL)
2. **Redis 缓存** (可选, 60s TTL)
3. **OPA/内嵌评估**

### 缓存键格式

```
role:action:resource:userId:classIds:studentIds:resClassId:resStudentId
```

### 缓存失效

- **TTL 过期**: 自动过期
- **策略热更新**: 清除所有缓存
- **手动清除**: 使用 API 端点

## 性能优化

### 1. 启用缓存

```bash
ABAC_CACHE_MEMORY_ENABLED=true
ABAC_CACHE_MEMORY_MAX_SIZE=5000
```

### 2. 生产环境使用 Redis

```bash
ABAC_CACHE_REDIS_ENABLED=true
ABAC_CACHE_REDIS_TTL_MS=120000
```

### 3. 监控缓存命中率

```bash
GET /abac/metrics
```

目标: ≥ 80% 命中率

## 故障排查

### 权限被拒绝

1. 检查用户角色是否正确
2. 验证资源数据是否匹配
3. 查看决策日志

```typescript
// 使用调试端点
POST /abac/evaluate
{
  "input": { /* 你的输入 */ }
}
```

### 性能问题

1. 检查缓存命中率
2. 增加缓存容量
3. 减少 TTL 时间

```bash
GET /abac/metrics
```

### 缓存问题

1. 手动清除缓存
2. 检查缓存配置
3. 监控缓存大小

```bash
POST /abac/policies/reload
```

## 测试

### 单元测试

```bash
npm test -- abac.service.spec.ts
npm test -- abac.guard.spec.ts
npm test -- abac.controller.spec.ts
```

### 集成测试

```bash
npm test -- abac.integration.spec.ts
```

### 性能测试

```bash
npm test -- abac-performance.integration.spec.ts
```

## 最佳实践

1. **明确的资源标识**: 使用清晰的资源名称
2. **合理的缓存配置**: 根据业务需求调整
3. **监控性能指标**: 定期检查缓存命中率
4. **规则简化**: 保持规则逻辑清晰
5. **测试覆盖**: 确保所有权限场景都有测试

## 扩展

### 添加新的权限规则

1. 在 `abac.service.ts` 中添加规则逻辑
2. 在 `school.authz.rego` 中添加对应规则
3. 编写测试验证规则
4. 更新文档

### 集成新的资源类型

1. 定义资源名称
2. 在规则中添加资源处理逻辑
3. 在控制器中使用 `@AbacResource()` 装饰器
4. 编写集成测试

## 相关文档

- [ABAC 性能优化文档](./abac-performance-optimization.md)
- [ABAC 架构设计](./school-admin-system/SPEC-SYSTEM-DESIGN.md)
- [ABAC 接口文档](http://localhost:3000/api-docs)