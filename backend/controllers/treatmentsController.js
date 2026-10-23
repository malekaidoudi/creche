/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTRÔLEUR TRAITEMENTS MÉDICAUX - CRÈCHE MIMA ELGHALIA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Gestion des traitements médicaux des enfants
 * - Parents: créer, modifier, supprimer des traitements
 * - Staff: voir les traitements à administrer, confirmer l'administration
 * - Cron: vérifier et envoyer les notifications
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const db = require('../config/db_postgres');
const pushNotificationService = require('../services/pushNotificationService');

/**
 * Notifier le job cron d'un changement de traitement pour ajuster la mise en veille
 */
const notifyTreatmentChange = () => {
    try {
        const { treatmentEvents } = require('../jobs/treatmentJob');
        if (treatmentEvents) {
            treatmentEvents.emit('change');
        }
    } catch (err) {
        // Ignorer si le job n'est pas encore initialisé
    }
};

/**
 * Initialiser les tables pour les traitements médicaux
 */
const initTreatmentsTables = async () => {
    try {
        // Table des traitements
        await db.query(`
            CREATE TABLE IF NOT EXISTS child_treatments (
                id SERIAL PRIMARY KEY,
                child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
                parent_id INTEGER REFERENCES users(id),
                
                -- Informations médicament
                medication_name VARCHAR(255) NOT NULL,
                dose VARCHAR(100) NOT NULL,
                notes TEXT,
                
                -- Planning
                timing_type VARCHAR(50) NOT NULL DEFAULT 'interval',
                interval_hours INTEGER DEFAULT 4,
                specific_times TEXT[],
                
                -- Durée
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                duration_days INTEGER NOT NULL,
                
                -- État et validation
                status VARCHAR(20) DEFAULT 'active',
                approval_status VARCHAR(20) DEFAULT 'approved',
                assigned_staff_id INTEGER REFERENCES users(id),
                approved_by INTEGER REFERENCES users(id),
                approved_at TIMESTAMP,
                rejection_reason TEXT,
                document_url VARCHAR(500),

                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Migration progressive : ajouter les colonnes d'approbation et assignation si elles manquent
        await db.query(`
            ALTER TABLE child_treatments ADD COLUMN IF NOT EXISTS assigned_staff_id INTEGER REFERENCES users(id);
            ALTER TABLE child_treatments ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved';
            ALTER TABLE child_treatments ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);
            ALTER TABLE child_treatments ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
            ALTER TABLE child_treatments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
            ALTER TABLE child_treatments ADD COLUMN IF NOT EXISTS document_url VARCHAR(500);
        `);

        // Table des administrations
        await db.query(`
            CREATE TABLE IF NOT EXISTS treatment_administrations (
                id SERIAL PRIMARY KEY,
                treatment_id INTEGER REFERENCES child_treatments(id) ON DELETE CASCADE,
                administered_by INTEGER REFERENCES users(id),
                administered_at TIMESTAMP NOT NULL,
                scheduled_time TIME,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Index pour les requêtes fréquentes
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_treatments_child_id ON child_treatments(child_id);
            CREATE INDEX IF NOT EXISTS idx_treatments_status ON child_treatments(status);
            CREATE INDEX IF NOT EXISTS idx_treatments_approval ON child_treatments(approval_status);
            CREATE INDEX IF NOT EXISTS idx_treatments_assigned_staff ON child_treatments(assigned_staff_id);
            CREATE INDEX IF NOT EXISTS idx_treatments_dates ON child_treatments(start_date, end_date);
            CREATE INDEX IF NOT EXISTS idx_administrations_treatment ON treatment_administrations(treatment_id);
            CREATE INDEX IF NOT EXISTS idx_administrations_date ON treatment_administrations(administered_at);
        `);

        console.log('✅ Tables traitements médicaux et workflow d\'assignation initialisés');
        return true;
    } catch (error) {
        console.error('❌ Erreur initialisation tables traitements:', error);
        return false;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINTS PARENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Créer un nouveau traitement
 * POST /api/treatments
 */
const createTreatment = async (req, res) => {
    try {
        const parentId = req.user.id || req.user.userId;
        const {
            child_id,
            medication_name,
            dose,
            notes,
            timing_type = 'interval',
            interval_hours = 4,
            specific_times = [],
            start_date,
            end_date
        } = req.body;

        // Validation
        if (!child_id || !medication_name || !dose || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Champs requis: child_id, medication_name, dose, start_date, end_date'
            });
        }

        // Vérifier que l'enfant appartient au parent (ou admin/developer)
        const role = req.user.role === 'developer' ? 'admin' : req.user.role;
        if (role !== 'admin') {
            const childCheck = await db.query(`
                SELECT c.id FROM children c
                WHERE c.id = $1 AND (
                    c.parent_id = $2
                    OR EXISTS (SELECT 1 FROM parent_children pc WHERE pc.child_id = c.id AND pc.parent_id = $2)
                    OR EXISTS (SELECT 1 FROM enrollments e WHERE e.child_id = c.id AND e.parent_id = $2 AND e.status = 'approved')
                )
            `, [child_id, parentId]);

            if (childCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Vous n\'êtes pas autorisé à gérer cet enfant'
                });
            }
        }

        // Calculer la durée en jours
        const start = new Date(start_date);
        const end = new Date(end_date);
        const duration_days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

        // Déterminer le statut initial selon le rôle
        const isAdmin = role === 'admin';
        const initialStatus = isAdmin ? 'active' : 'pending';
        const initialApproval = isAdmin ? 'approved' : 'pending_approval';
        const assignedStaffId = isAdmin ? (req.body.assigned_staff_id || null) : null;

        // Insérer le traitement
        const result = await db.query(`
            INSERT INTO child_treatments (
                child_id, parent_id, medication_name, dose, notes,
                timing_type, interval_hours, specific_times,
                start_date, end_date, duration_days, status,
                approval_status, assigned_staff_id, approved_by, approved_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
        `, [
            child_id, parentId, medication_name, dose, notes || null,
            timing_type, interval_hours, JSON.stringify(specific_times),
            start_date, end_date, duration_days, initialStatus,
            initialApproval, assignedStaffId,
            isAdmin ? parentId : null,
            isAdmin ? new Date() : null
        ]);

        const newTreatment = result.rows[0];

        // Si créé par un parent, notifier la direction/admin pour validation le matin
        if (!isAdmin) {
            try {
                const childInfo = await db.query('SELECT first_name, last_name FROM children WHERE id = $1', [child_id]);
                const childName = childInfo.rows[0] ? `${childInfo.rows[0].first_name} ${childInfo.rows[0].last_name}` : 'Enfant';
                
                const admins = await db.query("SELECT id FROM users WHERE role IN ('admin', 'developer') AND is_active = true");
                const adminIds = admins.rows.map(a => a.id);
                
                if (adminIds.length > 0) {
                    const title = '📋 Demande de médicament';
                    const message = `Nouvelle demande pour ${childName} : ${medication_name} (${dose}) en attente de validation.`;
                    
                    for (const adminId of adminIds) {
                        await db.query(`
                            INSERT INTO notifications (user_id, title, message, type, is_read)
                            VALUES ($1, $2, $3, 'treatment', false)
                        `, [adminId, title, message]);
                    }

                    pushNotificationService.sendPushToMany(adminIds, {
                        title,
                        message,
                        url: '/dashboard/treatments'
                    });
                }
            } catch (notifErr) {
                console.error('Erreur notification admin nouvelle demande médicament:', notifErr.message);
            }
        }

        res.status(201).json({
            success: true,
            message: isAdmin 
                ? 'Traitement créé et validé avec succès' 
                : 'Demande de traitement transmise à la direction pour validation',
            treatment: newTreatment
        });

        notifyTreatmentChange();

    } catch (error) {
        console.error('Erreur création traitement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du traitement'
        });
    }
};

/**
 * Récupérer les demandes de traitement en attente de validation (pour l'admin)
 * GET /api/treatments/pending
 */
const getPendingTreatments = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                ct.*,
                c.first_name as child_first_name,
                c.last_name as child_last_name,
                c.photo_url as child_photo,
                u.first_name as parent_first_name,
                u.last_name as parent_last_name,
                u.phone as parent_phone
            FROM child_treatments ct
            JOIN children c ON ct.child_id = c.id
            JOIN users u ON ct.parent_id = u.id
            WHERE ct.approval_status = 'pending_approval'
            ORDER BY ct.created_at DESC
        `);

        res.json({
            success: true,
            pending_treatments: result.rows
        });
    } catch (error) {
        console.error('Erreur getPendingTreatments:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

/**
 * Valider une demande de traitement et assigner à un membre du staff
 * PUT /api/treatments/:id/approve
 */
const approveTreatment = async (req, res) => {
    try {
        const treatmentId = req.params.id;
        const approverId = req.user.id || req.user.userId;
        const { assigned_staff_id } = req.body;

        if (!assigned_staff_id) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez assigner un membre du personnel pour ce traitement'
            });
        }

        // Vérifier que le traitement existe
        const current = await db.query(`
            SELECT ct.*, c.first_name as child_first_name, c.last_name as child_last_name
            FROM child_treatments ct
            JOIN children c ON ct.child_id = c.id
            WHERE ct.id = $1
        `, [treatmentId]);

        if (current.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Traitement non trouvé' });
        }

        const treatment = current.rows[0];

        // Mettre à jour le traitement
        const updateResult = await db.query(`
            UPDATE child_treatments
            SET approval_status = 'approved',
                status = 'active',
                assigned_staff_id = $1,
                approved_by = $2,
                approved_at = NOW(),
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [assigned_staff_id, approverId, treatmentId]);

        const updated = updateResult.rows[0];

        // 1. Notifier le staff assigné
        try {
            const staffTitle = '💊 Traitement médical assigné';
            const staffMessage = `Vous êtes assigné(e) pour administrer ${treatment.medication_name} (${treatment.dose}) à ${treatment.child_first_name} ${treatment.child_last_name}.`;
            
            await db.query(`
                INSERT INTO notifications (user_id, title, message, type, is_read)
                VALUES ($1, $2, $3, 'treatment', false)
            `, [assigned_staff_id, staffTitle, staffMessage]);

            pushNotificationService.sendPushToUser(assigned_staff_id, {
                title: staffTitle,
                message: staffMessage,
                url: '/dashboard/treatments'
            });
        } catch (e) {
            console.error('Erreur notif staff assigné:', e.message);
        }

        // 2. Notifier le parent que la demande est validée
        if (treatment.parent_id) {
            try {
                const parentTitle = '✅ Traitement médical validé';
                const parentMessage = `Le traitement (${treatment.medication_name}) pour ${treatment.child_first_name} a été validé et pris en charge par l'équipe.`;
                
                await db.query(`
                    INSERT INTO notifications (user_id, title, message, type, is_read)
                    VALUES ($1, $2, $3, 'treatment', false)
                `, [treatment.parent_id, parentTitle, parentMessage]);

                pushNotificationService.sendPushToUser(treatment.parent_id, {
                    title: parentTitle,
                    message: parentMessage,
                    url: '/mon-espace/treatments'
                });
            } catch (e) {
                console.error('Erreur notif parent traitement validé:', e.message);
            }
        }

        notifyTreatmentChange();

        res.json({
            success: true,
            message: 'Traitement approuvé et assigné avec succès',
            treatment: updated
        });

    } catch (error) {
        console.error('Erreur approveTreatment:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de la validation' });
    }
};

