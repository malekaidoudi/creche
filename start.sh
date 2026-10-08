#!/bin/bash
# ==============================================
# Script de démarrage du projet Crèche
# Lance le backend (Express) et le frontend (Vite)
# Usage : ./start.sh   (depuis la racine du projet)
# ==============================================

set -e

# Se placer à la racine du projet (dossier du script)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
FRONTEND_PORT=5173

# Lire le port backend depuis backend/.env (fallback : 3000)
# head -1 : en cas de doublon, dotenv conserve la première occurrence
BACKEND_PORT=$(grep -E '^PORT=' "$BACKEND_DIR/.env" 2>/dev/null | head -1 | cut -d= -f2 | tr -d ' \r')
BACKEND_PORT=${BACKEND_PORT:-3000}

echo "==========================================="
echo "  Demarrage du projet Creche"
echo "==========================================="

# 1. Nettoyage des anciens processus
echo "[1/4] Arret des processus existants..."
lsof -ti:"$BACKEND_PORT" | xargs kill -9 2>/dev/null || true
lsof -ti:"$FRONTEND_PORT" | xargs kill -9 2>/dev/null || true
pkill -f "creche/backend.*server.js" 2>/dev/null || true
sleep 1

# 2. Vérification des dépendances
echo "[2/4] Verification des dependances..."
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  echo "  -> Installation des dependances backend..."
  (cd "$BACKEND_DIR" && npm install)
fi
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "  -> Installation des dependances frontend..."
  (cd "$FRONTEND_DIR" && npm install)
fi

# 3. Vérification de la configuration
echo "[3/4] Verification de la configuration..."
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "  ATTENTION : backend/.env manquant, le backend risque de ne pas demarrer."
fi
# Avertissement si PostgreSQL ne repond pas
if command -v nc >/dev/null 2>&1; then
  nc -z localhost 5432 2>/dev/null || echo "  ATTENTION : PostgreSQL ne repond pas sur localhost:5432."
fi

# 4. Démarrage des deux services
echo "[4/4] Lancement des services..."

cleanup() {
  echo ""
  echo "Arret des services..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

(cd "$BACKEND_DIR" && npm run dev) &
BACKEND_PID=$!

(cd "$FRONTEND_DIR" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "==========================================="
echo "  Backend  : http://localhost:$BACKEND_PORT"
echo "  Frontend : http://localhost:$FRONTEND_PORT"
echo "  Health   : http://localhost:$BACKEND_PORT/api/health"
echo "==========================================="
echo "  Ctrl+C pour arreter les deux services"
echo ""

wait "$BACKEND_PID" "$FRONTEND_PID"
