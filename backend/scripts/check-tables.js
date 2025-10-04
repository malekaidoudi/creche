const { query } = require('../config/database');

async function checkTables() {
  try {
    console.log('🔍 Vérification des tables...');
    
    // Lister toutes les tables
    const tables = await query('SHOW TABLES');
    console.log('📋 Tables existantes:', tables.map(t => Object.values(t)[0]));
    
    // Vérifier si les tables principales existent
    const requiredTables = ['users', 'articles', 'news', 'children', 'enrollments'];
    
    for (const table of requiredTables) {
      const exists = tables.some(t => Object.values(t)[0] === table);
      if (exists) {
        console.log(`✅ Table ${table} existe`);
        
        // Compter les enregistrements
        const count = await query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   📊 ${count[0].count} enregistrements`);
      } else {
        console.log(`❌ Table ${table} manquante`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
  
  process.exit(0);
}

checkTables();
