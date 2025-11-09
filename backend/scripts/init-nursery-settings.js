#!/usr/bin/env node

/**
 * Script pour initialiser les paramètres de la crèche
 */

require('dotenv').config();
const db = require('../config/db_postgres');

async function initSettings() {
  try {
    console.log('🔄 Initialisation des paramètres de la crèche...\n');
    
    const defaultSettings = [
      { key: 'saturday_open', value: 'false', category: 'schedule' },
      { key: 'sunday_open', value: 'false', category: 'schedule' },
      { key: 'opening_time', value: '08:00', category: 'schedule' },
      { key: 'closing_time', value: '18:00', category: 'schedule' }
    ];
    
    for (const setting of defaultSettings) {
      // Vérifier si le paramètre existe
      const existing = await db.query(
        'SELECT id FROM nursery_settings WHERE setting_key = $1',
        [setting.key]
      );
      
      if (existing.rows.length === 0) {
        // Créer le paramètre
        await db.query(
          `INSERT INTO nursery_settings (setting_key, value_fr, category, is_active)
           VALUES ($1, $2, $3, true)`,
          [setting.key, setting.value, setting.category]
        );
        console.log(`✅ Créé: ${setting.key} = ${setting.value}`);
      } else {
        console.log(`⏭️  Existe déjà: ${setting.key}`);
      }
    }
    
    console.log('\n✅ Initialisation terminée\n');
    
    // Afficher tous les paramètres
    const allSettings = await db.query(
      'SELECT setting_key, value_fr, category, is_active FROM nursery_settings ORDER BY category, setting_key'
    );
    
    console.log('📋 Paramètres actuels:');
    allSettings.rows.forEach(s => {
      const status = s.is_active ? '✓' : '✗';
      console.log(`  [${status}] ${s.setting_key.padEnd(20)} = ${s.value_fr} (${s.category})`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

initSettings();
