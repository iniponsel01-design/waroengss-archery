#!/bin/bash
# Sync both repos: push to holisahmad (origin) and iniponsel01-design (fork)
# Usage: bash scripts/sync-repos.sh "commit message"

MSG="${1:-chore: sync}"

git add -A
git commit -m "$MSG" 2>/dev/null || echo "Nothing to commit"
git push origin main
git push fork main --force-with-lease
echo "✅ Pushed to both holisahmad/waroengss-archery and iniponsel01-design/waroengss-archery"
