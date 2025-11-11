const { pool } = require('../config/db_postgres');

async function checkAnnouncementsData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Vérification des annonces...\n');
    
    // Toutes les annonces
    const allResult = await client.query(`
      SELECT id, title, event_type, event_date, is_published
      FROM announcements
      ORDER BY event_date
    `);
    
    console.log('📋 Toutes les annonces:');
    allResult.rows.forEach(ann => {
      console.log(`   [${ann.event_type}] ${ann.title} - ${ann.event_date.toISOString().split('T')[0]} ${ann.is_published ? '✅' : '❌'}`);
    });
    
    // Compter par type
    const countResult = await client.query(`
      SELECT event_type, COUNT(*) as count
      FROM announcements
      WHERE is_published = true
      GROUP BY event_type
      ORDER BY event_type
    `);
    
    console.log('\n📊 Comptage par type (publiées):');
    countResult.rows.forEach(row => {
      console.log(`   ${row.event_type}: ${row.count}`);
    });
    
    // Vérifier les événements (events table)
    const eventsResult = await client.query(`
      SELECT id, title, type, start_date
      FROM events
      WHERE type = 'birthday'
      ORDER BY start_date
      LIMIT 10
    `);
    
    console.log('\n🎂 Événements anniversaires (events table):');
    if (eventsResult.rows.length > 0) {
      eventsResult.rows.forEach(evt => {
        console.log(`   [${evt.type}] ${evt.title} - ${evt.start_date}`);
      });
    } else {
      console.log('   Aucun anniversaire trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAnnouncementsData();
