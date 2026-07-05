#!/bin/bash
#===============================================================================
# PM Deploy - 一键全量部署脚本
# 自动化前后端构建、部署、验证全流程
#===============================================================================

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_PATH="${REPO_PATH:-/workspace/school-admin-system}"

# 日志函数
log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $1"
}

log_json() {
    echo '{"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","component":"full-deploy","action":"'"$1"'","status":"'"$2"'","details":'"$3"'}'
}

# 加载通用函数
source "${SCRIPT_DIR}/deploy-frontend.sh"
source "${SCRIPT_DIR}/deploy-backend.sh"

# 获取 Git 信息
get_git_info() {
    if [ -d "${REPO_PATH}/.git" ]; then
        GIT_COMMIT=$(cd "${REPO_PATH}" && git rev-parse --short HEAD 2>/dev/null || echo "unknown")
        GIT_BRANCH=$(cd "${REPO_PATH}" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    else
        GIT_COMMIT="unknown"
        GIT_BRANCH="unknown"
    fi
}

# Git pull 最新代码
git_sync() {
    log "同步 Git 最新代码..."
    
    if [ -d "${REPO_PATH}/.git" ]; then
        cd "${REPO_PATH}"
        git fetch origin
        git pull origin main
        log "✓ Git 同步完成"
        log_json "git-sync" "success" '{"commit":"'"$(git rev-parse --short HEAD)"'"}'
    else
        log "WARNING: Git 仓库不存在，跳过同步"
        log_json "git-sync" "skipped" '{"reason":"No git repo"}'
    fi
}

# 全量部署
full_deploy() {
    local start_time=$(date +%s)
    
    log "=== PM Deploy: 全量部署 ==="
    log "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Step 1: Git 同步
    git_sync
    echo ""
    
    # Step 2: 获取 Git 信息
    get_git_info
    log "Git Commit: ${GIT_COMMIT}"
    log "Git Branch: ${GIT_BRANCH}"
    echo ""
    
    # Step 3: 前端构建
    check_prerequisites
    build_frontend
    echo ""
    
    # Step 4: 前端部署
    deploy_frontend
    echo ""
    
    # Step 5: 后端编译
    compile_backend
    echo ""
    
    # Step 6: 后端重启
    restart_backend
    echo ""
    
    # Step 7: 全量验证
    source "${SCRIPT_DIR}/verify-deployment.sh"
    check_containers
    echo ""
    check_frontend
    echo ""
    check_backend
    echo ""
    check_network
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    log "=== 部署完成 ==="
    log "结束时间: $(date '+%Y-%m-%d %H:%M:%S')"
    log "总耗时: ${duration} 秒"
    log "Git Commit: ${GIT_COMMIT}"
    
    log_json "complete" "success" '{"git_commit":"'"${GIT_COMMIT}"'","duration_seconds":'"${duration}"'}'
}

# PM 控制：分步确认模式
pm_controlled_deploy() {
    log "=== PM 控 制 部 署 模 式 ==="
    log "每个步骤需要 PM 确认后执行"
    echo ""
    
    # Step 1: Git 同步
    echo "Step 1/6: Git 同步"
    echo "  即将执行: git pull origin main"
    echo "  输入 'y' 继续，或 'n' 跳过: "
    read -r response
    if [ "$response" = "y" ]; then
        git_sync
    else
        log "跳过 Git 同步"
    fi
    echo ""
    
    # Step 2: 前端构建
    echo "Step 2/6: 前端构建"
    echo "  即将执行: docker build frontend"
    echo "  输入 'y' 继续，或 'n' 跳过: "
    read -r response
    if [ "$response" = "y" ]; then
        build_frontend
    else
        log "跳过前端构建"
    fi
    echo ""
    
    # Step 3: 前端部署
    echo "Step 3/6: 前端部署"
    echo "  即将执行: docker run frontend"
    echo "  输入 'y' 继续，或 'n' 跳过: "
    read -r response
    if [ "$response" = "y" ]; then
        deploy_frontend
    else
        log "跳过前端部署"
    fi
    echo ""
    
    # Step 4: 后端编译
    echo "Step 4/6: 后端编译"
    echo "  即将执行: tsc compile backend"
    echo "  输入 'y' 继续，或 'n' 跳过: "
    read -r response
    if [ "$response" = "y" ]; then
        compile_backend
    else
        log "跳过后端编译"
    fi
    echo ""
    
    # Step 5: 后端重启
    echo "Step 5/6: 后端重启"
    echo "  即将执行: docker restart backend"
    echo "  输入 'y' 继续，或 'n' 跳过: "
    read -r response
    if [ "$response" = "y" ]; then
        restart_backend
    else
        log "跳过后端重启"
    fi
    echo ""
    
    # Step 6: 验证
    echo "Step 6/6: 部署验证"
    echo "  即将执行: 验证所有服务"
    echo "  输入 'y' 继续，或 'n' 跳过: "
    read -r response
    if [ "$response" = "y" ]; then
        source "${SCRIPT_DIR}/verify-deployment.sh"
        check_containers
        check_frontend
        check_backend
        check_network
    else
        log "跳过验证"
    fi
    echo ""
    
    log "=== PM 控制部署完成 ==="
}

# 主流程
main() {
    local mode="${1:-auto}"
    
    case "$mode" in
        "auto")
            full_deploy
            ;;
        "pm"|"interactive")
            pm_controlled_deploy
            ;;
        "frontend")
            get_git_info
            check_prerequisites
            build_frontend
            deploy_frontend
            ;;
        "backend")
            compile_backend
            restart_backend
            verify_backend
            ;;
        *)
            echo "用法: $0 [auto|pm|frontend|backend]"
            echo ""
            echo "模式说明:"
            echo "  auto        - 自动全量部署 (默认)"
            echo "  pm          - PM 控制分步部署"
            echo "  frontend    - 仅前端部署"
            echo "  backend     - 仅后端部署"
            exit 1
            ;;
    esac
}

# 执行
main "$@"
