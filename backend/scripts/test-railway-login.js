const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function testRailwayLogin() {
  try {
    console.log('🧪 Test de connexion Railway...');
    
    // Configuration Railway
    const config = {
      host: process.env.MYSQLHOST || process.env.DB_HOST,
      port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
      user: process.env.MYSQLUSER || process.env.DB_USER,
      password: process.env.MYSQLPASSWORD || process.env.DB_PASS,
      database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway'
    };
    
    if (!config.host || !config.user || !config.password) {
      throw new Error('Variables d\'environnement Railway manquantes');
    }
    
    const connection = await mysql.createConnection(config);
    console.log('✅ Connexion Railway réussie');
    
    // Test des comptes
    const testAccounts = [
      { email: 'admin@creche.test', password: 'Password123!', role: 'admin' },
      { email: 'staff@creche.test', password: 'Password123!', role: 'staff' },
      { email: 'parent@creche.test', password: 'Password123!', role: 'parent' }
    ];
    
    console.log('\n🔐 Test des comptes de connexion:');
    
    for (const account of testAccounts) {
      try {
        // Récupérer l'utilisateur
        const [users] = await connection.execute(
          'SELECT id, email, password, role FROM users WHERE email = ? AND is_active = TRUE',
          [account.email]
        );
        
        if (users.length === 0) {
          console.log(`   ❌ ${account.email} - Utilisateur non trouvé`);
          continue;
        }
        
        const user = users[0];
        
        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(account.password, user.password);
        
        if (isValidPassword) {
          console.log(`   ✅ ${account.email} (${user.role}) - Connexion OK`);
        } else {
          console.log(`   ❌ ${account.email} - Mot de passe incorrect`);
        }
        
      } catch (error) {
        console.log(`   ❌ ${account.email} - Erreur: ${error.message}`);
      }
    }
    
    // Statistiques
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
    const [childCount] = await connection.execute('SELECT COUNT(*) as count FROM children WHERE is_active = TRUE');
    
    console.log('\n📊 Statistiques Railway:');
    console.log(`   👥 Utilisateurs actifs: ${userCount[0].count}`);
    console.log(`   👶 Enfants actifs: ${childCount[0].count}`);
    
    await connection.end();
    console.log('\n🎉 Test terminé avec succès !');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur test Railway:', error.message);
    return false;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  testRailwayLogin().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testRailwayLogin;
