const { query } = require('../config/database');

async function testPagination() {
  try {
    console.log('🧪 Test de pagination...');
    
    // Test 1: Pagination des utilisateurs
    console.log('\n📋 Test pagination utilisateurs:');
    const users = await query(
      'SELECT * FROM users WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 10 OFFSET 0',
      []
    );
    console.log(`✅ Utilisateurs récupérés: ${users.length}`);
    
    // Test 2: Pagination des enfants
    console.log('\n👶 Test pagination enfants:');
    const children = await query(
      'SELECT * FROM children WHERE is_active = TRUE ORDER BY first_name, last_name LIMIT 10 OFFSET 0',
      []
    );
    console.log(`✅ Enfants récupérés: ${children.length}`);
    
    // Test 3: Pagination des inscriptions
    console.log('\n📝 Test pagination inscriptions:');
    const enrollments = await query(
      'SELECT * FROM enrollments ORDER BY created_at DESC LIMIT 10 OFFSET 0',
      []
    );
    console.log(`✅ Inscriptions récupérées: ${enrollments.length}`);
    
    // Test 4: Pagination des présences
    console.log('\n📅 Test pagination présences:');
    const attendance = await query(
      'SELECT * FROM attendance ORDER BY check_in_time DESC LIMIT 10 OFFSET 0',
      []
    );
    console.log(`✅ Présences récupérées: ${attendance.length}`);
    
    console.log('\n🎉 Tous les tests de pagination ont réussi !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test de pagination:', error);
    throw error;
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  testPagination()
    .then(() => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur:', error);
      process.exit(1);
    });
}

module.exports = { testPagination };
