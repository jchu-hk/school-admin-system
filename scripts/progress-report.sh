#!/bin/bash
# 2-hour progress report script for OpenClaw
# Run via: bash /workspace/projects/workspace/scripts/progress-report.sh

WORKSPACE="/workspace/projects/workspace"
GITHUB_REMOTE="https://github.com/jchu-hk/school-admin-system"

echo "=== Progress Report ==="
echo "Time: $(date '+%Y-%m-%d %H:%M %Z')"
echo ""

echo "--- DEV1 (phase-2-core-modules) ---"
git -C "$WORKSPACE" log --oneline feature/phase-2-core-modules -3 2>/dev/null || echo "no commits"

echo "--- DEV2 (phase-2-dev2-modules) ---"
git -C "$WORKSPACE" log --oneline feature/phase-2-dev2-modules -3 2>/dev/null || echo "no commits yet"

echo "--- QA1 (phase-2-core-modules qa) ---"
git -C "$WORKSPACE" log --oneline feature/phase-2-core-modules -3 -- qa_report/ 2>/dev/null || echo "no new qa reports"

echo "--- QA2 (e2e tests) ---"
git -C "$WORKSPACE" log --oneline feature/phase-2-qa2-automation -3 2>/dev/null || echo "no commits yet"

echo ""
echo "--- Recent All Commits (last 10) ---"
git -C "$WORKSPACE" log --oneline main -10 2>/dev/null || echo "no main commits"
