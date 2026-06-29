#!/bin/bash
# Setup Cloudflare Tunnels for external access

echo "Setting up Cloudflare Tunnels..."
echo ""

# Kill existing tunnels
pkill -9 cloudflared
sleep 2

# Start backend tunnel (port 3000)
echo "Starting backend tunnel (port 3000)..."
nohup cloudflared tunnel --url http://localhost:3000 --protocol http2 --no-autoupdate > /tmp/cloudflare-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend tunnel PID: $BACKEND_PID"

# Wait for backend tunnel to start
sleep 5

# Get backend URL
BACKEND_URL=$(grep -o "https://[a-z-]*\.trycloudflare\.com" /tmp/cloudflare-backend.log | tail -1)

# Start frontend tunnel (port 8080)
echo "Starting frontend tunnel (port 8080)..."
nohup cloudflared tunnel --url http://localhost:8080 --protocol http2 --no-autoupdate > /tmp/cloudflare-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend tunnel PID: $FRONTEND_PID"

# Wait for frontend tunnel to start
sleep 5

# Get frontend URL
FRONTEND_URL=$(grep -o "https://[a-z-]*\.trycloudflare\.com" /tmp/cloudflare-frontend.log | tail -1)

echo ""
echo "=== Cloudflare Tunnels Started ==="
echo "Backend (API): $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""
echo "Log files:"
echo "  Backend: /tmp/cloudflare-backend.log"
echo "  Frontend: /tmp/cloudflare-frontend.log"
echo ""
echo "To stop tunnels: pkill -9 cloudflared"
echo ""
echo "To check status:"
echo "  curl $BACKEND_URL/api/health"
echo "  curl $FRONTEND_URL"

# Save URLs to file
cat > /tmp/cloudflare-urls.txt << EOF
BACKEND_URL=$BACKEND_URL
FRONTEND_URL=$FRONTEND_URL
UPDATED_AT=$(date)
EOF

echo ""
echo "URLs saved to /tmp/cloudflare-urls.txt"
echo ""
echo "Testing connectivity..."
sleep 3
curl -s -o /dev/null -w "Backend: %{http_code}\n" "$BACKEND_URL/api/health"
curl -s -o /dev/null -w "Frontend: %{http_code}\n" "$FRONTEND_URL"