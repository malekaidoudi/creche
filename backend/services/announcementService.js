/**
 * SERVICE ANNONCES
 * Gestion des actualités/événements pour les parents
 */

const pool = require('../config/db_postgres');

/**
 * Créer une annonce
 */
async function createAnnouncement(announcementData, creatorId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      title, 
      description, 
      event_date, 
      event_type = 'general',
      target_audience = 'all',
      target_children = [],
      is_published = false
    } = announcementData;
    
    const result = await client.query(`
      INSERT INTO announcements 
      (title, description, event_date, event_type, target_audience, target_children, created_by, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [title, description, event_date, event_type, target_audience, target_children, creatorId, is_published]);
    
    const announcement = result.rows[0];
    
    // Si publié, notifier les parents concernés
    if (is_published) {
      await notifyParents(client, announcement);
    }
    
    await client.query('COMMIT');
    
    console.log(`✅ Annonce créée: ${title}`);
    
    return { success: true, announcement };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur createAnnouncement:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Récupérer toutes les annonces
 */
async function getAnnouncements(filters = {}) {
  try {
    const { is_published, event_type } = filters;
    
    let query = `
      SELECT 
        a.*,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (is_published !== undefined) {
      paramCount++;
      query += ` AND a.is_published = $${paramCount}`;
      params.push(is_published);
    }
    
    if (event_type) {
      paramCount++;
      query += ` AND a.event_type = $${paramCount}`;
      params.push(event_type);
    }
    
    query += ` ORDER BY a.event_date DESC`;
    
    const result = await pool.query(query, params);
    
    return { success: true, announcements: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getAnnouncements:', error);
    throw error;
  }
}

/**
 * Récupérer les annonces pour un parent
 */
async function getParentAnnouncements(parentId) {
  try {
    // Récupérer les enfants du parent
    const childrenResult = await pool.query(
      'SELECT id FROM children WHERE parent_id = $1',
      [parentId]
    );
    
    const childIds = childrenResult.rows.map(c => c.id);
    
    const result = await pool.query(`
      SELECT *
      FROM announcements
      WHERE is_published = true
        AND (
          target_audience = 'all'
          OR (target_audience = 'specific' AND target_children && $1)
        )
      ORDER BY event_date DESC
      LIMIT 20
    `, [childIds]);
    
    return { success: true, announcements: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getParentAnnouncements:', error);
    throw error;
  }
}

/**
 * Publier une annonce
 */
async function publishAnnouncement(announcementId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await client.query(`
      UPDATE announcements
      SET is_published = true, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [announcementId]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Annonce non trouvée' };
    }
    
    const announcement = result.rows[0];
    
    // Notifier les parents
    await notifyParents(client, announcement);
    
    await client.query('COMMIT');
    
    console.log(`✅ Annonce ${announcementId} publiée`);
    
    return { success: true, announcement };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur publishAnnouncement:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Supprimer une annonce
 */
async function deleteAnnouncement(announcementId) {
  try {
    const result = await pool.query(
      'DELETE FROM announcements WHERE id = $1 RETURNING *',
      [announcementId]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Annonce non trouvée' };
    }
    
    console.log(`✅ Annonce ${announcementId} supprimée`);
    
    return { success: true, message: 'Annonce supprimée' };
    
  } catch (error) {
    console.error('❌ Erreur deleteAnnouncement:', error);
    throw error;
  }
}

/**
 * Notifier les parents concernés
 */
async function notifyParents(client, announcement) {
  try {
    let parentIds = [];
    
    if (announcement.target_audience === 'all') {
      // Tous les parents
      const result = await client.query(
        "SELECT DISTINCT parent_id FROM children WHERE parent_id IS NOT NULL"
      );
      parentIds = result.rows.map(r => r.parent_id);
    } else {
      // Parents des enfants spécifiques
      const result = await client.query(
        "SELECT DISTINCT parent_id FROM children WHERE id = ANY($1) AND parent_id IS NOT NULL",
        [announcement.target_children]
      );
      parentIds = result.rows.map(r => r.parent_id);
    }
    
    // Créer notifications
    for (const parentId of parentIds) {
      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
        VALUES ($1, $2, $3, 'announcement', $4, false)
      `, [
        parentId,
        `📢 ${announcement.title}`,
        announcement.description.substring(0, 200),
        announcement.id
      ]);
    }
    
    console.log(`✅ ${parentIds.length} parents notifiés`);
    
  } catch (error) {
    console.error('❌ Erreur notifyParents:', error);
    throw error;
  }
}

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getParentAnnouncements,
  publishAnnouncement,
  deleteAnnouncement
};
