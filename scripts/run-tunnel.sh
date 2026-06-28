#!/bin/bash
# Cloudflare Tunnel Runner - detached mode

LOGFILE="/tmp/cloudflared-$(date +%Y%m%d-%H%M%S).log"
TOKEN="eyJhIjoiOTcxMTI0NDhhNTI2MDQxMThlZjZiYTY5NDQwOWQ4MmEiLCJ0IjoiZjY5ZjYwNDYtYTQ0ZC00NDQ0LWI0MDAtOTIyZWQxZjVhZWY0IiwicyI6Ik1EY3habVkwWWpndFlUZ3pPUzAwT0dOaExUbGtZalV0WkRZMFpXSm1NR0V6WVRFeCJ9"

# Kill any existing cloudflared
pkill -9 -f cloudflared 2>/dev/null
sleep 2

# Start tunnel in background with nohup
nohup /usr/local/bin/cloudflared tunnel run --token "$TOKEN" > "$LOGFILE" 2>&1 &
PID=$!

sleep 3
if ps -p $PID > /dev/null; then
    echo "✅ Tunnel started with PID: $PID"
    echo "Log: $LOGFILE"
else
    echo "❌ Failed to start"
    cat "$LOGFILE"
fi
