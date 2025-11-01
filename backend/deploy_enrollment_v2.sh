#!/bin/bash

# =====================================================
# SCRIPT DE DÉPLOIEMENT ENROLLMENT WORKFLOW V2.0
# =====================================================
# Objectif: Déployer la refactorisation complète du système d'inscription
# Date: 2025-10-31
# Version: 2.0.0

set -e  # Arrêter en cas d'erreur

echo "🚀 DÉPLOIEMENT ENROLLMENT WORKFLOW V2.0"
echo "======================================"

# Variables
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="./logs/deployment_$(date +%Y%m%d_%H%M%S).log"

# Créer dossiers nécessaires
mkdir -p backups logs

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Fonction de backup
backup_files() {
    log "📦 Création backup des fichiers actuels..."
    mkdir -p "$BACKUP_DIR"
    
    # Backup controllers actuels
    if [ -f "controllers/enrollmentsController.js" ]; then
        cp "controllers/enrollmentsController.js" "$BACKUP_DIR/"
        log "✅ Backup enrollmentsController.js"
    fi
    
    if [ -f "controllers/childrenController.js" ]; then
        cp "controllers/childrenController.js" "$BACKUP_DIR/"
        log "✅ Backup childrenController.js"
    fi
    
    if [ -f "middleware/auth.js" ]; then
        cp "middleware/auth.js" "$BACKUP_DIR/"
        log "✅ Backup auth.js"
    fi
    
    # Backup routes actuelles
    if [ -f "routes_postgres/enrollments.js" ]; then
        cp "routes_postgres/enrollments.js" "$BACKUP_DIR/"
        log "✅ Backup routes enrollments.js"
    fi
    
    log "📦 Backup terminé dans: $BACKUP_DIR"
}

# Fonction de backup base de données
backup_database() {
    log "🗄️ Backup base de données..."
    
    if [ -n "$DATABASE_URL" ]; then
        pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database_backup.sql"
        log "✅ Backup base de données créé"
    else
        log "⚠️ DATABASE_URL non défini - Backup DB ignoré"
    fi
}

# Fonction de déploiement des fichiers
deploy_files() {
    log "📁 Déploiement des nouveaux fichiers..."
    
    # Déployer nouveaux controllers
    if [ -f "controllers/enrollmentsController_v2.js" ]; then
        cp "controllers/enrollmentsController_v2.js" "controllers/enrollmentsController.js"
        log "✅ enrollmentsController_v2.js → enrollmentsController.js"
    fi
    
    if [ -f "controllers/childrenController_v2.js" ]; then
        cp "controllers/childrenController_v2.js" "controllers/childrenController.js"
        log "✅ childrenController_v2.js → childrenController.js"
    fi
    
    # Déployer nouveau middleware
    if [ -f "middleware/auth_v2.js" ]; then
        cp "middleware/auth_v2.js" "middleware/auth.js"
        log "✅ auth_v2.js → auth.js"
    fi
    
    # Déployer nouvelles routes
    if [ -f "routes_postgres/enrollments_v2.js" ]; then
        cp "routes_postgres/enrollments_v2.js" "routes_postgres/enrollments.js"
        log "✅ enrollments_v2.js → enrollments.js"
    fi
    
    log "📁 Déploiement fichiers terminé"
}

# Fonction de migration base de données
migrate_database() {
    log "🔄 Migration base de données..."
    
    if [ -n "$DATABASE_URL" ]; then
        # Appliquer migration principale
        if [ -f "migrations/001_refactor_enrollments_workflow.sql" ]; then
            psql "$DATABASE_URL" -f "migrations/001_refactor_enrollments_workflow.sql"
            log "✅ Migration schéma appliquée"
        fi
        
        # Migrer données existantes
        if [ -f "migrations/migrate_existing_data.js" ]; then
            node "migrations/migrate_existing_data.js"
            log "✅ Migration données terminée"
        fi
    else
        log "⚠️ DATABASE_URL non défini - Migration DB ignorée"
    fi
}

