#!/bin/bash

# Script pour déployer le frontend dans le dossier /docs pour GitHub Pages

echo "🚀 Déploiement du frontend dans /docs..."

# Build du projet
echo "📦 Build du projet..."
npm run build:github

# Copie des fichiers dans /docs
echo "📁 Copie des fichiers dans /docs..."
cp -r dist/* ../docs/

echo "✅ Déploiement terminé !"
echo "💡 N'oubliez pas de commiter et pusher les changements :"
echo "   git add docs/"
echo "   git commit -m '🚀 Update /docs with new frontend build'"
echo "   git push origin main"
