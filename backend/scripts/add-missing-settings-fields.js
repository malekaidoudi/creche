const { pool } = require('../config/database');

async function addMissingSettingsFields() {
  try {
    console.log('🔍 Ajout des champs manquants dans creche_settings...');
    
    // Liste des champs manquants à ajouter
    const missingFields = [
      {
        setting_key: 'nursery_name_ar',
        setting_value: 'ميما الغالية',
        setting_type: 'string',
        category: 'general',
        description: 'Nom de la crèche en arabe',
        is_public: 1
      },
      {
        setting_key: 'nursery_address_ar',
        setting_value: '123 شارع السلام، 1000 تونس، تونس',
        setting_type: 'string',
        category: 'contact',
        description: 'Adresse complète en arabe',
        is_public: 1
      },
      {
        setting_key: 'director_name_ar',
        setting_value: 'السيدة فاطمة بن علي',
        setting_type: 'string',
        category: 'general',
        description: 'Nom de la directrice en arabe',
        is_public: 1
      },
      {
        setting_key: 'staff_count',
        setting_value: '8',
        setting_type: 'number',
        category: 'statistics',
        description: 'Nombre d\'employés',
        is_public: 1
      },
      {
        setting_key: 'opening_year',
        setting_value: '2019',
        setting_type: 'number',
        category: 'statistics',
        description: 'Année d\'ouverture',
        is_public: 1
      },
      {
        setting_key: 'map_address',
        setting_value: '123 Rue de la Paix, 1000 Tunis, Tunisie',
        setting_type: 'string',
        category: 'contact',
        description: 'Adresse pour Google Maps',
        is_public: 1
      }
    ];

    // Vérifier quels champs existent déjà
    const [existingFields] = await pool.execute(
      'SELECT setting_key FROM creche_settings WHERE setting_key IN (?, ?, ?, ?, ?, ?)',
      ['nursery_name_ar', 'nursery_address_ar', 'director_name_ar', 'staff_count', 'opening_year', 'map_address']
    );
    
    const existingKeys = existingFields.map(row => row.setting_key);
    console.log('📋 Champs existants:', existingKeys);

    // Ajouter les champs manquants
    for (const field of missingFields) {
      if (existingKeys.includes(field.setting_key)) {
        console.log(`⚠️ ${field.setting_key} existe déjà, mise à jour...`);
        
        // Mettre à jour le champ existant
        await pool.execute(
          `UPDATE creche_settings 
           SET setting_value = ?, setting_type = ?, category = ?, description = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
           WHERE setting_key = ?`,
          [field.setting_value, field.setting_type, field.category, field.description, field.is_public, field.setting_key]
        );
        
        console.log(`✅ ${field.setting_key} mis à jour`);
      } else {
        console.log(`➕ Ajout de ${field.setting_key}...`);
        
        // Insérer le nouveau champ
        await pool.execute(
          `INSERT INTO creche_settings (setting_key, setting_value, setting_type, category, description, is_public)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [field.setting_key, field.setting_value, field.setting_type, field.category, field.description, field.is_public]
        );
        
        console.log(`✅ ${field.setting_key} ajouté`);
      }
    }

    // Vérifier le résultat final
    console.log('\n🔍 Vérification finale...');
    const [allFields] = await pool.execute(
      'SELECT setting_key, setting_value, setting_type FROM creche_settings ORDER BY category, setting_key'
    );
    
    console.log('📋 Tous les champs dans la base:');
    allFields.forEach(field => {
      console.log(`  - ${field.setting_key}: ${field.setting_value} (${field.setting_type})`);
    });
    
    console.log('\n✅ Mise à jour terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

addMissingSettingsFields();
