#!/usr/bin/env bash
set -euo pipefail

# Quickards deploy script
# Usage: ./deploy.sh [commit message]
#   If no message provided, opens editor for commit message

SERVER="yandex-cloud"
REMOTE_DIR="/home/flurai-rus/quickards"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { echo -e "${GREEN}=> $1${NC}"; }
warn() { echo -e "${YELLOW}   $1${NC}"; }

# 1. Git commit & push
step "Checking for changes..."
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
    warn "No changes to commit, pushing existing commits..."
else
    git add -A
    if [ -n "${1:-}" ]; then
        git commit -m "$1"
    else
        git commit
    fi
fi

step "Pushing to origin..."
git push

# 2. SSH to server: pull & rebuild
step "Deploying on server..."
ssh "$SERVER" bash -s << 'REMOTE'
set -euo pipefail

cd /home/flurai-rus/quickards

echo "=> Pulling latest changes..."
git pull --ff-only

echo "=> Rebuilding containers..."
docker compose up -d --build backend frontend

echo "=> Waiting for containers..."
sleep 3
docker compose ps

echo "=> Done!"
REMOTE

step "Deploy complete!"
