/**
 * SERVICE RENDEZ-VOUS v2
 * Workflow simplifié de négociation RDV admin ↔ parent
 * 
 * WORKFLOW:
 * 1. Création: Admin ou Parent crée → status=proposed, pending_response_from=autre partie
 * 2. Réponse:
 *    - Accepte → status=confirmed, notifications aux deux
 *    - Contre-propose → status=counter_proposed, nouvelle date proposée
 * 3. Boucle: Tant que contre-proposition → retour étape 2
 * 4. Confirmation: Dès acceptation → status=confirmed
 * 
 * TÂCHES (admin seulement):
 * - Créées automatiquement quand admin doit répondre
 * - Marquées complètes quand le RDV change de statut
 */

const { pool } = require('../config/db_postgres');
const cloudinaryService = require('./cloudinaryService');

// ============================================================================
// HELPERS
// ============================================================================

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

async function getAdmins(client) {
  const result = await client.query(`
    SELECT id, first_name, last_name, email 
    FROM users 
    WHERE role = 'admin' AND is_active = true
  `);
  return result.rows;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ============================================================================
// CRÉATION RDV
// ============================================================================

/**
 * Créer un rendez-vous (admin ou parent)
 * → Notifie l'autre partie
 * → Crée une tâche si c'est l'admin qui doit répondre
 * Compatible avec ancienne et nouvelle structure de table
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

    const creator = await getUserById(creatorId);
    const isParentCreator = parent_id === creatorId;

    // Créer le RDV avec la nouvelle structure
    const pendingResponseFrom = isParentCreator ? 'admin' : 'parent';
    console.log('📅 Création RDV:', { parent_id, child_id, creatorId, subject, proposed_date, location, pendingResponseFrom });

    const result = await client.query(`
      INSERT INTO appointments 
      (parent_id, child_id, created_by, subject, description, proposed_date, location, status, pending_response_from, last_proposed_by, proposal_history)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'proposed', $8, $3, $9)
      RETURNING *
    `, [
      parent_id, child_id, creatorId, subject, description, proposed_date, location,
      pendingResponseFrom,
      JSON.stringify([{ date: new Date().toISOString(), proposed_by: creatorId, proposed_date }])
    ]);

    const appointment = result.rows[0];
    const formattedDate = formatDate(proposed_date);

    if (isParentCreator) {
      // PARENT CRÉE → Notifier admins + créer tâche admin
      console.log(`📅 Parent ${creator?.first_name} ${creator?.last_name} propose un RDV: ${subject}`);

      const admins = await getAdmins(client);

      // Notifier chaque admin
      for (const admin of admins) {
        await client.query(`
          INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
          VALUES ($1, $2, $3, 'appointment_proposed', $4, false)
        `, [
          admin.id,
          '📅 Nouvelle proposition de RDV',
          `${creator?.first_name || 'Un parent'} ${creator?.last_name || ''} propose un RDV le ${formattedDate} : "${subject}"`,
          appointment.id
        ]);
      }

      // Créer tâche pour le premier admin
      if (admins.length > 0) {
        await createAppointmentTask(client, appointment, admins[0].id, 'respond');
      }

      console.log(`✅ Notifications envoyées à ${admins.length} admin(s) + tâche créée`);

    } else {
      // ADMIN CRÉE → Notifier le parent seulement (pas de tâche pour parent)
      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
        VALUES ($1, $2, $3, 'appointment_proposed', $4, false)
      `, [
        parent_id,
        '📅 Proposition de rendez-vous',
        `L'administration vous propose un RDV le ${formattedDate} : "${subject}"`,
        appointment.id
      ]);

      console.log(`✅ RDV proposé par admin au parent ${parent_id}`);
    }

    await client.query('COMMIT');
    return { success: true, appointment };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur createAppointment:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================================
// CONFIRMER RDV
// ============================================================================

/**
 * Confirmer un RDV (accepter la proposition)
 * → Notifie les deux parties
 * → Marque la tâche comme complète
 */
async function confirmAppointment(appointmentId, userId, userRole) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Récupérer le RDV
    const apptResult = await client.query(
      'SELECT * FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (apptResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Rendez-vous non trouvé' };
    }

    const appointment = apptResult.rows[0];

    // Vérifier que c'est bien à cette personne de répondre (si colonne existe)
    if (appointment.pending_response_from) {
      const expectedResponder = appointment.pending_response_from;
      const actualResponder = userRole === 'parent' ? 'parent' : 'admin';

      if (expectedResponder !== actualResponder) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: `C'est à ${expectedResponder === 'admin' ? 'l\'administration' : 'au parent'} de répondre`
        };
      }
    }

    // Mettre à jour le RDV (compatible ancienne et nouvelle structure)
    let result;
    try {
      result = await client.query(`
        UPDATE appointments
        SET status = 'confirmed', 
            confirmed_date = proposed_date,
            pending_response_from = NULL,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [appointmentId]);
    } catch (e) {
      // Fallback pour ancienne structure
      result = await client.query(`
        UPDATE appointments
        SET status = 'confirmed', 
            confirmed_date = proposed_date,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [appointmentId]);
    }

    const updatedAppointment = result.rows[0];
    const confirmer = await getUserById(userId);
    const formattedDate = formatDate(updatedAppointment.confirmed_date);

    // Notifier les DEUX parties
    // 1. Notifier le parent
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
      VALUES ($1, $2, $3, 'appointment_confirmed', $4, false)
    `, [
      updatedAppointment.parent_id,
      '✅ Rendez-vous confirmé',
      `Le RDV "${updatedAppointment.subject}" est confirmé pour le ${formattedDate}`,
      appointmentId
    ]);

    // 2. Notifier les admins
    const admins = await getAdmins(client);
    for (const admin of admins) {
      if (admin.id !== userId) { // Ne pas notifier celui qui confirme
        await client.query(`
          INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
          VALUES ($1, $2, $3, 'appointment_confirmed', $4, false)
        `, [
          admin.id,
          '✅ Rendez-vous confirmé',
          `${confirmer?.first_name || 'Quelqu\'un'} a confirmé le RDV "${updatedAppointment.subject}" pour le ${formattedDate}`,
          appointmentId
        ]);
      }
    }

    // Marquer les tâches liées comme complètes
    await completeAppointmentTasks(client, appointmentId);

    await client.query('COMMIT');
    console.log(`✅ RDV ${appointmentId} confirmé par ${userRole}`);

    return { success: true, appointment: updatedAppointment };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur confirmAppointment:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================================
// CONTRE-PROPOSER UNE DATE
// ============================================================================

/**
 * Proposer une autre date (contre-proposition)
 * → Notifie l'autre partie
 * → Crée une tâche si c'est l'admin qui doit répondre
 * Compatible avec ancienne et nouvelle structure de table
 */
async function counterProposeDate(appointmentId, newDate, userId, userRole) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Récupérer le RDV
    const apptResult = await client.query(
      'SELECT * FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (apptResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Rendez-vous non trouvé' };
    }

    const appointment = apptResult.rows[0];
    const proposer = await getUserById(userId);
    const isParent = userRole === 'parent';

    // Mettre à jour le RDV (compatible ancienne et nouvelle structure)
    let result;
    try {
      const newPendingResponseFrom = isParent ? 'admin' : 'parent';
      const history = appointment.proposal_history || [];
      history.push({ date: new Date().toISOString(), proposed_by: userId, proposed_date: newDate });

      result = await client.query(`
        UPDATE appointments
        SET status = 'counter_proposed',
            proposed_date = $1,
            pending_response_from = $2,
            last_proposed_by = $3,
            proposal_history = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `, [newDate, newPendingResponseFrom, userId, JSON.stringify(history), appointmentId]);
    } catch (e) {
      // Fallback pour ancienne structure (utilise 'rescheduled' au lieu de 'counter_proposed')
      result = await client.query(`
        UPDATE appointments
        SET status = 'rescheduled',
            proposed_date = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [newDate, appointmentId]);
    }

    const updatedAppointment = result.rows[0];
    const formattedDate = formatDate(newDate);

    if (isParent) {
      // PARENT CONTRE-PROPOSE → Notifier admins + créer tâche
      const admins = await getAdmins(client);

      for (const admin of admins) {
        await client.query(`
          INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
          VALUES ($1, $2, $3, 'appointment_counter_proposed', $4, false)
        `, [
          admin.id,
          '🔄 Nouvelle date proposée',
          `${proposer?.first_name || 'Un parent'} propose une autre date : ${formattedDate}`,
          appointmentId
        ]);
      }

      // Marquer anciennes tâches complètes et créer nouvelle
      await completeAppointmentTasks(client, appointmentId);
      if (admins.length > 0) {
        await createAppointmentTask(client, updatedAppointment, admins[0].id, 'respond');
      }

    } else {
      // ADMIN CONTRE-PROPOSE → Notifier parent seulement
      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
        VALUES ($1, $2, $3, 'appointment_counter_proposed', $4, false)
      `, [
        appointment.parent_id,
        '🔄 Nouvelle date proposée',
        `L'administration propose une autre date : ${formattedDate}`,
        appointmentId
      ]);

      // Marquer anciennes tâches complètes
      await completeAppointmentTasks(client, appointmentId);
    }

    await client.query('COMMIT');
    console.log(`✅ RDV ${appointmentId}: nouvelle date proposée par ${userRole}`);

    return { success: true, appointment: updatedAppointment };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur counterProposeDate:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================================
