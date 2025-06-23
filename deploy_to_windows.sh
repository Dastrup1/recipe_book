#!/bin/bash

# === SETTINGS ===
REMOTE_NAME="origin"
BRANCH_NAME="main"
WINDOWS_SSH="Dylan@192.168.4.72"
WINDOWS_PROJECT_PATH="C:/Users/Dylan/Desktop/recipe_book"
SMB_SHARE="smb://192.168.4.72/recipe_book_git"
MOUNT_POINT="/Users/dylanastrup/recipe_book_mount2"

echo "🚀 Starting deployment..."

# ✅ Step 0: Clean and mount SMB share
echo "🔗 Preparing SMB mount point..."
if mount | grep "$MOUNT_POINT" > /dev/null; then
  echo "⚠️  Stale SMB mount detected. Unmounting..."
  sudo umount "$MOUNT_POINT"
fi

if [ -d "$MOUNT_POINT" ]; then
  echo "⚠️  Removing stale mount directory..."
  sudo rm -rf "$MOUNT_POINT"
fi

mkdir -p "$MOUNT_POINT"

echo "🔗 Mounting SMB share..."
mount_smbfs "$SMB_SHARE" "$MOUNT_POINT"

# ✅ Verify mount contains the expected Git repo
REMOTE_REPO="$MOUNT_POINT/recipe_book_remote.git"

if [ ! -d "$REMOTE_REPO" ]; then
  echo "❌ Remote Git repository not found at $REMOTE_REPO"
  echo "❌ Check that the mount actually succeeded and the path is correct."
  exit 1
else
  echo "✅ SMB share mounted and Git repo found."
fi

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

# ✅ Step 2: Build frontend
echo "🛠️ Building frontend..."
cd recipe-frontend
npm run build
cd ..

# ✅ Step 3: Copy frontend build to Windows
echo "📦 Copying frontend build to Windows machine..."
cp -r recipe-frontend/build "$MOUNT_POINT/recipe_book_remote/react_build"

# ✅ Step 4: SSH into Windows and backup + restart services
echo "🔄 Pulling latest code on Windows and restarting services..."
ssh "$WINDOWS_SSH" << EOF
cd "$WINDOWS_PROJECT_PATH"

echo "📦 Backing up recipes.db..."
powershell -Command "
  \$backupDir = 'backups';
  if (!(Test-Path \$backupDir)) { New-Item -ItemType Directory -Path \$backupDir };
  \$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss';
  Copy-Item 'recipes.db' (\$backupDir + '/recipes_' + \$timestamp + '.db')
"

git pull origin $BRANCH_NAME

nssm restart FlaskApp
nssm restart ReactApp
nssm restart Caddy
EOF

echo "✅ Deployment complete!"
