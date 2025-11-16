const { pool } = require('../config/db_postgres');

async function updateAnnouncementTypes() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Mise à jour des types d\'annonces...\n');
    
    // Supprimer l'ancienne contrainte
    await client.query(`
      ALTER TABLE announcements 
      DROP CONSTRAINT IF EXISTS announcements_event_type_check
    `);
    console.log('✅ Ancienne contrainte supprimée');
    
    // Ajouter la nouvelle contrainte avec plus de types
    await client.query(`
      ALTER TABLE announcements 
      ADD CONSTRAINT announcements_event_type_check 
      CHECK (event_type IN ('general', 'urgent', 'meeting', 'event', 'celebration', 'reunion', 'fete', 'sortie', 'fermeture'))
    `);
    console.log('✅ Nouvelle contrainte ajoutée');
    
    console.log('\n📋 Types d\'annonces autorisés:');
    console.log('   - general (Information)');
    console.log('   - urgent (Urgent)');
    console.log('   - meeting (Réunion)');
    console.log('   - event (Événement)');
    console.log('   - celebration (Célébration)');
    console.log('   - reunion (ancien type)');
    console.log('   - fete (ancien type)');
    console.log('   - sortie (ancien type)');
    console.log('   - fermeture (ancien type)');
    
    console.log('\n✅ Mise à jour terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateAnnouncementTypes();
