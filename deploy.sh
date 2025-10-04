#!/bin/bash

# Script de déploiement rapide pour GitHub Pages
echo "🚀 Déploiement sur GitHub Pages..."

# Aller dans le dossier frontend
cd frontend

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Build pour la production
echo "🔨 Build de l'application..."
npm run build:github

# Déployer sur GitHub Pages
echo "🌐 Déploiement sur GitHub Pages..."
npm run deploy

echo "✅ Déploiement terminé !"
echo "🌐 Votre site sera disponible à : https://malekaidoudi.github.io/creche-site/"
echo "⏱️  Attendez 2-3 minutes pour la propagation..."
