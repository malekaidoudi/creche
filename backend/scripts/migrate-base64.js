const { pool } = require('../config/database');

// Script pour migrer la base de données pour supporter les images Base64
async function migrateForBase64() {
  console.log('🔄 Migration pour support Base64...');
  
  try {
    // Modifier la colonne setting_value pour MEDIUMTEXT
    await pool.execute(`
      ALTER TABLE creche_settings 
      MODIFY COLUMN setting_value MEDIUMTEXT
    `);
    console.log('✅ Colonne setting_value mise à jour vers MEDIUMTEXT');

    // Ajouter un index sur setting_type si il n'existe pas
    try {
      await pool.execute(`
        ALTER TABLE creche_settings 
        ADD INDEX idx_setting_type (setting_type)
      `);
      console.log('✅ Index idx_setting_type ajouté');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index idx_setting_type existe déjà');
      } else {
        throw error;
      }
    }

    // Vérifier la structure
    const [rows] = await pool.execute('DESCRIBE creche_settings');
    console.log('📋 Structure de la table mise à jour:');
    rows.forEach(row => {
      if (row.Field === 'setting_value') {
        console.log(`   ${row.Field}: ${row.Type} (${row.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
      }
    });

    console.log('🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  migrateForBase64()
    .then(() => {
      console.log('✅ Migration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Échec de la migration:', error);
      process.exit(1);
    });
}

module.exports = { migrateForBase64 };
