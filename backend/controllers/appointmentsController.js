/**
 * Contrôleur des rendez-vous (Appointments)
 * Gestion complète des RDV d'inscription
 */

const db = require('../config/db_postgres');
const emailService = require('../emails/emailService');

/**
 * Récupérer tous les rendez-vous du jour
 * GET /api/appointments/today
 */
exports.getTodayAppointments = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const result = await db.query(`
      SELECT 
        a.*,
        TO_CHAR(a.appointment_date, 'HH24:MI') as appointment_time,
        e.status as enrollment_status
      FROM appointments a
      LEFT JOIN enrollments e ON a.enrollment_id = e.id
      WHERE a.appointment_date >= $1
        AND a.appointment_date < $2
        AND a.status NOT IN ('cancelled', 'no_show')
      ORDER BY a.appointment_date ASC
    `, [today, tomorrow]);

        res.json({
            success: true,
            count: result.rows.length,
            date: today.toLocaleDateString('fr-FR'),
            appointments: result.rows
        });

    } catch (error) {
        console.error('❌ Erreur récupération RDV du jour:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des rendez-vous'
        });
    }
};

/**
 * Récupérer tous les rendez-vous (avec filtres)
 * GET /api/appointments
 */
exports.getAllAppointments = async (req, res) => {
    try {
        const { status, from_date, to_date, limit = 50, offset = 0 } = req.query;

        let query = `
      SELECT 
        a.*,
        TO_CHAR(a.appointment_date, 'HH24:MI') as appointment_time,
        e.status as enrollment_status
      FROM appointments a
      LEFT JOIN enrollments e ON a.enrollment_id = e.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND a.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (from_date) {
            query += ` AND a.appointment_date >= $${paramIndex}`;
            params.push(from_date);
            paramIndex++;
        }

        if (to_date) {
            query += ` AND a.appointment_date <= $${paramIndex}`;
            params.push(to_date);
            paramIndex++;
        }

        query += ` ORDER BY a.appointment_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        res.json({
            success: true,
            count: result.rows.length,
            appointments: result.rows
        });

    } catch (error) {
        console.error('❌ Erreur récupération RDV:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des rendez-vous'
        });
    }
};

/**
 * Récupérer un rendez-vous par ID
 * GET /api/appointments/:id
 */
exports.getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
      SELECT 
        a.*,
        TO_CHAR(a.appointment_date, 'HH24:MI') as appointment_time,
        e.status as enrollment_status
      FROM appointments a
      LEFT JOIN enrollments e ON a.enrollment_id = e.id
      WHERE a.id = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Rendez-vous non trouvé'
            });
        }

        res.json({
            success: true,
            appointment: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Erreur récupération RDV:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du rendez-vous'
        });
    }
};

/**
 * Récupérer RDV par token d'inscription (pour parent)
 * GET /api/appointments/by-enrollment/:enrollmentId
 */
exports.getAppointmentByEnrollment = async (req, res) => {
    try {
        const { enrollmentId } = req.params;

        const result = await db.query(`
      SELECT 
        a.*,
        TO_CHAR(a.appointment_date, 'HH24:MI') as appointment_time
      FROM appointments a
      WHERE a.enrollment_id = $1
      ORDER BY a.created_at DESC
      LIMIT 1
    `, [enrollmentId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Aucun rendez-vous trouvé pour cette inscription'
            });
        }

        res.json({
            success: true,
            appointment: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Erreur récupération RDV par inscription:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du rendez-vous'
        });
    }
};

/**
 * Parent confirme le rendez-vous
 * POST /api/appointments/:id/confirm
 */
exports.confirmAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { parent_notes } = req.body;

        const result = await db.query(`
      UPDATE appointments
      SET 
        status = 'confirmed',
        confirmed_at = NOW(),
        parent_notes = COALESCE($2, parent_notes),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, parent_notes]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Rendez-vous non trouvé'
            });
        }

        const appointment = result.rows[0];

        // TODO: Envoyer notification au staff

        res.json({
            success: true,
            message: 'Rendez-vous confirmé avec succès',
            appointment
        });

    } catch (error) {
        console.error('❌ Erreur confirmation RDV:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la confirmation du rendez-vous'
        });
    }
};

/**
 * Parent demande un changement de date
 * POST /api/appointments/:id/reschedule
 */
exports.rescheduleAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_date, parent_notes } = req.body;

        if (!new_date) {
            return res.status(400).json({
                success: false,
                error: 'Nouvelle date requise'
            });
        }

        // Vérifier que la date est dans le futur
        if (new Date(new_date) <= new Date()) {
            return res.status(400).json({
                success: false,
                error: 'La date doit être dans le futur'
            });
        }

        const result = await db.query(`
      UPDATE appointments
      SET 
        appointment_date = $2,
        status = 'rescheduled',
        rescheduled_count = rescheduled_count + 1,
        last_rescheduled_at = NOW(),
        parent_notes = COALESCE($3, parent_notes),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, new_date, parent_notes]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Rendez-vous non trouvé'
            });
        }

        const appointment = result.rows[0];

        // Formater la nouvelle date pour l'email
        const formattedDate = new Date(new_date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // TODO: Envoyer email de confirmation du nouveau RDV
        console.log(`📅 RDV reporté au ${formattedDate} pour ${appointment.parent_email}`);

        res.json({
            success: true,
            message: 'Rendez-vous reporté avec succès',
            appointment
        });

    } catch (error) {
        console.error('❌ Erreur report RDV:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du report du rendez-vous'
        });
    }
};

