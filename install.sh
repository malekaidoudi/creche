#!/bin/bash

# Script d'installation pour le système de gestion de crèche
# Ce script installe les dépendances pour le backend et le frontend

echo "🚀 Installation du système de gestion de crèche..."
echo "=================================================="

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js d'abord."
    echo "   Téléchargez depuis: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Installation des dépendances du backend
echo "📦 Installation des dépendances du backend..."
cd backend
if [ -f "package.json" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dépendances backend installées avec succès"
    else
        echo "❌ Erreur lors de l'installation des dépendances backend"
        exit 1
    fi
else
    echo "❌ Fichier package.json non trouvé dans le dossier backend"
    exit 1
fi

# Retour au dossier parent
cd ..

# Installation des dépendances du frontend
echo ""
echo "📦 Installation des dépendances du frontend..."
cd frontend
if [ -f "package.json" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dépendances frontend installées avec succès"
    else
        echo "❌ Erreur lors de l'installation des dépendances frontend"
        exit 1
    fi
else
    echo "❌ Fichier package.json non trouvé dans le dossier frontend"
    exit 1
fi

# Retour au dossier parent
cd ..

echo ""
echo "🎉 Installation terminée avec succès!"
echo "=================================================="
echo ""
echo "📋 Prochaines étapes:"
echo "1. Assurez-vous que MAMP est démarré avec MySQL"
echo "2. Configurez la base de données si nécessaire"
echo "3. Lancez le projet avec: ./start.sh"
echo ""
echo "👤 Comptes de test:"
echo "   Admin: admin@creche.com / admin123"
echo "   Staff: staff@creche.com / staff123"
echo "   Parent: parent@creche.com / parent123"
