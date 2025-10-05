#!/usr/bin/env node

/**
 * Script pour mettre à jour l'URL Railway dans la configuration API
 * 
 * Usage: node update-railway-url.js https://your-app.railway.app
 */

const fs = require('fs');
const path = require('path');

const railwayUrl = process.argv[2];

if (!railwayUrl) {
  console.error('❌ Erreur: URL Railway requise');
  console.log('Usage: node update-railway-url.js https://your-app.railway.app');
  process.exit(1);
}

// Valider l'URL
try {
  new URL(railwayUrl);
} catch (error) {
  console.error('❌ URL invalide:', railwayUrl);
  process.exit(1);
}

const apiConfigPath = path.join(__dirname, 'frontend/src/config/api.js');

// Lire le fichier de configuration
let configContent = fs.readFileSync(apiConfigPath, 'utf8');

// Remplacer l'URL placeholder par l'URL réelle
const oldUrl = 'https://your-app-name.railway.app';
const newContent = configContent.replace(oldUrl, railwayUrl);

if (configContent === newContent) {
  console.log('⚠️  URL déjà configurée ou placeholder non trouvé');
} else {
  // Écrire le fichier mis à jour
  fs.writeFileSync(apiConfigPath, newContent, 'utf8');
  console.log('✅ URL Railway mise à jour:');
  console.log(`   Ancienne: ${oldUrl}`);
  console.log(`   Nouvelle: ${railwayUrl}`);
  console.log('');
  console.log('🚀 Vous pouvez maintenant rebuilder et redéployer le frontend');
}
