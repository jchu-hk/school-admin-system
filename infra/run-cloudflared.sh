#!/bin/bash
# Cloudflare Tunnel Runner for School Admin System
# This script starts cloudflare tunnels for both the main app and Grafana

# Kill existing cloudflared processes
pkill -f "cloudflared" 2>/dev/null
sleep 2

echo "Starting Cloudflare tunnels..."
echo ""

# Start main app tunnel
echo "[1/2] Starting Main App tunnel (http://localhost:8080)..."
cloudflared tunnel --url http://localhost:8080 > /tmp/cloudflared-app.log 2>&1 &
APP_PID=$!
echo "      PID: $APP_PID"

# Start Grafana tunnel
echo "[2/2] Starting Grafana tunnel (http://localhost:3001)..."
cloudflared tunnel --url http://localhost:3001 > /tmp/cloudflared-grafana.log 2>&1 &
GRAFANA_PID=$!
echo "      PID: $GRAFANA_PID"

echo ""
echo "Waiting for tunnels to be ready..."
sleep 8

echo ""
echo "=========================================="
echo "🚀 Cloudflare Tunnels Started Successfully"
echo "=========================================="
echo ""
echo "📱 Main App:"
APP_URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' /tmp/cloudflared-app.log | tail -1)
echo "   $APP_URL"
echo ""
echo "📊 Grafana:"
GRAFANA_URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' /tmp/cloudflared-grafana.log | tail -1)
echo "   $GRAFANA_URL"
echo ""
echo "🔑 Grafana Login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📋 Logs:"
echo "   Main app:  tail -f /tmp/cloudflared-app.log"
echo "   Grafana:   tail -f /tmp/cloudflared-grafana.log"
echo ""
echo "🛑 To stop: pkill -f cloudflared"
echo "=========================================="
