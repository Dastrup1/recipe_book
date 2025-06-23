#!/bin/bash

# Helper function for robust notification
notify() {
  title="$1"
  message="$2"
  sound="$3"

  if ! terminal-notifier \
    -title "$title" \
    -message "$message" \
    -sound "$sound" \
    -appIcon /System/Applications/Launchpad.app/Contents/Resources/Launchpad.icns \
    -sender com.apple.Terminal; then
    osascript -e "display alert \"$title\" message \"$message\""
  fi
}

# Ask for a commit message using AppleScript (GUI dialog)
commit_msg=$(osascript -e 'Tell application "System Events" to display dialog "Enter commit message:" default answer ""' -e 'text returned of result')

if [ -z "$commit_msg" ]; then
  notify "❌ Deployment Cancelled" "No commit message entered." "Funk"
  exit 1
fi

echo "🚀 Starting Mac → GitHub push..."
cd ~/Documents/recipe_book || {
  notify "❌ Deployment Failed" "Could not find recipe_book directory." "Basso"
  exit 1
}

# Git commit and push
git add .
git commit -m "$commit_msg"
if ! git push origin main; then
  notify "❌ Deployment Failed" "Git push failed. Check your internet or repo settings." "Basso"
  exit 1
fi

# SSH to Windows and update
echo "🔐 SSHing into Windows to pull and restart..."

ssh_output=$(ssh Dylan@192.168.4.72 << 'EOF'
cd C:/Users/Dylan/Desktop/recipe_book || exit 1

echo "📦 Backing up recipes.db..."
powershell -Command "
  \$backupDir = 'backups';
  if (!(Test-Path \$backupDir)) { New-Item -ItemType Directory -Path \$backupDir };
  \$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss';
  Copy-Item 'recipes.db' (\$backupDir + '/recipes_' + \$timestamp + '.db')
" || exit 1

git checkout main || exit 1
git reset --hard origin/main || exit 1
git clean -fd || exit 1
git pull origin main || exit 1

nssm restart FlaskApp || exit 1
nssm restart ReactApp || exit 1
nssm restart Caddy || exit 1
EOF
)

# Check if SSH session succeeded
if [ $? -ne 0 ]; then
  notify "❌ Deployment Failed" "An error occurred during Windows deployment. Check logs." "Basso"
  echo "$ssh_output"
  exit 1
fi

echo "Triggering success notification..."
notify "✅ Deployment Success" "Deployment complete and services restarted!" "Hero"

echo "✅ All done!"
echo "$(date): Deployment successful" >> ~/Documents/deploy_log.txt