// GESTION DES TÂCHES
// ============================================================================

/**
 * Créer une tâche pour un RDV (admin seulement)
 */
async function createAppointmentTask(client, appointment, adminId, action = 'respond') {
  const formattedDate = formatDate(appointment.proposed_date);

  // Récupérer le nom du parent
  const parentResult = await client.query(
    'SELECT first_name, last_name FROM users WHERE id = $1',
    [appointment.parent_id]
  );
  const parent = parentResult.rows[0];
  const parentName = parent ? `${parent.first_name} ${parent.last_name}` : 'Parent';

  const title = action === 'respond'
    ? `📅 RDV à confirmer: ${parentName}`
    : `📅 RDV en attente: ${parentName}`;

  const description = `Proposition de RDV pour le ${formattedDate}. Sujet: ${appointment.subject}. Confirmez ou proposez une autre date.`;

  await client.query(`
    INSERT INTO events (
      title, description, type, status, priority,
      start_date, end_date, all_day,
      created_by, assigned_to, metadata
    )
    VALUES ($1, $2, 'task', 'pending', 'high', NOW(), NOW(), true, $3, $3, $4)
  `, [
    title,
    description,
    adminId,
    JSON.stringify({
      appointment_id: appointment.id,
      parent_id: appointment.parent_id,
      parent_name: parentName,
      proposed_date: appointment.proposed_date,
      is_appointment_task: true
    })
  ]);

  console.log(`📋 Tâche RDV créée pour admin ${adminId}`);
}

