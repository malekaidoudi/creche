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
 * Vérifie les alertes présences programmées pour la minute courante
 */
async function checkAttendanceRecorded() {
  try {
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('fr-CA', { timeZone: TIMEZONE }).format(now);
    const timeParts = new Intl.DateTimeFormat('fr-FR', {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now); // ex: "08:30"
    
    // Jour de la semaine en Tunis (1 = Lundi, 6 = Samedi, 0 = Dimanche)
    const dayOfWeek = new Date(`${todayStr}T12:00:00`).getDay();
    if (dayOfWeek === 0) return; // Fermé le dimanche

    if (!(await isWorkingDay(todayStr))) {
      return;
    }

    // Vérifier si des présences ont déjà été pointées aujourd'hui
    const attendanceResult = await db.query(`
      SELECT 1 FROM attendance WHERE date = $1 AND check_in_time IS NOT NULL LIMIT 1
    `, [todayStr]);

    if (attendanceResult.rows.length > 0) {
      // Présences déjà commencées pour aujourd'hui
      return;
    }

    // Récupérer les utilisateurs (admin/staff/developer) devant être notifiés
    const usersResult = await db.query(`
      SELECT u.id, u.first_name, 
             COALESCE(p.attendance_reminder_time, '08:30') as scheduled_time,
             COALESCE(p.attendance_reminder_days, '{1,2,3,4,5,6}') as scheduled_days,
             COALESCE(p.timezone, 'Africa/Tunis') as user_tz
      FROM users u
      LEFT JOIN user_notification_preferences p ON u.id = p.user_id
      WHERE u.role IN ('admin', 'staff', 'developer')
        AND u.is_active = true
        AND COALESCE(p.attendance_reminder_enabled, true) = true
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = u.id
            AND n.type = 'attendance_not_recorded'
            AND n.created_at::date = $1::date
        )
    `, [todayStr]);

    const staffIds = [];
    for (const u of usersResult.rows) {
      const tz = u.user_tz || TIMEZONE;
      let userTime = '';
      let userDay = dayOfWeek;
      try {
        userTime = new Intl.DateTimeFormat('fr-FR', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(now);
        const dayInTz = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(now);
        const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        userDay = dayMap[dayInTz] !== undefined ? dayMap[dayInTz] : dayOfWeek;
      } catch (e) {
        userTime = timeParts;
      }

      if (u.scheduled_time === userTime && Array.isArray(u.scheduled_days) && u.scheduled_days.includes(userDay)) {
        staffIds.push(u.id);
      }
    }

    if (staffIds.length === 0) return;

    const title = '⚠️ Aucune présence enregistrée';
    const message = `Aucune présence n'a encore été enregistrée aujourd'hui (${timeParts}). Pensez à pointer les arrivées des enfants.`;

    try {
      const insertSql = `
        INSERT INTO notifications (user_id, title, message, type, is_read)
        VALUES ${staffIds.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3}, 'attendance_not_recorded', false)`).join(', ')}
      `;
      const params = staffIds.flatMap(id => [id, title, message]);
      await db.query(insertSql, params);
    } catch (dbErr) {
      console.error('⚠️ [CRON PRÉSENCE] Erreur insertion notification DB:', dbErr.message);
    }

    try {
      await pushNotificationService.sendPushToMany(staffIds, {
        title,
        message,
        url: '/dashboard/attendance',
        tag: 'attendance-reminder'
      });
      console.log(`⚠️ [CRON PRÉSENCE ${timeParts}] Alerte Web Push envoyée à ${staffIds.length} utilisateur(s)`);
    } catch (pushErr) {
      console.error('❌ [CRON PRÉSENCE] Erreur envoi Web Push:', pushErr.message);
    }
  } catch (error) {
    console.error('❌ [CRON PRÉSENCE] Erreur vérification présences:', error.message);
  }
}

let attendanceReminderJob = null;

const startAttendanceReminderJob = () => {
  try {
    // S'exécute chaque minute pour distribuer les alertes selon l'heure personnalisée
    attendanceReminderJob = cron.schedule('* * * * *', () => {
      checkAttendanceRecorded();
    }, {
      scheduled: true,
      timezone: TIMEZONE
    });

    console.log('⏰ [CRON PRÉSENCE] Job d\'alerte présences programmables initialisé (24/7, /min) ✅');
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
