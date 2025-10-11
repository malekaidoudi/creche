const { query } = require('../config/database');

const resetDatabase = async () => {
  try {
    console.log('🔄 Réinitialisation complète de la base de données...');

    // Désactiver les contraintes de clés étrangères temporairement
    await query('SET FOREIGN_KEY_CHECKS = 0');

    // Supprimer toutes les tables dans l'ordre inverse des dépendances
    const tables = [
      'enrollment_documents',
      'attendance', 
      'logs',
      'uploads',
      'enrollments',
      'children',
      'users',
      'settings',
      'documents',
      'articles',
      'contacts'
    ];

    console.log('🗑️ Suppression des tables existantes...');
    for (const table of tables) {
      try {
        await query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`   ✅ Table ${table} supprimée`);
      } catch (error) {
        console.log(`   ⚠️ Table ${table} n'existait pas`);
      }
    }

    // Réactiver les contraintes de clés étrangères
    await query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Toutes les tables supprimées');
    console.log('🔄 Maintenant, exécutez: npm run db:init && npm run seed');

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation :', error);
    throw error;
  }
};

// Exécuter le script si appelé directement
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('✅ Réinitialisation terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale :', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };
