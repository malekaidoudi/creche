const { pool } = require('../config/db_postgres');

async function checkEventsStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Vérification structure table events...\n');
    
    // Structure de la table
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colonnes table events:');
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Exemple d'événement anniversaire avec jointure enfant
    console.log('\n🎂 Exemple événement anniversaire avec données enfant:');
    const eventResult = await client.query(`
      SELECT 
        e.id,
        e.title,
        e.type,
        e.start_date,
        e.child_id,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        c.birth_date as child_birth_date,
        c.gender as child_gender,
        c.photo_url as child_photo_url
      FROM events e
      LEFT JOIN children c ON e.child_id = c.id
      WHERE e.type = 'birthday'
      ORDER BY e.start_date
      LIMIT 3
    `);
    
    if (eventResult.rows.length > 0) {
      eventResult.rows.forEach(evt => {
        console.log(`\n   Event ID: ${evt.id}`);
        console.log(`   Title: ${evt.title}`);
        console.log(`   Date: ${evt.start_date}`);
        console.log(`   Child ID: ${evt.child_id}`);
        console.log(`   Child Name: ${evt.child_first_name} ${evt.child_last_name}`);
        console.log(`   Child Birth: ${evt.child_birth_date}`);
        console.log(`   Child Gender: ${evt.child_gender}`);
        console.log(`   Child Photo: ${evt.child_photo_url || 'null'}`);
      });
    } else {
      console.log('   Aucun anniversaire trouvé');
    }
    
    // Vérifier ce que retourne l'API
    console.log('\n📊 Simulation requête API /api/events?type=birthday:');
    const apiResult = await client.query(`
      SELECT 
        e.*,
        c.first_name || ' ' || c.last_name as child_name,
        c.birth_date as child_birth_date,
        c.gender as child_gender,
        c.photo_url as child_photo_url
      FROM events e
      LEFT JOIN children c ON e.child_id = c.id
      WHERE e.type = 'birthday'
      ORDER BY e.start_date
      LIMIT 3
    `);
    
    console.log('\n   Champs retournés:');
    if (apiResult.rows.length > 0) {
      console.log('   ' + Object.keys(apiResult.rows[0]).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkEventsStructure();