/**
 * Refuser une demande de traitement
 * PUT /api/treatments/:id/reject
 */
const rejectTreatment = async (req, res) => {
    try {
        const treatmentId = req.params.id;
        const approverId = req.user.id || req.user.userId;
        const { rejection_reason } = req.body;

        const current = await db.query(`
            SELECT ct.*, c.first_name as child_first_name, c.last_name as child_last_name
            FROM child_treatments ct
            JOIN children c ON ct.child_id = c.id
            WHERE ct.id = $1
        `, [treatmentId]);

        if (current.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Traitement non trouvé' });
        }

        const treatment = current.rows[0];

        await db.query(`
            UPDATE child_treatments
            SET approval_status = 'rejected',
                status = 'cancelled',
                rejection_reason = $1,
                approved_by = $2,
                approved_at = NOW(),
                updated_at = NOW()
            WHERE id = $3
        `, [rejection_reason || 'Demande non conforme', approverId, treatmentId]);

        // Notifier le parent
        if (treatment.parent_id) {
            try {
                const parentTitle = '❌ Demande de traitement non validée';
                const parentMessage = `Le traitement (${treatment.medication_name}) pour ${treatment.child_first_name} n'a pas pu être validé. Motif : ${rejection_reason || 'Non précisé'}`;
                
                await db.query(`
                    INSERT INTO notifications (user_id, title, message, type, is_read)
                    VALUES ($1, $2, $3, 'treatment', false)
                `, [treatment.parent_id, parentTitle, parentMessage]);

                pushNotificationService.sendPushToUser(treatment.parent_id, {
                    title: parentTitle,
                    message: parentMessage,
                    url: '/mon-espace/treatments'
                });
            } catch (e) {
                console.error('Erreur notif refus traitement:', e.message);
            }
        }

        notifyTreatmentChange();

        res.json({
            success: true,
            message: 'Demande de traitement refusée'
        });

    } catch (error) {
        console.error('Erreur rejectTreatment:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur lors du refus' });
    }
};

