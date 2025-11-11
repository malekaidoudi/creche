/**
 * SERVICE MÉMOS PERSONNELS
 * Mémos personnels pour chaque utilisateur
 */

const pool = require('../config/db_postgres');

/**
 * Créer un mémo personnel
 */
async function createMemo(memoData, userId) {
  try {
    const { content, memo_date } = memoData;
    
    const result = await pool.query(`
      INSERT INTO personal_memos (user_id, content, memo_date)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [userId, content, memo_date]);
    
    console.log(`✅ Mémo créé pour user ${userId}`);
    
    return { success: true, memo: result.rows[0] };
    
  } catch (error) {
    console.error('❌ Erreur createMemo:', error);
    throw error;
  }
}

/**
 * Récupérer les mémos d'un utilisateur
 */
async function getUserMemos(userId, filters = {}) {
  try {
    const { date, is_completed } = filters;
    
    let query = 'SELECT * FROM personal_memos WHERE user_id = $1';
    const params = [userId];
    let paramCount = 1;
    
    if (date) {
      paramCount++;
      query += ` AND memo_date = $${paramCount}`;
      params.push(date);
    }
    
    if (is_completed !== undefined) {
      paramCount++;
      query += ` AND is_completed = $${paramCount}`;
      params.push(is_completed);
    }
    
    query += ' ORDER BY memo_date DESC, created_at DESC';
    
    const result = await pool.query(query, params);
    
    return { success: true, memos: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getUserMemos:', error);
    throw error;
  }
}

/**
 * Récupérer les mémos d'aujourd'hui
 */
async function getTodayMemos(userId) {
  try {
    const result = await pool.query(`
      SELECT * FROM personal_memos
      WHERE user_id = $1
        AND memo_date = CURRENT_DATE
        AND is_completed = false
      ORDER BY created_at ASC
    `, [userId]);
    
    return { success: true, memos: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getTodayMemos:', error);
    throw error;
  }
}

/**
 * Marquer un mémo comme complété
 */
async function completeMemo(memoId, userId) {
  try {
    const result = await pool.query(`
      UPDATE personal_memos
      SET is_completed = true, completed_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [memoId, userId]);
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Mémo non trouvé' };
    }
    
    console.log(`✅ Mémo ${memoId} complété`);
    
    return { success: true, memo: result.rows[0] };
    
  } catch (error) {
    console.error('❌ Erreur completeMemo:', error);
    throw error;
  }
}

/**
 * Supprimer un mémo
 */
async function deleteMemo(memoId, userId) {
  try {
    const result = await pool.query(
      'DELETE FROM personal_memos WHERE id = $1 AND user_id = $2 RETURNING *',
      [memoId, userId]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Mémo non trouvé' };
    }
    
    console.log(`✅ Mémo ${memoId} supprimé`);
    
    return { success: true, message: 'Mémo supprimé' };
    
  } catch (error) {
    console.error('❌ Erreur deleteMemo:', error);
    throw error;
  }
}

module.exports = {
  createMemo,
  getUserMemos,
  getTodayMemos,
  completeMemo,
  deleteMemo
};
