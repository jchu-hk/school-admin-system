---
name: test-env-healthcheck
description: "Token-free testing environment health check. Monitor endpoints, response times, error rates via cron scripts."
---

# Test Environment Health Check Skill

Monitor testing environment health WITHOUT consuming OpenClaw tokens. Pure script-based health check scheduled via cron.

## Features

- ✅ Token-free (pure Python/curl scripts)
- ✅ Scheduled via cron (every 5 min)
- ✅ Multi-endpoint monitoring
- ✅ Response time tracking
- ✅ Error rate monitoring
- ✅ Historical data for trend analysis
- ✅ Critical alert via OpenClaw message

## Usage

### Manual Check

```bash
python skills/test-env-healthcheck/scripts/healthcheck.py
```

### Cron Schedule (every 5 minutes)

```bash
*/5 * * * * cd /workspace/projects/workspace && python3 skills/test-env-healthcheck/scripts/healthcheck.py >> /tmp/healthcheck.log 2>&1
```

### Add Cron Job

```bash
cron action=add --job='{"name":"test-env-healthcheck","schedule":{"expr":"*/5 * * * *","kind":"cron"},"payload":{"kind":"agentTurn","message":"Run test environment health check"},"delivery":{"mode":"none"},"sessionTarget":"isolated"}'
```

## Endpoints Monitored

| Endpoint | Check | Expected |
|----------|-------|----------|
| `/api/health` | Backend health | 200 OK, JSON response |
| `/api/users` | API accessible | 200 OK |
| Cloudflare Tunnel | External access | 200 OK |
| Database | Connection pool | < 100ms response |
| Frontend | Static files | 200 OK |

## Alert Levels

| Level | Condition | Action |
|-------|-----------|--------|
| **CRITICAL** | Endpoint down > 2 min | Send message immediately |
| **WARNING** | Response time > 3s | Log only |
| **DEGRADING** | Trend worsening | Warning after 3 samples |
| **OK** | All checks pass | Silent |

## Output

### Console Output

```
=== Test Environment Health Check === 2026-06-29 09:00:00

✅ Backend Health: 200 OK (45ms)
✅ API Access: 200 OK (82ms)
⚠️  Cloudflare Tunnel: 502 Bad Gateway
✅ Database: Connected (12ms)

Summary: 3 OK, 1 WARNING
Duration: 1.2s
```

### History File

```json
{
  "timestamp": "2026-06-29T09:00:00Z",
  "checks": {
    "backend_health": {"status": "ok", "response_time_ms": 45},
    "api_access": {"status": "ok", "response_time_ms": 82},
    "cloudflare_tunnel": {"status": "warning", "response_time_ms": null},
    "database": {"status": "ok", "response_time_ms": 12}
  },
  "summary": {"ok": 3, "warning": 1, "critical": 0}
}
```

## Configuration

Edit `scripts/healthcheck_config.json`:

```json
{
  "endpoints": {
    "backend_health": {
      "url": "http://localhost:3000/api/health",
      "timeout": 5,
      "expected_status": 200
    },
    "cloudflare_tunnel": {
      "url": "https://until-diamonds-disclosure-needle.trycloudflare.com/api/health",
      "timeout": 10,
      "expected_status": 200
    }
  },
  "thresholds": {
    "response_time_warning_ms": 3000,
    "response_time_critical_ms": 10000,
    "consecutive_failures_for_alert": 3
  }
}
```

## Files

```
skills/test-env-healthcheck/
├── SKILL.md
└── scripts/
    ├── healthcheck.py              # Main health check script
    ├── healthcheck_config.json     # Configuration
    └── healthcheck_history.json    # Historical data
```

## Token Consumption

**0 tokens** - Pure script execution, no LLM calls.

## Dependencies

- Python 3
- requests library
- (No LLM required)

## Related

- PROJECT-WIKI.md: Testing environment URLs
- infra/docker-compose.yml: Service definitions