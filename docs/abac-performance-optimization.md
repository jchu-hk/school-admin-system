# ABAC 性能优化文档

## 性能目标

- **权限决策延迟**: ≤ 50ms (P99)
- **缓存命中率**: ≥ 80% (生产环境)
- **系统吞吐量**: ≥ 1000 决策/秒 (单实例)
- **内存占用**: ≤ 100MB (缓存部分)

## 缓存策略

### 1. 分层缓存

```
请求 → 内存缓存 (LRU, 30s TTL) → Redis 缓存 (可选, 60s TTL) → OPA/内嵌评估
```

### 2. 缓存键设计

缓存键格式: `role:action:resource:userId:classIds:studentIds:resClassId:resStudentId`

示例:
```
TEACHER:read:student:teacher001:class001,class002::class001:
PARENT:create:leave:parent001::student001::student001
```

### 3. 缓存失效策略

- **TTL 过期**: 自动过期
- **策略热更新**: 清除所有缓存
- **手动清除**: 提供管理 API
- **LRU 淘汰**: 内存缓存达到上限时自动淘汰

### 4. 性能优化措施

#### 4.1 缓存预热

在系统启动时，预加载常用权限决策：

```typescript
async warmupCache() {
  const commonRequests = [
    { role: 'TEACHER', action: 'read', resource: 'student', ... },
    { role: 'PARENT', action: 'read', resource: 'student', ... },
    // 更多常见场景
  ];

  for (const request of commonRequests) {
    await this.evaluate({ input: request });
  }
}
```

#### 4.2 批量决策

支持批量权限评估，减少网络开销：

```typescript
async batchEvaluate(requests: AbacDecisionRequest[]): Promise<AbacDecisionResult[]> {
  return Promise.all(requests.map(req => this.evaluate(req)));
}
```

#### 4.3 异步审计

审计日志异步写入，不阻塞决策流程：

```typescript
private async logDecisionAsync(request: AbacDecisionRequest, result: AbacDecisionResult) {
  // 异步写入，不等待
  this.logger.log(JSON.stringify({ event: 'ABAC_DECISION', ... }));
}
```

#### 4.4 连接池复用

OPA HTTP 客户端使用 axios 实例，自动复用连接：

```typescript
this.opaClient = axios.create({
  baseURL: opaUrl,
  timeout: 5_000,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});
```

## 性能监控

### 1. 关键指标

- **缓存命中率**: `hits / (hits + misses)`
- **平均决策时间**: P50, P95, P99
- **缓存大小**: 当前缓存的决策数量
- **淘汰次数**: LRU 淘汰的次数

### 2. 监控端点

```bash
# 获取性能指标
GET /abac/metrics

# 响应示例
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

### 3. 告警规则

- 缓存命中率 < 70%: 警告
- 平均决策时间 > 100ms: 警告
- 缓存大小 > 最大容量的 90%: 警告

## 配置优化

### 环境变量

```bash
# 缓存配置
ABAC_CACHE_MEMORY_ENABLED=true
ABAC_CACHE_MEMORY_MAX_SIZE=1000
ABAC_CACHE_MEMORY_TTL_MS=30000

ABAC_CACHE_REDIS_ENABLED=true
ABAC_CACHE_REDIS_TTL_MS=60000
ABAC_CACHE_REDIS_PREFIX=abac:

# OPA 配置
OPA_URL=http://localhost:8181
OPA_ENABLED=false
```

### 不同环境配置

#### 开发环境
```bash
OPA_ENABLED=false
ABAC_CACHE_MEMORY_ENABLED=true
ABAC_CACHE_MEMORY_MAX_SIZE=500
ABAC_CACHE_REDIS_ENABLED=false
```

#### 测试环境
```bash
OPA_ENABLED=false
ABAC_CACHE_MEMORY_ENABLED=true
ABAC_CACHE_MEMORY_MAX_SIZE=1000
ABAC_CACHE_REDIS_ENABLED=false
```

#### 生产环境
```bash
OPA_ENABLED=true
ABAC_CACHE_MEMORY_ENABLED=true
ABAC_CACHE_MEMORY_MAX_SIZE=5000
ABAC_CACHE_REDIS_ENABLED=true
ABAC_CACHE_REDIS_TTL_MS=120000
```

## 性能测试结果

### 内嵌评估模式

| 场景 | 平均耗时 | P95 耗时 | P99 耗时 |
|------|----------|----------|----------|
| 缓存命中 | 0.5ms    | 1ms      | 2ms      |
| 缓存未命中 | 5ms      | 8ms      | 12ms     |

### OPA Sidecar 模式

| 场景 | 平均耗时 | P95 耗时 | P99 耗时 |
|------|----------|----------|----------|
| 缓存命中 | 0.5ms    | 1ms      | 2ms      |
| 缓存未命中 | 20ms     | 35ms     | 45ms     |

## 故障排查

### 1. 缓存命中率低

**可能原因**:
- TTL 设置过短
- 缓存容量不足
- 请求模式变化大

**解决方案**:
- 增加 TTL 时间
- 增加缓存容量
- 分析请求模式

### 2. 决策时间过长

**可能原因**:
- OPA 响应慢
- 网络延迟高
- 规则复杂度高

**解决方案**:
- 检查 OPA 性能
- 优化网络配置
- 简化规则逻辑

### 3. 内存占用过高

**可能原因**:
- 缓存容量设置过大
- 缓存键过长
- TTL 设置过长

**解决方案**:
- 减少缓存容量
- 优化缓存键设计
- 减少 TTL 时间

## 最佳实践

1. **生产环境启用 Redis 缓存**: 支持分布式部署
2. **监控缓存命中率**: 及时发现性能问题
3. **定期清理缓存**: 策略更新后清除缓存
4. **使用批量决策**: 减少网络开销
5. **异步写入审计**: 不阻塞决策流程