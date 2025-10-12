#!/bin/bash

# Script de démarrage pour le système de gestion de crèche
# Ce script démarre le backend et le frontend en parallèle

echo "🚀 Démarrage du système de gestion de crèche..."
echo "=============================================="

# Vérifier si les dossiers existent
if [ ! -d "backend" ]; then
    echo "❌ Dossier backend non trouvé"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo "❌ Dossier frontend non trouvé"
    exit 1
fi

# Vérifier si les node_modules existent
if [ ! -d "backend/node_modules" ]; then
    echo "❌ Dépendances backend non installées. Lancez d'abord: ./install.sh"
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Dépendances frontend non installées. Lancez d'abord: ./install.sh"
    exit 1
fi

# Fonction pour nettoyer les processus à l'arrêt
cleanup() {
    echo ""
    echo "🛑 Arrêt des services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Services arrêtés"
    exit 0
}

# Capturer Ctrl+C pour nettoyer proprement
trap cleanup SIGINT SIGTERM

echo "🔧 Vérification de MAMP/MySQL..."
# Vérifier si MySQL est accessible (optionnel)
if command -v mysql &> /dev/null; then
    echo "✅ MySQL détecté"
else
    echo "⚠️  MySQL non détecté - assurez-vous que MAMP est démarré"
fi

echo ""
echo "🚀 Démarrage du backend (port 3003)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Attendre un peu pour que le backend démarre
sleep 3

echo "🚀 Démarrage du frontend (port 5173)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Services démarrés!"
echo "=============================================="
echo "🌐 Frontend: http://localhost:5173"
echo "🔗 Backend API: http://localhost:3003/api"
echo ""
echo "👤 Comptes de test:"
echo "   Admin: admin@creche.com / admin123"
echo "   Staff: staff@creche.com / staff123"
echo "   Parent: parent@creche.com / parent123"
echo ""
echo "💡 Appuyez sur Ctrl+C pour arrêter les services"
echo "=============================================="

# Attendre que les processus se terminent
wait $BACKEND_PID $FRONTEND_PID