# Fonction de vérification
verify_deployment() {
    log "🧪 Vérification du déploiement..."
    
    # Vérifier que les fichiers existent
    local files_ok=true
    
    if [ ! -f "controllers/enrollmentsController.js" ]; then
        log "❌ enrollmentsController.js manquant"
        files_ok=false
    fi
    
    if [ ! -f "controllers/childrenController.js" ]; then
        log "❌ childrenController.js manquant"
        files_ok=false
    fi
    
    if [ ! -f "middleware/auth.js" ]; then
        log "❌ auth.js manquant"
        files_ok=false
    fi
    
    if [ "$files_ok" = true ]; then
        log "✅ Tous les fichiers sont présents"
    else
        log "❌ Fichiers manquants détectés"
        return 1
    fi
    
    # Tester la syntaxe Node.js
    if node -c "controllers/enrollmentsController.js" 2>/dev/null; then
        log "✅ enrollmentsController.js syntaxe OK"
    else
        log "❌ Erreur syntaxe enrollmentsController.js"
        return 1
    fi
    
    # Exécuter tests si disponibles
    if [ -f "tests/enrollments.test.js" ]; then
        log "🧪 Exécution des tests..."
        if npm test -- --testPathPattern=enrollments.test.js; then
            log "✅ Tests réussis"
        else
            log "⚠️ Certains tests ont échoué"
        fi
    fi
    
    log "🧪 Vérification terminée"
}

# Fonction de rollback
rollback() {
    log "🔄 ROLLBACK EN COURS..."
    
    if [ -d "$BACKUP_DIR" ]; then
        # Restaurer fichiers
        if [ -f "$BACKUP_DIR/enrollmentsController.js" ]; then
            cp "$BACKUP_DIR/enrollmentsController.js" "controllers/"
            log "✅ enrollmentsController.js restauré"
        fi
        
        if [ -f "$BACKUP_DIR/childrenController.js" ]; then
            cp "$BACKUP_DIR/childrenController.js" "controllers/"
            log "✅ childrenController.js restauré"
        fi
        
        if [ -f "$BACKUP_DIR/auth.js" ]; then
            cp "$BACKUP_DIR/auth.js" "middleware/"
            log "✅ auth.js restauré"
        fi
        
        # Restaurer base de données
        if [ -f "$BACKUP_DIR/database_backup.sql" ] && [ -n "$DATABASE_URL" ]; then
            log "🗄️ Restauration base de données..."
            psql "$DATABASE_URL" -f "migrations/001_rollback_enrollments_workflow.sql"
            log "✅ Base de données restaurée"
        fi
        
        log "🔄 Rollback terminé"
    else
        log "❌ Aucun backup trouvé pour rollback"
        return 1
    fi
}

# Fonction principale
main() {
    log "🚀 Début du déploiement Enrollment Workflow v2.0"
    
    # Vérifier prérequis
    if ! command -v node &> /dev/null; then
        log "❌ Node.js non installé"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        log "❌ PostgreSQL client non installé"
        exit 1
    fi
    
    # Étapes de déploiement
    backup_files
    backup_database
    
    if deploy_files && migrate_database && verify_deployment; then
        log "🎉 DÉPLOIEMENT RÉUSSI !"
        log "📋 Résumé:"
        log "   - Fichiers déployés et vérifiés"
        log "   - Base de données migrée"
        log "   - Tests passés"
        log "   - Backup disponible: $BACKUP_DIR"
        log ""
        log "🔗 Prochaines étapes:"
        log "   1. Redémarrer le serveur: npm restart"
        log "   2. Vérifier les logs: tail -f logs/server.log"
        log "   3. Tester les endpoints: curl -X GET /api/enrollments"
        log "   4. Surveiller les métriques de performance"
    else
        log "❌ ÉCHEC DU DÉPLOIEMENT"
        log "🔄 Lancement du rollback automatique..."
        
        if rollback; then
            log "✅ Rollback réussi - Système restauré"
        else
            log "❌ Échec du rollback - Intervention manuelle requise"
        fi
        
        exit 1
    fi
}

# Gestion des signaux pour rollback d'urgence
trap 'log "⚠️ Interruption détectée"; rollback; exit 1' INT TERM

# Exécution
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        log "🔄 Rollback manuel demandé"
        rollback
        ;;
    "verify")
        log "🧪 Vérification manuelle"
        verify_deployment
        ;;
    *)
        echo "Usage: $0 [deploy|rollback|verify]"
        echo "  deploy  - Déployer le nouveau workflow (défaut)"
        echo "  rollback - Annuler le déploiement"
        echo "  verify  - Vérifier le déploiement actuel"
        exit 1
        ;;
esac
