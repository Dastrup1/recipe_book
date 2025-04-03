#!/bin/bash

# === SETTINGS ===
REMOTE_NAME="origin"
BRANCH_NAME="main"
WINDOWS_SSH="Dylan@192.168.4.137"
WINDOWS_PROJECT_PATH="C:/Users/Dylan/Desktop/recipe_book"

echo "🚀 Starting deployment..."

# ✅ Step 0: Dynamically locate the mounted volume
MOUNT_PATH=$(find /Volumes -maxdepth 1 -type d -name "recipe_book_git*" | head -n 1)

if [ ! -d "$MOUNT_PATH" ]; then
  echo "❌ Could not find mounted recipe_book_git folder!"
  exit 1
fi

REMOTE_REPO="$MOUNT_PATH/recipe_book_remote.git"

# ✅ Step 1: Commit and Push to the remote repo
read -p "💬 Enter commit message (press Enter to use default): " commit_msg
if [ -z "$commit_msg" ]; then
  commit_msg="Auto-deploy commit"
fi

echo "🔍 Committing and pushing local changes..."
cd ~/Documents/recipe_book || exit 1

git remote set-url $REMOTE_NAME "$REMOTE_REPO"
git add .
git commit -m "$commit_msg"
git push $REMOTE_NAME $BRANCH_NAME

# ✅ Step 2: SSH into Windows machine and pull latest + restart
echo "🔄 Pulling latest code on Windows and restarting services..."
ssh "$WINDOWS_SSH" << EOF
cd "$WINDOWS_PROJECT_PATH"
git pull origin $BRANCH_NAME
nssm restart FlaskApp
nssm restart ReactApp
nssm restart Caddy
EOF

echo "✅ Deployment complete!"