/**
 * Staff marque le RDV comme terminé avec succès
 * POST /api/appointments/:id/complete ou POST /api/appointments/:id/validate
 * 
 * WORKFLOW: RDV validé → Archiver inscription → Supprimer de enrollments
 */
exports.completeAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { staff_notes } = req.body;

        // 1. Récupérer le RDV et l'inscription complète
        const appointmentCheck = await db.query(`
            SELECT a.*, 
                   e.id as enrollment_id, e.status as enrollment_status,
                   e.parent_id, e.child_id, e.enrollment_date, e.lunch_assistance,
                   e.regulation_accepted, e.admin_notes as e_admin_notes,
                   e.created_at as e_created_at, e.applicant_first_name,
                   e.applicant_last_name, e.applicant_email, e.approved_by, e.approved_at
            FROM appointments a
            LEFT JOIN enrollments e ON a.enrollment_id = e.id
            WHERE a.id = $1
        `, [id]);

        if (appointmentCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Rendez-vous non trouvé'
            });
        }

        const appointment = appointmentCheck.rows[0];

        // 2. Mettre à jour le RDV
        const result = await db.query(`
            UPDATE appointments
            SET 
                status = 'completed',
                appointment_outcome = 'success',
                staff_notes = COALESCE($2, staff_notes),
                confirmed_date = NOW(),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `, [id, staff_notes]);

        // 3. Si c'est un RDV d'inscription, archiver et supprimer l'inscription
        if (appointment.enrollment_id && appointment.appointment_type === 'inscription') {

            // Archiver l'inscription dans enrollments_archive
            await db.query(`
                INSERT INTO enrollments_archive (
                    id, parent_id, child_id, enrollment_date, status,
                    lunch_assistance, regulation_accepted, appointment_date, appointment_time,
                    admin_notes, created_at, updated_at, applicant_first_name,
                    applicant_last_name, applicant_email, new_status, approved_by, approved_at
                ) VALUES (
                    $1, $2, $3, $4, 'approved',
                    $5, $6, $7, $8,
                    $9, $10, NOW(), $11,
                    $12, $13, 'approved', $14, $15
                )
            `, [
                appointment.enrollment_id,
                appointment.parent_id,
                appointment.child_id,
                appointment.enrollment_date || new Date(),
                appointment.lunch_assistance || false,
                appointment.regulation_accepted || false,
                appointment.proposed_date,
                appointment.proposed_date ? new Date(appointment.proposed_date).toTimeString().slice(0, 8) : null,
                staff_notes || appointment.e_admin_notes,
                appointment.e_created_at || new Date(),
                appointment.applicant_first_name,
                appointment.applicant_last_name,
                appointment.applicant_email,
                appointment.approved_by,
                appointment.approved_at
            ]);

            console.log(`📦 Inscription #${appointment.enrollment_id} archivée dans enrollments_archive`);

            // Supprimer l'inscription de la table enrollments
            await db.query(`DELETE FROM enrollments WHERE id = $1`, [appointment.enrollment_id]);

            console.log(`✅ Inscription #${appointment.enrollment_id} supprimée de enrollments (finalisée avec succès)`);
        }

        res.json({
            success: true,
            message: 'Rendez-vous validé avec succès - Inscription finalisée et archivée',
            appointment: result.rows[0],
            archived: true
        });

    } catch (error) {
        console.error('❌ Erreur complétion RDV:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour du rendez-vous'
        });
    }
};

/**
 * Staff annule le RDV
 * POST /api/appointments/:id/cancel
 */