/**
 * Récupérer les traitements de mes enfants (parent)
 * GET /api/treatments/my-children
 */
const getMyChildrenTreatments = async (req, res) => {
    try {
        const parentId = req.user.id || req.user.userId;
        const { status = 'all', child_id } = req.query;

        let statusFilter = '';
        if (status !== 'all') {
            statusFilter = `AND ct.status = '${status}'`;
        }

        const params = [parentId];
        let childFilter = '';
        if (child_id) {
            params.push(child_id);
            childFilter = `AND ct.child_id = $${params.length}`;
        }

        const result = await db.query(`
            SELECT 
                ct.*,
                c.first_name as child_first_name,
                c.last_name as child_last_name,
                c.photo_url as child_photo,
                (
                    SELECT COUNT(*) FROM treatment_administrations ta 
                    WHERE ta.treatment_id = ct.id
                ) as administrations_count,
                (
                    SELECT ta.administered_at FROM treatment_administrations ta 
                    WHERE ta.treatment_id = ct.id 
                    ORDER BY ta.administered_at DESC LIMIT 1
                ) as last_administration
            FROM child_treatments ct
            JOIN children c ON ct.child_id = c.id
            WHERE (
                ct.parent_id = $1
                OR c.parent_id = $1
                OR EXISTS (SELECT 1 FROM parent_children pc WHERE pc.child_id = c.id AND pc.parent_id = $1)
            ) ${statusFilter} ${childFilter}
            ORDER BY ct.status = 'active' DESC, ct.created_at DESC
        `, params);

        res.json({
            success: true,
            treatments: result.rows
        });

    } catch (error) {
        console.error('Erreur récupération traitements:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des traitements'
        });
    }
};

