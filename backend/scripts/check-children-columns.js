const { pool } = require('../config/db_postgres');

async function checkChildrenColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Vérification structure table children...\n');
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'children'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colonnes de la table children:');
    result.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Vérifier s'il y a des enfants avec parent
    const childrenResult = await client.query(`
      SELECT * FROM children LIMIT 1
    `);
    
    if (childrenResult.rows.length > 0) {
      console.log('\n📝 Exemple d\'enregistrement:');
      console.log(childrenResult.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkChildrenColumns();
