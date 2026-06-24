#!/bin/bash
# F-OPS-001 数据库健康检查脚本
# School Admin System - PostgreSQL Health Check
# 参考: SPEC-SYSTEM-DESIGN.md v1.7.0 Section 9.2

set -euo pipefail

# 环境变量配置
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-school_admin}
DB_NAME=${DB_NAME:-school_admin}
DB_PASSWORD=${DB_PASSWORD:-}
WAL_THRESHOLD=${WAL_THRESHOLD:-500}  # MB
POOL_THRESHOLD=${POOL_THRESHOLD:-80}  # %

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 输出日志函数
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 执行psql命令的辅助函数
run_psql() {
  local query="$1"
  if [[ -n "$DB_PASSWORD" ]]; then
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$query" 2>&1 || echo "error"
  else
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$query" 2>&1 || echo "error"
  fi
}

# 输出JSON结果
output_json() {
  local checks=$1
  local overall_status="healthy"
  
  # 判断整体状态
  if echo "$checks" | grep -q '"status":"unhealthy"'; then
    overall_status="unhealthy"
  elif echo "$checks" | grep -q '"status":"warning"'; then
    overall_status="warning"
  fi
  
  cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "overallStatus": "$overall_status",
  "database": {
    "host": "$DB_HOST",
    "port": $DB_PORT,
    "name": "$DB_NAME"
  },
  "checks": $checks
}
EOF
}

# 检查数据库连接
check_connection() {
  local status="healthy"
  local message="连接正常"
  local response_time=0
  
  # 测试连接并获取响应时间
  local start_time=$(date +%s%N)
  local result=$(run_psql "SELECT 1")
  local end_time=$(date +%s%N)
  
  response_time=$(( (end_time - start_time) / 1000000 ))
  
  if [[ "$result" == *"error"* ]] || [[ "$result" == *"could not connect"* ]]; then
    status="unhealthy"
    message="无法连接数据库: $(echo "$result" | head -1)"
    log_error "数据库连接失败"
  else
    log_info "数据库连接正常 (响应时间: ${response_time}ms)"
  fi
  
  cat <<EOF
{
  "name": "connection",
  "status": "$status",
  "message": "$message",
  "responseTimeMs": $response_time
}
EOF
}

# 检查WAL积压
check_wal() {
  local status="healthy"
  local message="WAL正常"
  local wal_mb=0
  
  # 获取WAL大小
  local wal_result=$(run_psql "SELECT COALESCE(pg_wal_lsn_diff(pg_current_wal_lsn(), sent_lsn) / 1024 / 1024, 0) FROM pg_stat_replication LIMIT 1;")
  
  wal_mb=$(echo "$wal_result" | tr -d '[:space:]' | grep -oE '[0-9]+' | head -1 || echo "0")
  
  # 判断状态
  if [[ $wal_mb -gt $WAL_THRESHOLD ]]; then
    status="unhealthy"
    message="WAL积压过大，需要立即处理"
    log_error "WAL积压过大: ${wal_mb}MB > ${WAL_THRESHOLD}MB"
  elif [[ $wal_mb -gt $(($WAL_THRESHOLD / 2)) ]]; then
    status="warning"
    message="WAL积压偏高，需要关注"
    log_warn "WAL积压偏高: ${wal_mb}MB"
  else
    log_info "WAL积压正常: ${wal_mb}MB"
  fi
  
  cat <<EOF
{
  "name": "wal",
  "status": "$status",
  "message": "$message",
  "sizeMb": $wal_mb,
  "threshold": $WAL_THRESHOLD
}
EOF
}

# 检查连接池
check_pool() {
  local status="healthy"
  local message="连接池正常"
  local used=1
  local max=100
  local available=99
  local usage_percent=1
  
  # 获取连接数
  local used_result=$(run_psql "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();")
  used=$(echo "$used_result" | tr -d '[:space:]' | grep -oE '[0-9]+' | head -1 || echo "1")
  
  # 获取最大连接数
  local max_result=$(run_psql "SELECT setting FROM pg_settings WHERE name = 'max_connections';")
  max=$(echo "$max_result" | tr -d '[:space:]' | grep -oE '[0-9]+' | head -1 || echo "100")
  
  if [[ $max -gt 0 ]]; then
    available=$((max - used))
    usage_percent=$((used * 100 / max))
  fi
  
  # 判断状态
  if [[ $usage_percent -gt $POOL_THRESHOLD ]]; then
    status="unhealthy"
    message="连接池使用率过高，需要立即处理"
    log_error "连接池使用率过高: ${usage_percent}% > ${POOL_THRESHOLD}%"
  elif [[ $usage_percent -gt $(($POOL_THRESHOLD * 3 / 4)) ]]; then
    status="warning"
    message="连接池使用率偏高，需要关注"
    log_warn "连接池使用率偏高: ${usage_percent}%"
  else
    log_info "连接池使用率正常: ${usage_percent}% (${used}/${max})"
  fi
  
  cat <<EOF
{
  "name": "pool",
  "status": "$status",
  "message": "$message",
  "used": $used,
  "max": $max,
  "available": $available,
  "usagePercent": $usage_percent,
  "threshold": $POOL_THRESHOLD
}
EOF
}