/**
 * Modifier un traitement
 * PUT /api/treatments/:id
 */
const updateTreatment = async (req, res) => {
    try {
        const parentId = req.user.id;
        const treatmentId = req.params.id;
        const {
            medication_name,
            dose,
            notes,
            timing_type,
            interval_hours,
            specific_times,
            end_date
        } = req.body;

        // Vérifier que le traitement appartient au parent
        const check = await db.query(`
            SELECT id FROM child_treatments 
            WHERE id = $1 AND parent_id = $2
        `, [treatmentId, parentId]);

        if (check.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Traitement non trouvé ou non autorisé'
            });
        }

        // Mettre à jour
        const result = await db.query(`
            UPDATE child_treatments SET
                medication_name = COALESCE($1, medication_name),
                dose = COALESCE($2, dose),
                notes = COALESCE($3, notes),
                timing_type = COALESCE($4, timing_type),
                interval_hours = COALESCE($5, interval_hours),
                specific_times = COALESCE($6, specific_times),
                end_date = COALESCE($7, end_date),
                updated_at = NOW()
            WHERE id = $8
            RETURNING *
        `, [
            medication_name, dose, notes, timing_type,
            interval_hours, specific_times, end_date, treatmentId
        ]);

        res.json({
            success: true,
            message: 'Traitement mis à jour',
            treatment: result.rows[0]
        });

        notifyTreatmentChange();

    } catch (error) {
        console.error('Erreur modification traitement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la modification du traitement'
        });
    }
};

