#!/bin/bash
# Cloudflared Tunnel Manager
# 功能: 启动、监控、自动重启、URL通知

set -e

# 配置
WORKSPACE="/workspace/projects/workspace"
LOG_DIR="$WORKSPACE/logs"
mkdir -p "$LOG_DIR"

TUNNEL_LOG="$LOG_DIR/cloudflared-$(date '+%Y%m%d').log"
PID_FILE="$WORKSPACE/.cloudflared.pid"
STATE_FILE="$WORKSPACE/.cloudflared-state.json"
WEBHOOK_URL="${WECHAT_WEBHOOK_URL:-}"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/cloudflared-monitor.log"
}

# 发送通知
send_notification() {
    local title="$1"
    local message="$2"
    local color="${3:-green}"
    
    log "${YELLOW}[通知]${NC} $title: $message"
    
    if [ -n "$WEBHOOK_URL" ]; then
        local emoji="✅"
        [ "$color" = "red" ] && emoji="🔴"
        [ "$color" = "yellow" ] && emoji="⚠️"
        
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"msgtype\": \"text\", \"text\": {\"content\": \"$emoji $title\n$message\"}}" \
            > /dev/null 2>&1 || true
    fi
}

# 获取当前Tunnel URL
get_current_url() {
    local port="$1"
    local name="$2"
    local log_file="$LOG_DIR/cloudflared-$name.log"
    
    # 从日志中提取URL
    local url=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$log_file" 2>/dev/null | tail -1)
    
    if [ -n "$url" ]; then
        echo "$url"
    else
        # 尝试直接获取
        curl -s --max-time 5 "http://localhost:$port" 2>/dev/null | grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | head -1
    fi
}

# 保存状态
save_state() {
    local backend_url="$1"
    local frontend_url="$2"
    local timestamp="$3"
    local backend_status="$4"
    local frontend_status="$5"
    
    cat > "$STATE_FILE" << EOF
{
    "backend": {
        "url": "$backend_url",
        "status": "$backend_status"
    },
    "frontend": {
        "url": "$frontend_url",
        "status": "$frontend_status"
    },
    "updated": "$timestamp"
}
EOF
}

# 健康检查
health_check() {
    local port="$1"
    local name="$2"
    
    if curl -s --max-time 5 "http://localhost:$port" > /dev/null 2>&1; then
        return 0
    else
        log "${RED}[错误]${NC} $name (端口 $port) 无响应"
        return 1
    fi
}

# 启动tunnel
start_tunnel() {
    local port="$1"
    local name="$2"
    local log_file="$LOG_DIR/cloudflared-$name.log"
    
    log "${GREEN}[启动]${NC} 启动 $name Tunnel (端口: $port)"
    
    # 检查是否已运行
    if pgrep -f "cloudflared.*--url.*localhost:$port" > /dev/null; then
        log "${YELLOW}[跳过]${NC} $name Tunnel 已在运行"
        return 0
    fi
    
    # 清理旧日志（保留最新）
    if [ -f "$log_file" ]; then
        tail -100 "$log_file" > "$log_file.tmp" 2>/dev/null || true
        mv "$log_file.tmp" "$log_file"
    fi
    
    # 启动
    nohup cloudflared tunnel --url "http://localhost:$port" \
        > "$log_file" 2>&1 &
    
    # 保存PID
    echo $! >> "$PID_FILE" 2>/dev/null || true
    
    # 等待就绪
    sleep 10
    
    # 提取URL
    local url=$(get_current_url "$port" "$name")
    if [ -n "$url" ]; then
        log "${GREEN}[成功]${NC} $name Tunnel URL: $url"
        send_notification "Tunnel已启动" "$name: $url" "green"
        echo "$url"
    else
        log "${RED}[失败]${NC} 无法获取 $name Tunnel URL"
        send_notification "Tunnel启动失败" "$name 启动失败，请检查日志" "red"
        echo ""
    fi
}

# 监控循环
monitor_loop() {
    log "${GREEN}[监控]${NC} 启动Tunnel监控..."
    log "PID文件: $PID_FILE"
    log "状态文件: $STATE_FILE"
    log "Webhook: ${WEBHOOK_URL:-未配置}"
    
    while true; do
        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        
        # 检查Backend Tunnel
        if ! pgrep -f "cloudflared.*--url.*localhost:3000" > /dev/null; then
            log "${RED}[检测]${NC} Backend Tunnel已停止，尝试重启..."
            send_notification "Tunnel中断" "Backend Tunnel已停止，正在重启..." "yellow"
            start_tunnel 3000 "backend"
        else
            log "${GREEN}[检查]${NC} Backend Tunnel 运行正常"
        fi
        
        # 检查Frontend Tunnel
        if ! pgrep -f "cloudflared.*--url.*localhost:8080" > /dev/null; then
            log "${RED}[检测]${NC} Frontend Tunnel已停止，尝试重启..."
            send_notification "Tunnel中断" "Frontend Tunnel已停止，正在重启..." "yellow"
            start_tunnel 8080 "frontend"
        else
            log "${GREEN}[检查]${NC} Frontend Tunnel 运行正常"
        fi
        
        # 保存当前状态
        local backend_url=$(get_current_url 3000 "backend")
        local frontend_url=$(get_current_url 8080 "frontend")
        if [ -n "$backend_url" ] && [ -n "$frontend_url" ]; then
            save_state "$backend_url" "$frontend_url" "$timestamp" "running" "running"
        fi
        
        # 每3分钟检查一次
        sleep 180
    done
}