# 检查数据库响应时间
check_response_time() {
  local status="healthy"
  local message="响应时间正常"
  local avg_time=0
  
  # 执行简单查询测量响应时间
  local start_time=$(date +%s%N)
  run_psql "SELECT NOW();" > /dev/null
  local end_time=$(date +%s%N)
  
  avg_time=$(( (end_time - start_time) / 1000000 ))
  
  # 判断状态（阈值: 100ms）
  if [[ $avg_time -gt 100 ]]; then
    status="warning"
    message="响应时间较慢"
    log_warn "数据库响应时间较慢: ${avg_time}ms"
  else
    log_info "数据库响应时间正常: ${avg_time}ms"
  fi
  
  cat <<EOF
{
  "name": "responseTime",
  "status": "$status",
  "message": "$message",
  "avgTimeMs": $avg_time
}
EOF
}

# 检查数据库磁盘空间
check_disk_space() {
  local status="healthy"
  local message="磁盘空间充足"
  local db_size_mb=0
  local disk_total_mb=10000
  local disk_available_mb=5000
  local disk_usage_percent=50
  
  # 获取数据库大小
  local size_result=$(run_psql "SELECT pg_database_size(current_database()) / 1024 / 1024;")
  db_size_mb=$(echo "$size_result" | tr -d '[:space:]' | grep -oE '[0-9]+' | head -1 || echo "0")
  
  # 获取磁盘空间（需要外部命令）
  if command -v df >/dev/null 2>&1; then
    local disk_info=$(df -BM /var/lib/postgresql 2>/dev/null | tail -1 || df -BM / 2>/dev/null | tail -1 || echo "10000M 5000M 5000M")
    disk_total_mb=$(echo "$disk_info" | awk '{print $2}' | tr -d 'M' | grep -oE '[0-9]+' || echo "10000")
    disk_available_mb=$(echo "$disk_info" | awk '{print $4}' | tr -d 'M' | grep -oE '[0-9]+' || echo "5000")
    if [[ $disk_total_mb -gt 0 ]]; then
      disk_usage_percent=$((100 - disk_available_mb * 100 / disk_total_mb))
    fi
  fi
  
  # 判断状态（阈值: 80%）
  if [[ $disk_usage_percent -gt 80 ]]; then
    status="unhealthy"
    message="磁盘空间不足，需要立即处理"
    log_error "磁盘空间不足: ${disk_usage_percent}% > 80%"
  elif [[ $disk_usage_percent -gt 70 ]]; then
    status="warning"
    message="磁盘空间紧张，需要关注"
    log_warn "磁盘空间紧张: ${disk_usage_percent}%"
  else
    log_info "磁盘空间充足: ${disk_available_mb}MB可用 (${disk_usage_percent}%已使用)"
  fi
  
  cat <<EOF
{
  "name": "diskSpace",
  "status": "$status",
  "message": "$message",
  "dbSizeMb": $db_size_mb,
  "diskTotalMb": $disk_total_mb,
  "diskAvailableMb": $disk_available_mb,
  "diskUsagePercent": $disk_usage_percent
}
EOF
}

# 检查数据库版本和运行时间
check_version() {
  local version="unknown"
  local uptime="unknown"
  
  # 获取版本
  version=$(run_psql "SHOW server_version;" | tr -d '[:space:]' || echo "unknown")
  
  # 获取运行时间（PostgreSQL重启时间）
  uptime=$(run_psql "SELECT pg_postmaster_start_time();" | tr -d '[:space:]' || echo "unknown")
  
  log_info "PostgreSQL版本: $version"
  log_info "数据库启动时间: $uptime"
  
  cat <<EOF
{
  "name": "version",
  "status": "healthy",
  "message": "版本信息",
  "version": "$version",
  "startTime": "$uptime"
}
EOF
}

# 检查主从复制状态（如果有配置）
check_replication() {
  local status="healthy"
  local message="无复制配置"
  local is_master="true"
  local replica_count=0
  
  # 检查是否是主库
  local master_check=$(run_psql "SELECT pg_is_in_recovery();" | tr -d '[:space:]' || echo "true")
  
  if [[ "$master_check" == *"false"* ]]; then
    # 获取副本数量
    local replica_result=$(run_psql "SELECT count(*) FROM pg_stat_replication;")
    replica_count=$(echo "$replica_result" | tr -d '[:space:]' | grep -oE '[0-9]+' | head -1 || echo "0")
    
    if [[ $replica_count -gt 0 ]]; then
      message="主库运行正常，有${replica_count}个副本"
      log_info "主库运行正常，副本数: $replica_count"
    else
      status="warning"
      message="主库运行正常，但无副本连接"
      log_warn "主库无副本连接"
    fi
  else
    # 从库
    is_master="false"
    message="从库运行正常"
    log_info "从库运行正常"
  fi
  
  cat <<EOF
{
  "name": "replication",
  "status": "$status",
  "message": "$message",
  "isMaster": $is_master,
  "replicaCount": $replica_count
}
EOF
}

# 主执行函数
main() {
  log_info "开始数据库健康检查..."
  log_info "数据库: $DB_HOST:$DB_PORT/$DB_NAME"
  
  # 检查环境变量
  if [[ -z "${DB_PASSWORD}" ]]; then
    log_warn "DB_PASSWORD环境变量未设置，使用peer认证或trust认证"
  fi
  
  # 执行所有检查
  local checks="["
  checks+=$(check_connection)
  checks+=","
  checks+=$(check_wal)
  checks+=","
  checks+=$(check_pool)
  checks+=","
  checks+=$(check_response_time)
  checks+=","
  checks+=$(check_disk_space)
  checks+=","
  checks+=$(check_version)
  checks+=","
  checks+=$(check_replication)
  checks+="]"
  
  # 输出JSON结果
  output_json "$checks"
  
  log_info "数据库健康检查完成"
}

# 执行主函数
main "$@"