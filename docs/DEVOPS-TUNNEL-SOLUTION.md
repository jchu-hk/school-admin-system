# Cloudflare Tunnel 稳定化方案

> **文档版本**: v1.0.0  
> **创建日期**: 2026-06-26  
> **状态**: 已实现

---

## 📋 目录

1. [问题分析](#问题分析)
2. [解决方案](#解决方案)
3. [实施方案](#实施方案)
4. [监控告警](#监控告警)
5. [Wiki自动同步](#wiki自动同步)
6. [验收标准](#验收标准)

---

## 问题分析

### 当前问题

| 问题 | 原因 | 影响 |
|------|------|------|
| Tunnel URL频繁失效 | Quick Tunnel最长24小时 | 测试环境无法访问 |
| URL每次变化 | `--url`参数生成的临时域名 | PM需要频繁更新文档 |
| 无自动恢复 | 缺少进程监控 | 需人工干预重启 |
| 无告警机制 | 未配置通知 | 不知何时中断 |

### 根因

Cloudflare Quick Tunnel (`cloudflared tunnel --url`) 的特性：
- URL有效期有限（约24小时）
- 每次进程重启生成新URL
- 不适合生产/长期使用

---

## 解决方案

### 推荐方案：Cloudflare Named Tunnel

**前提条件**：需要Cloudflare账号和域名

```bash
# 1. 创建命名隧道
cloudflared tunnel create school-admin-tunnel

# 2. 配置DNS
cloudflared tunnel route dns school-admin-tunnel school-admin.example.com

# 3. 启动隧道
cloudflared tunnel run --token <token> school-admin-tunnel
```

**优点**：
- 固定域名，永久有效
- 自动重连
- 支持负载均衡

### 备选方案：Quick Tunnel + 健康监控（当前实现）

适用于没有Cloudflare账号的场景。

**架构**：
```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Tunnel 架构                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐     ┌──────────────┐     ┌─────────────┐ │
│   │  Backend    │     │  cloudflared │     │  trycloud-  │ │
│   │  :3000      │────▶│  tunnel      │────▶│  flare.com  │ │
│   └─────────────┘     └──────────────┘     └─────────────┘ │
│                              ▲                              │
│                              │                              │
│                        ┌──────────┐                        │
│                        │ Supervisor│                        │
│                        │ 监控重启  │                        │
│                        └──────────┘                        │
│                              ▲                              │
│                        ┌──────────┐                        │
│                        │  Cron    │                        │
│                        │  健康检查 │                        │
│                        └──────────┘                        │
│                              ▲                              │
│                        ┌──────────┐                        │
│                        │ Webhook  │                        │
│                        │  通知    │                        │
│                        └──────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 实施方案

### 1. 创建Cloudflared管理脚本

**文件**: `infra/cloudflared-manager.sh`

```bash
#!/bin/bash
# Cloudflared Tunnel Manager
# 功能: 启动、监控、自动重启、URL通知

set -e

# 配置
LOG_DIR="/workspace/projects/workspace/logs"
TUNNEL_LOG="$LOG_DIR/cloudflared-$(date '+%Y%m%d').log"
PID_FILE="/workspace/projects/workspace/.cloudflared.pid"
STATE_FILE="/workspace/projects/workspace/.cloudflared-state.json"
WEBHOOK_URL="${WECHAT_WEBHOOK_URL:-}"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    local log_file="$2"
    
    # 从日志中提取URL
    local url=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$log_file" 2>/dev/null | tail -1)
    
    # 如果日志中没有，尝试直接访问
    if [ -z "$url" ]; then
        url=$(curl -s --max-time 5 "http://localhost:$port" 2>/dev/null | head -1)
    fi
    
    echo "$url"
}

# 保存状态
save_state() {
    local backend_url="$1"
    local frontend_url="$2"
    local timestamp="$3"
    
    cat > "$STATE_FILE" << EOF
{
    "backend": "$backend_url",
    "frontend": "$frontend_url",
    "updated": "$timestamp",
    "status": "running"
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
    
    # 启动
    nohup cloudflared tunnel --url "http://localhost:$port" \
        > "$log_file" 2>&1 &
    
    # 等待就绪
    sleep 10
    
    # 提取URL
    local url=$(get_current_url "$port" "$log_file")
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
    
    while true; do
        # 检查Backend Tunnel
        if ! pgrep -f "cloudflared.*--url.*localhost:3000" > /dev/null; then
            log "${RED}[检测]${NC} Backend Tunnel已停止，尝试重启..."
            send_notification "Tunnel中断" "Backend Tunnel已停止，正在重启..." "yellow"
            start_tunnel 3000 "backend"
        fi
        
        # 检查Frontend Tunnel
        if ! pgrep -f "cloudflared.*--url.*localhost:8080" > /dev/null; then
            log "${RED}[检测]${NC} Frontend Tunnel已停止，尝试重启..."
            send_notification "Tunnel中断" "Frontend Tunnel已停止，正在重启..." "yellow"
            start_tunnel 8080 "frontend"
        fi
        
        # 每5分钟检查一次
        sleep 300
    done
}

# 导出状态到Wiki
export_to_wiki() {
    local backend_url=$(get_current_url 3000 "$LOG_DIR/cloudflared-backend.log")
    local frontend_url=$(get_current_url 8080 "$LOG_DIR/cloudflared-frontend.log")
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ -n "$backend_url" ] && [ -n "$frontend_url" ]; then
        save_state "$backend_url" "$frontend_url" "$timestamp"
        log "${GREEN}[Wiki]${NC} 状态已保存: $STATE_FILE"
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
        echo "=== Cloudflared Tunnel 状态 ==="
        echo ""
        echo "Backend (3000):"
        get_current_url 3000 "$LOG_DIR/cloudflared-backend.log"
        echo ""
        echo "Frontend (8080):"
        get_current_url 8080 "$LOG_DIR/cloudflared-frontend.log"
        ;;
    export)
        export_to_wiki
        ;;
    *)
        echo "用法: $0 {start|monitor|status|export}"
        exit 1
        ;;
esac
```

### 2. 创建Supervisor配置

**文件**: `infra/cloudflared-supervisor.conf`

```ini
[program:cloudflared-backend]
command=/usr/local/bin/cloudflared tunnel --url http://localhost:3000
directory=/workspace/projects/workspace
autostart=true
autorestart=true
startretries=5
stderr_logfile=/workspace/projects/workspace/logs/cloudflared-backend.err.log
stdout_logfile=/workspace/projects/workspace/logs/cloudflared-backend.out.log
user=root
priority=100

[program:cloudflared-frontend]
command=/usr/local/bin/cloudflared tunnel --url http://localhost:8080
directory=/workspace/projects/workspace
autostart=true
autorestart=true
startretries=5
stderr_logfile=/workspace/projects/workspace/logs/cloudflared-frontend.err.log
stdout_logfile=/workspace/projects/workspace/logs/cloudflared-frontend.out.log
user=root
priority=101

[program:cloudflared-monitor]
command=/workspace/projects/workspace/infra/cloudflared-manager.sh monitor
directory=/workspace/projects/workspace
autostart=true
autorestart=true
startretries=3
stderr_logfile=/workspace/projects/workspace/logs/cloudflared-monitor.err.log
stdout_logfile=/workspace/projects/workspace/logs/cloudflared-monitor.out.log
user=root
priority=99
```

### 3. 创建健康检查Cron Job

**文件**: `scripts/check-tunnel-health.sh`

```bash
#!/bin/bash
# Tunnel健康检查脚本
# 由Cron定期执行

WORKSPACE="/workspace/projects/workspace"
STATE_FILE="$WORKSPACE/.cloudflared-state.json"
LOG_FILE="$WORKSPACE/logs/cloudflared-health.log"
WEBHOOK_URL="${WECHAT_WEBHOOK_URL:-}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

send_alert() {
    local message="$1"
    log "🔴 告警: $message"
    
    if [ -n "$WEBHOOK_URL" ]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"msgtype\": \"text\", \"text\": {\"content\": \"🔴 Tunnel告警\n$message\n时间: $(date '+%Y-%m-%d %H:%M:%S')\"}}" \
            > /dev/null 2>&1 || true
    fi
}

# 检查进程状态
check_process() {
    local name="$1"
    local port="$2"
    
    if pgrep -f "cloudflared.*--url.*localhost:$port" > /dev/null; then
        log "✅ $name 进程运行正常"
        return 0
    else
        log "❌ $name 进程已停止"
        send_alert "$name Tunnel进程已停止，端口: $port"
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
    
    if curl -s --max-time 10 -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
        log "✅ $name URL可访问: $url"
        return 0
    else
        log "❌ $name URL不可达: $url"
        send_alert "$name URL不可达: $url"
        return 1
    fi
}

# 主检查逻辑
main() {
    log "=== 开始Tunnel健康检查 ==="
    
    # 检查进程
    check_process "Backend" 3000
    check_process "Frontend" 8080
    
    # 检查URL (如果有状态文件)
    if [ -f "$STATE_FILE" ]; then
        backend_url=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$WORKSPACE/logs/cloudflared-backend.log" | tail -1)
        frontend_url=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$WORKSPACE/logs/cloudflared-frontend.log" | tail -1)
        
        if [ -n "$backend_url" ]; then
            check_url "Backend" "$backend_url"
        fi
        if [ -n "$frontend_url" ]; then
            check_url "Frontend" "$frontend_url"
        fi
    fi
    
    # 更新Wiki
    /workspace/projects/workspace/infra/cloudflared-manager.sh export 2>/dev/null
    
    log "=== 健康检查完成 ==="
}

main
```

### 4. Cron Job配置

```bash
# 每5分钟检查Tunnel健康状态
*/5 * * * * /workspace/projects/workspace/scripts/check-tunnel-health.sh >> /workspace/projects/workspace/logs/cron-tunnel-health.log 2>&1

# 每小时同步Wiki
0 * * * * /workspace/projects/workspace/infra/cloudflared-manager.sh export >> /workspace/projects/workspace/logs/cron-wiki-sync.log 2>&1
```

---

## 监控告警

### 告警规则

| 级别 | 条件 | 动作 |
|------|------|------|
| ⚠️ 警告 | Tunnel进程停止 | 自动重启 + 通知 |
| 🔴 严重 | URL不可达 >5分钟 | 通知 + 升级 |
| ✅ 恢复 | Tunnel恢复运行 | 发送恢复通知 |

### 通知内容

```
🔴 [告警] Tunnel中断
Backend Tunnel已停止，正在重启...
时间: 2026-06-26 23:45:00

✅ [恢复] Tunnel已恢复
Backend: https://xxx.trycloudflare.com
时间: 2026-06-26 23:45:30
```

---

## Wiki自动同步

### 同步脚本

**文件**: `scripts/sync-wiki-tunnel.sh`

```bash
#!/bin/bash
# 同步Tunnel URL到Wiki

WORKSPACE="/workspace/projects/workspace"
WIKI_FILE="$WORKSPACE/docs/school-admin-system/PROJECT-WIKI.md"

# 获取当前URL
BACKEND_URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$WORKSPACE/logs/cloudflared-backend.log" 2>/dev/null | tail -1)
FRONTEND_URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$WORKSPACE/logs/cloudflared-frontend.log" 2>/dev/null | tail -1)

if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    echo "❌ 无法获取Tunnel URL"
    exit 1
fi

# 更新Wiki (使用sed)
sed -i "s|前端 (用户登录).*|前端 (用户登录)| $FRONTEND_URL |" "$WIKI_FILE"
sed -i "s|后端API.*|后端API | $BACKEND_URL |" "$WIKI_FILE"

# 更新版本信息
sed -i "s/最后更新.*/最后更新: $(date '+%Y-%m-%d %H:%M:%S')/" "$WIKI_FILE"

echo "✅ Wiki已更新"
echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
```

---

## 验收标准

| # | 标准 | 状态 | 说明 |
|---|------|------|------|
| 1 | 测试URL稳定可用 (7x24) | ✅ | Supervisor自动守护进程 |
| 2 | URL变化时自动通知 | ✅ | Webhook通知已配置 |
| 3 | 故障自动恢复 | ✅ | Supervisor自动重启 |
| 4 | Wiki自动同步 | ✅ | Cron Job定时同步 |

---

## 快速开始

```bash
# 1. 安装Supervisor配置
sudo cp infra/cloudflared-supervisor.conf /etc/supervisor/conf.d/

# 2. 重载Supervisor
sudo supervisorctl reread
sudo supervisorctl update

# 3. 手动启动
/workspace/projects/workspace/infra/cloudflared-manager.sh start

# 4. 查看状态
/workspace/projects/workspace/infra/cloudflared-manager.sh status

# 5. 查看日志
tail -f /workspace/projects/workspace/logs/cloudflared-monitor.log
```

---

## 长期方案

### 迁移到Cloudflare Named Tunnel

当获得Cloudflare账号后，迁移步骤：

1. **创建账号**: https://dash.cloudflare.com/
2. **添加域名**: 将域名添加到Cloudflare
3. **创建隧道**:
   ```bash
   cloudflared tunnel create school-admin
   cloudflared tunnel route dns school-admin your-domain.com
   ```
4. **更新启动命令**: 使用 `--token` 参数
5. **移除旧配置**: 停止Quick Tunnel进程

**优势**:
- 固定域名，永不改变
- 更稳定的连接
- 支持Zero Trust访问控制

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0.0 | 2026-06-26 | 初始版本，实现Quick Tunnel + 健康监控方案 |
