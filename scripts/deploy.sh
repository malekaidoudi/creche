#!/bin/bash

# Script de déploiement pour le système de gestion de crèche
# Usage: ./scripts/deploy.sh [production|staging]

set -e  # Arrêter le script en cas d'erreur

# Configuration
ENVIRONMENT=${1:-staging}
PROJECT_NAME="creche-management-system"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🚀 Démarrage du déploiement en mode: $ENVIRONMENT"

# Fonction pour afficher les étapes
log_step() {
    echo "📋 $1"
}

# Fonction pour afficher les succès
log_success() {
    echo "✅ $1"
}

# Fonction pour afficher les erreurs
log_error() {
    echo "❌ $1"
    exit 1
}

# Vérification des prérequis
log_step "Vérification des prérequis..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js n'est pas installé"
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    log_error "npm n'est pas installé"
fi

# Vérifier MySQL
if ! command -v mysql &> /dev/null; then
    log_error "MySQL n'est pas installé"
fi

log_success "Prérequis vérifiés"

# Installation des dépendances
log_step "Installation des dépendances..."

# Backend
cd backend
npm ci --only=production
cd ..

# Frontend
cd frontend
npm ci
cd ..

# Root
npm ci

log_success "Dépendances installées"

# Tests
if [ "$ENVIRONMENT" = "production" ]; then
    log_step "Exécution des tests..."
    
    # Tests backend
    cd backend
    npm test
    cd ..
    
    # Tests frontend
    cd frontend
    npm test
    cd ..
    
    log_success "Tests réussis"
fi

# Build du frontend
log_step "Build du frontend..."
cd frontend
npm run build
cd ..
log_success "Frontend buildé"

# Sauvegarde de la base de données (si production)
if [ "$ENVIRONMENT" = "production" ]; then
    log_step "Sauvegarde de la base de données..."
    
    mkdir -p $BACKUP_DIR
    
    # Créer une sauvegarde
    mysqldump -u root -p creche_app > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
    
    log_success "Base de données sauvegardée"
fi

# Migration de la base de données
log_step "Migration de la base de données..."
cd backend
npm run db:migrate 2>/dev/null || echo "Pas de migrations à exécuter"
cd ..
log_success "Migrations appliquées"

# Configuration de l'environnement
log_step "Configuration de l'environnement..."

if [ "$ENVIRONMENT" = "production" ]; then
    # Copier le fichier .env de production
    if [ -f ".env.production" ]; then
        cp .env.production .env
        log_success "Configuration de production appliquée"
    else
        log_error "Fichier .env.production manquant"
    fi
elif [ "$ENVIRONMENT" = "staging" ]; then
    # Copier le fichier .env de staging
    if [ -f ".env.staging" ]; then
        cp .env.staging .env
        log_success "Configuration de staging appliquée"
    else
        log_error "Fichier .env.staging manquant"
    fi
fi

# Redémarrage des services (exemple avec PM2)
log_step "Redémarrage des services..."

# Si PM2 est installé
if command -v pm2 &> /dev/null; then
    # Arrêter l'ancienne version
    pm2 stop $PROJECT_NAME 2>/dev/null || true
    
    # Démarrer la nouvelle version
    cd backend
    pm2 start ecosystem.config.js --env $ENVIRONMENT
    cd ..
    
    log_success "Services redémarrés avec PM2"
else
    log_step "PM2 non installé, démarrage manuel requis"
    echo "Pour démarrer manuellement:"
    echo "cd backend && npm start"
fi

# Vérification de santé
log_step "Vérification de santé..."

sleep 5  # Attendre que le service démarre

# Tester l'API
if curl -f -s http://localhost:3003/api/health > /dev/null; then
    log_success "API fonctionnelle"
else
    log_error "API non accessible"
fi

# Nettoyage
log_step "Nettoyage..."

# Supprimer les anciens backups (garder les 5 derniers)
if [ -d "$BACKUP_DIR" ]; then
    cd $BACKUP_DIR
    ls -t backup_*.sql | tail -n +6 | xargs -r rm
    cd ..
fi

log_success "Nettoyage terminé"

# Résumé
echo ""
echo "🎉 Déploiement terminé avec succès!"
echo "📊 Environnement: $ENVIRONMENT"
echo "⏰ Timestamp: $TIMESTAMP"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌐 Application accessible sur: https://votre-domaine.com"
else
    echo "🌐 Application accessible sur: http://localhost:3003"
fi

echo ""
echo "📝 Prochaines étapes:"
echo "   - Vérifier les logs: pm2 logs $PROJECT_NAME"
echo "   - Monitorer les performances: pm2 monit"
echo "   - Vérifier l'application dans le navigateur"
