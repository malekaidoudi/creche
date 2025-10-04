const { pool } = require('../config/database');

async function initializeSettings() {
  try {
    console.log('🔄 Initialisation des paramètres...');
    
    // 1. Créer la table si elle n'existe pas
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS creche_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        setting_type ENUM('string', 'number', 'boolean', 'json', 'image') DEFAULT 'string',
        category VARCHAR(50) NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Table creche_settings créée ou existe déjà');
    
    // 2. Vérifier si des données existent déjà
    const [existing] = await pool.execute('SELECT COUNT(*) as count FROM creche_settings');
    
    if (existing[0].count > 0) {
      console.log(`📊 ${existing[0].count} paramètres trouvés, pas d'insertion nécessaire`);
      return;
    }
    
    // 3. Insérer les paramètres par défaut
    const defaultSettings = [
      // Informations générales
      ['nursery_name', 'Mima Elghalia', 'string', 'general', 'Nom de la crèche', true],
      ['nursery_logo', '/images/logo.png', 'image', 'general', 'Logo de la crèche', true],
      ['director_name', 'Mme Fatima Ben Ali', 'string', 'general', 'Nom de la directrice', true],
      
      // Contact
      ['nursery_address', '123 Rue de la Paix, 1000 Tunis, Tunisie', 'string', 'contact', 'Adresse complète', true],
      ['nursery_phone', '+216 71 123 456', 'string', 'contact', 'Numéro de téléphone principal', true],
      ['nursery_email', 'contact@mimaelghalia.tn', 'string', 'contact', 'Email de contact', true],
      ['nursery_website', 'https://mimaelghalia.tn', 'string', 'contact', 'Site web', true],
      
      // Capacité
      ['total_capacity', '30', 'number', 'capacity', 'Nombre total de places', true],
      ['available_spots', '5', 'number', 'capacity', 'Places disponibles actuellement', true],
      ['min_age_months', '3', 'number', 'capacity', 'Âge minimum en mois', true],
      ['max_age_months', '48', 'number', 'capacity', 'Âge maximum en mois', true],
      
      // Messages
      ['welcome_message_fr', 'Bienvenue à la crèche Mima Elghalia, un lieu d\'épanouissement pour vos enfants dans un environnement sécurisé et bienveillant.', 'string', 'content', 'Message d\'accueil en français', true],
      ['welcome_message_ar', 'مرحباً بكم في حضانة ميما الغالية، مكان لنمو أطفالكم في بيئة آمنة ومحبة.', 'string', 'content', 'Message d\'accueil en arabe', true],
      
      // Thème
      ['site_theme', 'light', 'string', 'appearance', 'Thème du site (light/dark/auto)', true],
      ['primary_color', '#3B82F6', 'string', 'appearance', 'Couleur primaire', true],
      ['secondary_color', '#8B5CF6', 'string', 'appearance', 'Couleur secondaire', true],
      ['accent_color', '#F59E0B', 'string', 'appearance', 'Couleur d\'accent', true],
      
      // Horaires
      ['opening_hours', '{"monday": {"open": "07:00", "close": "18:00"}, "tuesday": {"open": "07:00", "close": "18:00"}, "wednesday": {"open": "07:00", "close": "18:00"}, "thursday": {"open": "07:00", "close": "18:00"}, "friday": {"open": "07:00", "close": "18:00"}, "saturday": {"open": "08:00", "close": "16:00"}, "sunday": {"open": null, "close": null}}', 'json', 'schedule', 'Horaires d\'ouverture par jour', true],
      
      // Système
      ['enrollment_enabled', 'true', 'boolean', 'system', 'Inscription en ligne activée', false],
      ['maintenance_mode', 'false', 'boolean', 'system', 'Mode maintenance', false]
    ];
    
    console.log('📝 Insertion des paramètres par défaut...');
    
    for (const setting of defaultSettings) {
      try {
        await pool.execute(
          'INSERT INTO creche_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES (?, ?, ?, ?, ?, ?)',
          setting
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error(`❌ Erreur lors de l'insertion de ${setting[0]}:`, error.message);
        }
      }
    }
    
    // 4. Vérifier le résultat
    const [final] = await pool.execute('SELECT COUNT(*) as count FROM creche_settings');
    console.log(`✅ ${final[0].count} paramètres configurés avec succès !`);
    
    // 5. Afficher quelques paramètres importants
    const [important] = await pool.execute(`
      SELECT setting_key, setting_value 
      FROM creche_settings 
      WHERE setting_key IN ('nursery_name', 'nursery_email', 'total_capacity', 'site_theme')
    `);
    
    console.log('\n🔧 Paramètres principaux :');
    important.forEach(setting => {
      console.log(`   ${setting.setting_key}: ${setting.setting_value}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation :', error.message);
    throw error;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  initializeSettings()
    .then(() => {
      console.log('🎉 Initialisation terminée !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de l\'initialisation :', error.message);
      process.exit(1);
    });
}

module.exports = { initializeSettings };
