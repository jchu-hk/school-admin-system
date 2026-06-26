#!/bin/bash
# Tunnel健康检查脚本
# 由Cron定期执行

WORKSPACE="/workspace/projects/workspace"
LOG_DIR="$WORKSPACE/logs"
mkdir -p "$LOG_DIR"

STATE_FILE="$WORKSPACE/.cloudflared-state.json"
HEALTH_LOG="$WORKSPACE/logs/cloudflared-health.log"
WEBHOOK_URL="${WECHAT_WEBHOOK_URL:-}"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$HEALTH_LOG"
}

# 发送告警
send_alert() {
    local level="$1"
    local message="$2"
    
    log "$level $message"
    
    if [ -n "$WEBHOOK_URL" ]; then
        local emoji="⚠️"
        [ "$level" = "🔴" ] && emoji="🔴"
        [ "$level" = "✅" ] && emoji="✅"
        
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"msgtype\": \"text\", \"text\": {\"content\": \"$emoji [Tunnel健康检查]\n$message\n时间: $(date '+%Y-%m-%d %H:%M:%S')\"}}" \
            > /dev/null 2>&1 || true
    fi
}

# 获取当前URL
get_current_url() {
    local name="$1"
    grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$LOG_DIR/cloudflared-$name.log" 2>/dev/null | tail -1
}

# 检查进程状态
check_process() {
    local name="$1"
    local port="$2"
    
    if pgrep -f "cloudflared.*--url.*localhost:$port" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# 检查URL可达性
check_url() {
    local name="$1"
    local url="$2"
    
    if [ -z "$url" ]; then
        return 1
    fi
    
    local status=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if echo "$status" | grep -qE "200|301|302|303|307|308"; then
        return 0
    else
        return 1
    fi
}

# 主检查逻辑
main() {
    log "=== 开始Tunnel健康检查 ==="
    
    local has_issue=0
    
    # 检查Backend进程
    if check_process "backend" 3000; then
        log "✅ Backend进程运行正常"
    else
        log "❌ Backend进程已停止"
        send_alert "🔴" "Backend Tunnel进程已停止 (端口: 3000)"
        has_issue=1
    fi
    
    # 检查Frontend进程
    if check_process "frontend" 8080; then
        log "✅ Frontend进程运行正常"
    else
        log "❌ Frontend进程已停止"
        send_alert "🔴" "Frontend Tunnel进程已停止 (端口: 8080)"
        has_issue=1
    fi
    
    # 检查URL可达性
    local backend_url=$(get_current_url "backend")
    local frontend_url=$(get_current_url "frontend")
    
    if [ -n "$backend_url" ]; then
        if check_url "backend" "$backend_url"; then
            log "✅ Backend URL可访问: $backend_url"
        else
            log "❌ Backend URL不可达: $backend_url"
            send_alert "🔴" "Backend URL不可达: $backend_url"
            has_issue=1
        fi
    fi
    
    if [ -n "$frontend_url" ]; then
        if check_url "frontend" "$frontend_url"; then
            log "✅ Frontend URL可访问: $frontend_url"
        else
            log "❌ Frontend URL不可达: $frontend_url"
            send_alert "🔴" "Frontend URL不可达: $frontend_url"
            has_issue=1
        fi
    fi
    
    # 如果有问题，尝试重启
    if [ $has_issue -eq 1 ]; then
        log "⚠️ 检测到问题，尝试重启..."
        "$WORKSPACE/infra/cloudflared-manager.sh" restart >> "$HEALTH_LOG" 2>&1
        send_alert "⚠️" "正在重启Tunnel服务..."
    else
        log "✅ 所有检查通过"
    fi
    
    # 更新Wiki状态
    "$WORKSPACE/infra/cloudflared-manager.sh" export >> "$HEALTH_LOG" 2>&1
    
    log "=== 健康检查完成 ==="
}

main
