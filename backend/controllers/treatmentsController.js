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
                
                -- État
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
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
            CREATE INDEX IF NOT EXISTS idx_treatments_dates ON child_treatments(start_date, end_date);
            CREATE INDEX IF NOT EXISTS idx_administrations_treatment ON treatment_administrations(treatment_id);
            CREATE INDEX IF NOT EXISTS idx_administrations_date ON treatment_administrations(administered_at);
        `);

        console.log('✅ Tables traitements médicaux initialisées');
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
        const parentId = req.user.id;
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

        // Vérifier que l'enfant appartient au parent
        const childCheck = await db.query(`
            SELECT c.id FROM children c
            JOIN users u ON c.parent_id = u.id
            WHERE c.id = $1 AND c.parent_id = $2
        `, [child_id, parentId]);

        if (childCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'êtes pas autorisé à gérer cet enfant'
            });
        }

        // Calculer la durée en jours
        const start = new Date(start_date);
        const end = new Date(end_date);
        const duration_days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        // Insérer le traitement
        const result = await db.query(`
            INSERT INTO child_treatments (
                child_id, parent_id, medication_name, dose, notes,
                timing_type, interval_hours, specific_times,
                start_date, end_date, duration_days, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
            RETURNING *
        `, [
            child_id, parentId, medication_name, dose, notes || null,
            timing_type, interval_hours, specific_times,
            start_date, end_date, duration_days
        ]);

        res.status(201).json({
            success: true,
            message: 'Traitement créé avec succès',
            treatment: result.rows[0]
        });

    } catch (error) {
        console.error('Erreur création traitement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du traitement'
        });
    }
};

/**
 * Récupérer les traitements de mes enfants (parent)
 * GET /api/treatments/my-children
 */
const getMyChildrenTreatments = async (req, res) => {
    try {
        const parentId = req.user.id;
        const { status = 'all' } = req.query;

        let statusFilter = '';
        if (status !== 'all') {
            statusFilter = `AND ct.status = '${status}'`;
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
            WHERE ct.parent_id = $1 ${statusFilter}
            ORDER BY ct.status = 'active' DESC, ct.created_at DESC
        `, [parentId]);

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
            AND a.check_in_time IS NOT NULL
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
                    dose: treatment.dose
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
 * Envoyer les notifications au staff
 */
const sendStaffNotifications = async (notifications) => {
    try {
        // Récupérer tous les tokens push du staff
        const staffTokens = await db.query(`
            SELECT DISTINCT push_token 
            FROM users 
            WHERE role IN ('staff', 'admin', 'direction') 
            AND push_token IS NOT NULL
        `);

        if (staffTokens.rows.length === 0) {
            console.log('⚠️ Aucun token push staff trouvé');
            return;
        }

        // Créer les notifications en base
        for (const notif of notifications) {
            await db.query(`
                INSERT INTO notifications (
                    user_id, title, message, type, data, created_at
                )
                SELECT id, $1, $2, 'treatment', $3, NOW()
                FROM users 
                WHERE role IN ('staff', 'admin', 'direction')
            `, [
                '💊 Traitement à donner',
                `${notif.child_name} - ${notif.medication} ${notif.dose}`,
                JSON.stringify({ treatment_id: notif.treatment_id })
            ]);
        }

        console.log(`✅ ${notifications.length} notifications envoyées au staff`);

    } catch (error) {
        console.error('❌ Erreur envoi notifications:', error);
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
    administerTreatment,
    getTreatmentHistory,
    getChildTodayTreatments,
    checkAndNotifyTreatments
};