/**
 * Annuler un traitement
 * DELETE /api/treatments/:id
 */
const cancelTreatment = async (req, res) => {
    try {
        const parentId = req.user.id;
        const treatmentId = req.params.id;

        // Vérifier que le traitement appartient au parent
        const check = await db.query(`
            SELECT id FROM child_treatments 
            WHERE id = $1 AND parent_id = $2
        `, [treatmentId, parentId]);

        if (check.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Traitement non trouvé ou non autorisé'
            });
        }

        // Marquer comme annulé (soft delete)
        await db.query(`
            UPDATE child_treatments SET status = 'cancelled', updated_at = NOW()
            WHERE id = $1
        `, [treatmentId]);

        res.json({
            success: true,
            message: 'Traitement annulé'
        });

        notifyTreatmentChange();

    } catch (error) {
        console.error('Erreur annulation traitement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'annulation du traitement'
        });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINTS STAFF
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupérer les traitements à administrer aujourd'hui
 * GET /api/treatments/today
 */
const getTodayTreatments = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Récupérer les traitements actifs pour aujourd'hui
        // avec les enfants présents
        const result = await db.query(`
            SELECT 
                ct.*,
                c.id as child_id,
                c.first_name as child_first_name,
                c.last_name as child_last_name,
                c.photo_url as child_photo,
                c.birth_date,
                a.check_in_time,
                p.first_name as parent_first_name,
                p.last_name as parent_last_name,
                p.phone as parent_phone,
                (
                    SELECT json_agg(json_build_object(
                        'id', ta.id,
                        'administered_at', ta.administered_at,
                        'administered_by', ta.administered_by,
                        'staff_name', CONCAT(u.first_name, ' ', u.last_name)
                    ) ORDER BY ta.administered_at DESC)
                    FROM treatment_administrations ta
                    LEFT JOIN users u ON ta.administered_by = u.id
                    WHERE ta.treatment_id = ct.id 
                    AND DATE(ta.administered_at) = $1
                ) as today_administrations
            FROM child_treatments ct
            JOIN children c ON ct.child_id = c.id
            JOIN users p ON c.parent_id = p.id
            LEFT JOIN attendance a ON c.id = a.child_id AND a.date = $1
            WHERE ct.status = 'active'
            AND $1 BETWEEN ct.start_date AND ct.end_date
            ORDER BY c.first_name, c.last_name
        `, [today]);

        // Calculer les prochaines heures de prise pour chaque traitement
        const treatmentsWithSchedule = result.rows.map(treatment => {
            const schedule = calculateNextDoses(treatment);
            return {
                ...treatment,
                schedule
            };
        });

        res.json({
            success: true,
            date: today,
            treatments: treatmentsWithSchedule
        });

    } catch (error) {
        console.error('Erreur récupération traitements du jour:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des traitements'
        });
    }
};

/**
 * Confirmer l'administration d'un traitement
 * POST /api/treatments/:id/administer
 */
