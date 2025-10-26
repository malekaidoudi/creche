#!/bin/bash

echo "🚀 DÉPLOIEMENT AUTOMATIQUE COMPLET"
echo "=================================="

# 1. Build du frontend
echo "📦 Build du frontend..."
cd frontend
npm run build
cd ..

# 2. Déploiement Railway (backend)
echo "🚂 Déploiement Railway..."
cd backend
railway up --detach
cd ..

# 3. Déploiement Vercel (frontend)
echo "▲ Déploiement Vercel..."
cd frontend
vercel --prod --yes --force
cd ..

echo "✅ Déploiement terminé !"
echo "🌐 Vérifiez vos applications:"
echo "   - Backend: https://creche-backend-new.up.railway.app"
echo "   - Frontend: https://creche-frontend.vercel.app"
