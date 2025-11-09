#!/usr/bin/env node

/**
 * Script de migration pour créer la table absence_requests
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../config/db_postgres');

async function runMigration() {
  try {
    console.log('🔄 Démarrage migration absence_requests...\n');
    
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, '../database/migrations/create_absence_requests.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Fichier SQL chargé:', sqlPath);
    console.log('📝 Contenu:\n', sql.substring(0, 200) + '...\n');
    
    // Exécuter la migration
    console.log('⚙️  Exécution de la migration...');
    await db.query(sql);
    
    console.log('✅ Migration réussie !');
    console.log('✅ Table absence_requests créée avec succès\n');
    
    // Vérifier la table
    const checkResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'absence_requests'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Structure de la table absence_requests:');
    checkResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n🎉 Migration terminée avec succès !');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

runMigration();
