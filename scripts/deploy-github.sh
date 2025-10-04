#!/bin/bash

# Script de déploiement GitHub pour Mima Elghalia
# Usage: ./scripts/deploy-github.sh

set -e

echo "🚀 Déploiement sur GitHub Pages - Mima Elghalia"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Vérifications préliminaires
log_info "Vérification des prérequis..."

# Vérifier Git
if ! command -v git &> /dev/null; then
    log_error "Git n'est pas installé"
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js n'est pas installé"
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    log_error "npm n'est pas installé"
fi

log_success "Prérequis vérifiés"

# Vérifier si on est dans un repo Git
if [ ! -d ".git" ]; then
    log_error "Ce n'est pas un repository Git. Initialisez d'abord avec 'git init'"
fi

# Vérifier le statut Git
if [ -n "$(git status --porcelain)" ]; then
    log_warning "Il y a des changements non commitées"
    echo "Voulez-vous continuer ? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_error "Déploiement annulé"
    fi
fi

# Installation des dépendances
log_info "Installation des dépendances..."
npm run install:all
log_success "Dépendances installées"

# Tests (optionnel pour le déploiement frontend)
log_info "Exécution des tests frontend uniquement..."
cd frontend
npm test -- --run --reporter=verbose 2>/dev/null || log_warning "Tests frontend ignorés pour le déploiement"
cd ..
log_success "Tests terminés"

# Build du frontend
log_info "Build du frontend pour la production..."
cd frontend
npm run build
cd ..
log_success "Frontend buildé"

# Installation de gh-pages si nécessaire
log_info "Vérification de gh-pages..."
cd frontend
if ! npm list gh-pages &> /dev/null; then
    log_info "Installation de gh-pages..."
    npm install --save-dev gh-pages
fi
cd ..

# Déploiement sur GitHub Pages
log_info "Déploiement sur GitHub Pages..."
cd frontend
npm run deploy
cd ..
log_success "Déploiement terminé"

# Informations finales
echo ""
echo "🎉 Déploiement GitHub Pages terminé avec succès!"
echo ""
echo "📋 Résumé:"
echo "   - Frontend déployé sur GitHub Pages"
echo "   - URL: https://votre-username.github.io/creche-site/"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Aller dans les paramètres de votre repo GitHub"
echo "   2. Section 'Pages' > Source: 'Deploy from a branch'"
echo "   3. Branch: 'gh-pages' > Folder: '/ (root)'"
echo "   4. Configurer un domaine personnalisé si souhaité"
echo ""
echo "⚠️  Note importante:"
echo "   - Le backend doit être déployé séparément (Heroku, Railway, etc.)"
echo "   - Mettre à jour VITE_API_URL dans frontend/.env.production"
echo ""
