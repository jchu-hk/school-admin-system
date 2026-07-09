#!/bin/bash
# Dashboard Daily Refresh - Token-less
# Updates multi-agent dashboard from GitHub events without calling LLM

cd /workspace/projects/workspace

# Run the Python script directly (no model call)
python3 skills/multi-agent-dashboard/scripts/update_dashboard.py \
  --repo jchu-hk/school-admin-system \
  >> /tmp/dashboard-refresh.log 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] Dashboard refresh completed successfully" >> /tmp/dashboard-refresh.log
else
    echo "[$(date)] Dashboard refresh failed with code $EXIT_CODE" >> /tmp/dashboard-refresh.log
fi

exit 0
