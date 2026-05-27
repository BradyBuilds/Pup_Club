#!/usr/bin/env bash
# Run these commands in your Replit Shell (bottom panel)
# This pushes your current workspace to BradyBuilds/Pup_Club

cd /home/runner/workspace

# 1. Stage everything
git add -A

# 2. Commit
git commit -m "feat: push latest Replit build to GitHub"

# 3. Add GitHub remote (if not already there)
git remote add github https://github.com/BradyBuilds/Pup_Club.git 2>/dev/null || true

# 4. Push to GitHub
# If the GitHub repo is empty or has a compatible history, this just works:
git push github main

# If you get a "rejected" error because GitHub has commits Replit doesn't,
# uncomment this line instead (forces Replit's version to be the source of truth):
# git push github main --force
