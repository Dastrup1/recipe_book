#!/bin/bash

# === SETTINGS ===
TERMINAL_NOTIFIER="/opt/homebrew/bin/terminal-notifier"  # Update this if needed

# Ask for a commit message using AppleScript (GUI dialog)
commit_msg=$(osascript -e 'Tell application "System Events" to display dialog "Enter commit message:" default answer ""' -e 'text returned of result')

if [ -z "$commit_msg" ]; then
  $TERMINAL_NOTIFIER -title "❌ Deployment Cancelled" -message "No commit message entered." -sound Funk
  exit 1
fi

echo "🚀 Starting Mac → GitHub push..."
cd ~/Documents/recipe_book || {
  $TERMINAL_NOTIFIER -title "❌ Deployment Failed" -message "Could not find recipe_book directory." -sound Basso
  exit 1
}

# Git commit and push
git add .
git commit -m "$commit_msg"
if ! git push origin main; then
  $TERMINAL_NOTIFIER -title "❌ Deployment Failed" -message "Git push failed. Check your internet or repo settings." -sound Basso
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
$TERMINAL_NOTIFIER -title "✅ Deployment Success" -message "Deployment complete and services restarted!" -sound Hero

echo "✅ All done!"

echo "$(date): Deployment successful" >> ~/Documents/deploy_log.txt
