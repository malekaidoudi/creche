const { pool } = require('../config/db_postgres');

async function checkMessagesStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Vérification structure table staff_messages...\n');
    
    // Structure de la table
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'staff_messages'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colonnes table staff_messages:');
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Exemple de messages non lus
    console.log('\n📬 Exemple messages non lus:');
    const messagesResult = await client.query(`
      SELECT 
        sm.id,
        sm.content,
        sm.created_at,
        sm.sender_id,
        sm.recipient_id,
        sm.is_read,
        sender.first_name || ' ' || sender.last_name as sender_name,
        recipient.first_name || ' ' || recipient.last_name as recipient_name
      FROM staff_messages sm
      LEFT JOIN users sender ON sm.sender_id = sender.id
      LEFT JOIN users recipient ON sm.recipient_id = recipient.id
      WHERE sm.is_read = false
      ORDER BY sm.created_at DESC
      LIMIT 5
    `);
    
    if (messagesResult.rows.length > 0) {
      messagesResult.rows.forEach(msg => {
        console.log(`\n   Message ID: ${msg.id}`);
        console.log(`   De: ${msg.sender_name} (ID: ${msg.sender_id})`);
        console.log(`   À: ${msg.recipient_name} (ID: ${msg.recipient_id})`);
        console.log(`   Contenu: ${msg.content.substring(0, 50)}...`);
        console.log(`   Date: ${msg.created_at}`);
        console.log(`   Lu: ${msg.is_read}`);
      });
    } else {
      console.log('   Aucun message non lu');
    }
    
    // Compter messages par utilisateur
    console.log('\n📊 Messages non lus par utilisateur:');
    const countResult = await client.query(`
      SELECT 
        recipient_id,
        u.first_name || ' ' || u.last_name as recipient_name,
        COUNT(*) as unread_count
      FROM staff_messages sm
      LEFT JOIN users u ON sm.recipient_id = u.id
      WHERE sm.is_read = false
      GROUP BY recipient_id, u.first_name, u.last_name
      ORDER BY unread_count DESC
    `);
    
    if (countResult.rows.length > 0) {
      countResult.rows.forEach(row => {
        console.log(`   ${row.recipient_name}: ${row.unread_count} message(s)`);
      });
    } else {
      console.log('   Aucun message non lu');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkMessagesStructure();
