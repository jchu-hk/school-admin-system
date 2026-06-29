#!/usr/bin/env python3
"""
Cloudflare Tunnel Watchdog - 自动监控并重启 tunnel
零 Token，纯脚本

功能：
1. 检查 cloudflared 进程是否运行
2. 检查 tunnel URL 是否可访问
3. 如果异常，自动重启 tunnel
4. 记录状态到 /tmp/cloudflare-status.json
"""

import json
import subprocess
import time
from datetime import datetime
from pathlib import Path

STATUS_FILE = Path("/tmp/cloudflare-status.json")
LOG_FILE = Path("/tmp/cloudflare-watchdog.log")

# Tunnel 配置
TUNNELS = [
    {"name": "backend", "port": 3000, "log_file": "/tmp/cf-backend.log"},
    {"name": "frontend", "port": 8080, "log_file": "/tmp/cf-frontend.log"},
]

def log(msg):
    """写日志"""
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def is_process_running(name="cloudflared"):
    """检查进程是否运行"""
    r = subprocess.run(
        ["pgrep", "-f", name],
        capture_output=True, text=True
    )
    return r.returncode == 0

def get_tunnel_url(log_file):
    """从日志获取 tunnel URL"""
    try:
        content = Path(log_file).read_text()
        import re
        match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', content)
        return match.group(0) if match else None
    except:
        return None

def check_url_accessible(url):
    """检查 URL 是否可访问"""
    if not url:
        return False
    try:
        r = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
             "--max-time", "10", url],
            capture_output=True, text=True, timeout=15
        )
        return r.stdout.strip() in ["200", "301", "302", "404"]
    except:
        return False

def restart_tunnel(tunnel):
    """重启单个 tunnel"""
    name = tunnel["name"]
    port = tunnel["port"]
    log_file = tunnel["log_file"]
    
    log(f"Restarting {name} tunnel (port {port})...")
    
    # 停止现有进程
    subprocess.run(["pkill", "-9", "-f", f"cloudflared tunnel --url http://localhost:{port}"],
                   capture_output=True)
    time.sleep(2)
    
    # 启动新 tunnel
    cmd = f"nohup cloudflared tunnel --url http://localhost:{port} > {log_file} 2>&1 &"
    subprocess.run(cmd, shell=True)
    time.sleep(8)
    
    # 获取新 URL
    new_url = get_tunnel_url(log_file)
    log(f"{name} tunnel restarted: {new_url}")
    return new_url

def main():
    log("=" * 50)
    log("Cloudflare Watchdog 开始")
    
    status = {
        "timestamp": datetime.now().isoformat(),
        "tunnels": {},
        "actions": []
    }
    
    all_healthy = True
    
    for tunnel in TUNNELS:
        name = tunnel["name"]
        log_file = tunnel["log_file"]
        
        tunnel_status = {
            "name": name,
            "process_running": is_process_running(f"localhost:{tunnel['port']}"),
            "url": get_tunnel_url(log_file),
            "accessible": False,
            "action": None
        }
        
        # 检查进程
        if not tunnel_status["process_running"]:
            log(f"⚠️ {name}: 进程未运行")
            new_url = restart_tunnel(tunnel)
            tunnel_status["url"] = new_url
            tunnel_status["action"] = "restarted"
            tunnel_status["process_running"] = True
            all_healthy = False
            status["actions"].append(f"{name}: restarted")
        
        # 检查 URL
        if tunnel_status["url"]:
            tunnel_status["accessible"] = check_url_accessible(tunnel_status["url"])
            if not tunnel_status["accessible"]:
                log(f"⚠️ {name}: URL 不可访问 {tunnel_status['url']}")
                # 再等几秒后重试
                time.sleep(5)
                tunnel_status["accessible"] = check_url_accessible(tunnel_status["url"])
                if not tunnel_status["accessible"]:
                    log(f"⚠️ {name}: 仍然不可访问，尝试重启")
                    new_url = restart_tunnel(tunnel)
                    tunnel_status["url"] = new_url
                    tunnel_status["action"] = "force_restarted"
                    all_healthy = False
                    status["actions"].append(f"{name}: force_restarted")
        else:
            log(f"⚠️ {name}: 无 URL，尝试重启")
            new_url = restart_tunnel(tunnel)
            tunnel_status["url"] = new_url
            tunnel_status["action"] = "started"
            all_healthy = False
            status["actions"].append(f"{name}: started")
        
        status["tunnels"][name] = tunnel_status
    
    status["all_healthy"] = all_healthy
    
    # 保存状态
    STATUS_FILE.write_text(json.dumps(status, indent=2, ensure_ascii=False))
    
    log("=" * 50)
    if all_healthy:
        log("✅ 所有 tunnel 健康")
    else:
        log(f"⚠️ 采取了 {len(status['actions'])} 项修复措施")
    
    return 0 if all_healthy else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())