#!/bin/bash
#===============================================================================
# Wiki Quick Update - 快速更新 Wiki 当前版本信息
# 用于部署后快速同步版本信息
#===============================================================================

set -e

# 配置
REPO_PATH="${REPO_PATH:-/workspace/school-admin-system}"
WIKI_PATH="${REPO_PATH}/PROJECT-WIKI.md"

# 日志函数
log() {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $1"
}

log_json() {
    echo '{"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","component":"wiki-update","action":"'"$1"'","status":"'"$2"'","details":'"$3"'}'
}

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

# 获取当前版本
get_current_version() {
    if [ -f "${WIKI_PATH}" ]; then
        grep '\*\*Version\*\*:' "${WIKI_PATH}" | sed 's/.*\*\*Version\*\*:\s*//' | tr -d ' '
    else
        echo "v1.5.0"
    fi
}

# 快速更新 Wiki
quick_update() {
    log "快速更新 Wiki..."
    
    if [ ! -f "${WIKI_PATH}" ]; then
        log "ERROR: Wiki 文件不存在: ${WIKI_PATH}"
        log_json "update" "failed" '{"error":"Wiki not found"}'
        exit 1
    fi
    
    # 更新时间戳
    sed -i "s/> Last updated:.*/> Last updated: $(date '+%Y-%m-%d %H:%M GMT+8')/" "${WIKI_PATH}"
    
    # 更新 Docker Uptime
    sed -i "s/- \*\*Docker Uptime\*\*:.*/- **Docker Uptime**: Fresh deploy ($(date '+%Y-%m-%d %H:%M'))/" "${WIKI_PATH}"
    
    log "✓ Wiki 更新时间戳和容器状态"
    log_json "update" "success" '{"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'
}

# 完整版本更新
full_update() {
    local version="$1"
    local changelog="$2"
    local tester="${3:-QA Agent}"
    
    log "完整版本更新: ${version}"
    
    python3 "$(dirname "$0")/release.py" \
        --version "${version}" \
        --changelog "${changelog}" \
        --tested-by "${tester}"
}

# 主流程
main() {
    get_git_info
    
    case "${1:-quick}" in
        "quick")
            quick_update
            ;;
        "full")
            full_update "${2:-}" "${3:-}" "${4:-}"
            ;;
        "version")
            get_current_version
            ;;
        *)
            echo "用法: $0 [quick|full|version]"
            echo "  quick   - 快速更新 Wiki 时间戳"
            echo "  full    - 完整版本更新 (需指定版本和变更)"
            echo "  version - 获取当前版本"
            exit 1
            ;;
    esac
}

main "$@"
