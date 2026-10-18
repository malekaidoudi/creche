/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JOB CRON - ALERTE PRÉSENCES NON ENREGISTRÉES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Chaque jour ouvré à 8h30 (Africa/Tunis), vérifie si au moins un enfant a
 * été pointé en présence aujourd'hui. Si aucune présence n'est enregistrée,
 * notifie tous les admins et le staff.
 *
 * "Jour ouvré" = du lundi au vendredi toujours, le samedi seulement si
 * `saturday_open` est actif dans nursery_settings, et jamais un jour férié
 * actif (table `holidays`).
 * ═══════════════════════════════════════════════════════════════════════════
 */

const cron = require('node-cron');
const db = require('../config/db_postgres');
const { getScheduleSettings } = require('../services/attendanceAutoCheckoutService');
const { generateEffectiveHolidays } = require('../utils/holidayEffectiveDates');
const pushNotificationService = require('../services/pushNotificationService');

const TIMEZONE = 'Africa/Tunis';

/**
 * Détermine si la date donnée (YYYY-MM-DD) est un jour ouvré pour la crèche
 */
async function isWorkingDay(dateStr) {
  const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay(); // 0 = Dimanche, 6 = Samedi

  if (dayOfWeek === 0) return false; // Dimanche : jamais ouvert

  if (dayOfWeek === 6) {
    const schedule = await getScheduleSettings();
    if (!schedule.saturdayOpen) return false;
  }

  // Vérifier si c'est un jour férié actif
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
  const isHoliday = effectiveClosures.some(h => h.date === dateStr);

  return !isHoliday;
}

/**
 * Vérifie si aucune présence n'a encore été enregistrée aujourd'hui et alerte admin/staff
 */
async function checkAttendanceRecorded() {
  try {
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('fr-CA', { timeZone: TIMEZONE }).format(now);

    if (!(await isWorkingDay(todayStr))) {
      return;
    }

    const attendanceResult = await db.query(`
      SELECT 1 FROM attendance WHERE date = $1 AND check_in_time IS NOT NULL LIMIT 1
    `, [todayStr]);

    if (attendanceResult.rows.length > 0) {
      return; // Au moins une présence déjà enregistrée
    }

    // Garde-fou anti-doublon : ne pas renvoyer l'alerte plusieurs fois le même jour
    const alreadySent = await db.query(`
      SELECT 1 FROM notifications
      WHERE type = 'attendance_not_recorded' AND created_at::date = CURRENT_DATE
      LIMIT 1
    `);
    if (alreadySent.rows.length > 0) return;

    const staffResult = await db.query(`
      SELECT id FROM users WHERE role IN ('admin', 'staff') AND is_active = true
    `);
    const staffIds = staffResult.rows.map(r => r.id);
    if (staffIds.length === 0) return;

    const title = '⚠️ Aucune présence enregistrée';
    const message = "Aucune présence n'a encore été enregistrée aujourd'hui (8h30). Pensez à pointer les arrivées des enfants.";

    const insertSql = `
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES ${staffIds.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3}, 'attendance_not_recorded', false)`).join(', ')}
    `;
    const params = staffIds.flatMap(id => [id, title, message]);

    await db.query(insertSql, params);
    await pushNotificationService.sendPushToMany(staffIds, { title, message, url: '/dashboard/attendance' });

    console.log(`⚠️ [CRON PRÉSENCE 8H30] Alerte envoyée à ${staffIds.length} admin(s)/staff (aucune présence enregistrée)`);
  } catch (error) {
    console.error('❌ [CRON PRÉSENCE 8H30] Erreur vérification présences:', error.message);
  }
}

let attendanceReminderJob = null;

const startAttendanceReminderJob = () => {
  try {
    // Du lundi au samedi à 8h30 (le dimanche est exclu nativement, le samedi
    // fermé est filtré dynamiquement par isWorkingDay())
    attendanceReminderJob = cron.schedule('30 8 * * 1-6', () => {
      console.log('⏰ [CRON PRÉSENCE 8H30] Vérification des présences du jour...');
      checkAttendanceRecorded();
    }, {
      scheduled: true,
      timezone: TIMEZONE
    });

    console.log('⚠️ [CRON PRÉSENCE 8H30] Job d\'alerte présences non enregistrées initialisé ✅');
    return true;
  } catch (error) {
    console.error('❌ Erreur démarrage job alerte présences:', error.message);
    return false;
  }
};

const stopAttendanceReminderJob = () => {
  if (attendanceReminderJob) {
    attendanceReminderJob.stop();
    attendanceReminderJob = null;
  }
};

module.exports = {
  startAttendanceReminderJob,
  stopAttendanceReminderJob,
  checkAttendanceRecorded
};
