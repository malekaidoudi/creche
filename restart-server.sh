#!/bin/bash

echo "🔄 Arrêt des processus existants..."
pkill -f "node.*server" 2>/dev/null || true
sleep 2

echo "🚀 Démarrage du serveur backend..."
cd backend && node server.js
