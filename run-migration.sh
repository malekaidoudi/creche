#!/bin/bash

# Script pour exécuter la migration de correction du type d'événement
# Date: 2025-11-16

echo "🔧 Migration: Correction contrainte type événements"
echo "=================================================="
echo ""

# Lire l'URL depuis le fichier .env
if [ -f backend/.env ]; then
    DB_URL=$(grep "^DATABASE_URL=" backend/.env | cut -d '=' -f 2-)
    echo "📋 URL trouvée dans .env"
else
    echo "❌ Fichier .env non trouvé"
    exit 1
fi

echo "📋 Exécution de la migration..."
psql "$DB_URL" -f backend/database/migrations/fix_events_type_constraint.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration exécutée avec succès !"
    echo ""
    echo "🎯 Prochaines étapes:"
    echo "  1. Redémarrer le serveur backend"
    echo "  2. Tester la création d'événement"
    echo "  3. Vérifier les logs dans la console"
else
    echo ""
    echo "❌ Erreur lors de l'exécution de la migration"
    echo "Vérifiez les logs ci-dessus pour plus de détails"
fi
