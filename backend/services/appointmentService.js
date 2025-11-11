/**
 * SERVICE RENDEZ-VOUS
 * Gestion des RDV admin ↔ parent
 */

const { pool } = require('../config/db_postgres');

/**
 * Créer un rendez-vous
 */
async function createAppointment(appointmentData, creatorId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      parent_id, 
      child_id, 
      subject, 
      description, 
      proposed_date,
      location = 'Crèche'
    } = appointmentData;
    
    const result = await client.query(`
      INSERT INTO appointments 
      (parent_id, child_id, created_by, subject, description, proposed_date, location, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'proposed')
      RETURNING *
    `, [parent_id, child_id, creatorId, subject, description, proposed_date, location]);
    
    const appointment = result.rows[0];
    
    // Notifier le parent
    const creator = await getUserById(creatorId);
    
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
      VALUES ($1, $2, $3, 'appointment_proposed', $4, false)
    `, [
      parent_id,
      '📅 Proposition de rendez-vous',
      `${creator.first_name} ${creator.last_name} vous propose un rendez-vous : "${subject}"`,
      appointment.id
    ]);
    
    await client.query('COMMIT');
    
    console.log(`✅ RDV créé: ${subject} avec parent ${parent_id}`);
    
    return { success: true, appointment };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur createAppointment:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Récupérer les rendez-vous
 */
async function getAppointments(userId, role, filters = {}) {
  try {
    const { status } = filters;
    
    let query = `
      SELECT 
        a.*,
        u.first_name || ' ' || u.last_name as parent_name,
        c.first_name || ' ' || c.last_name as child_name
      FROM appointments a
      LEFT JOIN users u ON a.parent_id = u.id
      LEFT JOIN children c ON a.child_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    // Filtrer selon le rôle
    if (role === 'parent') {
      paramCount++;
      query += ` AND a.parent_id = $${paramCount}`;
      params.push(userId);
    }
    
    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ` ORDER BY COALESCE(a.confirmed_date, a.proposed_date) DESC`;
    
    const result = await pool.query(query, params);
    
    return { success: true, appointments: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getAppointments:', error);
    throw error;
  }
}

/**
 * Récupérer les RDV d'aujourd'hui (admin)
 */
async function getTodayAppointments() {
  try {
    const result = await pool.query(`
      SELECT 
        a.*,
        u.first_name || ' ' || u.last_name as parent_name,
        c.first_name || ' ' || c.last_name as child_name
      FROM appointments a
      LEFT JOIN users u ON a.parent_id = u.id
      LEFT JOIN children c ON a.child_id = c.id
      WHERE DATE(COALESCE(a.confirmed_date, a.proposed_date)) = CURRENT_DATE
        AND a.status IN ('confirmed', 'proposed')
      ORDER BY COALESCE(a.confirmed_date, a.proposed_date) ASC
    `);
    
    return { success: true, appointments: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getTodayAppointments:', error);
    throw error;
  }
}

/**
 * Confirmer un rendez-vous (parent)
 */
async function confirmAppointment(appointmentId, confirmedDate, userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await client.query(`
      UPDATE appointments
      SET confirmed_date = $1, status = 'confirmed', updated_at = NOW()
      WHERE id = $2 AND parent_id = $3
      RETURNING *
    `, [confirmedDate, appointmentId, userId]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Rendez-vous non trouvé' };
    }
    
    const appointment = result.rows[0];
    
    // Notifier l'admin
    const parent = await getUserById(userId);
    
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
      VALUES ($1, $2, $3, 'appointment_confirmed', $4, false)
    `, [
      appointment.created_by,
      '✅ Rendez-vous confirmé',
      `${parent.first_name} ${parent.last_name} a confirmé le rendez-vous : "${appointment.subject}"`,
      appointment.id
    ]);
    
    await client.query('COMMIT');
    
    console.log(`✅ RDV ${appointmentId} confirmé`);
    
    return { success: true, appointment };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur confirmAppointment:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Proposer une nouvelle date (parent)
 */
async function rescheduleAppointment(appointmentId, newDate, userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await client.query(`
      UPDATE appointments
      SET proposed_date = $1, status = 'rescheduled', updated_at = NOW()
      WHERE id = $2 AND parent_id = $3
      RETURNING *
    `, [newDate, appointmentId, userId]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Rendez-vous non trouvé' };
    }
    
    const appointment = result.rows[0];
    
    // Notifier l'admin
    const parent = await getUserById(userId);
    
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
      VALUES ($1, $2, $3, 'appointment_rescheduled', $4, false)
    `, [
      appointment.created_by,
      '🔄 Nouvelle date proposée',
      `${parent.first_name} ${parent.last_name} propose une nouvelle date pour : "${appointment.subject}"`,
      appointment.id
    ]);
    
    await client.query('COMMIT');
    
    console.log(`✅ RDV ${appointmentId} replanifié`);
    
    return { success: true, appointment };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur rescheduleAppointment:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Marquer comme complété (admin)
 */
async function completeAppointment(appointmentId, notes) {
  try {
    const result = await pool.query(`
      UPDATE appointments
      SET status = 'completed', notes = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [notes, appointmentId]);
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Rendez-vous non trouvé' };
    }
    
    console.log(`✅ RDV ${appointmentId} complété`);
    
    return { success: true, appointment: result.rows[0] };
    
  } catch (error) {
    console.error('❌ Erreur completeAppointment:', error);
    throw error;
  }
}

/**
 * Annuler un rendez-vous
 */
async function cancelAppointment(appointmentId) {
  try {
    const result = await pool.query(`
      UPDATE appointments
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [appointmentId]);
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Rendez-vous non trouvé' };
    }
    
    console.log(`✅ RDV ${appointmentId} annulé`);
    
    return { success: true, appointment: result.rows[0] };
    
  } catch (error) {
    console.error('❌ Erreur cancelAppointment:', error);
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
  createAppointment,
  getAppointments,
  getTodayAppointments,
  confirmAppointment,
  rescheduleAppointment,
  completeAppointment,
  cancelAppointment
};
