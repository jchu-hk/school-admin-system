#!/bin/bash
# Keep Cloudflare quick tunnel alive
LOGFILE="/tmp/cloudflared-quick.log"
URL=""

while true; do
    # Kill any existing cloudflared
    pkill -f cloudflared 2>/dev/null
    sleep 2
    
    # Start new tunnel
    cloudflared tunnel --url http://localhost:3000 --no-autoupdate > "$LOGFILE" 2>&1 &
    TUNNEL_PID=$!
    
    # Wait for URL
    sleep 8
    
    # Extract URL
    NEW_URL=$(grep -o "https://[a-z0-9-]*\.trycloudflare\.com" "$LOGFILE" 2>/dev/null | head -1)
    
    if [ -n "$NEW_URL" ] && [ "$NEW_URL" != "$URL" ]; then
        echo "NEW_URL: $NEW_URL $(date)" >> /tmp/tunnel-changes.log
        URL="$NEW_URL"
        echo "Tunnel URL: $URL"
    fi
    
    # Check every 5 minutes
    sleep 300
done