const administerTreatment = async (req, res) => {
    try {
        const staffId = req.user.id;
        const treatmentId = req.params.id;
        const { notes, scheduled_time } = req.body;

        // Vérifier que le traitement existe et est actif
        const check = await db.query(`
            SELECT ct.*, c.first_name, c.last_name
            FROM child_treatments ct
            JOIN children c ON ct.child_id = c.id
            WHERE ct.id = $1 AND ct.status = 'active'
        `, [treatmentId]);

        if (check.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Traitement non trouvé ou inactif'
            });
        }

        const treatment = check.rows[0];

        // Enregistrer l'administration
        const result = await db.query(`
            INSERT INTO treatment_administrations (
                treatment_id, administered_by, administered_at, scheduled_time, notes
            ) VALUES ($1, $2, NOW(), $3, $4)
            RETURNING *
        `, [treatmentId, staffId, scheduled_time || null, notes || null]);

        // Vérifier si le traitement est terminé (date de fin atteinte)
        const today = new Date().toISOString().split('T')[0];
        if (today >= treatment.end_date) {
            await db.query(`
                UPDATE child_treatments SET status = 'completed', updated_at = NOW()
                WHERE id = $1
            `, [treatmentId]);
        }

        res.json({
            success: true,
            message: `Traitement administré à ${treatment.first_name} ${treatment.last_name}`,
            administration: result.rows[0]
        });

    } catch (error) {
        console.error('Erreur administration traitement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement de l\'administration'
        });
    }
};

/**
 * Récupérer l'historique des administrations d'un traitement
 * GET /api/treatments/:id/history
 */
const getTreatmentHistory = async (req, res) => {
    try {
        const treatmentId = req.params.id;

        const result = await db.query(`
            SELECT 
                ta.*,
                u.first_name as staff_first_name,
                u.last_name as staff_last_name
            FROM treatment_administrations ta
            LEFT JOIN users u ON ta.administered_by = u.id
            WHERE ta.treatment_id = $1
            ORDER BY ta.administered_at DESC
        `, [treatmentId]);

        res.json({
            success: true,
            history: result.rows
        });

    } catch (error) {
        console.error('Erreur récupération historique:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'historique'
        });
    }
};

/**
 * Récupérer les traitements d'un enfant pour le rapport journalier
 * GET /api/treatments/child/:childId/today
 */
const getChildTodayTreatments = async (req, res) => {
    try {
        const { childId } = req.params;
        const today = new Date().toISOString().split('T')[0];

        const result = await db.query(`
            SELECT 
                ct.id,
                ct.medication_name,
                ct.dose,
                ct.timing_type,
                ct.interval_hours,
                ct.specific_times,
                ct.notes as treatment_notes,
                (
                    SELECT json_agg(json_build_object(
                        'id', ta.id,
                        'administered_at', ta.administered_at,
                        'notes', ta.notes,
                        'staff_name', CONCAT(u.first_name, ' ', u.last_name)
                    ) ORDER BY ta.administered_at)
                    FROM treatment_administrations ta
                    LEFT JOIN users u ON ta.administered_by = u.id
                    WHERE ta.treatment_id = ct.id 
                    AND DATE(ta.administered_at) = $2
                ) as administrations
            FROM child_treatments ct
            WHERE ct.child_id = $1
            AND ct.status = 'active'
            AND $2 BETWEEN ct.start_date AND ct.end_date
            ORDER BY ct.medication_name
        `, [childId, today]);

        res.json({
            success: true,
            treatments: result.rows
        });

    } catch (error) {
        console.error('Erreur récupération traitements enfant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des traitements'
        });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// CRON JOB - NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifier les traitements et envoyer les notifications
 * Appelé toutes les 15 minutes par le cron
 */
const checkAndNotifyTreatments = async () => {
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM

        console.log(`🔔 Vérification traitements: ${today} ${currentTime}`);

        // Récupérer les traitements actifs avec enfants présents
        const treatments = await db.query(`
            SELECT 
                ct.*,
                c.id as child_id,
                c.first_name as child_first_name,
                c.last_name as child_last_name,
                a.check_in_time,
                (
                    SELECT ta.administered_at 
                    FROM treatment_administrations ta 
                    WHERE ta.treatment_id = ct.id 
                    ORDER BY ta.administered_at DESC LIMIT 1
                ) as last_administration
            FROM child_treatments ct
            JOIN children c ON ct.child_id = c.id
            JOIN attendance a ON c.id = a.child_id AND a.date = $1
            WHERE ct.status = 'active'
            AND (ct.approval_status = 'approved' OR ct.approval_status IS NULL)
            AND $1 BETWEEN ct.start_date AND ct.end_date
            AND a.check_in_time IS NOT NULL
            AND a.check_out_time IS NULL
        `, [today]);

        const notificationsToSend = [];

        for (const treatment of treatments.rows) {
            const shouldNotify = checkIfShouldNotify(treatment, now);

            if (shouldNotify) {
                notificationsToSend.push({
                    treatment_id: treatment.id,
                    child_name: `${treatment.child_first_name} ${treatment.child_last_name}`,
                    medication: treatment.medication_name,
                    dose: treatment.dose,
                    assigned_staff_id: treatment.assigned_staff_id
                });
            }
        }

        // Envoyer les notifications au staff
        if (notificationsToSend.length > 0) {
            await sendStaffNotifications(notificationsToSend);
        }

        // Mettre à jour les traitements terminés
        await db.query(`
            UPDATE child_treatments 
            SET status = 'completed', updated_at = NOW()
            WHERE status = 'active' AND end_date < $1
        `, [today]);

        return {
            checked: treatments.rows.length,
            notifications: notificationsToSend.length
        };

    } catch (error) {
        console.error('❌ Erreur vérification traitements:', error);
        return { error: error.message };
    }
};