# 导出状态到Wiki
export_to_wiki() {
    local backend_url=$(get_current_url 3000 "backend")
    local frontend_url=$(get_current_url 8080 "frontend")
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ -n "$backend_url" ] && [ -n "$frontend_url" ]; then
        save_state "$backend_url" "$frontend_url" "$timestamp" "running" "running"
        log "${GREEN}[Wiki]${NC} 状态已保存: $STATE_FILE"
        
        # 同时更新Wiki文件
        update_wiki_urls "$backend_url" "$frontend_url"
    else
        log "${RED}[警告]${NC} 无法获取完整URL，跳过状态保存"
    fi
}

# 更新Wiki中的URL
update_wiki_urls() {
    local backend_url="$1"
    local frontend_url="$2"
    local wiki_file="$WORKSPACE/docs/school-admin-system/PROJECT-WIKI.md"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ ! -f "$wiki_file" ]; then
        log "${YELLOW}[警告]${NC} Wiki文件不存在: $wiki_file"
        return 1
    fi
    
    # 使用Python进行更安全的替换
    python3 - "$wiki_file" "$backend_url" "$frontend_url" "$timestamp" << 'PYEOF'
import re, sys

wiki_file = sys.argv[1]
backend_url = sys.argv[2]
frontend_url = sys.argv[3]
timestamp = sys.argv[4]

try:
    with open(wiki_file, 'r') as f:
        content = f.read()
    
    # 替换前端URL
    pattern = r'(前端 \(用户登录\)\s*\| )https://[a-zA-Z0-9-]+\.trycloudflare\.com'
    replacement = r'\g<1>' + frontend_url
    content = re.sub(pattern, replacement, content)
    
    # 替换后端URL
    pattern = r'(后端API\s*\| )https://[a-zA-Z0-9-]+\.trycloudflare\.com'
    replacement = r'\g<1>' + backend_url
    content = re.sub(pattern, replacement, content)
    
    # 更新时间戳
    content = re.sub(r'\*\*最后更新\*\*:.*', f'**最后更新**: {timestamp}', content)
    
    with open(wiki_file, 'w') as f:
        f.write(content)
    
    print("✅ Wiki已更新")
except Exception as e:
    print(f"❌ Wiki更新失败: {e}")
PYEOF
    
    log "${GREEN}[Wiki]${NC} URL同步完成"
}

# 查看状态
show_status() {
    echo ""
    echo "=========================================="
    echo "       Cloudflared Tunnel 状态"
    echo "=========================================="
    echo ""
    
    # 进程状态
    echo "📋 进程状态:"
    echo "----------------------------------------"
    
    local backend_pid=$(pgrep -f "cloudflared.*--url.*localhost:3000" 2>/dev/null || echo "")
    local frontend_pid=$(pgrep -f "cloudflared.*--url.*localhost:8080" 2>/dev/null || echo "")
    
    if [ -n "$backend_pid" ]; then
        echo "  ✅ Backend Tunnel (3000) - PID: $backend_pid"
    else
        echo "  ❌ Backend Tunnel (3000) - 未运行"
    fi
    
    if [ -n "$frontend_pid" ]; then
        echo "  ✅ Frontend Tunnel (8080) - PID: $frontend_pid"
    else
        echo "  ❌ Frontend Tunnel (8080) - 未运行"
    fi
    
    echo ""
    
    # URL状态
    echo "🔗 Tunnel URLs:"
    echo "----------------------------------------"
    
    local backend_url=$(get_current_url 3000 "backend")
    local frontend_url=$(get_current_url 8080 "frontend")
    
    echo "  Backend:  ${backend_url:-未获取到}"
    echo "  Frontend: ${frontend_url:-未获取到}"
    
    echo ""
    
    # 状态文件
    if [ -f "$STATE_FILE" ]; then
        echo "📁 状态文件: $STATE_FILE"
        cat "$STATE_FILE"
    fi
    
    echo ""
    echo "=========================================="
}

# 停止所有Tunnel
stop_all() {
    log "${YELLOW}[停止]${NC} 停止所有Cloudflared Tunnel..."
    
    pkill -f "cloudflared.*--url" 2>/dev/null || true
    
    sleep 2
    
    if pgrep -f "cloudflared.*--url" > /dev/null; then
        log "${RED}[错误]${NC} 无法停止所有Tunnel"
        return 1
    else
        log "${GREEN}[成功]${NC} 所有Tunnel已停止"
        return 0
    fi
}

# 主命令处理
case "$1" in
    start)
        mkdir -p "$LOG_DIR"
        start_tunnel 3000 "backend"
        start_tunnel 8080 "frontend"
        export_to_wiki
        ;;
    monitor)
        monitor_loop
        ;;
    status)
        show_status
        ;;
    export)
        export_to_wiki
        ;;
    stop)
        stop_all
        ;;
    restart)
        stop_all
        sleep 2
        mkdir -p "$LOG_DIR"
        start_tunnel 3000 "backend"
        start_tunnel 8080 "frontend"
        export_to_wiki
        ;;
    *)
        echo ""
        echo "Cloudflared Tunnel 管理器"
        echo ""
        echo "用法: $0 {start|stop|restart|monitor|status|export}"
        echo ""
        echo "  start    - 启动Tunnel"
        echo "  stop     - 停止Tunnel"
        echo "  restart  - 重启Tunnel"
        echo "  monitor  - 启动监控循环 (守护进程)"
        echo "  status   - 查看状态"
        echo "  export   - 导出状态到Wiki"
        echo ""
        exit 1
        ;;
esac