/**
 * Marquer les tâches d'un RDV comme complètes
 */
async function completeAppointmentTasks(client, appointmentId) {
  const result = await client.query(`
    UPDATE events 
    SET status = 'completed', updated_at = NOW()
    WHERE type = 'task' 
      AND status = 'pending'
      AND metadata::jsonb @> $1::jsonb
    RETURNING id
  `, [JSON.stringify({ appointment_id: appointmentId, is_appointment_task: true })]);

  if (result.rows.length > 0) {
    console.log(`✅ ${result.rows.length} tâche(s) RDV marquée(s) complète(s)`);
  }
}

// ============================================================================
// AUTRES FONCTIONS
// ============================================================================

/**
 * Récupérer les rendez-vous
 */
async function getAppointments(userId, role, filters = {}) {
  try {
    const { status } = filters;

    // Requête compatible avec l'ancienne et nouvelle structure de table
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
 * Récupérer un RDV par ID
 */
async function getAppointmentById(appointmentId, userId, role) {
  try {
    const result = await pool.query(`
      SELECT 
        a.*,
        u.first_name || ' ' || u.last_name as parent_name,
        u.email as parent_email,
        c.first_name || ' ' || c.last_name as child_name
      FROM appointments a
      LEFT JOIN users u ON a.parent_id = u.id
      LEFT JOIN children c ON a.child_id = c.id
      WHERE a.id = $1
    `, [appointmentId]);

    if (result.rows.length === 0) {
      return { success: false, error: 'Rendez-vous non trouvé' };
    }

    const appointment = result.rows[0];

    if (role === 'parent' && appointment.parent_id !== userId) {
      return { success: false, error: 'Accès non autorisé' };
    }

    return { success: true, appointment };

  } catch (error) {
    console.error('❌ Erreur getAppointmentById:', error);
    throw error;
  }
}

/**
 * RDV d'aujourd'hui (admin)
 */
async function getTodayAppointments() {
  try {
    // Compatible avec ancienne et nouvelle structure (rescheduled ou counter_proposed)
    const result = await pool.query(`
      SELECT 
        a.*,
        COALESCE(u.first_name || ' ' || u.last_name, a.parent_first_name || ' ' || a.parent_last_name) as parent_name,
        COALESCE(c.first_name || ' ' || c.last_name, a.child_first_name || ' ' || a.child_last_name) as child_name
      FROM appointments a
      LEFT JOIN users u ON a.parent_id = u.id
      LEFT JOIN children c ON a.child_id = c.id
      WHERE DATE(COALESCE(a.confirmed_date, a.proposed_date)) = CURRENT_DATE
        AND a.status IN ('confirmed', 'proposed', 'counter_proposed', 'rescheduled')
      ORDER BY COALESCE(a.confirmed_date, a.proposed_date) ASC
    `);

    return { success: true, appointments: result.rows };

  } catch (error) {
    console.error('❌ Erreur getTodayAppointments:', error);
    throw error;
  }
}

/**
 * RDV en attente de réponse (pour cron job)
 * Compatible avec ancienne structure (sans pending_response_from)
 */
async function getPendingAppointments() {
  try {
    // Essayer d'abord avec la nouvelle structure
    let result;
    try {
      result = await pool.query(`
        SELECT 
          a.*,
          u.first_name || ' ' || u.last_name as parent_name,
          u.email as parent_email
        FROM appointments a
        LEFT JOIN users u ON a.parent_id = u.id
        WHERE a.status IN ('proposed', 'counter_proposed')
          AND a.pending_response_from IS NOT NULL
        ORDER BY a.updated_at ASC
      `);
    } catch (e) {
      // Fallback pour ancienne structure (sans pending_response_from)
      result = await pool.query(`
        SELECT 
          a.*,
          u.first_name || ' ' || u.last_name as parent_name,
          u.email as parent_email
        FROM appointments a
        LEFT JOIN users u ON a.parent_id = u.id
        WHERE a.status IN ('proposed', 'rescheduled')
        ORDER BY a.updated_at ASC
      `);
    }

    return { success: true, appointments: result.rows };

  } catch (error) {
    console.error('❌ Erreur getPendingAppointments:', error);
    throw error;
  }
}

/**
 * Annuler un RDV
 */
async function cancelAppointment(appointmentId, userId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(`
      UPDATE appointments
      SET status = 'cancelled', pending_response_from = NULL, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [appointmentId]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Rendez-vous non trouvé' };
    }

    const appointment = result.rows[0];
    const canceller = await getUserById(userId);

    // Notifier l'autre partie
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
      VALUES ($1, $2, $3, 'appointment_cancelled', $4, false)
    `, [
      appointment.parent_id,
      '❌ Rendez-vous annulé',
      `Le RDV "${appointment.subject}" a été annulé`,
      appointmentId
    ]);

    // Marquer tâches complètes
    await completeAppointmentTasks(client, appointmentId);

    await client.query('COMMIT');
    console.log(`✅ RDV ${appointmentId} annulé`);

    return { success: true, appointment };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur cancelAppointment:', error);
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
      SET status = 'completed', notes = $1, pending_response_from = NULL, updated_at = NOW()
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
 * Mettre à jour le statut
 */
async function updateAppointmentStatus(appointmentId, status, userId) {
  try {
    const validStatuses = ['proposed', 'counter_proposed', 'confirmed', 'completed', 'cancelled', 'failed', 'no_show'];

    if (!validStatuses.includes(status)) {
      return { success: false, error: `Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}` };
    }

    const result = await pool.query(`
      UPDATE appointments
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, appointmentId]);

    if (result.rows.length === 0) {
      return { success: false, error: 'Rendez-vous non trouvé' };
    }

    console.log(`✅ Statut RDV #${appointmentId} mis à jour: ${status}`);
    return { success: true, appointment: result.rows[0] };

  } catch (error) {
    console.error('❌ Erreur updateAppointmentStatus:', error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  getTodayAppointments,
  getPendingAppointments,
  confirmAppointment,
  counterProposeDate,
  completeAppointment,
  cancelAppointment,
  updateAppointmentStatus
};
