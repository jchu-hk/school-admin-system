#!/bin/bash
# Setup script for test-env-healthcheck cron job (system-level, token-free)

SCRIPT_PATH="/workspace/projects/workspace/skills/test-env-healthcheck/scripts/healthcheck.py"
LOG_FILE="/tmp/healthcheck.log"

echo "Setting up Test Environment Health Check cron job..."
echo ""

# Add to system crontab (runs every 5 minutes, no OpenClaw tokens)
(crontab -l 2>/dev/null | grep -v "test-env-healthcheck"; echo "*/5 * * * * /usr/bin/python3 ${SCRIPT_PATH} >> ${LOG_FILE} 2>&1") | crontab -

echo "✅ Cron job added to system crontab"
echo ""
echo "Run schedule: Every 5 minutes (*/5 * * * *)"
echo "Log file: ${LOG_FILE}"
echo ""
echo "To view logs: tail -f ${LOG_FILE}"
echo "To remove cron: crontab -l | grep -v test-env-healthcheck | crontab -"
echo ""
echo "Current crontab:"
crontab -l | grep "test-env-healthcheck"