/**
 * Vérifier si un traitement doit déclencher une notification
 */
const checkIfShouldNotify = (treatment, now) => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Heures des repas (approximatives)
    const mealTimes = {
        breakfast: 8 * 60,      // 08:00
        lunch: 12 * 60,         // 12:00
        snack: 16 * 60          // 16:00
    };

    switch (treatment.timing_type) {
        case 'before_meal':
            // 15 minutes avant les repas
            for (const mealTime of Object.values(mealTimes)) {
                const notifyTime = mealTime - 15;
                if (Math.abs(currentMinutes - notifyTime) <= 7) {
                    return !hasBeenAdministeredRecently(treatment, 30);
                }
            }
            return false;

        case 'after_meal':
            // 30 minutes après les repas
            for (const mealTime of Object.values(mealTimes)) {
                const notifyTime = mealTime + 30;
                if (Math.abs(currentMinutes - notifyTime) <= 7) {
                    return !hasBeenAdministeredRecently(treatment, 30);
                }
            }
            return false;

        case 'interval':
            // Selon l'intervalle défini
            const intervalMinutes = (treatment.interval_hours || 4) * 60;
            const lastAdmin = treatment.last_administration
                ? new Date(treatment.last_administration)
                : null;

            if (!lastAdmin) {
                // Première dose du jour - notifier si après 8h
                return currentMinutes >= 8 * 60;
            }

            const minutesSinceLastAdmin = (now - lastAdmin) / (1000 * 60);
            // Notifier si l'intervalle est atteint (avec 7 min de tolérance)
            return minutesSinceLastAdmin >= intervalMinutes - 7;

        case 'specific_times':
            // Heures spécifiques
            if (treatment.specific_times && treatment.specific_times.length > 0) {
                for (const time of treatment.specific_times) {
                    const [hours, minutes] = time.split(':').map(Number);
                    const targetMinutes = hours * 60 + minutes;
                    if (Math.abs(currentMinutes - targetMinutes) <= 7) {
                        return !hasBeenAdministeredRecently(treatment, 30);
                    }
                }
            }
            return false;

        default:
            return false;
    }
};

/**
 * Vérifier si le traitement a été administré récemment
 */
const hasBeenAdministeredRecently = (treatment, withinMinutes) => {
    if (!treatment.last_administration) return false;

    const lastAdmin = new Date(treatment.last_administration);
    const now = new Date();
    const diffMinutes = (now - lastAdmin) / (1000 * 60);

    return diffMinutes < withinMinutes;
};

