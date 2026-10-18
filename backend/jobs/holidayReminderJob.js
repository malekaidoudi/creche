/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JOB CRON - RAPPEL DE FERMETURE POUR JOUR FÉRIÉ (veille)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Chaque jour à 18h00 (Africa/Tunis), vérifie si la crèche sera fermée le
 * lendemain pour un jour férié actif. Si oui, notifie tous les parents :
 * - Fermeture d'un seul jour : "La crèche sera fermée demain pour <nom>."
 * - Fermeture de plusieurs jours (ex: Aïd) : mentionne le nombre total de
 *   jours de fermeture, en se basant sur le premier jour de la période.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const cron = require('node-cron');
const db = require('../config/db_postgres');
const { findClosuresStartingOn } = require('../utils/holidayEffectiveDates');
const pushNotificationService = require('../services/pushNotificationService');

const TIMEZONE = 'Africa/Tunis';

/**
 * Vérifie si la crèche ferme demain et notifie les parents le cas échéant
 */
async function checkAndNotifyTomorrowClosure() {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = new Intl.DateTimeFormat('fr-CA', { timeZone: TIMEZONE }).format(tomorrow);

    const result = await db.query(`
      SELECT id, holiday_key, name, name_ar, type, fixed_day, fixed_month, days_count, is_active, date
      FROM holidays
      WHERE is_active = true
    `);

    const holidays = result.rows.map(h => ({
      ...h,
      date: h.date instanceof Date ? h.date.toISOString().split('T')[0] : h.date
    }));

    const closuresStartingTomorrow = findClosuresStartingOn(holidays, tomorrowStr);

    if (closuresStartingTomorrow.length === 0) {
      return;
    }

    // Garde-fou anti-doublon : ne pas renotifier si déjà envoyé aujourd'hui pour ce jour férié
    const parentsResult = await db.query(
      "SELECT id FROM users WHERE role = 'parent' AND is_active = true"
    );
    const parentIds = parentsResult.rows.map(r => r.id);

    if (parentIds.length === 0) return;

    for (const closure of closuresStartingTomorrow) {
      const alreadySent = await db.query(`
        SELECT 1 FROM notifications
        WHERE type = 'holiday_reminder' AND related_id = $1 AND created_at::date = CURRENT_DATE
        LIMIT 1
      `, [closure.id]);

      if (alreadySent.rows.length > 0) continue;

      const daysCount = closure.days_count || 1;
      const title = '🏖️ Fermeture de la crèche';
      const message = daysCount > 1
        ? `La crèche sera fermée pendant ${daysCount} jours à partir de demain pour ${closure.name}.`
        : `La crèche sera fermée demain pour ${closure.name}.`;

      // (user_id, title, message, type, related_id, metadata)
      const insertSql = `
        INSERT INTO notifications (user_id, title, message, type, related_id, metadata, is_read)
        VALUES ${parentIds.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, 'holiday_reminder', $${i * 5 + 4}, $${i * 5 + 5}, false)`).join(', ')}
      `;
      const params = parentIds.flatMap(id => [
        id, title, message, closure.id,
        JSON.stringify({ holiday_key: closure.holiday_key, days_count: daysCount, start_date: closure.date })
      ]);

      await db.query(insertSql, params);
      await pushNotificationService.sendPushToMany(parentIds, { title, message, url: '/mon-espace' });

      console.log(`🏖️ [CRON JOURS FÉRIÉS] Rappel envoyé à ${parentIds.length} parent(s) pour "${closure.name}" (${daysCount} jour(s))`);
    }
  } catch (error) {
    console.error('❌ [CRON JOURS FÉRIÉS] Erreur vérification fermeture de demain:', error.message);
  }
}

let holidayReminderJob = null;

const startHolidayReminderJob = () => {
  try {
    holidayReminderJob = cron.schedule('0 18 * * *', () => {
      console.log('⏰ [CRON JOURS FÉRIÉS] Vérification de la fermeture de demain...');
      checkAndNotifyTomorrowClosure();
    }, {
      scheduled: true,
      timezone: TIMEZONE
    });

    console.log('🏖️ [CRON JOURS FÉRIÉS] Job de rappel de fermeture initialisé (quotidien à 18h00) ✅');
    return true;
  } catch (error) {
    console.error('❌ Erreur démarrage job rappel jours fériés:', error.message);
    return false;
  }
};

const stopHolidayReminderJob = () => {
  if (holidayReminderJob) {
    holidayReminderJob.stop();
    holidayReminderJob = null;
  }
};

module.exports = {
  startHolidayReminderJob,
  stopHolidayReminderJob,
  checkAndNotifyTomorrowClosure
};
