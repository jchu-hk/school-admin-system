#!/bin/bash
# Cloudflare Named Tunnel Startup Script

# Kill existing cloudflared processes
pkill -f cloudflared 2>/dev/null
sleep 2

# Start the tunnel with the token
exec cloudflared tunnel run --token eyJhIjoiOTcxMTI0NDhhNTI2MDQxMThlZjZiYTY5NDQwOWQ4MmEiLCJ0IjoiZjY5ZjYwNDYtYTQ0ZC00NDQ0LWI0MDAtOTIyZWQxZjVhZWY0IiwicyI6Ik1EY3habVkwWWpndFlUZ3pPUzAwT0dOaExUbGtZalV0WkRZMFpXSm1NR0V6WVRFeCJ9
