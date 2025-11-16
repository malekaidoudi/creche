const { pool } = require('../config/db_postgres');

async function addCurrentMonthBirthdays() {
  const client = await pool.connect();
  
  try {
    console.log('🎂 Ajout d\'anniversaires pour novembre 2025...\n');
    
    // Récupérer les enfants
    const childrenResult = await client.query('SELECT id, first_name, last_name, birth_date FROM children LIMIT 5');
    
    if (childrenResult.rows.length === 0) {
      console.log('❌ Aucun enfant trouvé');
      return;
    }
    
    console.log(`👶 ${childrenResult.rows.length} enfants trouvés\n`);
    
    // Créer des anniversaires pour novembre 2025
    const novemberDates = [15, 20, 25];
    
    for (let i = 0; i < Math.min(3, childrenResult.rows.length); i++) {
      const child = childrenResult.rows[i];
      const birthdayDate = `2025-11-${novemberDates[i]}`;
      
      // Vérifier si l'événement existe déjà
      const existingResult = await client.query(
        'SELECT id FROM events WHERE child_id = $1 AND type = $2 AND start_date::date = $3::date',
        [child.id, 'birthday', birthdayDate]
      );
      
      if (existingResult.rows.length > 0) {
        console.log(`⏭️  Anniversaire existe déjà pour ${child.first_name} le ${birthdayDate}`);
        continue;
      }
      
      // Créer l'événement anniversaire
      const result = await client.query(`
        INSERT INTO events (
          title, description, start_date, end_date, type, 
          all_day, child_id, created_by, priority
        )
        VALUES ($1, $2, $3, $3, 'birthday', true, $4, 1, 'medium')
        RETURNING id, title, start_date
      `, [
        `🎂 Anniversaire de ${child.first_name}`,
        `Joyeux anniversaire à ${child.first_name} ${child.last_name} !`,
        birthdayDate,
        child.id
      ]);
      
      console.log(`✅ Créé: ${result.rows[0].title} - ${birthdayDate}`);
    }
    
    console.log('\n📊 Résumé des anniversaires novembre 2025:');
    const summaryResult = await client.query(`
      SELECT e.id, e.title, e.start_date, c.first_name, c.last_name
      FROM events e
      LEFT JOIN children c ON e.child_id = c.id
      WHERE e.type = 'birthday'
        AND e.start_date >= '2025-11-01'
        AND e.start_date < '2025-12-01'
      ORDER BY e.start_date
    `);
    
    summaryResult.rows.forEach(row => {
      console.log(`   ${row.start_date.toISOString().split('T')[0]} - ${row.first_name} ${row.last_name}`);
    });
    
    console.log('\n✅ Anniversaires ajoutés !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addCurrentMonthBirthdays();
