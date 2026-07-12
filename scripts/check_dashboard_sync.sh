#!/usr/bin/env bash
# Check if dashboard can push to GitHub - run before write_message
# Returns 0 if git status is OK, 1 if diverged

set -e
cd /workspace/projects/workspace

# Check if we're ahead/behind
git fetch origin main 2>/dev/null || true
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)

if [ "$BEHIND" -gt 0 ]; then
    echo "⚠️  WARNING: Local is behind origin/main by $BEHIND commits. Run git pull --rebase first."
    exit 1
fi

echo "✅ Dashboard git sync OK (ahead by $AHEAD commits)"
exit 0
