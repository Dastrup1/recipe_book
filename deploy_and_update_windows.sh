#!/bin/bash

# Ask for a commit message using AppleScript (GUI dialog)
commit_msg=$(osascript -e 'Tell application "System Events" to display dialog "Enter commit message:" default answer ""' -e 'text returned of result')

if [ -z "$commit_msg" ]; then
  osascript -e 'display alert "Deployment cancelled" message "No commit message entered."'
  exit 1
fi

echo "🚀 Starting Mac → GitHub push..."
cd ~/Documents/recipe_book || {
  osascript -e 'display alert "Deployment Failed" message "Could not find recipe_book directory."'
  exit 1
}

# Git commit and push
git add .
git commit -m "$commit_msg"
if ! git push origin main; then
  osascript -e 'display alert "Deployment Failed" message "Git push failed. Check your internet or repo settings."'
  exit 1
fi

# SSH to Windows and update
echo "🔐 SSHing into Windows to pull and restart..."
ssh Dylan@192.168.4.72 << 'EOF'
cd C:/Users/Dylan/Desktop/recipe_book

echo "📦 Backing up recipes.db..."
powershell -Command "
  \$backupDir = 'backups';
  if (!(Test-Path \$backupDir)) { New-Item -ItemType Directory -Path \$backupDir };
  \$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss';
  Copy-Item 'recipes.db' (\$backupDir + '/recipes_' + \$timestamp + '.db')
"

git pull origin main

nssm restart FlaskApp
nssm restart ReactApp
nssm restart Caddy
EOF

# Success notification
osascript -e 'display notification "Deployment complete and services restarted!" with title "✅ Deployment Success" sound name "Hero"'

echo "✅ All done!"
