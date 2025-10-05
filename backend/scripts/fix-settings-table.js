const { pool } = require('../config/database');

async function fixSettingsTable() {
  try {
    console.log('🔍 Vérification de la structure de la table creche_settings...');
    
    // Vérifier la structure actuelle
    const [columns] = await pool.execute('DESCRIBE creche_settings');
    console.log('📋 Structure actuelle:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default}`);
    });
    
    // Modifier la colonne setting_value pour accepter plus de données
    console.log('\n🔧 Modification de la colonne setting_value...');
    await pool.execute('ALTER TABLE creche_settings MODIFY setting_value TEXT');
    
    console.log('✅ Table modifiée avec succès!');
    
    // Vérifier la nouvelle structure
    const [newColumns] = await pool.execute('DESCRIBE creche_settings');
    const settingValueCol = newColumns.find(col => col.Field === 'setting_value');
    console.log(`📋 Nouvelle structure setting_value: ${settingValueCol.Type}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

fixSettingsTable();
