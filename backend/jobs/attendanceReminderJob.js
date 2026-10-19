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

    // La table `attendance` n'a pas de colonne `status` : une absence n'est
    // jamais persistée, seule l'arrivée (`check_in_time`) l'est. On considère
    // donc qu'"au moins une présence a été pointée" dès qu'une ligne a un check-in.
    const attendanceResult = await db.query(`
      SELECT 1 FROM attendance WHERE date = $1 AND check_in_time IS NOT NULL LIMIT 1
    `, [todayStr]);

    if (attendanceResult.rows.length > 0) {
      return; // Au moins une présence ou absence déjà enregistrée
    }

    // Garde-fou anti-doublon : ne pas renvoyer l'alerte plusieurs fois le même jour
    const alreadySent = await db.query(`
      SELECT 1 FROM notifications
      WHERE type = 'attendance_not_recorded' AND created_at::date = $1::date
      LIMIT 1
    `, [todayStr]);
    if (alreadySent.rows.length > 0) return;

    const staffResult = await db.query(`
      SELECT id FROM users WHERE role IN ('admin', 'staff') AND is_active = true
    `);
    const staffIds = staffResult.rows.map(r => r.id);
    if (staffIds.length === 0) return;

    const title = '⚠️ Aucune présence enregistrée';
    const message = "Aucune présence n'a encore été enregistrée aujourd'hui (8h30). Pensez à pointer les arrivées des enfants.";

    try {
      const insertSql = `
        INSERT INTO notifications (user_id, title, message, type, is_read)
        VALUES ${staffIds.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3}, 'attendance_not_recorded', false)`).join(', ')}
      `;
      const params = staffIds.flatMap(id => [id, title, message]);
      await db.query(insertSql, params);
    } catch (dbErr) {
      console.error('⚠️ [CRON PRÉSENCE 8H30] Erreur insertion notification DB:', dbErr.message);
    }

    try {
      await pushNotificationService.sendPushToMany(staffIds, {
        title,
        message,
        url: '/dashboard/attendance',
        tag: 'attendance-reminder'
      });
      console.log(`⚠️ [CRON PRÉSENCE 8H30] Alerte Web Push envoyée à ${staffIds.length} admin(s)/staff`);
    } catch (pushErr) {
      console.error('❌ [CRON PRÉSENCE 8H30] Erreur envoi Web Push:', pushErr.message);
    }
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
