#!/bin/bash
#===============================================================================
# PM Deploy - Backend 编译与重启脚本
# 标准化部署流程，无 Token 依赖
#===============================================================================

set -e

# 配置
CONTAINER_NAME="school-admin-backend"
API_PORT=3000

# 日志函数
log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $1"
}

log_json() {
    echo '{"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","component":"backend","action":"'"$1"'","status":"'"$2"'","details":'"$3"'}'
}

# 检查容器状态
check_container() {
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log "ERROR: 容器未运行: ${CONTAINER_NAME}"
        log_json "check" "failed" '{"error":"E003 - Container not running"}'
        exit 1
    fi
}

# 编译后端代码
compile_backend() {
    log "开始编译后端代码..."
    local start_time=$(date +%s)
    
    docker exec "${CONTAINER_NAME}" sh -c "cd /app && pnpm exec tsc -p apps/backend/tsconfig.build.json --noEmitOnError false" 2>&1
    
    local compile_status=$?
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $compile_status -eq 0 ]; then
        log "✓ 后端编译成功 (${duration}s)"
        log_json "compile" "success" '{"duration_seconds":'"${duration}"'}'
    else
        log "WARNING: 编译有警告，继续..."
        log_json "compile" "warning" '{"error":"E003 - Compile warnings","duration_seconds":'"${duration}"'}'
    fi
}

# 重启后端服务
restart_backend() {
    log "重启后端服务..."
    
    docker restart "${CONTAINER_NAME}" > /dev/null 2>&1
    
    # 等待服务启动
    local retries=10
    local success=false
    
    for i in $(seq 1 $retries); do
        if docker exec "${CONTAINER_NAME}" sh -c "curl -sf http://localhost:${API_PORT}/api/health" > /dev/null 2>&1; then
            success=true
            break
        fi
        sleep 2
    done
    
    if [ "$success" = true ]; then
        log "✓ 后端重启成功"
        log_json "restart" "success" '{}'
    else
        log "ERROR: 后端重启失败"
        log_json "restart" "failed" '{"error":"E003 - Backend restart failed"}'
        exit 1
    fi
}

# 验证后端
verify_backend() {
    log "验证后端服务..."
    
    local retries=5
    local success=false
    
    for i in $(seq 1 $retries); do
        response=$(docker exec "${CONTAINER_NAME}" sh -c "curl -s http://localhost:${API_PORT}/api/health" 2>/dev/null)
        if echo "$response" | grep -q "ok"; then
            success=true
            break
        fi
        sleep 2
    done
    
    if [ "$success" = true ]; then
        log "✓ 后端验证通过"
        log_json "verify" "success" '{}'
        return 0
    else
        log "ERROR: 后端验证失败"
        log_json "verify" "failed" '{"error":"E004 - Verification failed"}'
        return 1
    fi
}

# 查看后端日志
show_logs() {
    log "后端日志 (最后 20 行):"
    docker logs "${CONTAINER_NAME}" --tail 20 2>&1
}

# 主流程
main() {
    local action="${1:-full}"
    
    log "=== PM Deploy: Backend ==="
    log "Container: ${CONTAINER_NAME}"
    log "Action: ${action}"
    echo ""
    
    case "$action" in
        "compile")
            compile_backend
            ;;
        "restart")
            restart_backend
            ;;
        "verify")
            verify_backend
            ;;
        "logs")
            show_logs
            ;;
        "full")
            compile_backend
            restart_backend
            verify_backend
            ;;
        *)
            echo "用法: $0 [compile|restart|verify|logs|full]"
            exit 1
            ;;
    esac
}

# 导出函数
export -f log log_json check_container compile_backend restart_backend verify_backend show_logs

# 执行
main "$@"
