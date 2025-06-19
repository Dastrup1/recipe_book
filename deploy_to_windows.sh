#!/bin/bash

# === SETTINGS ===
REMOTE_NAME="origin"
BRANCH_NAME="main"
WINDOWS_SSH="Dylan@192.168.4.72"
WINDOWS_PROJECT_PATH="C:/Users/Dylan/Desktop/recipe_book"
SMB_SHARE="smb://192.168.4.72/recipe_book_git"
MOUNT_POINT="/Volumes/recipe_book_git"

echo "🚀 Starting deployment..."

# ✅ Step 0: Mount SMB share if not already mounted
if [ ! -d "$MOUNT_POINT" ]; then
  echo "🔗 Mounting SMB share..."
  mkdir -p "$MOUNT_POINT"
  mount_smbfs "$SMB_SHARE" "$MOUNT_POINT"
  if [ ! -d "$MOUNT_POINT" ]; then
    echo "❌ Failed to mount SMB share!"
    exit 1
  fi
else
  echo "✅ SMB share already mounted."
fi

# ✅ Step 1: Ensure remote repo is available
REMOTE_REPO="$MOUNT_POINT/recipe_book_remote.git"
if [ ! -d "$REMOTE_REPO" ]; then
  echo "❌ Remote Git repository not found at $REMOTE_REPO"
  exit 1
fi

# ✅ Step 2: Git commit and push changes
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

# ✅ Step 3: Build React frontend
echo "🛠️ Building frontend..."
cd recipe-frontend
npm run build
cd ..

# ✅ Step 4: Copy build and database to mounted Windows share
echo "📦 Copying frontend build and database to Windows machine..."

rm -rf "$MOUNT_POINT/recipe-frontend/build"
cp -R recipe-frontend/build "$MOUNT_POINT/recipe-frontend/"

cp recipes.db "$MOUNT_POINT/"

# Optional: Copy migrations folder (if needed)
cp -R migrations "$MOUNT_POINT/" 2>/dev/null || echo "ℹ️ No migrations folder to copy"

# ✅ Step 5: SSH into Windows machine and restart services
echo "🔄 Pulling latest code on Windows and restarting services..."
ssh "$WINDOWS_SSH" << EOF
cd "$WINDOWS_PROJECT_PATH"
git pull origin $BRANCH_NAME
nssm restart FlaskApp
nssm restart ReactApp
nssm restart Caddy
EOF

echo "✅ Deployment complete!"
