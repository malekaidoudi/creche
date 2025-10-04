const { query } = require('../config/database');

async function addProfilePictureColumn() {
  try {
    console.log('🔍 Vérification de la colonne profile_picture...');
    
    // Vérifier si la colonne existe déjà
    const columns = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'profile_picture'
    `);
    
    if (columns.length > 0) {
      console.log('✅ La colonne profile_picture existe déjà');
      return;
    }
    
    console.log('➕ Ajout de la colonne profile_picture...');
    
    // Ajouter la colonne profile_picture
    await query(`
      ALTER TABLE users 
      ADD COLUMN profile_picture VARCHAR(255) NULL 
      AFTER phone
    `);
    
    console.log('✅ Colonne profile_picture ajoutée avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la colonne:', error);
    throw error;
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  addProfilePictureColumn()
    .then(() => {
      console.log('🎉 Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur:', error);
      process.exit(1);
    });
}

module.exports = { addProfilePictureColumn };
