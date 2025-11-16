const { pool } = require('../config/db_postgres');

async function addTestAnnouncements() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Ajout des annonces de test...\n');
    
    const announcements = [
      {
        title: 'Information importante',
        description: 'Nous vous informons que la crèche sera fermée le 25 décembre pour les fêtes de fin d\'année.',
        event_date: '2025-12-25',
        event_type: 'general'
      },
      {
        title: 'URGENT: Fermeture exceptionnelle',
        description: 'En raison de travaux urgents, la crèche sera fermée demain 12 novembre. Merci de votre compréhension.',
        event_date: '2025-11-12',
        event_type: 'urgent'
      },
      {
        title: 'Réunion parents',
        description: 'Réunion de rentrée pour tous les parents le 15 novembre à 18h. Présence obligatoire.',
        event_date: '2025-11-15',
        event_type: 'meeting'
      },
      {
        title: 'Réunion trimestrielle',
        description: 'Réunion trimestrielle pour faire le point sur l\'évolution des enfants. Le 20 décembre à 17h30.',
        event_date: '2025-12-20',
        event_type: 'meeting'
      },
      {
        title: 'Fête de Noël',
        description: 'Grande fête de Noël à la crèche ! Spectacle, goûter et distribution de cadeaux. Le 22 décembre à 15h.',
        event_date: '2025-12-22',
        event_type: 'event'
      },
      {
        title: 'Sortie au parc',
        description: 'Sortie pédagogique au parc municipal pour les enfants de 3-4 ans. Prévoir casquette et eau. Le 18 novembre.',
        event_date: '2025-11-18',
        event_type: 'event'
      },
      {
        title: 'Anniversaire collectif',
        description: 'Célébration des anniversaires du mois de novembre. Gâteau et jeux au programme ! Le 30 novembre.',
        event_date: '2025-11-30',
        event_type: 'celebration'
      }
    ];
    
    for (const ann of announcements) {
      const result = await client.query(`
        INSERT INTO announcements (title, description, event_date, event_type, target_audience, created_by, is_published)
        VALUES ($1, $2, $3, $4, 'all', 1, true)
        RETURNING id, title, event_type, event_date
      `, [ann.title, ann.description, ann.event_date, ann.event_type]);
      
      console.log(`✅ Créé: [${result.rows[0].event_type}] ${result.rows[0].title} - ${result.rows[0].event_date}`);
    }
    
    console.log('\n📊 Résumé des annonces:');
    const summary = await client.query(`
      SELECT event_type, COUNT(*) as count
      FROM announcements
      WHERE is_published = true
      GROUP BY event_type
      ORDER BY event_type
    `);
    
    summary.rows.forEach(row => {
      console.log(`   ${row.event_type}: ${row.count} annonce(s)`);
    });
    
    console.log('\n✅ Annonces de test ajoutées avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addTestAnnouncements();
