require('dotenv').config();
const db = require('../config/db_postgres');

async function fixAbsenceRequestsTable() {
  try {
    console.log('🔧 Vérification de la table absence_requests...');
    
    // Vérifier la structure actuelle
    const checkColumn = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'absence_requests'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colonnes actuelles:');
    checkColumn.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Vérifier si acknowledged_at existe
    const hasAcknowledgedAt = checkColumn.rows.some(col => col.column_name === 'acknowledged_at');
    
    if (!hasAcknowledgedAt) {
      console.log('\n⚠️  Colonne "acknowledged_at" manquante');
      console.log('➕ Ajout de la colonne...');
      
      await db.query(`
        ALTER TABLE absence_requests 
        ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP
      `);
      
      console.log('✅ Colonne "acknowledged_at" ajoutée avec succès');
    } else {
      console.log('\n✅ Colonne "acknowledged_at" existe déjà');
    }
    
    // Vérifier à nouveau
    const finalCheck = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'absence_requests'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Structure finale:');
    finalCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✅ Table absence_requests corrigée avec succès');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixAbsenceRequestsTable();
