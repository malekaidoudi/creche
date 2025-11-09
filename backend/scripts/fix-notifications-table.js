require('dotenv').config();
const db = require('../config/db_postgres');

async function fixNotificationsTable() {
  try {
    console.log('🔧 Vérification de la table notifications...');
    
    // Vérifier la structure actuelle
    const checkColumn = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colonnes actuelles:');
    checkColumn.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Vérifier si related_id existe
    const hasRelatedId = checkColumn.rows.some(col => col.column_name === 'related_id');
    
    if (!hasRelatedId) {
      console.log('\n⚠️  Colonne "related_id" manquante');
      console.log('➕ Ajout de la colonne...');
      
      await db.query(`
        ALTER TABLE notifications 
        ADD COLUMN IF NOT EXISTS related_id INTEGER
      `);
      
      console.log('✅ Colonne "related_id" ajoutée avec succès');
    } else {
      console.log('\n✅ Colonne "related_id" existe déjà');
    }
    
    // Vérifier à nouveau
    const finalCheck = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Structure finale:');
    finalCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✅ Table notifications corrigée avec succès');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixNotificationsTable();
