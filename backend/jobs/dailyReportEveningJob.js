/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JOB CRON - RÉSUMÉ DU SOIR POUR LES PARENTS (19h00)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Envoie une notification unique chaque soir vers 19h00 (Africa/Tunis) aux parents
 * dont les enfants ont été présents à la crèche aujourd'hui.
 * Résume les informations clés : repas (matin, midi, goûter), couches, sieste et observations.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const cron = require('node-cron');
const db = require('../config/db_postgres');
const { getScheduleSettings } = require('../services/attendanceAutoCheckoutService');
const { generateEffectiveHolidays } = require('../utils/holidayEffectiveDates');
const pushNotificationService = require('../services/pushNotificationService');

const TIMEZONE = 'Africa/Tunis';

/**
 * Vérifier si aujourd'hui est un jour d'ouverture de la crèche
 */
async function isWorkingDay(dateStr) {
    const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay(); // 0 = Dimanche, 6 = Samedi
    if (dayOfWeek === 0) return false;

    if (dayOfWeek === 6) {
        const schedule = await getScheduleSettings();
        if (!schedule.saturdayOpen) return false;
    }

    const holidaysResult = await db.query(`
        SELECT id, holiday_key, name, type, fixed_day, fixed_month, days_count, is_active, date
        FROM holidays
        WHERE is_active = true
    `);
    const holidays = holidaysResult.rows.map(h => ({
        ...h,
        date: h.date instanceof Date ? h.date.toISOString().split('T')[0] : h.date
    }));
    const effectiveClosures = generateEffectiveHolidays(holidays);
    return !effectiveClosures.some(h => h.date === dateStr);
}

/**
 * Traiter et envoyer le résumé du soir aux parents
 */
async function sendEveningDailyReports() {
    try {
        const now = new Date();
        const todayStr = new Intl.DateTimeFormat('fr-CA', { timeZone: TIMEZONE }).format(now);

        if (!(await isWorkingDay(todayStr))) {
            return;
        }

        console.log(`🌙 [RÉSUMÉ DU SOIR] Vérification des carnets journaliers pour le ${todayStr}...`);

        // Récupérer tous les enfants présents aujourd'hui avec leur parent et rapport
        const query = `
            SELECT DISTINCT ON (c.id)
                c.id as child_id,
                c.first_name as child_first_name,
                c.last_name as child_last_name,
                COALESCE(c.parent_id, e.parent_id) as parent_id,
                dr.id as report_id,
                dr.observations,
                dr.sleep_quality,
                dr.appetite,
                (SELECT COUNT(*) FROM daily_diaper_changes WHERE report_id = dr.id) as diaper_count,
                (SELECT COUNT(*) FROM daily_meals WHERE report_id = dr.id) as meals_count
            FROM children c
            INNER JOIN attendance a ON c.id = a.child_id AND a.date = $1 AND a.check_in_time IS NOT NULL
            LEFT JOIN enrollments e ON c.id = e.child_id AND e.status = 'approved'
            LEFT JOIN daily_reports dr ON c.id = dr.child_id AND dr.report_date = $1
            WHERE c.is_active = true
              AND (c.parent_id IS NOT NULL OR e.parent_id IS NOT NULL)
        `;

        const result = await db.query(query, [todayStr]);

        if (result.rows.length === 0) {
            console.log('🌙 [RÉSUMÉ DU SOIR] Aucun enfant présent aujourd\'hui');
            return;
        }

        let sentCount = 0;

        for (const row of result.rows) {
            if (!row.parent_id) continue;

            // Vérifier si le parent n'a pas déjà reçu la notification du soir aujourd'hui pour cet enfant
            const alreadySent = await db.query(`
                SELECT 1 FROM notifications 
                WHERE user_id = $1 
                  AND type = 'daily_report_evening' 
                  AND created_at::date = $2::date
                  AND (data->>'child_id')::int = $3
                LIMIT 1
            `, [row.parent_id, todayStr, row.child_id]);

            if (alreadySent.rows.length > 0) {
                continue;
            }

            // Composer les détails du résumé
            const childName = row.child_first_name;
            const title = `🌟 Carnet du jour : ${childName}`;

            let summaryParts = [];
            if (row.meals_count > 0) {
                summaryParts.push(`🥣 ${row.meals_count} repas notés`);
            }
            if (row.diaper_count > 0) {
                summaryParts.push(`🧷 ${row.diaper_count} changes`);
            }
            if (row.sleep_quality) {
                summaryParts.push(`💤 Sieste : ${row.sleep_quality}`);
            }

            let message = '';
            if (row.report_id) {
                const detailsText = summaryParts.length > 0 ? summaryParts.join(' • ') : 'Repas, sieste et activités enregistrés';
                message = `Le carnet de ${childName} est prêt ! ${detailsText}. Cliquez pour consulter la journée complète.`;
            } else {
                message = `La journée de ${childName} à la crèche est terminée. Retrouvez son carnet dans votre espace.`;
            }

            // Insertion notification in-app
            await db.query(`
                INSERT INTO notifications (user_id, title, message, type, is_read, data, created_at)
                VALUES ($1, $2, $3, 'daily_report_evening', false, $4, NOW())
            `, [
                row.parent_id,
                title,
                message,
                JSON.stringify({ child_id: row.child_id, report_id: row.report_id })
            ]);

            // Envoi Web Push vers le smartphone du parent
            try {
                await pushNotificationService.sendPushToUser(row.parent_id, {
                    title,
                    message,
                    url: '/mon-espace/daily-reports',
                    tag: `evening-report-${row.child_id}-${todayStr}`
                });
            } catch (pushErr) {
                console.error(`Erreur push parent ${row.parent_id}:`, pushErr.message);
            }

            sentCount++;
        }

        console.log(`🌙 [RÉSUMÉ DU SOIR] ${sentCount} notifications de résumé envoyées aux parents`);

    } catch (error) {
        console.error('❌ Erreur sendEveningDailyReports:', error);
    }
}

let eveningReportJob = null;

const startDailyReportEveningJob = () => {
    try {
        // Exécution du lundi au samedi à 19h00 (Africa/Tunis)
        eveningReportJob = cron.schedule('0 19 * * 1-6', () => {
            sendEveningDailyReports();
        }, {
            scheduled: true,
            timezone: TIMEZONE
        });

        console.log('🌙 [CRON RÉSUMÉ DU SOIR] Job initialisé (du lundi au samedi à 19h00) ✅');
        return true;
    } catch (error) {
        console.error('❌ Erreur démarrage job résumé du soir:', error.message);
        return false;
    }
};

const stopDailyReportEveningJob = () => {
    if (eveningReportJob) {
        eveningReportJob.stop();
        eveningReportJob = null;
    }
};

module.exports = {
    startDailyReportEveningJob,
    stopDailyReportEveningJob,
    sendEveningDailyReports
};
