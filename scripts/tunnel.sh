#!/bin/bash
# Tunnel management script for public internet access
# Uses serveo.net for SSH-based tunnel (no auth required)

TUNNEL_HOST="serveo.net"
LOCAL_PORT=80

start_tunnel() {
    nohup ssh -o StrictHostKeyChecking=no \
        -o ServerAliveInterval=30 \
        -o ServerAliveCountMax=3 \
        -o ExitOnForwardFailure=yes \
        -R 80:localhost:$LOCAL_PORT $TUNNEL_HOST \
        > /tmp/serveo.log 2>&1 &
    echo "Tunnel started with PID: $!"
}

stop_tunnel() {
    pkill -f "serveo.net"
    echo "Tunnel stopped"
}

status_tunnel() {
    if pgrep -f "serveo.net" > /dev/null; then
        echo "Tunnel is running"
        cat /tmp/serveo.log | grep -o "https://[^ ]*serveousercontent.com" | tail -1
    else
        echo "Tunnel is NOT running"
    fi
}

case "$1" in
    start) start_tunnel ;;
    stop) stop_tunnel ;;
    status) status_tunnel ;;
    restart) stop_tunnel; sleep 2; start_tunnel ;;
    *) echo "Usage: $0 {start|stop|status|restart}" ;;
esac
