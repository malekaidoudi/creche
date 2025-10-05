const { pool } = require('../config/database');

async function checkSettingsTable() {
  try {
    console.log('🔍 Vérification du contenu de creche_settings...');
    
    // Vérifier tous les champs
    const [allSettings] = await pool.execute(
      'SELECT setting_key, setting_value FROM creche_settings ORDER BY setting_key'
    );
    
    console.log('📋 Contenu actuel de la table:');
    allSettings.forEach(setting => {
      console.log(`  - ${setting.setting_key}: ${setting.setting_value}`);
    });
    
    // Vérifier spécifiquement les champs arabes
    const [arabicFields] = await pool.execute(
      'SELECT setting_key, setting_value FROM creche_settings WHERE setting_key IN (?, ?, ?)',
      ['nursery_name_ar', 'nursery_address_ar', 'director_name_ar']
    );
    
    console.log('\n🔍 Champs arabes:');
    if (arabicFields.length === 0) {
      console.log('❌ Aucun champ arabe trouvé!');
    } else {
      arabicFields.forEach(field => {
        console.log(`  ✅ ${field.setting_key}: ${field.setting_value}`);
      });
    }
    
    console.log(`\n📊 Total: ${allSettings.length} paramètres dans la table`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkSettingsTable();
