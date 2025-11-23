#!/bin/bash

# Script pour nettoyer les console.log de debug dans le frontend
# Garde les console.error importants pour le debugging en production

echo "🧹 Nettoyage des console.log de debug..."

# Répertoire frontend
FRONTEND_DIR="/Volumes/Works/Windsurf/creche-site/frontend/src"

# Compteur
TOTAL_REMOVED=0

# Fonction pour nettoyer un fichier
clean_file() {
    local file="$1"
    local count=0
    
    # Patterns à supprimer (logs de debug)
    # Garde: console.error pour les vraies erreurs
    
    # Supprimer les console.log avec emojis de debug
    count=$(grep -c "console\.log('🌐" "$file" 2>/dev/null || echo 0)
    sed -i '' "/console\.log('🌐/d" "$file" 2>/dev/null
    
    count=$((count + $(grep -c "console\.log('✅" "$file" 2>/dev/null || echo 0)))
    sed -i '' "/console\.log('✅/d" "$file" 2>/dev/null
    
    count=$((count + $(grep -c "console\.log('❌" "$file" 2>/dev/null || echo 0)))
    sed -i '' "/console\.log('❌/d" "$file" 2>/dev/null
    
    count=$((count + $(grep -c "console\.log('📋" "$file" 2>/dev/null || echo 0)))
    sed -i '' "/console\.log('📋/d" "$file" 2>/dev/null
    
    count=$((count + $(grep -c "console\.log('🏢" "$file" 2>/dev/null || echo 0)))
    sed -i '' "/console\.log('🏢/d" "$file" 2>/dev/null
    
    # Supprimer les console.log de debug génériques
    count=$((count + $(grep -c "console\.log('DEBUG" "$file" 2>/dev/null || echo 0)))
    sed -i '' "/console\.log('DEBUG/d" "$file" 2>/dev/null
    
    count=$((count + $(grep -c "console\.log(\"DEBUG" "$file" 2>/dev/null || echo 0)))
    sed -i '' "/console\.log(\"DEBUG/d" "$file" 2>/dev/null
    
    # Supprimer les console.log avec des messages de test
    count=$((count + $(grep -c "console\.log('Test" "$file" 2>/dev/null || echo 0)))
    sed -i '' "/console\.log('Test/d" "$file" 2>/dev/null
    
    if [ $count -gt 0 ]; then
        echo "  ✓ $file: $count logs supprimés"
        TOTAL_REMOVED=$((TOTAL_REMOVED + count))
    fi
}

# Trouver tous les fichiers .js et .jsx
echo ""
echo "Recherche des fichiers à nettoyer..."
echo ""

find "$FRONTEND_DIR" -type f \( -name "*.js" -o -name "*.jsx" \) | while read -r file; do
    clean_file "$file"
done

echo ""
echo "✅ Nettoyage terminé!"
echo "📊 Total de logs de debug supprimés: $TOTAL_REMOVED"
echo ""
echo "⚠️  Note: Les console.error ont été conservés pour le debugging en production"
echo ""
