/**
 * Script pour générer les événements d'anniversaire
 * Usage: node scripts/generateBirthdays.js
 */

require('dotenv').config();
const { generateBirthdayEvents } = require('../services/birthdayService');

async function main() {
  try {
    console.log('🎂 Démarrage de la génération des anniversaires...\n');
    
    await generateBirthdayEvents();
    
    console.log('\n✅ Génération terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    process.exit(1);
  }
}

main();
