#!/bin/bash
# Memory Sync to GitHub - openclaw1-coze-memory
# Pushes memory/ directory to backup repo (daily 09:00, 21:00)

REPO_DIR="/workspace/projects/workspace"
BACKUP_REPO_URL="https://github.com/jchu-hk/openclaw1-coze-memory.git"
WORK_DIR="/tmp/openclaw-memory-backup"

set -e

echo "=== Memory Backup: $(date -u '+%Y-%m-%d %H:%M UTC') ==="

# Clone the backup repo (shallow clone for speed)
rm -rf "$WORK_DIR"
git clone --depth 1 "$BACKUP_REPO_URL" "$WORK_DIR"

# Copy memory files
cp "$REPO_DIR"/memory/*.md "$WORK_DIR/memory/" 2>/dev/null || true
cp "$REPO_DIR"/memory/heartbeat-state.json "$WORK_DIR/memory/" 2>/dev/null || true

# Commit and push
cd "$WORK_DIR"
git config user.name "openclaw-memory-sync"
git config user.email "memory-sync@openclaw.ai"
git add -A memory/
if git diff --cached --quiet; then
    echo "No changes to backup."
else
    git commit -m "backup: memory $(date -u '+%Y-%m-%d %H:%M UTC')"
    git push origin main
    echo "✅ Backup pushed successfully."
fi

# Cleanup
cd /
rm -rf "$WORK_DIR"
echo "=== Backup complete ==="
