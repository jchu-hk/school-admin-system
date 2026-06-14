#!/bin/bash
# ============================================================
# PostgreSQL 数据库自动备份脚本
# Issue: #87 F-BACK-001 自动备份管理
# 功能: 自动备份、压缩、保留管理、通知
# ============================================================

set -e

# 配置变量（从环境变量读取，提供默认值）
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-school_admin}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-school_admin}"

# 备份目录
BACKUP_DIR="${BACKUP_DIR:-/var/backups/school_admin}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# 通知配置
NOTIFICATION_ENABLED="${NOTIFICATION_ENABLED:-true}"
NOTIFICATION_WEBHOOK="${NOTIFICATION_WEBHOOK:-}"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-}"

# 创建时间戳
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"
LOG_FILE="/var/log/backup_${TIMESTAMP}.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

log_info() {
    log "INFO" "${GREEN}$1${NC}"
}

log_warn() {
    log "WARN" "${YELLOW}$1${NC}"
}

log_error() {
    log "ERROR" "${RED}$1${NC}"
}

# 清理函数
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "备份失败，退出码: ${exit_code}"
        send_notification "failure" "数据库备份失败，退出码: ${exit_code}"
    fi
    exit $exit_code
}

trap cleanup EXIT

# 发送通知
send_notification() {
    local status=$1
    local message=$2
    
    if [ "$NOTIFICATION_ENABLED" != "true" ]; then
        return 0
    fi
    
    local title=""
    local urgency=""
    
    if [ "$status" == "success" ]; then
        title="✅ 数据库备份成功"
        urgency="normal"
    else
        title="❌ 数据库备份失败"
        urgency="high"
    fi
    
    # 调用通知服务API（如果配置了）
    if [ -n "$NOTIFICATION_WEBHOOK" ]; then
        curl -s -X POST "$NOTIFICATION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"title\": \"${title}\",
                \"message\": \"${message}\",
                \"status\": \"${status}\",
                \"timestamp\": \"$(date -Iseconds)\",
                \"urgency\": \"${urgency}\"
            }" > /dev/null 2>&1 || true
    fi
    
    # 发送邮件通知（如果配置了）
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "$title" "$NOTIFICATION_EMAIL" 2>/dev/null || true
    fi
    
    log_info "通知已发送: ${title}"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump 未安装，请安装 postgresql-client"
        exit 1
    fi
    
    if ! command -v gzip &> /dev/null; then
        log_error "gzip 未安装"
        exit 1
    fi
    
    log_info "依赖检查通过"
}

# 创建备份目录
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "创建备份目录: ${BACKUP_DIR}"
        mkdir -p "$BACKUP_DIR"
    fi
    
    # 检查磁盘空间
    local available_space=$(df -BG "$BACKUP_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 5 ]; then
        log_warn "磁盘空间不足 5GB，当前可用: ${available_space}GB"
    fi
}

# 执行备份
perform_backup() {
    log_info "开始备份数据库: ${DB_NAME}"
    log_info "主机: ${DB_HOST}:${DB_PORT}"
    log_info "用户: ${DB_USER}"
    
    # 设置密码环境变量（如果有）
    if [ -n "$DB_PASSWORD" ]; then
        export PGPASSWORD="$DB_PASSWORD"
    fi
    
    # 执行备份
    local full_path="${BACKUP_DIR}/${BACKUP_FILE}"
    
    if pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -F p \
        -f "$full_path" \
        --no-owner \
        --no-acl \
        2>> "${LOG_FILE}"; then
        
        log_info "备份文件创建成功: ${full_path}"
        
        # 压缩备份文件
        log_info "压缩备份文件..."
        if gzip -f "$full_path"; then
            local compressed_size=$(du -h "${full_path}.gz" | cut -f1)
            log_info "压缩完成，文件大小: ${compressed_size}"
        else
            log_error "压缩失败"
            return 1
        fi
    else
        log_error "备份失败"
        return 1
    fi
    
    # 清除密码环境变量
    unset PGPASSWORD
    
    return 0
}

# 清理旧备份
cleanup_old_backups() {
    log_info "清理 ${RETENTION_DAYS} 天前的备份文件..."
    
    local deleted_count=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
    
    if [ "$deleted_count" -gt 0 ]; then
        log_info "已删除 ${deleted_count} 个旧备份文件"
    else
        log_info "没有需要清理的备份文件"
    fi
}

# 生成报告
generate_report() {
    local backup_file="${BACKUP_DIR}/${BACKUP_FILE_GZ}"
    local file_size=$(du -h "$backup_file" 2>/dev/null | cut -f1 || echo "N/A")
    local file_count=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "N/A")
    local oldest_backup=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -printf '%T+ %p\n' 2>/dev/null | sort | head -1 | cut -d' ' -f2- || echo "N/A")
    
    log_info "========== 备份报告 =========="
    log_info "备份文件: ${backup_file}"
    log_info "文件大小: ${file_size}"
    log_info "备份总数: ${file_count}"
    log_info "总占用空间: ${total_size}"
    log_info "最早备份: ${oldest_backup}"
    log_info "保留策略: ${RETENTION_DAYS} 天"
    log_info "=============================="
    
    # 返回报告信息（用于通知）
    echo "备份文件: ${backup_file}, 大小: ${file_size}, 总数: ${file_count}"
}

# 验证备份完整性
verify_backup() {
    local backup_file="${BACKUP_DIR}/${BACKUP_FILE_GZ}"
    
    log_info "验证备份完整性..."
    
    # 检查文件是否存在
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: ${backup_file}"
        return 1
    fi
    
    # 检查文件大小（至少1MB）
    local file_size=$(stat -c%s "$backup_file" 2>/dev/null || echo "0")
    if [ "$file_size" -lt 1048576 ]; then
        log_warn "备份文件小于 1MB，可能存在问题"
    fi
    
    # 尝试解压测试
    if gzip -t "$backup_file" 2>/dev/null; then
        log_info "备份文件完整性验证通过"
    else
        log_error "备份文件损坏"
        return 1
    fi
    
    return 0
}

# 主函数
main() {
    log_info "========== 开始数据库备份 =========="
    log_info "时间: $(date)"
    
    check_dependencies
    create_backup_dir
    
    if perform_backup; then
        verify_backup
        cleanup_old_backups
        local report=$(generate_report)
        send_notification "success" "$report"
        log_info "========== 备份成功完成 =========="
    else
        log_error "备份失败"
        send_notification "failure" "数据库备份执行失败，请检查日志: ${LOG_FILE}"
        exit 1
    fi
}

# 执行主函数
main "$@"
