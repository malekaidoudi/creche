/**
 * SERVICE MESSAGES STAFF
 * Messages staff ↔ admin avec réponses
 */

const { pool } = require('../config/db_postgres');

/**
 * Envoyer un message
 */
async function sendMessage(messageData, senderId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { recipient_id, subject, content, parent_message_id = null } = messageData;
    
    const result = await client.query(`
      INSERT INTO staff_messages (sender_id, recipient_id, parent_message_id, subject, content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [senderId, recipient_id, parent_message_id, subject, content]);
    
    const message = result.rows[0];
    
    // Notifier le destinataire
    const sender = await getUserById(senderId);
    const isReply = parent_message_id !== null;
    
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
      VALUES ($1, $2, $3, 'staff_message', $4, false)
    `, [
      recipient_id,
      isReply ? '💬 Nouvelle réponse' : '📨 Nouveau message',
      `${sender.first_name} ${sender.last_name}: ${content.substring(0, 100)}`,
      message.id
    ]);
    
    await client.query('COMMIT');
    
    console.log(`✅ Message envoyé: ${senderId} → ${recipient_id}`);
    
    return { success: true, message };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur sendMessage:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Récupérer les messages d'un utilisateur
 */
async function getUserMessages(userId) {
  try {
    const result = await pool.query(`
      SELECT 
        m.*,
        sender.first_name || ' ' || sender.last_name as sender_name,
        recipient.first_name || ' ' || recipient.last_name as recipient_name
      FROM staff_messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN users recipient ON m.recipient_id = recipient.id
      WHERE (m.sender_id = $1 OR m.recipient_id = $1)
        AND m.parent_message_id IS NULL
      ORDER BY m.created_at DESC
    `, [userId]);
    
    return { success: true, messages: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getUserMessages:', error);
    throw error;
  }
}

/**
 * Récupérer une conversation (message + réponses)
 */
async function getConversation(messageId, userId) {
  try {
    const result = await pool.query(`
      SELECT 
        m.*,
        sender.first_name || ' ' || sender.last_name as sender_name,
        recipient.first_name || ' ' || recipient.last_name as recipient_name
      FROM staff_messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN users recipient ON m.recipient_id = recipient.id
      WHERE (m.id = $1 OR m.parent_message_id = $1)
        AND (m.sender_id = $2 OR m.recipient_id = $2)
      ORDER BY m.created_at ASC
    `, [messageId, userId]);
    
    return { success: true, conversation: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getConversation:', error);
    throw error;
  }
}

/**
 * Marquer comme lu
 */
async function markAsRead(messageId, userId) {
  try {
    const result = await pool.query(`
      UPDATE staff_messages
      SET is_read = true, read_at = NOW()
      WHERE id = $1 AND recipient_id = $2
      RETURNING *
    `, [messageId, userId]);
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Message non trouvé' };
    }
    
    return { success: true, message: result.rows[0] };
    
  } catch (error) {
    console.error('❌ Erreur markAsRead:', error);
    throw error;
  }
}

/**
 * Récupérer un utilisateur par ID
 */
async function getUserById(userId) {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Erreur getUserById:', error);
    return null;
  }
}

module.exports = {
  sendMessage,
  getUserMessages,
  getConversation,
  markAsRead
};
