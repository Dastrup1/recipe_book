#!/bin/bash

# === SETTINGS ===
REMOTE_NAME="origin"
BRANCH_NAME="main"
WINDOWS_SSH="Dylan@192.168.4.137"
WINDOWS_PROJECT_PATH="C:/Users/Dylan/Desktop/recipe_book"

echo "🚀 Starting deployment..."

# Prompt for commit message
read -p "💬 Enter commit message (press Enter to use default): " commit_msg
if [ -z "$commit_msg" ]; then
  commit_msg="Auto-deploy commit"
fi

# Step 1: Git add/commit/push
echo "🔍 Committing and pushing local changes..."
cd ~/Documents/recipe_book || exit 1
git add .
git commit -m "$commit_msg"
git push $REMOTE_NAME $BRANCH_NAME

# Step 2: Connect to Windows and pull the latest code
echo "🔄 Pulling latest code on Windows and restarting services..."
ssh "$WINDOWS_SSH" << EOF
cd "$WINDOWS_PROJECT_PATH"
git pull origin $BRANCH_NAME
nssm restart FlaskApp
nssm restart ReactApp
nssm restart Caddy
EOF

echo "✅ Deployment complete!"
