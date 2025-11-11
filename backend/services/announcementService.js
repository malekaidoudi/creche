/**
 * SERVICE ANNONCES
 * Gestion des actualités/événements pour les parents
 */

const { pool } = require('../config/db_postgres');

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
    const { is_published, event_type, current_month_only = false } = filters;
    
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
    
    // Filtrer par mois courant si demandé
    if (current_month_only) {
      query += ` AND a.event_date >= DATE_TRUNC('month', CURRENT_DATE)`;
      query += ` AND a.event_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`;
    }
    
    query += ` ORDER BY a.event_date ASC`;
    
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
async function getParentAnnouncements(parentUserId) {
  try {
    console.log('🔍 getParentAnnouncements pour user_id:', parentUserId);
    
    // Récupérer les enfants du parent (utiliser parent_id)
    const childrenResult = await pool.query(
      'SELECT id FROM children WHERE parent_id = $1',
      [parentUserId]
    );
    
    console.log('👶 Enfants trouvés:', childrenResult.rows.length);
    
    const childIds = childrenResult.rows.map(c => c.id);
    
    // Récupérer les annonces publiées du mois courant uniquement (DISTINCT pour éviter doublons)
    const result = await pool.query(`
      SELECT DISTINCT ON (a.id)
        a.*,
        u.first_name || ' ' || u.last_name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.is_published = true
        AND a.event_date >= DATE_TRUNC('month', CURRENT_DATE)
        AND a.event_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        AND (
          a.target_audience = 'all'
          OR (a.target_audience = 'specific' AND a.target_children && $1::integer[])
        )
      ORDER BY a.id, a.event_date ASC, a.created_at DESC
      LIMIT 50
    `, [childIds]);
    
    console.log('📢 Annonces trouvées:', result.rows.length);
    
    return { success: true, announcements: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getParentAnnouncements:', error);
    console.error('Détails:', error.message);
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
    let parentUserIds = [];
    
    if (announcement.target_audience === 'all') {
      // Tous les parents (utiliser parent_id)
      const result = await client.query(
        "SELECT DISTINCT parent_id FROM children WHERE parent_id IS NOT NULL"
      );
      parentUserIds = result.rows.map(r => r.parent_id);
    } else {
      // Parents des enfants spécifiques (utiliser parent_id)
      const result = await client.query(
        "SELECT DISTINCT parent_id FROM children WHERE id = ANY($1) AND parent_id IS NOT NULL",
        [announcement.target_children]
      );
      parentUserIds = result.rows.map(r => r.parent_id);
    }
    
    // Créer notifications
    for (const parentUserId of parentUserIds) {
      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
        VALUES ($1, $2, $3, 'announcement', $4, false)
      `, [
        parentUserId,
        `📢 ${announcement.title}`,
        announcement.description.substring(0, 200),
        announcement.id
      ]);
    }
    
    console.log(`✅ ${parentUserIds.length} parents notifiés`);
    
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
