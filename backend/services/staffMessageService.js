/**
 * SERVICE MESSAGES STAFF
 * Messages staff ↔ admin avec réponses
 */

const { pool } = require('../config/db_postgres');
const pushNotificationService = require('./pushNotificationService');

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

    // related_id = sender_id pour permettre d'ouvrir la conversation directement
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
      VALUES ($1, $2, $3, 'staff_message', $4, false)
    `, [
      recipient_id,
      `${sender.first_name} ${sender.last_name}`,
      content.substring(0, 100),
      senderId  // Utiliser sender_id au lieu de message.id pour la navigation
    ]);

    await client.query('COMMIT');

    // Envoyer une notification push au destinataire
    pushNotificationService.sendPushNotification(recipient_id, {
      title: `${sender.first_name} ${sender.last_name}`,
      message: content.substring(0, 100),
      type: 'staff_message',
      related_id: senderId,
    }).catch(err => console.error('Erreur push notification:', err));

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

/**
 * Récupérer messages non lus
 */
async function getUnreadMessages(userId) {
  try {
    const result = await pool.query(`
      SELECT 
        sm.id,
        sm.content,
        sm.created_at,
        sm.sender_id,
        sm.recipient_id,
        sm.is_read,
        sender.first_name || ' ' || sender.last_name as sender_name
      FROM staff_messages sm
      LEFT JOIN users sender ON sm.sender_id = sender.id
      WHERE sm.recipient_id = $1
        AND sm.is_read = false
      ORDER BY sm.created_at DESC
      LIMIT 10
    `, [userId]);

    return {
      success: true,
      messages: result.rows
    };

  } catch (error) {
    console.error('❌ Erreur getUnreadMessages:', error);
    throw error;
  }
}

/**
 * Récupérer la liste des conversations groupées par contact
 */
async function getConversationsList(userId) {
  try {
    const result = await pool.query(`
      WITH conversation_contacts AS (
        SELECT DISTINCT
          CASE 
            WHEN sender_id = $1 THEN recipient_id 
            ELSE sender_id 
          END as contact_id
        FROM staff_messages
        WHERE sender_id = $1 OR recipient_id = $1
      ),
      last_messages AS (
        SELECT DISTINCT ON (
          CASE 
            WHEN sender_id = $1 THEN recipient_id 
            ELSE sender_id 
          END
        )
          CASE 
            WHEN sender_id = $1 THEN recipient_id 
            ELSE sender_id 
          END as contact_id,
          content as last_message,
          created_at as last_message_date,
          sender_id
        FROM staff_messages
        WHERE sender_id = $1 OR recipient_id = $1
        ORDER BY 
          CASE 
            WHEN sender_id = $1 THEN recipient_id 
            ELSE sender_id 
          END,
          created_at DESC
      ),
      unread_counts AS (
        SELECT 
          sender_id as contact_id,
          COUNT(*) as unread_count
        FROM staff_messages
        WHERE recipient_id = $1 AND is_read = false
        GROUP BY sender_id
      )
      SELECT 
        u.id as contact_id,
        u.first_name || ' ' || u.last_name as contact_name,
        u.role as contact_role,
        u.profile_image as contact_avatar,
        lm.last_message,
        lm.last_message_date,
        COALESCE(uc.unread_count, 0) as unread_count
      FROM conversation_contacts cc
      JOIN users u ON u.id = cc.contact_id
      LEFT JOIN last_messages lm ON lm.contact_id = cc.contact_id
      LEFT JOIN unread_counts uc ON uc.contact_id = cc.contact_id
      ORDER BY lm.last_message_date DESC NULLS LAST
    `, [userId]);

    return {
      success: true,
      conversations: result.rows
    };

  } catch (error) {
    console.error('❌ Erreur getConversationsList:', error);
    throw error;
  }
}

/**
 * Récupérer une conversation avec un contact spécifique
 */
async function getConversationWithContact(contactId, userId) {
  try {
    // Récupérer les infos du contact
    const contactResult = await pool.query(
      'SELECT id, first_name, last_name, role, profile_image FROM users WHERE id = $1',
      [contactId]
    );
    const contact = contactResult.rows[0] || null;

    // Si le contact est un parent, récupérer ses enfants
    if (contact && contact.role === 'parent') {
      const childrenResult = await pool.query(
        `SELECT c.id, c.first_name 
         FROM children c
         WHERE c.parent_id = $1 AND c.is_active = true
         ORDER BY c.first_name`,
        [contactId]
      );
      contact.children = childrenResult.rows;
    }

    // Récupérer tous les messages entre les deux utilisateurs
    const result = await pool.query(`
      SELECT 
        m.id,
        m.content,
        m.created_at,
        m.sender_id,
        m.is_read,
        sender.first_name || ' ' || sender.last_name as sender_name,
        sender.profile_image as sender_avatar
      FROM staff_messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      WHERE (m.sender_id = $1 AND m.recipient_id = $2)
         OR (m.sender_id = $2 AND m.recipient_id = $1)
      ORDER BY m.created_at ASC
    `, [userId, contactId]);

    // Marquer les messages reçus comme lus
    await pool.query(`
      UPDATE staff_messages
      SET is_read = true, read_at = NOW()
      WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false
    `, [contactId, userId]);

    return {
      success: true,
      messages: result.rows,
      contact
    };

  } catch (error) {
    console.error('❌ Erreur getConversationWithContact:', error);
    throw error;
  }
}

module.exports = {
  sendMessage,
  getUserMessages,
  getConversation,
  getConversationsList,
  getConversationWithContact,
  markAsRead,
  getUnreadMessages
};