exports.cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const result = await db.query(`
      UPDATE appointments
      SET 
        status = 'cancelled',
        staff_notes = COALESCE($2, staff_notes),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, reason]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Rendez-vous non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Rendez-vous annulé',
            appointment: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Erreur annulation RDV:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'annulation du rendez-vous'
        });
    }
};

/**
 * Staff marque absence (no-show)
 * POST /api/appointments/:id/no-show
 */
exports.markNoShow = async (req, res) => {
    try {
        const { id } = req.params;
        const { staff_notes } = req.body;

        const result = await db.query(`
      UPDATE appointments
      SET 
        status = 'no_show',
        staff_notes = COALESCE($2, staff_notes),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, staff_notes]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Rendez-vous non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Parent marqué absent',
            appointment: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Erreur marquage absence:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du marquage d\'absence'
        });
    }
};

/**
 * Staff marque le RDV comme échoué et décide de la suite
 * POST /api/appointments/:id/failed
 * 
 * WORKFLOW:
 * - outcome = 'reschedule' → Créer un nouveau RDV, enrollment reste dans la table
 * - outcome = 'abandon' → Archiver inscription → Supprimer de enrollments
 */
exports.markAppointmentFailed = async (req, res) => {
    try {
        const { id } = req.params;
        const { outcome, staff_notes, new_appointment_date } = req.body;

        // Valider l'outcome
        if (!['reschedule', 'abandon'].includes(outcome)) {
            return res.status(400).json({
                success: false,
                error: 'Outcome invalide. Doit être "reschedule" ou "abandon"'
            });
        }

        // 1. Récupérer le RDV et l'inscription liée avec toutes les infos nécessaires
        const appointmentCheck = await db.query(`
            SELECT a.*, 
                   e.id as enrollment_id, e.status as enrollment_status,
                   e.failed_appointments_count, e.created_parent_user_id,
                   e.applicant_email, e.applicant_first_name, e.applicant_last_name,
                   e.child_first_name, e.child_last_name, e.applicant_phone,
                   e.parent_id, e.child_id, e.enrollment_date, e.lunch_assistance,
                   e.regulation_accepted, e.admin_notes as e_admin_notes,
                   e.created_at as e_created_at, e.approved_by, e.approved_at
            FROM appointments a
            LEFT JOIN enrollments e ON a.enrollment_id = e.id
            WHERE a.id = $1
        `, [id]);

        if (appointmentCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Rendez-vous non trouvé'
            });
        }

        const appointment = appointmentCheck.rows[0];

        // 2. Marquer le RDV actuel comme échoué
        await db.query(`
            UPDATE appointments
            SET 
                status = 'failed',
                appointment_outcome = $2,
                staff_notes = COALESCE($3, staff_notes),
                updated_at = NOW()
            WHERE id = $1
        `, [id, outcome, staff_notes]);

        // 3. Incrémenter le compteur d'échecs
        const newFailedCount = (appointment.failed_appointments_count || 0) + 1;

        if (outcome === 'reschedule') {
            // ============================================================
            // REPROGRAMMATION: Créer un nouveau RDV, inscription reste dans la table
            // ============================================================

            if (!new_appointment_date) {
                return res.status(400).json({
                    success: false,
                    error: 'Nouvelle date de RDV requise pour la reprogrammation'
                });
            }

            // Créer le nouveau RDV
            const newAppointmentResult = await db.query(`
                INSERT INTO appointments (
                    enrollment_id,
                    parent_id,
                    child_id,
                    created_by,
                    subject,
                    description,
                    proposed_date,
                    status,
                    location,
                    appointment_type,
                    parent_email,
                    parent_phone,
                    parent_first_name,
                    parent_last_name,
                    child_first_name,
                    child_last_name,
                    rescheduled_count
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING *
            `, [
                appointment.enrollment_id,
                null,
                null,
                req.user.userId,
                `Rendez-vous d'inscription (reprogrammé) - ${appointment.child_first_name}`,
                `Rendez-vous reprogrammé suite à échec précédent.`,
                new_appointment_date,
                'proposed',
                'Crèche Mima Elghalia',
                'inscription',
                appointment.applicant_email,
                appointment.applicant_phone || '',
                appointment.applicant_first_name || 'Parent',
                appointment.applicant_last_name || '',
                appointment.child_first_name,
                appointment.child_last_name || '',
                newFailedCount
            ]);

            const newAppointment = newAppointmentResult.rows[0];

            // Mettre à jour l'inscription avec le nouveau RDV actif (reste dans enrollments)
            await db.query(`
                UPDATE enrollments
                SET failed_appointments_count = $1,
                    active_appointment_id = $2,
                    updated_at = NOW()
                WHERE id = $3
            `, [newFailedCount, newAppointment.id, appointment.enrollment_id]);

            console.log(`📅 Nouveau RDV #${newAppointment.id} créé pour inscription #${appointment.enrollment_id}`);

            res.json({
                success: true,
                message: 'RDV échoué - Nouveau rendez-vous programmé',
                failed_appointment: { id: parseInt(id), status: 'failed' },
                new_appointment: newAppointment,
                failed_count: newFailedCount
            });

        } else {
            // ============================================================
            // ABANDON: Archiver inscription → Supprimer de enrollments
            // ============================================================

            // Archiver l'inscription dans enrollments_archive
            await db.query(`
                INSERT INTO enrollments_archive (
                    id, parent_id, child_id, enrollment_date, status,
                    lunch_assistance, regulation_accepted, appointment_date, appointment_time,
                    admin_notes, created_at, updated_at, applicant_first_name,
                    applicant_last_name, applicant_email, new_status, approved_by, approved_at
                ) VALUES (
                    $1, $2, $3, $4, 'rejected_deleted',
                    $5, $6, $7, $8,
                    $9, $10, NOW(), $11,
                    $12, $13, 'rejected_deleted', $14, $15
                )
            `, [
                appointment.enrollment_id,
                appointment.parent_id,
                appointment.child_id,
                appointment.enrollment_date || new Date(),
                appointment.lunch_assistance || false,
                appointment.regulation_accepted || false,
                appointment.proposed_date,
                appointment.proposed_date ? new Date(appointment.proposed_date).toTimeString().slice(0, 8) : null,
                staff_notes || appointment.e_admin_notes || `Abandonné après ${newFailedCount} échec(s) de RDV`,
                appointment.e_created_at || new Date(),
                appointment.applicant_first_name,
                appointment.applicant_last_name,
                appointment.applicant_email,
                appointment.approved_by,
                appointment.approved_at
            ]);

            console.log(`📦 Inscription #${appointment.enrollment_id} archivée dans enrollments_archive (abandonné)`);

            // Supprimer le compte parent s'il a été créé
            let parentDeleted = false;
            if (appointment.created_parent_user_id) {
                try {
                    const userCheck = await db.query(`
                        SELECT id, email, role FROM users WHERE id = $1 AND role = 'parent'
                    `, [appointment.created_parent_user_id]);

                    if (userCheck.rows.length > 0) {
                        await db.query(`DELETE FROM users WHERE id = $1`, [appointment.created_parent_user_id]);
                        parentDeleted = true;
                        console.log(`🗑️ Compte parent #${appointment.created_parent_user_id} supprimé`);
                    }
                } catch (deleteError) {
                    console.error('⚠️ Erreur suppression compte parent:', deleteError);
                }
            }

            // Supprimer l'inscription de la table enrollments
            await db.query(`DELETE FROM enrollments WHERE id = $1`, [appointment.enrollment_id]);

            console.log(`❌ Inscription #${appointment.enrollment_id} supprimée de enrollments (abandonnée)`);

            res.json({
                success: true,
                message: 'Inscription abandonnée et archivée' + (parentDeleted ? ' - Compte parent supprimé' : ''),
                enrollment_status: 'rejected_deleted',
                parent_deleted: parentDeleted,
                failed_count: newFailedCount,
                archived: true
            });
        }

    } catch (error) {
        console.error('❌ Erreur marquage RDV échoué:', error);
        console.error('Détails:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du traitement du rendez-vous échoué',
            details: error.message
        });
    }
};

