/**
 * Controller pour les rapports journaliers (daily_reports)
 * Gère le suivi quotidien des enfants par les éducatrices
 */

const db = require('../config/db_postgres');

/**
 * Calcule l'âge en mois d'un enfant
 */
const calculateAgeInMonths = (birthDate) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    return months;
};

/**
 * Détermine le type de rapport basé sur l'âge de l'enfant
 * baby = < 12 mois, child = >= 12 mois
 */
const getReportType = (birthDate) => {
    const ageInMonths = calculateAgeInMonths(birthDate);
    return ageInMonths < 12 ? 'baby' : 'child';
};

/**
 * GET /api/daily-reports/children/today?date=YYYY-MM-DD
 * Liste des enfants qui ont été PRÉSENTS à la date spécifiée (ou aujourd'hui par défaut)
 * Inclut les enfants présents ET ceux déjà partis (check_out)
 * Filtre selon l'affectation du staff connecté (baby/child/both)
 */
const getChildrenForToday = async (req, res) => {
    try {
        // Utiliser la date passée en query string ou aujourd'hui par défaut
        const reportDate = req.query.date || new Date().toISOString().split('T')[0];
        const userId = req.user.id;
        const userRole = req.user.role;

        // Récupérer l'affectation du staff connecté
        let staffAgeGroup = 'both'; // Par défaut, voir tous les enfants
        if (userRole === 'staff' || userRole === 'admin') {
            const assignmentResult = await db.query(
                'SELECT age_group FROM staff_age_assignments WHERE staff_id = $1',
                [userId]
            );
            if (assignmentResult.rows.length > 0) {
                staffAgeGroup = assignmentResult.rows[0].age_group;
            }
        }

        // Récupérer tous les enfants qui ont été présents ce jour-là (check_in existe)
        const result = await db.query(`
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.birth_date,
        c.photo_url,
        c.gender,
        dr.id as report_id,
        dr.status as report_status,
        dr.created_at as report_created_at,
        a.check_in_time,
        a.check_out_time,
        cs.quantity as diaper_stock,
        cs.alert_threshold as diaper_alert_threshold
      FROM children c
      INNER JOIN attendance a ON c.id = a.child_id AND DATE(a.date) = DATE($1) AND a.check_in_time IS NOT NULL
      LEFT JOIN daily_reports dr ON c.id = dr.child_id AND DATE(dr.report_date) = DATE($1)
      LEFT JOIN child_supplies cs ON c.id = cs.child_id AND cs.supply_type = 'diapers'
      WHERE c.is_active = true
      ORDER BY c.first_name, c.last_name
    `, [reportDate]);

        // Enrichir avec le type de rapport et alerte couches
        let children = result.rows.map(child => ({
            ...child,
            report_type: getReportType(child.birth_date),
            age_in_months: calculateAgeInMonths(child.birth_date),
            has_report: !!child.report_id,
            is_present: !child.check_out_time,
            has_left: !!child.check_out_time,
            diaper_stock: child.diaper_stock || 0,
            diaper_low_stock: (child.diaper_stock || 0) <= (child.diaper_alert_threshold || 10)
        }));

        // Filtrer selon l'affectation du staff (sauf si 'both')
        if (staffAgeGroup !== 'both') {
            children = children.filter(child => child.report_type === staffAgeGroup);
        }

        res.json({
            success: true,
            date: reportDate,
            total: children.length,
            with_report: children.filter(c => c.has_report).length,
            without_report: children.filter(c => !c.has_report).length,
            still_present: children.filter(c => c.is_present).length,
            already_left: children.filter(c => c.has_left).length,
            children
        });
    } catch (error) {
        console.error('Erreur getChildrenForToday:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * GET /api/daily-reports/:childId/:date
 * Récupérer un rapport spécifique
 */
const getReport = async (req, res) => {
    try {
        const { childId, date } = req.params;

        const result = await db.query(`
      SELECT 
        dr.*,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        c.birth_date,
        c.photo_url as child_photo,
        u.first_name as educator_first_name,
        u.last_name as educator_last_name
      FROM daily_reports dr
      INNER JOIN children c ON dr.child_id = c.id
      LEFT JOIN users u ON dr.created_by = u.id
      WHERE dr.child_id = $1 AND dr.report_date = $2
    `, [childId, date]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rapport non trouvé pour cette date'
            });
        }

        const report = result.rows[0];
        report.report_type = getReportType(report.birth_date);

        // Récupérer les repas détaillés
        const mealsResult = await db.query(
            'SELECT * FROM daily_meals WHERE report_id = $1 ORDER BY period',
            [report.id]
        );
        report.meals_details = mealsResult.rows;

        // Récupérer les changements de couches détaillés
        const diapersResult = await db.query(
            'SELECT * FROM daily_diaper_changes WHERE report_id = $1 ORDER BY change_time',
            [report.id]
        );
        report.diaper_changes_details = diapersResult.rows;

        // Récupérer les fournitures apportées ce jour
        const suppliesResult = await db.query(
            'SELECT supply_type, quantity, description FROM daily_supplies_brought WHERE child_id = $1 AND brought_date = $2',
            [childId, date]
        );
        report.today_supplies = suppliesResult.rows;

        res.json({ success: true, report });
    } catch (error) {
        console.error('Erreur getReport:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * GET /api/daily-reports/:childId/history
 * Historique des rapports d'un enfant
 */
const getReportHistory = async (req, res) => {
    try {
        const { childId } = req.params;
        const { limit = 30, offset = 0 } = req.query;

        // Vérifier l'accès (parent ne peut voir que ses enfants)
        if (req.user.role === 'parent') {
            // Utilise children.parent_id OU enrollments.parent_id (comme la section "Mes enfants")
            const accessCheck = await db.query(`
        SELECT 1 FROM children c
        LEFT JOIN enrollments e ON c.id = e.child_id AND e.status = 'approved'
        WHERE c.id = $1 AND (c.parent_id = $2 OR e.parent_id = $2)
      `, [childId, req.user.id]);

            if (accessCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès non autorisé à cet enfant'
                });
            }
        }

        const result = await db.query(`
      SELECT 
        dr.*,
        u.first_name as educator_first_name,
        u.last_name as educator_last_name
      FROM daily_reports dr
      LEFT JOIN users u ON dr.created_by = u.id
      WHERE dr.child_id = $1
      ORDER BY dr.report_date DESC
      LIMIT $2 OFFSET $3
    `, [childId, limit, offset]);

        // Compter le total
        const countResult = await db.query(
            'SELECT COUNT(*) FROM daily_reports WHERE child_id = $1',
            [childId]
        );

        // Récupérer les détails des repas et couches pour chaque rapport
        const reports = await Promise.all(result.rows.map(async (report) => {
            const mealsResult = await db.query(
                'SELECT * FROM daily_meals WHERE report_id = $1 ORDER BY period',
                [report.id]
            );
            const diapersResult = await db.query(
                'SELECT * FROM daily_diaper_changes WHERE report_id = $1 ORDER BY change_time',
                [report.id]
            );
            return {
                ...report,
                meals_details: mealsResult.rows,
                diaper_changes_details: diapersResult.rows
            };
        }));

        res.json({
            success: true,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset),
            reports
        });
    } catch (error) {
        console.error('Erreur getReportHistory:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * GET /api/daily-reports/parent/my-children
 * Rapports des enfants d'un parent (pour l'espace parent)
 */
const getParentChildrenReports = async (req, res) => {
    try {
        const parentId = req.user.id;
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        // Utilise children.parent_id OU enrollments.parent_id (comme la section "Mes enfants")
        const result = await db.query(`
      SELECT DISTINCT ON (c.id)
        c.id as child_id,
        c.first_name,
        c.last_name,
        c.birth_date,
        c.photo_url,
        dr.id as report_id,
        dr.report_date,
        dr.status as report_status,
        dr.appetite,
        dr.sleep_quality,
        dr.activities,
        dr.observations,
        dr.temperature,
        dr.diaper_changes,
        dr.created_at as report_created_at,
        u.first_name as educator_first_name,
        u.last_name as educator_last_name,
        cs.quantity as diaper_stock,
        cs.alert_threshold as diaper_alert_threshold
      FROM children c
      LEFT JOIN enrollments e ON c.id = e.child_id AND e.status = 'approved'
      LEFT JOIN daily_reports dr ON c.id = dr.child_id AND dr.report_date = $2
      LEFT JOIN users u ON dr.created_by = u.id
      LEFT JOIN child_supplies cs ON c.id = cs.child_id AND cs.supply_type = 'diapers'
      WHERE c.is_active = true 
        AND (c.parent_id = $1 OR e.parent_id = $1)
      ORDER BY c.id, c.first_name, c.last_name
    `, [parentId, targetDate]);

        // Récupérer les fournitures apportées ce jour pour chaque enfant
        const childrenWithSupplies = await Promise.all(result.rows.map(async (child) => {
            const suppliesResult = await db.query(`
                SELECT supply_type, quantity, description
                FROM daily_supplies_brought
                WHERE child_id = $1 AND brought_date = $2
            `, [child.child_id, targetDate]);

            return {
                ...child,
                report_type: getReportType(child.birth_date),
                has_report: !!child.report_id,
                diaper_stock: child.diaper_stock || 0,
                diaper_low_stock: (child.diaper_stock || 0) <= (child.diaper_alert_threshold || 10),
                today_supplies: suppliesResult.rows
            };
        }));

        res.json({
            success: true,
            date: targetDate,
            children: childrenWithSupplies
        });
    } catch (error) {
        console.error('Erreur getParentChildrenReports:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * POST /api/daily-reports
 * Créer ou mettre à jour un rapport journalier avec repas et couches détaillés
 */
const createOrUpdateReport = async (req, res) => {
    try {
        const {
            child_id,
            report_date,
            temperature,
            medication,
            // Nouveaux champs détaillés
            meals = [], // Array de {period, meal_type, meal_description, quantity}
            diaper_changes_list = [], // Array de {nature, time, notes}
            // Champs legacy (pour compatibilité)
            meals_count,
            meal_type,
            period,
            appetite,
            appetite_notes,
            diaper_changes,
            diaper_nature,
            diaper_notes,
            skin_condition,
            skin_notes,
            sleep_quality,
            sleep_start,
            sleep_end,
            sleep_notes,
            activities,
            observations,
            status = 'draft',
            // Champs fournitures (ignorés ici, gérés séparément par l'API supplies)
            supplies_diapers,
            supplies_food
        } = req.body;

        const userId = req.user.id;
        const date = report_date || new Date().toISOString().split('T')[0];

        // Récupérer l'enfant pour déterminer le type de rapport
        const childResult = await db.query(
            'SELECT birth_date FROM children WHERE id = $1',
            [child_id]
        );

        if (childResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Enfant non trouvé' });
        }

        const reportType = getReportType(childResult.rows[0].birth_date);

        // Calculer le nombre de repas et couches depuis les listes détaillées
        const actualMealsCount = meals.length > 0 ? meals.length : (meals_count || 0);
        const actualDiaperChanges = diaper_changes_list.length > 0 ? diaper_changes_list.length : (diaper_changes || 0);

        // Upsert le rapport principal
        const result = await db.query(`
      INSERT INTO daily_reports (
        child_id, report_date, report_type, created_by,
        temperature, medication, meals_count, meal_type, period,
        appetite, appetite_notes, diaper_changes, diaper_nature, diaper_notes,
        skin_condition, skin_notes, sleep_quality, sleep_start, sleep_end, sleep_notes,
        activities, observations, status, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW()
      )
      ON CONFLICT (child_id, report_date) 
      DO UPDATE SET
        temperature = EXCLUDED.temperature,
        medication = EXCLUDED.medication,
        meals_count = EXCLUDED.meals_count,
        meal_type = EXCLUDED.meal_type,
        period = EXCLUDED.period,
        appetite = EXCLUDED.appetite,
        appetite_notes = EXCLUDED.appetite_notes,
        diaper_changes = EXCLUDED.diaper_changes,
        diaper_nature = EXCLUDED.diaper_nature,
        diaper_notes = EXCLUDED.diaper_notes,
        skin_condition = EXCLUDED.skin_condition,
        skin_notes = EXCLUDED.skin_notes,
        sleep_quality = EXCLUDED.sleep_quality,
        sleep_start = EXCLUDED.sleep_start,
        sleep_end = EXCLUDED.sleep_end,
        sleep_notes = EXCLUDED.sleep_notes,
        activities = EXCLUDED.activities,
        observations = EXCLUDED.observations,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING *
    `, [
            child_id, date, reportType, userId,
            temperature || null, medication || null, actualMealsCount, meal_type || null, period || null,
            appetite || null, appetite_notes || null, actualDiaperChanges, diaper_nature || null, diaper_notes || null,
            skin_condition || 'good', skin_notes || null, sleep_quality || null, sleep_start || null, sleep_end || null, sleep_notes || null,
            activities || null, observations || null, status
        ]);

        const reportId = result.rows[0].id;

        // Gérer les repas détaillés
        if (meals.length > 0) {
            // Supprimer les anciens repas pour ce rapport
            await db.query('DELETE FROM daily_meals WHERE report_id = $1', [reportId]);

            // Insérer les nouveaux repas
            for (const meal of meals) {
                await db.query(`
                    INSERT INTO daily_meals (report_id, child_id, meal_date, period, meal_type, meal_description, quantity, notes)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [reportId, child_id, date, meal.period, meal.meal_type, meal.meal_description || null, meal.quantity || null, meal.notes || null]);
            }
        }

        // Gérer les changements de couches détaillés
        if (diaper_changes_list.length > 0) {
            // Supprimer les anciens changements pour ce rapport
            await db.query('DELETE FROM daily_diaper_changes WHERE report_id = $1', [reportId]);

            // Insérer les nouveaux changements et décrémenter le stock
            for (const change of diaper_changes_list) {
                await db.query(`
                    INSERT INTO daily_diaper_changes (report_id, child_id, change_date, change_time, nature, notes)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [reportId, child_id, date, change.time || null, change.nature, change.notes || null]);
            }

            // Décrémenter le stock de couches
            const diaperCount = diaper_changes_list.length;
            const stockResult = await db.query(`
                UPDATE child_supplies 
                SET quantity = GREATEST(0, quantity - $2),
                    updated_at = CURRENT_TIMESTAMP
                WHERE child_id = $1 AND supply_type = 'diapers'
                RETURNING quantity, alert_threshold
            `, [child_id, diaperCount]);

            // Vérifier si stock bas et envoyer notification
            if (stockResult.rows.length > 0) {
                const { quantity, alert_threshold } = stockResult.rows[0];
                if (quantity <= alert_threshold) {
                    await createLowStockNotification(child_id, 'diapers', quantity);
                }
            }
        }

        // Récupérer le rapport complet avec les détails
        const fullReport = await getFullReport(reportId);

        res.status(201).json({
            success: true,
            message: 'Rapport enregistré avec succès',
            report: fullReport
        });
    } catch (error) {
        console.error('Erreur createOrUpdateReport:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * Récupérer un rapport complet avec ses détails (repas, couches)
 */
const getFullReport = async (reportId) => {
    const reportResult = await db.query('SELECT * FROM daily_reports WHERE id = $1', [reportId]);
    if (reportResult.rows.length === 0) return null;

    const report = reportResult.rows[0];

    // Récupérer les repas détaillés
    const mealsResult = await db.query(
        'SELECT * FROM daily_meals WHERE report_id = $1 ORDER BY period',
        [reportId]
    );

    // Récupérer les changements de couches détaillés
    const diapersResult = await db.query(
        'SELECT * FROM daily_diaper_changes WHERE report_id = $1 ORDER BY change_time',
        [reportId]
    );

    return {
        ...report,
        meals_details: mealsResult.rows,
        diaper_changes_details: diapersResult.rows
    };
};

/**
 * Créer une notification de stock bas pour les parents
 */
const createLowStockNotification = async (childId, supplyType, remainingQuantity) => {
    try {
        const childResult = await db.query(`
            SELECT c.first_name, c.last_name, e.parent_id
            FROM children c
            JOIN enrollments e ON c.id = e.child_id AND e.status = 'approved'
            WHERE c.id = $1
        `, [childId]);

        if (childResult.rows.length === 0) return;

        const child = childResult.rows[0];
        const supplyNames = { diapers: 'couches', wipes: 'lingettes', cream: 'crème' };
        const supplyName = supplyNames[supplyType] || supplyType;

        await db.query(`
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES ($1, 'supply_alert', $2, $3, $4)
        `, [
            child.parent_id,
            `Stock bas - ${supplyName}`,
            `Le stock de ${supplyName} de ${child.first_name} est bas (${remainingQuantity} restantes). Merci d'en apporter.`,
            JSON.stringify({ child_id: childId, supply_type: supplyType, remaining: remainingQuantity })
        ]);
    } catch (error) {
        console.error('Erreur createLowStockNotification:', error);
    }
};

/**
 * PATCH /api/daily-reports/:id/status
 * Changer le statut d'un rapport (draft -> completed -> sent)
 */
const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['draft', 'completed', 'sent'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide. Valeurs acceptées: draft, completed, sent'
            });
        }

        const result = await db.query(`
      UPDATE daily_reports 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Rapport non trouvé' });
        }

        res.json({
            success: true,
            message: `Statut mis à jour: ${status}`,
            report: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur updateReportStatus:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * DELETE /api/daily-reports/:id
 * Supprimer un rapport (admin/staff uniquement)
 */
const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM daily_reports WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Rapport non trouvé' });
        }

        res.json({
            success: true,
            message: 'Rapport supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur deleteReport:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

module.exports = {
    getChildrenForToday,
    getReport,
    getReportHistory,
    getParentChildrenReports,
    createOrUpdateReport,
    updateReportStatus,
    deleteReport
};
