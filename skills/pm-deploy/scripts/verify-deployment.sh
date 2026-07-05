#!/bin/bash
#===============================================================================
# PM Deploy - 部署验证脚本
# 验证前后端部署状态和连通性
#===============================================================================

set -e

# 配置
FRONTEND_URL="${FRONTEND_URL:-http://localhost:8080}"
BACKEND_CONTAINER="school-admin-backend"
BACKEND_PORT=3000
NETWORK="school-admin-network"

# 日志函数
log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $1"
}

log_json() {
    echo '{"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","component":"verify","action":"'"$1"'","status":"'"$2"'","details":'"$3"'}'
}

# 检查 Docker 容器状态
check_containers() {
    log "检查容器状态..."
    
    local containers=("school-admin-frontend" "school-admin-backend" "school-admin-postgres")
    local all_running=true
    
    for container in "${containers[@]}"; do
        if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            local status=$(docker inspect --format='{{.State.Status}}' "${container}")
            local uptime=$(docker inspect --format='{{.State.StartedAt}}' "${container}")
            log "  ✓ ${container}: ${status}"
        else
            log "  ✗ ${container}: not running"
            all_running=false
        fi
    done
    
    if [ "$all_running" = true ]; then
        log_json "containers" "success" '{"all_running":true}'
    else
        log_json "containers" "failed" '{"all_running":false}'
        return 1
    fi
}

# 检查前端健康
check_frontend() {
    log "检查前端服务..."
    
    local retries=5
    local success=false
    
    for i in $(seq 1 $retries); do
        http_code=$(curl -sf -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/api/health" 2>/dev/null || echo "000")
        if [ "$http_code" = "200" ]; then
            success=true
            break
        fi
        sleep 1
    done
    
    if [ "$success" = true ]; then
        log "  ✓ 前端健康检查通过"
        log_json "frontend" "success" '{"url":"'"${FRONTEND_URL}"'"}'
    else
        log "  ✗ 前端健康检查失败 (HTTP ${http_code})"
        log_json "frontend" "failed" '{"url":"'"${FRONTEND_URL}"'","http_code":"'"${http_code}"'"}'
        return 1
    fi
}

# 检查后端健康
check_backend() {
    log "检查后端服务..."
    
    local retries=5
    local success=false
    
    for i in $(seq 1 $retries); do
        response=$(docker exec "${BACKEND_CONTAINER}" sh -c "curl -s http://localhost:${BACKEND_PORT}/api/health" 2>/dev/null)
        if echo "$response" | grep -q "ok"; then
            success=true
            break
        fi
        sleep 1
    done
    
    if [ "$success" = true ]; then
        log "  ✓ 后端健康检查通过"
        log_json "backend" "success" '{}'
    else
        log "  ✗ 后端健康检查失败"
        log_json "backend" "failed" '{}'
        return 1
    fi
}

# 检查网络连通性
check_network() {
    log "检查网络连通性..."
    
    # 从前端容器访问后端 API
    local response=$(docker exec school-admin-frontend sh -c "wget -qO- --timeout=5 http://school-admin-backend:${BACKEND_PORT}/api/health 2>/dev/null" || echo "failed")
    
    if echo "$response" | grep -q "ok"; then
        log "  ✓ 网络连通正常 (frontend → backend)"
        log_json "network" "success" '{}'
    else
        log "  ✗ 网络连通失败"
        log_json "network" "failed" '{"error":"Network connectivity failed"}'
        return 1
    fi
}

# 获取版本信息
get_version_info() {
    log "获取版本信息..."
    
    # 前端版本
    local frontend_version=$(curl -sf "${FRONTEND_URL}/api/version" 2>/dev/null | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    log "  前端版本: ${frontend_version}"
    
    # Git commit
    local git_commit=$(docker exec school-admin-frontend sh -c "cat /usr/share/nginx/html/assets/*.js 2>/dev/null | grep -oE '[0-9a-f]{7}' | head -1" || echo "unknown")
    log "  Git Commit: ${git_commit}"
    
    log_json "version" "success" '{"frontend_version":"'"${frontend_version}"'","git_commit":"'"${git_commit}"'"}'
}

# 生成完整报告
generate_report() {
    log ""
    log "=== 部署验证报告 ==="
    log "时间: $(date '+%Y-%m-%d %H:%M:%S')"
    log "前端: ${FRONTEND_URL}"
    log "后端: localhost:${BACKEND_PORT}"
    log "========================"
}

# 主流程
main() {
    local exit_code=0
    
    log "=== PM Deploy: Verification ==="
    echo ""
    
    check_containers || exit_code=1
    echo ""
    
    check_frontend || exit_code=1
    echo ""
    
    check_backend || exit_code=1
    echo ""
    
    check_network || exit_code=1
    echo ""
    
    get_version_info
    echo ""
    
    generate_report
    
    if [ $exit_code -eq 0 ]; then
        log "✓ 所有检查通过 - 部署成功"
        log_json "all" "success" '{}'
    else
        log "✗ 部分检查失败 - 需要处理"
        log_json "all" "failed" '{}'
    fi
    
    return $exit_code
}

# 导出函数
export -f log log_json check_containers check_frontend check_backend check_network get_version_info generate_report

# 执行
main "$@"
