#!/bin/bash

echo "🚀 Starting Mac → GitHub push..."
cd ~/Documents/recipe_book || exit 1

git add .
git commit -m "Quick deploy"
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
