#!/bin/bash

echo "🧹 Nettoyage des processus existants..."

# Tuer tous les processus Node.js liés au serveur
pkill -f "node.*server" 2>/dev/null || true

# Tuer spécifiquement les processus sur le port 3003 et 3004
lsof -ti:3003 | xargs kill -9 2>/dev/null || true
lsof -ti:3004 | xargs kill -9 2>/dev/null || true

echo "⏳ Attente de 3 secondes..."
sleep 3

echo "🚀 Démarrage du serveur sur le port 3004..."
cd backend
PORT=3004 node server.js