/**
 * Créer un RDV (appelé par approveEnrollment)
 * Fonction interne - pas exposée en route
 */
exports.createAppointmentForEnrollment = async (enrollmentId, appointmentDate, proposedBy, enrollmentData) => {
    try {
        const result = await db.query(`
      INSERT INTO appointments (
        enrollment_id,
        parent_first_name,
        parent_last_name,
        parent_email,
        parent_phone,
        child_first_name,
        child_last_name,
        title,
        description,
        appointment_date,
        status,
        priority,
        proposed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
            enrollmentId,
            enrollmentData.applicant_first_name || 'Parent',
            enrollmentData.applicant_last_name || '',
            enrollmentData.applicant_email,
            enrollmentData.applicant_phone || '',
            enrollmentData.child_first_name,
            enrollmentData.child_last_name || '',
            `Rendez-vous d'inscription - ${enrollmentData.child_first_name}`,
            `Rendez-vous pour finaliser l'inscription de ${enrollmentData.child_first_name} ${enrollmentData.child_last_name || ''} à la crèche.`,
            appointmentDate,
            'pending',
            'high',
            proposedBy
        ]);

        console.log(`✅ RDV créé dans appointments: ID ${result.rows[0].id}`);
        return result.rows[0];

    } catch (error) {
        console.error('❌ Erreur création RDV:', error);
        throw error;
    }
};
