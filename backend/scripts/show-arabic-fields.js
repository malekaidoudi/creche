const { pool } = require('../config/database');

async function showArabicFields() {
  try {
    console.log('🔍 Recherche des champs arabes dans creche_settings...');
    
    // Rechercher spécifiquement les champs arabes
    const [arabicFields] = await pool.execute(`
      SELECT id, setting_key, setting_value, created_at, updated_at 
      FROM creche_settings 
      WHERE setting_key LIKE '%_ar' OR setting_key IN ('staff_count', 'opening_year', 'map_address')
      ORDER BY id
    `);
    
    console.log('📋 Champs arabes et manquants:');
    if (arabicFields.length === 0) {
      console.log('❌ Aucun champ trouvé!');
    } else {
      arabicFields.forEach(field => {
        console.log(`  ID ${field.id}: ${field.setting_key} = "${field.setting_value}"`);
      });
    }
    
    // Vérifier les IDs les plus élevés
    const [lastRecords] = await pool.execute(`
      SELECT id, setting_key, setting_value 
      FROM creche_settings 
      WHERE id > 25
      ORDER BY id
    `);
    
    console.log('\n📋 Enregistrements avec ID > 25:');
    if (lastRecords.length === 0) {
      console.log('❌ Aucun enregistrement avec ID > 25');
    } else {
      lastRecords.forEach(record => {
        console.log(`  ID ${record.id}: ${record.setting_key} = "${record.setting_value}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

showArabicFields();
