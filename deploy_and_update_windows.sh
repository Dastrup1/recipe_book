#!/bin/bash

# Get commit message from argument or fallback to default
commit_msg="$1"
if [ -z "$commit_msg" ]; then
  commit_msg="Auto-deploy commit"
fi

echo "🚀 Starting Mac → GitHub push..."
cd ~/Documents/recipe_book || exit 1

git add .
git commit -m "$commit_msg"
git push origin main

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

echo "✅ All done!"
exit 0


# TEst