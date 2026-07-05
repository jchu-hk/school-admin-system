#!/bin/bash
#===============================================================================
# PM Deploy - Frontend 构建与部署脚本
# 标准化部署流程，无 Token 依赖
#===============================================================================

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_PATH="${REPO_PATH:-/workspace/school-admin-system}"
FRONTEND_PATH="${REPO_PATH}/school-admin-frontend"
IMAGE_NAME="school-admin-frontend:latest"
CONTAINER_NAME="school-admin-frontend"
PORT=8080
NETWORK="school-admin-network"

# 日志函数
log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $1"
}

log_json() {
    echo '{"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","component":"frontend","action":"'"$1"'","status":"'"$2"'","details":'"$3"'}'
}

# 获取 Git 信息
get_git_info() {
    if [ -d "${REPO_PATH}/.git" ]; then
        GIT_COMMIT=$(cd "${REPO_PATH}" && git rev-parse --short HEAD 2>/dev/null || echo "unknown")
        GIT_BRANCH=$(cd "${REPO_PATH}" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
        VERSION=$(cd "${FRONTEND_PATH}" && cat package.json | grep '"version"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
    else
        GIT_COMMIT="unknown"
        GIT_BRANCH="unknown"
        VERSION="unknown"
    fi
}

# 检查前置条件
check_prerequisites() {
    if [ ! -d "${REPO_PATH}/.git" ]; then
        log "ERROR: Git 仓库不存在: ${REPO_PATH}"
        log_json "check" "failed" '{"error":"E001 - Git repo not found","path":"'"${REPO_PATH}"'"}'
        exit 1
    fi
    
    if [ ! -d "${FRONTEND_PATH}" ]; then
        log "ERROR: 前端目录不存在: ${FRONTEND_PATH}"
        log_json "check" "failed" '{"error":"E001 - Frontend path not found","path":"'"${FRONTEND_PATH}"'"}'
        exit 1
    fi
    
    log "✓ 前置条件检查通过"
}

# 构建前端
build_frontend() {
    log "开始构建前端镜像..."
    local start_time=$(date +%s)
    
    cd "${FRONTEND_PATH}"
    
    docker build \
        --build-arg GIT_COMMIT="${GIT_COMMIT}" \
        --build-arg GIT_BRANCH="${GIT_BRANCH}" \
        -t "${IMAGE_NAME}" \
        -f Dockerfile . 2>&1 | tail -10
    
    local build_status=$?
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $build_status -eq 0 ]; then
        log "✓ 前端镜像构建成功 (${duration}s)"
        log_json "build" "success" '{"git_commit":"'"${GIT_COMMIT}"'","version":"'"${VERSION}"'","duration_seconds":'"${duration}"'}'
    else
        log "ERROR: 前端镜像构建失败"
        log_json "build" "failed" '{"error":"E002 - Docker build failed","git_commit":"'"${GIT_COMMIT}"'"}'
        exit 1
    fi
}

# 部署前端
deploy_frontend() {
    log "开始部署前端..."
    
    # 停止旧容器
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log "停止旧容器: ${CONTAINER_NAME}"
        docker stop "${CONTAINER_NAME}" > /dev/null 2>&1
        docker rm "${CONTAINER_NAME}" > /dev/null 2>&1
    fi
    
    # 确保网络存在
    if ! docker network ls --format '{{.Name}}' | grep -q "^${NETWORK}$"; then
        log "创建网络: ${NETWORK}"
        docker network create "${NETWORK}" > /dev/null 2>&1 || true
    fi
    
    # 启动新容器
    docker run -d \
        --name "${CONTAINER_NAME}" \
        --network "${NETWORK}" \
        -p "${PORT}:80" \
        --restart always \
        "${IMAGE_NAME}" > /dev/null 2>&1
    
    # 连接网络
    docker network connect "${NETWORK}" "${CONTAINER_NAME}" 2>/dev/null || true
    
    sleep 2
    
    # 健康检查
    if curl -sf "http://localhost:${PORT}/api/health" > /dev/null 2>&1; then
        log "✓ 前端部署成功"
        log_json "deploy" "success" '{"container":"'"${CONTAINER_NAME}"'","port":'"${PORT}"'}'
    else
        log "ERROR: 前端健康检查失败"
        log_json "deploy" "failed" '{"error":"E004 - Health check failed"}'
        exit 1
    fi
}

# 验证部署
verify_deployment() {
    log "验证部署..."
    
    local retries=5
    local success=false
    
    for i in $(seq 1 $retries); do
        if curl -sf "http://localhost:${PORT}/api/health" > /dev/null 2>&1; then
            success=true
            break
        fi
        sleep 2
    done
    
    if [ "$success" = true ]; then
        log "✓ 部署验证通过"
        log_json "verify" "success" '{}'
        return 0
    else
        log "ERROR: 部署验证失败"
        log_json "verify" "failed" '{"error":"E004 - Verification failed"}'
        return 1
    fi
}

# 主流程
main() {
    local action="${1:-full}"
    
    get_git_info
    log "=== PM Deploy: Frontend ==="
    log "Git Commit: ${GIT_COMMIT}"
    log "Version: ${VERSION}"
    log "Action: ${action}"
    echo ""
    
    check_prerequisites
    
    case "$action" in
        "build")
            build_frontend
            ;;
        "deploy-only")
            deploy_frontend
            ;;
        "verify")
            verify_deployment
            ;;
        "full")
            build_frontend
            deploy_frontend
            verify_deployment
            ;;
        *)
            echo "用法: $0 [build|deploy-only|verify|full]"
            exit 1
            ;;
    esac
}

# 导出函数供其他脚本调用
export -f log log_json get_git_info check_prerequisites build_frontend deploy_frontend verify_deployment

# 执行
main "$@"
