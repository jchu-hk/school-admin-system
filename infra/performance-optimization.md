# 性能优化指南

## 1. 数据库查询优化

### 1.1 索引检查

已存在的索引（参考 DB-SCHEMA.md）：

```sql
-- 用户查询优化
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);

-- 请假模块查询优化
CREATE INDEX IF NOT EXISTS idx_leave_student ON leave_applications(student_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_applications(school_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_class ON leave_applications(class_id);

-- 考勤查询优化
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance_records(class_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records(student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance_records(school_id, date DESC);

-- 通知模块查询优化
CREATE INDEX IF NOT EXISTS idx_notification_school ON notifications(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_recipient ON notification_deliveries(recipient_id, status);
```

### 1.2 N+1 问题解决

**问题**: 常见于 `find()` + `relations` 使用场景

**解决示例**:

```typescript
// ❌ N+1 问题示例
const users = await userRepository.find(); // N queries
for (const user of users) {
  console.log(user.role.name); // 每个 user 触发一次 role 查询
}

// ✅ 正确做法：使用 join 一次性加载
const users = await userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.roles', 'role')
  .getMany();
```

**Leave 模块优化**:

```typescript
// 优化前
const applications = await this.leaveRepository.find({ relations: ['student', 'class'] });

// 优化后 - 使用 index hint 和 limit
const applications = await this.leaveRepository
  .createQueryBuilder('leave')
  .leftJoinAndSelect('leave.student', 'student')
  .leftJoinAndSelect('leave.class', 'class')
  .useIndex('idx_leave_student')  // 强制使用索引
  .where('leave.schoolId = :schoolId', { schoolId })
  .andWhere('leave.status IN (:...statuses)', { statuses: ['pending', 'pending_director'] })
  .orderBy('leave.createdAt', 'DESC')
  .skip((page - 1) * limit)
  .take(limit)
  .getManyAndCount();
```

### 1.3 批量操作优化

```typescript
// 批量通知发送优化：使用 bulk insert
async sendBulkNotifications(notifications: SendNotificationDto[]) {
  // 批量创建通知记录
  const notificationRecords = notifications.map(n =>
    this.notificationRepository.create({ ...n, status: NotificationStatus.PENDING })
  );
  await this.notificationRepository.save(notificationRecords, { chunk: 100 });

  // 批量创建送达记录
  const deliveries = notifications.flatMap(n =>
    (n.recipientIds || []).map(rid =>
      this.deliveryRepository.create({
        notificationId: n.id,
        recipientId: rid,
        status: DeliveryStatus.PENDING,
      })
    )
  );
  await this.deliveryRepository.save(deliveries, { chunk: 500 });
}
```

## 2. API 响应时间优化（目标 ≤500ms）

### 2.1 缓存策略

```typescript
// Redis 缓存装饰器
const CACHE_TTL = 60 * 5; // 5分钟

@Cacheable('leave:statistics', { ttl: CACHE_TTL })
async getStatistics(schoolId: string, dto: LeaveStatisticsDto) {
  // ...
}

// 缓存失效
@CacheEvict('leave:statistics:*')
async createLeave(dto: CreateLeaveDto) {
  // ...
}
```

### 2.2 异步处理

```typescript
// 通知发送改为异步，不阻塞主请求
@InjectQueue('notifications')
private notificationQueue: Queue;

async sendNotificationAsync(dto: SendNotificationDto) {
  await this.notificationQueue.add('send', dto, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
}
```

### 2.3 API 响应时间监控中间件

```typescript
// performance.middleware.ts
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 500) {
        console.warn(`[PERF] ${req.method} ${req.path} - ${duration}ms (SLOW)`);
        // 发送告警
      }
    });
    next();
  }
}
```

## 3. OPA 缓存配置优化

```yaml
# opa/config.yaml
services:
  local:
    url: http://localhost:8181

bundle:
  url: file:///policies/policies.tar.gz
  force_refresh: false
  polling:
    min_delay_seconds: 60
    max_delay_seconds: 300

decision_logs:
  console: false  # 生产环境关闭
  plugin: fluentd

status:
  port: 8282

caching:
  inter_query_builtin_cache:
    max_size: 1000
    avg_item_size: 10240  # 10KB

limits:
  max_query_memory_bytes: 1GB
  max_query_depth: 100
```

```rego
# 缓存友好的策略设计
# 使用索引字段进行过滤，避免全表扫描

package school.authz

default allow := false

allow if {
    # 使用索引字段 school_id 作为第一过滤条件
    input.school_id != ""
    input.user_id != ""

    # 缓存 key = school_id + role + resource
    cache_key := sprintf("%s:%s:%s", [input.school_id, input.user_role, input.resource])

    # ABAC 策略评估
    data.school[input.school_id].users[input.user_id].role == input.user_role
    data.school[input.school_id].permissions[input.resource][input.action]
}
```

## 4. 数据库连接池优化

```typescript
// app.module.ts - TypeORM 配置
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    // ...
    extra: {
      // 开发环境
      max: 20,         // 最大连接数
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
    // 生产环境（参考 docker-compose.prod.yml 的 DB_MAX_CONNECTIONS=200）
    extra: {
      max: parseInt(process.env.DB_MAX_CONNECTIONS || '50', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
  }),
})
```

## 5. 查询性能测试

```sql
-- 查看慢查询（PostgreSQL）
SELECT
  query,
  calls,
  mean_time,
  total_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- 开启慢查询日志
ALTER SYSTEM SET log_min_duration_statement = 500; -- 500ms
SELECT pg_reload_conf();
```

## 6. 性能目标清单

| 接口 | 目标 | 当前基线 | 优化措施 |
|------|------|---------|---------|
| GET /api/leaves | ≤300ms | ~800ms | 索引 + 分页 |
| GET /api/users | ≤200ms | ~500ms | 关系预加载 |
| POST /api/otp/verify | ≤100ms | ~150ms | 缓存 + 异步 |
| GET /api/notifications | ≤300ms | ~600ms | 索引 + 分页 |