/**
 * Envoyer les notifications au staff (ciblé sur le staff assigné en priorité)
 */
const sendStaffNotifications = async (notifications) => {
    try {
        const admins = await db.query(`
            SELECT id FROM users WHERE role IN ('admin', 'developer', 'direction') AND is_active = true
        `);
        const adminIds = admins.rows.map(u => u.id);

        for (const notif of notifications) {
            const title = '💊 Traitement à administrer maintenant';
            const message = `${notif.child_name} - ${notif.medication} (${notif.dose})`;

            const targetUserIds = new Set();

            if (notif.assigned_staff_id) {
                targetUserIds.add(notif.assigned_staff_id);
            } else {
                // Si pas de staff assigné, envoyer à tous les staff/admin
                const allStaff = await db.query(`
                    SELECT id FROM users WHERE role IN ('staff', 'admin') AND is_active = true
                `);
                allStaff.rows.forEach(u => targetUserIds.add(u.id));
            }

            // Toujours mettre une copie aux admins pour traçabilité
            adminIds.forEach(id => targetUserIds.add(id));

            const userIdsArray = Array.from(targetUserIds);

            for (const uid of userIdsArray) {
                await db.query(`
                    INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                    VALUES ($1, $2, $3, 'treatment', false, NOW())
                `, [uid, title, message]);
            }

            pushNotificationService.sendPushToMany(userIdsArray, {
                title,
                message,
                url: '/dashboard/treatments',
                tag: `treatment-${notif.treatment_id}`
            });
        }

        console.log(`✅ ${notifications.length} rappels de médicaments envoyés`);

    } catch (error) {
        console.error('❌ Erreur envoi notifications de traitement:', error);
    }
};

/**
 * Calculer les prochaines doses pour un traitement
 */
const calculateNextDoses = (treatment) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const schedule = [];

    const mealTimes = {
        'Petit-déjeuner': 8 * 60,
        'Déjeuner': 12 * 60,
        'Goûter': 16 * 60
    };

    switch (treatment.timing_type) {
        case 'before_meal':
            for (const [meal, time] of Object.entries(mealTimes)) {
                schedule.push({
                    time: formatMinutesToTime(time - 15),
                    label: `Avant ${meal}`,
                    passed: currentMinutes > time - 15
                });
            }
            break;

        case 'after_meal':
            for (const [meal, time] of Object.entries(mealTimes)) {
                schedule.push({
                    time: formatMinutesToTime(time + 30),
                    label: `Après ${meal}`,
                    passed: currentMinutes > time + 30
                });
            }
            break;

        case 'interval':
            const intervalHours = treatment.interval_hours || 4;
            let startTime = 8 * 60; // 08:00
            const endTime = 18 * 60; // 18:00

            while (startTime <= endTime) {
                schedule.push({
                    time: formatMinutesToTime(startTime),
                    label: `Toutes les ${intervalHours}h`,
                    passed: currentMinutes > startTime
                });
                startTime += intervalHours * 60;
            }
            break;

        case 'specific_times':
            if (treatment.specific_times) {
                for (const time of treatment.specific_times) {
                    const [hours, minutes] = time.split(':').map(Number);
                    const targetMinutes = hours * 60 + minutes;
                    schedule.push({
                        time,
                        label: 'Heure fixe',
                        passed: currentMinutes > targetMinutes
                    });
                }
            }
            break;
    }

    return schedule;
};

/**
 * Formater les minutes en HH:MM
 */
const formatMinutesToTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

module.exports = {
    initTreatmentsTables,
    createTreatment,
    getMyChildrenTreatments,
    updateTreatment,
    cancelTreatment,
    getTodayTreatments,
    getPendingTreatments,
    approveTreatment,
    rejectTreatment,
    administerTreatment,
    getTreatmentHistory,
    getChildTodayTreatments,
    checkAndNotifyTreatments
};
