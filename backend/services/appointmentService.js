/**
 * SERVICE RENDEZ-VOUS
 * Gestion des RDV admin ↔ parent
 */

const { pool } = require('../config/db_postgres');
const cloudinaryService = require('./cloudinaryService');

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
      location = 'Crèche',
      status = 'proposed'
    } = appointmentData;

    // Déterminer si c'est le parent qui crée (demande) ou l'admin (proposition)
    const isParentRequest = parent_id === creatorId;
    // Les statuts valides sont: proposed, confirmed, rescheduled, completed, cancelled
    // Pour les demandes de parent, on utilise aussi 'proposed' (proposition du parent)

    const result = await client.query(`
      INSERT INTO appointments 
      (parent_id, child_id, created_by, subject, description, proposed_date, location, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'proposed')
      RETURNING *
    `, [parent_id, child_id, creatorId, subject, description, proposed_date, location]);

    const appointment = result.rows[0];
    const creator = await getUserById(creatorId);

    if (isParentRequest) {
      // PARENT DEMANDE UN RDV → Notifier tous les admins + créer tâche
      console.log(`📅 Parent ${creator?.first_name} ${creator?.last_name} demande un RDV: ${subject}`);

      // Récupérer tous les admins
      const adminsResult = await client.query(`
        SELECT id, first_name, last_name FROM users WHERE role = 'admin' AND is_active = true
      `);

      if (adminsResult.rows.length === 0) {
        console.warn('⚠️ Aucun admin actif trouvé pour recevoir la demande de RDV');
      }

      // Notifier chaque admin
      for (const admin of adminsResult.rows) {
        await client.query(`
          INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
          VALUES ($1, $2, $3, 'appointment_request', $4, false)
        `, [
          admin.id,
          '📅 Nouvelle demande de RDV',
          `${creator?.first_name || 'Un parent'} ${creator?.last_name || ''} demande un rendez-vous : "${subject}"`,
          appointment.id
        ]);
      }

      // Créer une tâche pour traiter la demande de RDV (assignée au premier admin)
      const proposedDateFormatted = new Date(proposed_date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });

      const firstAdminId = adminsResult.rows[0]?.id || null;

      if (firstAdminId) {
        await client.query(`
          INSERT INTO events (
            title, 
            description, 
            type, 
            status, 
            priority, 
            start_date, 
            end_date, 
            all_day,
            created_by,
            assigned_to,
            metadata
          )
          VALUES ($1, $2, 'task', 'pending', 'high', NOW(), NOW(), true, $3, $3, $4)
        `, [
          `📅 Demande RDV: ${creator?.first_name || 'Parent'} ${creator?.last_name || ''}`,
          `Demande de rendez-vous pour le ${proposedDateFormatted}. Sujet: ${subject}`,
          firstAdminId,
          JSON.stringify({
            appointment_id: appointment.id,
            parent_id: parent_id,
            parent_name: `${creator?.first_name || ''} ${creator?.last_name || ''}`,
            proposed_date: proposed_date,
            is_appointment_request: true
          })
        ]);
        console.log(`✅ Tâche créée et assignée à l'admin ${firstAdminId}`);
      }

      console.log(`✅ Notifications envoyées à ${adminsResult.rows.length} admin(s)`);

    } else {
      // ADMIN PROPOSE UN RDV → Notifier le parent
      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
        VALUES ($1, $2, $3, 'appointment_proposed', $4, false)
      `, [
        parent_id,
        '📅 Proposition de rendez-vous',
        `${creator?.first_name || 'L\'administration'} ${creator?.last_name || ''} vous propose un rendez-vous : "${subject}"`,
        appointment.id
      ]);

      // Marquer comme complétées toutes les tâches urgentes de RDV pour ce parent
      await client.query(`
        UPDATE events 
        SET status = 'completed', updated_at = NOW()
        WHERE type = 'task' 
        AND status = 'pending'
        AND metadata::jsonb @> $1::jsonb
      `, [JSON.stringify({ is_urgent_appointment: true, parent_id: parent_id })]);

      console.log(`✅ RDV proposé par admin: ${subject} au parent ${parent_id}`);
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
        COALESCE(u.first_name || ' ' || u.last_name, a.parent_first_name || ' ' || a.parent_last_name) as parent_name,
        COALESCE(c.first_name || ' ' || c.last_name, a.child_first_name || ' ' || a.child_last_name) as child_name,
        e.status as enrollment_status
      FROM appointments a
      LEFT JOIN users u ON a.parent_id = u.id
      LEFT JOIN children c ON a.child_id = c.id
      LEFT JOIN enrollments e ON a.enrollment_id = e.id
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
 * Confirmer un rendez-vous (parent ou admin)
 */
async function confirmAppointment(appointmentId, confirmedDate, userId, userRole = 'parent') {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Si admin, pas de vérification parent_id
    let query, params;
    if (userRole === 'admin' || userRole === 'staff') {
      query = `
        UPDATE appointments
        SET confirmed_date = $1, status = 'confirmed', updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      params = [confirmedDate, appointmentId];
    } else {
      query = `
        UPDATE appointments
        SET confirmed_date = $1, status = 'confirmed', updated_at = NOW()
        WHERE id = $2 AND parent_id = $3
        RETURNING *
      `;
      params = [confirmedDate, appointmentId, userId];
    }

    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Rendez-vous non trouvé' };
    }

    const appointment = result.rows[0];

    // Notifier selon qui confirme
    if (userRole === 'admin' || userRole === 'staff') {
      // Admin confirme → notifier le parent
      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
        VALUES ($1, $2, $3, 'appointment_confirmed', $4, false)
      `, [
        appointment.parent_id,
        '✅ Rendez-vous confirmé',
        `Votre rendez-vous "${appointment.subject}" a été confirmé par l'administration.`,
        appointment.id
      ]);
    } else {
      // Parent confirme → notifier l'admin
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
    }

    await client.query('COMMIT');

    console.log(`✅ RDV ${appointmentId} confirmé par ${userRole}`);

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
    const parentName = parent ? `${parent.first_name} ${parent.last_name}` : 'Un parent';

    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
      VALUES ($1, $2, $3, 'appointment_rescheduled', $4, false)
    `, [
      appointment.created_by,
      '🔄 Nouvelle date proposée',
      `${parentName} propose une nouvelle date pour : "${appointment.subject}"`,
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
 * Si c'est un RDV d'inscription, transfère les documents vers children_documents
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

    const appointment = result.rows[0];
    console.log(`✅ RDV ${appointmentId} complété`);

    // Si c'est un RDV d'inscription avec un enrollment_id, transférer les documents
    if (appointment.enrollment_id && appointment.appointment_type === 'inscription') {
      await transferEnrollmentDocumentsToChild(appointment.enrollment_id);
    }

    return { success: true, appointment };

  } catch (error) {
    console.error('❌ Erreur completeAppointment:', error);
    throw error;
  }
}

/**
 * Transférer les documents d'inscription vers children_documents
 */
async function transferEnrollmentDocumentsToChild(enrollmentId) {
  try {
    // Récupérer l'inscription avec le child_id
    const enrollmentResult = await pool.query(`
      SELECT id, child_id, status FROM enrollments WHERE id = $1
    `, [enrollmentId]);

    if (enrollmentResult.rows.length === 0) {
      console.log(`⚠️ Inscription #${enrollmentId} non trouvée pour transfert documents`);
      return;
    }

    const enrollment = enrollmentResult.rows[0];

    if (!enrollment.child_id) {
      console.log(`⚠️ Inscription #${enrollmentId} n'a pas de child_id, transfert impossible`);
      return;
    }

    // Récupérer les documents de l'inscription
    const docsResult = await pool.query(`
      SELECT * FROM enrollment_documents WHERE enrollment_id = $1
    `, [enrollmentId]);

    if (docsResult.rows.length === 0) {
      console.log(`📄 Aucun document à transférer pour inscription #${enrollmentId}`);
      return;
    }

    console.log(`📄 Transfert de ${docsResult.rows.length} document(s) vers enfant #${enrollment.child_id}`);

    // Migrer les fichiers Cloudinary vers le dossier enfant
    let migratedFiles = [];
    if (cloudinaryService.isConfigured()) {
      console.log(`☁️  Migration fichiers Cloudinary: enrollment_${enrollmentId} → child_${enrollment.child_id}`);
      const migrationResult = await cloudinaryService.migrateEnrollmentToChild(enrollmentId, enrollment.child_id);
      if (migrationResult.success && migrationResult.migratedFiles) {
        migratedFiles = migrationResult.migratedFiles;
        console.log(`✅ ${migrationResult.migratedCount} fichier(s) migré(s) sur Cloudinary`);
      }
    }

    // Transférer chaque document
    for (const doc of docsResult.rows) {
      // Vérifier si le document n'existe pas déjà
      const existsCheck = await pool.query(`
        SELECT id FROM children_documents 
        WHERE child_id = $1 AND document_type = $2 AND transferred_from_enrollment = $3
      `, [enrollment.child_id, doc.document_type, enrollmentId]);

      if (existsCheck.rows.length > 0) {
        console.log(`   ⏭️ Document ${doc.document_type} déjà transféré`);
        continue;
      }

      // Trouver la nouvelle URL si le fichier a été migré
      let newCloudinaryUrl = doc.cloudinary_url;
      let newCloudinaryPublicId = doc.cloudinary_public_id;

      if (doc.cloudinary_public_id) {
        const migratedFile = migratedFiles.find(f => f.oldPublicId === doc.cloudinary_public_id);
        if (migratedFile) {
          newCloudinaryUrl = migratedFile.newUrl;
          newCloudinaryPublicId = migratedFile.newPublicId;
          console.log(`   📦 URL mise à jour: ${doc.cloudinary_public_id} → ${newCloudinaryPublicId}`);
        }
      }

      // Insérer dans children_documents avec les nouvelles URLs
      await pool.query(`
        INSERT INTO children_documents (
          child_id, filename, original_filename, file_path,
          mime_type, file_size, document_type, transferred_from_enrollment,
          uploaded_by, uploaded_at, cloudinary_url, cloudinary_public_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        enrollment.child_id,
        doc.filename,
        doc.original_filename,
        newCloudinaryUrl || doc.file_path,
        doc.mime_type,
        doc.file_size,
        doc.document_type,
        enrollmentId,
        doc.uploaded_by,
        doc.uploaded_at,
        newCloudinaryUrl,
        newCloudinaryPublicId
      ]);

      // Mettre à jour l'URL dans enrollment_documents aussi
      if (newCloudinaryUrl !== doc.cloudinary_url) {
        await pool.query(`
          UPDATE enrollment_documents 
          SET cloudinary_url = $1, cloudinary_public_id = $2
          WHERE id = $3
        `, [newCloudinaryUrl, newCloudinaryPublicId, doc.id]);
      }

      console.log(`   ✅ Document ${doc.document_type} transféré`);
    }

    // Mettre à jour le statut de l'inscription à 'approved' (finalisé)
    await pool.query(`
      UPDATE enrollments SET status = 'approved', finalized_at = NOW() WHERE id = $1
    `, [enrollmentId]);

    console.log(`✅ Inscription #${enrollmentId} finalisée, documents transférés et migrés`);

  } catch (error) {
    console.error('❌ Erreur transferEnrollmentDocumentsToChild:', error);
    // Ne pas faire échouer le complete si le transfert échoue
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
 * Refuser RDV et proposer nouvelle date (admin)
 * Crée une tâche urgente pour l'admin jusqu'à envoi du nouveau RDV
 */
async function rejectWithProposal(appointmentId, proposedDate, reason, adminId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Récupérer le RDV
    const apptResult = await client.query(
      'SELECT * FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (apptResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Rendez-vous non trouvé' };
    }

    const appointment = apptResult.rows[0];

    // 2. Marquer le RDV comme failed (reste visible dans les tâches admin et widget parent)
    await client.query(
      'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2',
      ['failed', appointmentId]
    );

    // 3. Récupérer infos parent
    const parentResult = await client.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [appointment.parent_id]
    );
    const parent = parentResult.rows[0];

    // 4. Créer notification pour le parent
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
      VALUES ($1, $2, $3, 'appointment_rejected', $4, false)
    `, [
      appointment.parent_id,
      '❌ Rendez-vous refusé',
      `Votre rendez-vous du ${new Date(appointment.proposed_date).toLocaleDateString('fr-FR')} a été refusé. Nouvelle date proposée : ${new Date(proposedDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}. ${reason ? `Raison: ${reason}` : ''}`,
      appointmentId
    ]);

    // 5. Créer tâche urgente ponctuelle (1 seul jour) pour l'admin
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const taskResult = await client.query(`
      INSERT INTO events (
        title, 
        description, 
        type, 
        status, 
        priority, 
        start_date, 
        end_date, 
        all_day,
        created_by,
        assigned_to,
        metadata
      )
      VALUES ($1, $2, 'task', 'pending', 'high', NOW(), $3, true, $4, $4, $5)
      RETURNING *
    `, [
      `🚨 Fixer RDV: ${parent.first_name} ${parent.last_name}`,
      `RDV refusé. Proposer nouvelle date au parent. Cliquez pour créer un nouveau RDV ou marquer comme traité.`,
      today.toISOString(),
      adminId,
      JSON.stringify({
        appointment_id: appointmentId,
        parent_id: appointment.parent_id,
        child_id: appointment.child_id,
        parent_name: `${parent.first_name} ${parent.last_name}`,
        proposed_date: proposedDate,
        reason: reason,
        is_urgent_appointment: true,
        can_create_rdv: true,
        can_mark_done: true
      })
    ]);

    await client.query('COMMIT');

    console.log(`✅ RDV ${appointmentId} refusé avec proposition. Tâche urgente créée: ${taskResult.rows[0].id}`);

    return {
      success: true,
      appointment: appointment,
      task: taskResult.rows[0],
      message: 'RDV refusé, nouvelle date proposée au parent et tâche urgente créée'
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur rejectWithProposal:', error);
    throw error;
  } finally {
    client.release();
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
 * Récupérer un rendez-vous par ID
 */
async function getAppointmentById(appointmentId, userId, role) {
  try {
    const query = `
      SELECT 
        a.*,
        u.first_name || ' ' || u.last_name as parent_name,
        u.email as parent_email,
        c.first_name || ' ' || c.last_name as child_name
      FROM appointments a
      LEFT JOIN users u ON a.parent_id = u.id
      LEFT JOIN children c ON a.child_id = c.id
      WHERE a.id = $1
    `;

    const result = await pool.query(query, [appointmentId]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Rendez-vous non trouvé'
      };
    }

    const appointment = result.rows[0];

    // Vérifier les permissions
    if (role === 'parent' && appointment.parent_id !== userId) {
      return {
        success: false,
        error: 'Accès non autorisé'
      };
    }

    return {
      success: true,
      appointment
    };

  } catch (error) {
    console.error('❌ Erreur getAppointmentById:', error);
    throw error;
  }
}

/**
 * Mettre à jour le statut d'un rendez-vous
 */
async function updateAppointmentStatus(appointmentId, status, userId) {
  try {
    const validStatuses = ['proposed', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'failed', 'no_show'];

    if (!validStatuses.includes(status)) {
      return {
        success: false,
        error: `Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}`
      };
    }

    const result = await pool.query(`
      UPDATE appointments
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, appointmentId]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Rendez-vous non trouvé'
      };
    }

    console.log(`✅ Statut RDV #${appointmentId} mis à jour: ${status}`);

    return {
      success: true,
      appointment: result.rows[0]
    };

  } catch (error) {
    console.error('❌ Erreur updateAppointmentStatus:', error);
    throw error;
  }
}

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  getTodayAppointments,
  confirmAppointment,
  rescheduleAppointment,
  completeAppointment,
  cancelAppointment,
  rejectWithProposal,
  updateAppointmentStatus
};
