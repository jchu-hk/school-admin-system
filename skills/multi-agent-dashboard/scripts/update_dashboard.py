#!/usr/bin/env python3
"""
Thin wrapper — delegates to agent-dashboard/agent_status.py (the canonical dashboard skill).

The agent-dashboard skill (skills/agent-dashboard/) is the single source of truth for:
- agent status updates (running/idle/terminated)
- agent communication logs
- dashboard HTML generation + GitHub push

This wrapper exists for backward compatibility — all existing callers
(check_rules.py, dashboard-refresh.sh, write_message.py, reset_agent.py, coordinator.sh)
continue to work without modification.

Design per user spec (2026-07-01): simple, direct, zero-token — no heartbeat files,
no GitHub inference, just agents calling one script with 3 params.

Usage:
    python update_dashboard.py    → rebuild dashboard from existing data
"""

import subprocess
import sys
from pathlib import Path

AGENT_STATUS = Path(__file__).resolve().parent.parent.parent.parent / \
    "skills" / "agent-dashboard" / "scripts" / "agent_status.py"

result = subprocess.run(
    [sys.executable, str(AGENT_STATUS), "--rebuild"],
    capture_output=True, text=True,
    timeout=120
)

print(result.stdout, end="")
if result.stderr:
    print(result.stderr, end="", file=sys.stderr)
sys.exit(result.returncode)
