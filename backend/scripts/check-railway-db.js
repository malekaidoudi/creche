const mysql = require('mysql2/promise');

async function checkRailwayDB() {
  try {
    console.log('🔍 Vérification de la base de données Railway...');
    
    // Configuration Railway
    const config = {
      host: process.env.MYSQLHOST || process.env.DB_HOST,
      port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
      user: process.env.MYSQLUSER || process.env.DB_USER,
      password: process.env.MYSQLPASSWORD || process.env.DB_PASS,
      database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway'
    };
    
    console.log('📋 Configuration détectée:');
    console.log(`   Host: ${config.host || 'NON DÉFINI'}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   User: ${config.user || 'NON DÉFINI'}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   Password: ${config.password ? '***DÉFINI***' : 'NON DÉFINI'}`);
    
    if (!config.host || !config.user || !config.password) {
      throw new Error('Variables d\'environnement Railway manquantes');
    }
    
    // Test de connexion
    const connection = await mysql.createConnection(config);
    console.log('✅ Connexion Railway réussie');
    
    // Vérifier les tables existantes
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📊 Tables trouvées: ${tables.length}`);
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    
    // Vérifier les utilisateurs
    try {
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`👥 Utilisateurs dans la DB: ${users[0].count}`);
      
      if (users[0].count > 0) {
        const [userList] = await connection.execute('SELECT email, role FROM users LIMIT 5');
        console.log('📝 Utilisateurs existants:');
        userList.forEach(user => {
          console.log(`   - ${user.email} (${user.role})`);
        });
      }
    } catch (error) {
      console.log('⚠️  Table users non trouvée ou vide');
    }
    
    await connection.end();
    console.log('🎉 Vérification terminée avec succès');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur de vérification Railway:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    // Suggestions de dépannage
    console.log('\n🔧 Suggestions de dépannage:');
    console.log('1. Vérifier que le service MySQL Railway est démarré');
    console.log('2. Vérifier les variables d\'environnement Railway:');
    console.log('   - MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE');
    console.log('3. Vérifier la connectivité réseau');
    
    return false;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  checkRailwayDB().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = checkRailwayDB;
