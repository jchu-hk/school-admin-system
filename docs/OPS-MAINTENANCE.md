# OPS系统维护手册

**版本**: v1.0.0  
**创建日期**: 2026-06-24  
**最后更新**: 2026-06-24  
**对应设计文档**: SPEC-SYSTEM-DESIGN.md v1.7.0 Section 9 (F-OPS-001至F-OPS-009)

---

## 目录

1. [日常检查清单](#1-日常检查清单)
2. [告警处理流程](#2-告警处理流程)
3. [故障排查步骤](#3-故障排查步骤)
4. [紧急联系信息](#4-紧急联系信息)
5. [脚本使用说明](#5-脚本使用说明)
6. [运维健康指标标准](#6-运维健康指标标准)

---

## 1. 日常检查清单

### 每日检查 (08:00)

**自动化检查脚本**: 可运行 `scripts/pm-daily-check.sh` 自动执行以下大部分检查项。

```bash
# 执行每日检查
cd /workspace/projects/workspace
./scripts/pm-daily-check.sh
```

#### 1.1 容器状态检查

```bash
# 检查所有容器状态
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 检查容器健康状态
docker inspect --format='{{.State.Health.Status}}' $(docker ps -q)
```

**期望结果**: 所有容器状态为 `running`，健康状态为 `healthy`

**异常处理**:
- 容器停止 → 执行 `docker restart <container_name>`
- 容器不健康 → 检查日志 `docker logs <container_name> --tail 100`

#### 1.2 健康检查API验证

```bash
# 基础健康检查
curl -s http://localhost:3000/api/health | jq .

# 详细健康检查
curl -s http://localhost:3000/api/health/detailed | jq .

# 数据库健康检查
curl -s http://localhost:3000/api/health/database | jq .
```

**期望结果**: 
- `status: "healthy"` 或 `status: "ok"`
- 所有子系统状态为 `healthy`

**异常处理**:
- API返回 `unhealthy` → 查看 `docker logs backend --tail 200`
- 数据库检查失败 → 执行 `scripts/db-health-check.sh`

#### 1.3 WAL积压检查

```bash
# 使用健康检查脚本
./scripts/db-health-check.sh | jq '.checks[] | select(.name=="wal")'

# 或直接查询数据库
psql -h $DB_HOST -U school_admin -d school_admin -c \
  "SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0') / 1024 / 1024 as wal_mb;"
```

**期望结果**: WAL积压 < 500MB

**阈值标准**:
- `< 200MB`: 正常 ✅
- `200-500MB`: 轻微警告 ⚠️
- `> 500MB`: 需要立即处理 🔴

**异常处理**:
- WAL > 500MB → 检查归档进程状态，可能需要手动归档

#### 1.4 连接池使用率检查

```bash
# 使用健康检查脚本
./scripts/db-health-check.sh | jq '.checks[] | select(.name=="pool")'

# 或直接查询
psql -h $DB_HOST -U school_admin -d school_admin -c \
  "SELECT count(*) as used, (SELECT setting FROM pg_settings WHERE name='max_connections') as max;"
```

**期望结果**: 连接池使用率 < 80%

**阈值标准**:
- `< 60%`: 正常 ✅
- `60-80%`: 轻微警告 ⚠️
- `> 80%`: 需要优化 🔴

**异常处理**:
- 使用率 > 80% → 检查是否有连接泄漏，重启backend服务释放连接

#### 1.5 错误日志检查

```bash
# 检查backend错误日志
docker logs backend --tail 200 | grep -i "error\|exception\|failed"

# 检查nginx错误日志
docker logs nginx --tail 100 | grep -i "error"

# 检查数据库错误日志
docker logs postgres --tail 100 | grep -i "error\|fatal"
```

**期望结果**: 无严重错误日志

**异常处理**:
- 发现大量5xx错误 → 检查API健康状态和错误率
- 发现数据库连接错误 → 执行数据库健康检查

---

### 每周检查 (周一)

#### 1.6 SSL证书有效期检查

```bash
# 使用证书续期脚本检查
./scripts/ssl-cert-renew.sh --check-only

# 或手动检查
openssl s_client -servername school-admin.hk -connect localhost:443 2>/dev/null | \
  openssl x509 -noout -dates
```

**期望结果**: 证书有效期 > 30天

**阈值标准**:
- `> 60天`: 正常 ✅
- `30-60天`: 计划续期 ⚠️
- `< 30天`: 立即续期 🔴

**异常处理**:
- 证书 < 30天到期 → 执行 `./scripts/ssl-cert-renew.sh`

#### 1.7 磁盘空间检查

```bash
# 检查磁盘使用率
df -h | grep -E "/$|/data|/var"

# 检查docker磁盘使用
docker system df
```

**期望结果**: 
- 系统盘剩余空间 > 20%
- 数据盘剩余空间 > 30%

**阈值标准**:
- `> 30%`: 正常 ✅
- `20-30%`: 轻微警告 ⚠️
- `< 20%`: 需要清理 🔴

**异常处理**:
- 空间不足 → 清理旧日志、docker镜像、临时文件
```bash
# 清理docker资源
docker system prune -af --volumes

# 清理旧日志
find /var/log -type f -name "*.log" -mtime +30 -delete
```

#### 1.8 备份完整性检查

```bash
# 检查备份文件
ls -lh /backups/*.sql.gz | tail -5

# 检查备份校验和
sha256sum /backups/latest.sql.gz

# 验证备份可用性（可选，建议在测试环境执行）
gunzip -c /backups/latest.sql.gz | head -100
```

**期望结果**: 
- 每日备份文件存在
- 备份文件大小合理（不为0）
- 校验和一致

**异常处理**:
- 备份缺失 → 检查 `scripts/backup-database.sh` 执行状态
- 备份损坏 → 手动执行备份

#### 1.9 Prometheus告警历史检查

```bash
# 检查最近告警记录
curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.status.state=="firing")'

# 检查告警历史（过去7天）
curl -s "http://localhost:9090/api/v1/query?query=ALERTS_FOR_STATE" | jq .
```

**期望结果**: 无持续触发的告警

**异常处理**:
- 发现持续告警 → 查看告警原因，执行相应故障排查

---

### 每月检查

#### 1.10 容量规划评估

检查项目:
- 数据库增长趋势
- 用户数增长趋势
- API请求量增长趋势
- 存储容量增长趋势

```bash
# 数据库大小趋势
psql -c "SELECT pg_database_size('school_admin') / 1024 / 1024 as size_mb;"

# 检查Grafana Dashboard趋势图
# 访问: http://localhost:3001/d/database-monitoring
```

**建议**: 如果增长超过预期，提前扩容

#### 1.11 安全漏洞扫描

```bash
# 使用安全扫描工具（如果有配置）
docker scan backend
docker scan frontend

# 检查依赖漏洞
npm audit
```

**期望结果**: 无高危漏洞

**异常处理**: 升级依赖包修复漏洞

#### 1.12 备份恢复测试

**建议**: 每月至少一次在测试环境执行备份恢复测试

```bash
# 在测试环境执行恢复
gunzip -c /backups/latest.sql.gz | psql -h test-db -U school_admin -d school_admin_test

# 验证恢复结果
psql -h test-db -U school_admin -d school_admin_test -c "SELECT count(*) FROM users;"
```

**期望结果**: 数据完整恢复，数据量一致

#### 1.13 证书续期检查（季度）

检查所有SSL证书状态，计划续期时间表。

---

## 2. 告警处理流程

### 2.1 Critical级别 (15分钟内响应)

**通知方式**: SMS + Slack + Email

#### 处理流程

```
1. 收到告警通知
   ↓
2. 确认告警类型和严重程度
   ↓
3. 检查健康检查API确认问题
   curl -s http://localhost:3000/api/health/detailed | jq .
   ↓
4. 查看相关日志定位根因
   docker logs <service> --tail 200
   ↓
5. 执行修复脚本或手动干预
   ↓
6. 验证修复结果
   curl -s http://localhost:3000/api/health | jq '.status'
   ↓
7. 记录处理过程
   更新 /workspace/projects/workspace/memory/YYYY-MM-DD.md
```

#### 常见Critical告警处理

**服务宕机 (ServiceDown)**:
```bash
# 1. 检查容器状态
docker ps -a | grep <service>

# 2. 重启容器
docker restart <service>

# 3. 检查日志
docker logs <service> --tail 100

# 4. 验证恢复
curl -s http://localhost:3000/api/health | jq .
```

**数据库连接池 > 80% (DatabasePoolHigh)**:
```bash
# 1. 检查活跃连接
psql -c "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"

# 2. 查找长时间空闲连接
psql -c "SELECT pid, usename, state, query_start FROM pg_stat_activity WHERE state='idle' AND query_start < NOW() - INTERVAL '10 minutes';"

# 3. 终止空闲连接
psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state='idle' AND query_start < NOW() - INTERVAL '10 minutes';"

# 4. 重启backend释放连接池
docker restart backend
```

**WAL积压 > 500MB (WALBacklogHigh)**:
```bash
# 1. 检查WAL状态
psql -c "SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0') / 1024 / 1024 as wal_mb;"

# 2. 检查归档进程
psql -c "SELECT * FROM pg_stat_archiver;"

# 3. 手动触发归档（如需要）
psql -c "SELECT pg_switch_wal();"

# 4. 检查归档配置
cat /etc/postgresql/postgresql.conf | grep archive
```

**审计日志断层 (AuditLogGapDetected)**:
```bash
# 1. 检查Kafka消费状态
./scripts/kafka-consumer-status.sh

# 2. 检查MongoDB审计日志
mongo audit_logs --eval "db.logs.find().sort({sequence:-1}).limit(10)"

# 3. 触发补录流程（自动或手动）
./scripts/audit-log-backfill.sh

# 4. 验证完整性
curl -s http://localhost:3000/api/audit/integrity-check | jq .
```

---

### 2.2 Warning级别 (2小时内响应)

**通知方式**: Slack + Email

#### 处理流程

```
1. Slack通知确认
   ↓
2. 分析告警原因
   查看Prometheus Dashboard
   ↓
3. 制定处理方案
   ↓
4. 执行优化措施
   ↓
5. 验证优化效果
   ↓
6. 更新运维日志
```

#### 常见Warning告警处理

**API响应延迟 > 2s (HighLatency)**:
```bash
# 1. 检查API性能
curl -s "http://localhost:3000/api/metrics" | grep http_request_duration

# 2. 检查数据库慢查询
psql -c "SELECT query, calls, total_time/calls as avg_time FROM pg_stat_statements ORDER BY avg_time DESC LIMIT 10;"

# 3. 检查Redis缓存命中
curl -s http://localhost:3000/api/health/cache | jq .

# 4. 执行优化
# - 优化慢查询SQL
# - 增加缓存策略
# - 检查是否有大查询并发
```

**缓存命中率 < 60% (CacheHitLow)**:
```bash
# 1. 检查Redis状态
redis-cli INFO stats | grep hit_rate

# 2. 分析缓存使用模式
redis-cli --bigkeys

# 3. 优化缓存策略
# - 增加热点数据缓存
# - 调整缓存过期时间
# - 增加缓存容量
```

**SSL证书即将过期 (CertExpiringSoon)**:
```bash
# 1. 检查证书状态
./scripts/ssl-cert-renew.sh --check-only

# 2. 执行续期
./scripts/ssl-cert-renew.sh

# 3. 验证新证书
openssl s_client -servername school-admin.hk -connect localhost:443 2>/dev/null | openssl x509 -noout -dates
```

**Coze配额 > 80% (CozeQuotaUsageWarning)**:
```bash
# 1. 检查配额使用
curl -s http://localhost:3000/api/ai/quota | jq .

# 2. 分析使用模式
# - 检查是否有异常高频调用
# - 调整AI功能调用频率

# 3. 准备备用方案
# - 确认OpenAI备用API可用
# - 测试本地备用模型
```

---

## 3. 故障排查步骤

### 3.1 服务宕机

#### 排查步骤

```bash
# Step 1: 检查容器状态
docker ps -a
docker inspect <container> | jq '.[0].State'

# Step 2: 查看容器日志
docker logs <container> --tail 200
docker logs <container> --since 30m

# Step 3: 检查容器资源使用
docker stats <container>

# Step 4: 检查网络连接
docker network inspect bridge

# Step 5: 重启容器
docker restart <container>

# Step 6: 如果重启失败，重建容器
docker compose up -d --force-recreate <service>

# Step 7: 验证恢复
curl -s http://localhost:3000/api/health | jq .
```

#### 常见原因

- 内存溢出 (OOM) → 检查 `docker inspect` 的 `OOMKilled` 字段
- 配置错误 → 检查环境变量和配置文件
- 依赖服务不可用 → 检查数据库、Redis等依赖
- 端口冲突 → 检查端口占用 `netstat -tulpn`

---

### 3.2 数据库问题

#### 排查步骤

```bash
# Step 1: 执行数据库健康检查
./scripts/db-health-check.sh

# Step 2: 检查数据库状态API
curl -s http://localhost:3000/api/health/database | jq .

# Step 3: 检查连接状态
psql -c "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"

# Step 4: 检查慢查询
psql -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 20;"

# Step 5: 检查WAL状态
psql -c "SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0') / 1024 / 1024 as wal_mb;"

# Step 6: 检查锁等待
psql -c "SELECT relation::regclass, mode, granted, count(*) FROM pg_locks GROUP BY relation, mode, granted;"

# Step 7: 检查磁盘空间
df -h /var/lib/postgresql
```

#### 常见问题处理

**连接池耗尽**:
```bash
# 终止空闲连接
psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state='idle' AND query_start < NOW() - INTERVAL '5 minutes';"

# 增加max_connections（需要重启数据库）
# 修改postgresql.conf: max_connections = 200
```

**WAL积压过大**:
```bash
# 检查归档进程
psql -c "SELECT * FROM pg_stat_archiver;"

# 手动切换WAL
psql -c "SELECT pg_switch_wal();"

# 检查归档命令配置
cat /etc/postgresql/postgresql.conf | grep archive_command
```

**慢查询优化**:
```bash
# 分析慢查询
EXPLAIN ANALYZE <慢查询SQL>

# 创建缺失索引
CREATE INDEX CONCURRENTLY idx_xxx ON table_name(column);

# 更新统计信息
ANALYZE table_name;
```

---

### 3.3 高延迟

#### 排查步骤

```bash
# Step 1: 检查API响应时间
curl -s "http://localhost:9090/api/v1/query?query=http_request_duration_seconds" | jq .

# Step 2: 检查数据库响应时间
psql -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Step 3: 检查Redis缓存命中
redis-cli INFO stats | grep -E "hit_rate|keyspace_hits|keyspace_misses"

# Step 4: 检查网络延迟
ping -c 10 localhost
traceroute backend-service

# Step 5: 检查CPU和内存
top
docker stats
```

#### 优化措施

**数据库优化**:
- 添加索引
- 优化查询语句
- 调整查询计划

**缓存优化**:
- 增加热点数据缓存
- 调整缓存过期策略
- 增加缓存容量

**资源优化**:
- 增加CPU/内存资源
- 调整并发配置
- 优化连接池设置

---

## 4. 紧急联系信息

### 4.1 运维团队

| 角色 | 姓名 | 联系方式 | 负责范围 |
|------|------|----------|----------|
| 运维主管 | [待填写] | [电话] | 整体运维协调、P0告警决策 |
| DBA | [待填写] | [电话] | 数据库维护、备份恢复、性能优化 |
| 后端开发 | [待填写] | [电话] | API问题排查、代码修复 |
| 前端开发 | [待填写] | [电话] | 前端问题排查、用户体验 |
| 安全工程师 | [待填写] | [电话] | 安全告警、审计日志、权限问题 |

### 4.2 第三方支持

| 服务提供商 | 联系方式 | 服务范围 |
|------------|----------|----------|
| 云服务商技术支持 | [待填写] | 基础设施故障、网络问题 |
| 数据库顾问 | [待填写] | PostgreSQL高级问题 |
| 安全审计机构 | [待填写] | 安全评估、合规审计 |

### 4.3 业务方联系

| 角色 | 姓名 | 联系方式 | 职责 |
|------|------|----------|------|
| 校务主任 | [待填写] | [电话] | 业务决策、紧急授权 |
| IT主管 | [待填写] | [电话] | 技术协调、用户沟通 |

---

## 5. 脚本使用说明

### 5.1 数据库健康检查脚本

**脚本路径**: `scripts/db-health-check.sh`

**功能**: F-OPS-001 数据库健康检查，输出JSON格式结果

**使用方式**:

```bash
# 基本使用
./scripts/db-health-check.sh

# 自定义数据库连接参数
DB_HOST=192.168.1.100 DB_PORT=5432 ./scripts/db-health-check.sh

# 自定义WAL阈值（MB）
WAL_THRESHOLD=300 ./scripts/db-health-check.sh

# 输出美化
./scripts/db-health-check.sh | jq .
```

**输出格式**:

```json
{
  "timestamp": "2026-06-24T08:45:00+08:00",
  "checks": [
    {
      "name": "connection",
      "status": "healthy",
      "message": "连接正常",
      "responseTime": "15ms"
    },
    {
      "name": "wal",
      "status": "healthy",
      "message": "WAL正常",
      "sizeMb": 120,
      "threshold": 500
    },
    {
      "name": "pool",
      "status": "healthy",
      "used": 45,
      "max": 100,
      "available": 55
    }
  ]
}
```

**状态判断**:
- `healthy`: 正常
- `warning`: 轻微警告，需要关注
- `unhealthy`: 严重问题，需要立即处理

---

### 5.2 灾难恢复脚本

**脚本路径**: `scripts/dr-recovery.sh`

**功能**: F-OPS-004 一键灾难恢复，支持L4区域级故障恢复

**使用方式**:

```bash
# Dry-run模式（查看恢复计划）
./scripts/dr-recovery.sh

# 确认执行恢复
./scripts/dr-recovery.sh --confirm

# 自定义备份目录
BACKUP_DIR=/data/backups ./scripts/dr-recovery.sh --confirm
```

**恢复流程**:

1. **Phase 1**: 故障自动评估
2. **Phase 2**: 备份完整性校验
3. **Phase 3**: 数据恢复（DR区域）
4. **Phase 4**: 应用服务恢复
5. **Phase 5**: 完整性校验
6. **Phase 6**: 流量切换（灰度）

**RTO/RPO标准**:
- L1单服务故障: RTO < 5分钟, RPO = 0
- L2数据库故障: RTO < 15分钟, RPO < 5分钟
- L3可用区故障: RTO < 1小时, RPO < 15分钟
- L4区域灾难: RTO < 4小时, RPO < 1小时

**注意**: L4恢复需要人工确认 (`--confirm` 参数)

---

### 5.3 SSL证书自动续期脚本

**脚本路径**: `scripts/ssl-cert-renew.sh`

**功能**: F-OPS-002 SSL证书到期自动续期

**使用方式**:

```bash
# 检查证书状态（不执行续期）
./scripts/ssl-cert-renew.sh --check-only

# 执行证书续期
./scripts/ssl-cert-renew.sh

# 强制续期
./scripts/ssl-cert-renew.sh --force
```

**续期条件**:
- 证书有效期 < 30天自动触发
- 支持 certbot 或 acme.sh
- 续期后自动重启nginx

---

### 5.4 其他运维脚本

#### 备份脚本

**脚本路径**: `scripts/backup-database.sh`

```bash
# 执行数据库备份
./scripts/backup-database.sh

# 备份文件位置
ls -lh /backups/
```

#### 每日检查脚本

**脚本路径**: `scripts/pm-daily-check.sh`

```bash
# 执行每日检查
./scripts/pm-daily-check.sh

# 输出检查报告
```

---

## 6. 运维健康指标标准

### 6.1 系统健康评分标准

| 指标 | 正常值 | 警告值 | 异常值 | 权重 |
|------|--------|--------|--------|------|
| 服务存活率 | 100% | < 100% | < 95% | 40% |
| HTTP 5xx错误率 | < 0.1% | 0.1-1% | > 1% | 20% |
| 数据库连接池使用率 | < 60% | 60-80% | > 80% | 15% |
| 缓存命中率 | > 90% | 60-90% | < 60% | 10% |
| API响应时间P95 | < 500ms | 500-2000ms | > 2000ms | 10% |
| 审计日志积压 | < 100 | 100-1000 | > 1000 | 5% |

**健康评分计算**:
```
健康评分 = Σ(指标值 * 权重)
正常范围: 85-100分
警告范围: 60-85分
异常范围: < 60分
```

### 6.2 告警等级标准

| 等级 | 响应时间 | 通知方式 | 示例 |
|------|----------|----------|------|
| P0 Critical | 15分钟内 | SMS + Slack + Email | 服务宕机、数据库故障、审计断层 |
| P1 Warning | 2小时内 | Slack + Email | 性能下降、配额警告、证书过期 |
| P2 Info | 24小时内 | Email | 日常维护提醒、容量规划 |

### 6.3 SLA标准

| 服务 | SLA目标 | 可用性标准 |
|------|---------|------------|
| API服务 | 99.5% | 每月不可用时间 < 3.6小时 |
| 数据库 | 99.9% | 每月不可用时间 < 43分钟 |
| 灾难恢复RTO | L1: 5分钟, L4: 4小时 | 按层级执行 |
| 灾难恢复RPO | L1: 0, L4: 1小时 | 按层级执行 |

---

## 附录

### A. Grafana Dashboard访问

- OPS健康总览: http://localhost:3001/d/ops-health-overview
- 数据库监控: http://localhost:3001/d/database-monitoring

### B. Prometheus查询接口

- 健康检查: http://localhost:9090/api/v1/query?query=up
- 告警列表: http://localhost:9090/api/v1/alerts

### C. 相关文档

- 系统架构设计: `docs/school-admin-system/SPEC-SYSTEM-DESIGN.md`
- 部署文档: `DEPLOYMENT_REPORT.md`
- PM工作流程: `docs/PM-WORKFLOW.md`

---

**文档维护**: 每次运维流程变更后更新本手册  
**版本历史**: 记录在 `docs/CHANGELOG.md`