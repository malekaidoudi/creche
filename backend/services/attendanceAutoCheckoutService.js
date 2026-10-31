/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SERVICE DE CLÔTURE AUTOMATIQUE DES PRÉSENCES NON POINTÉES EN SORTIE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Règle métier :
 * Si un membre du personnel oublie d'enregistrer le départ d'un enfant :
 * 1. Pour les dates antérieures à aujourd'hui : l'enregistrement est automatiquement
 *    clôturé avec l'heure de fermeture de la crèche pour cette journée.
 * 2. Pour la journée en cours : dès que l'heure de fermeture de la crèche est
 *    atteinte ou dépassée (ex: 18h00 en semaine, 13h00 le samedi) :
 *    tous les enfants encore notés "présents" sont automatiquement clôturés
 *    avec check_out_time = heure de fermeture officielle de la crèche.
 * 3. Cela stoppe le compteur de présence, évite que les enfants restent
 *    "actuellement présents" toute la nuit, et préserve des statistiques exactes.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const db = require('../config/db_postgres');

const TIMEZONE = 'Africa/Tunis';

/**
 * Récupère les horaires de fermeture depuis nursery_settings
 */
const getScheduleSettings = async () => {
  try {
    const res = await db.query(`
      SELECT setting_key, value_fr 
      FROM nursery_settings 
      WHERE setting_key IN ('closing_time', 'saturday_open', 'saturday_closing_time')
    `);
    
    const settings = {};
    res.rows.forEach(r => {
      settings[r.setting_key] = r.value_fr;
    });

    return {
      closingTime: settings.closing_time || '18:00',
      saturdayOpen: settings.saturday_open !== 'false',
      saturdayClosingTime: settings.saturday_closing_time || '13:00'
    };
  } catch (err) {
    console.warn('[attendanceAutoCheckout] Erreur lecture schedule settings, utilisation des défauts:', err.message);
    return {
      closingTime: '18:00',
      saturdayOpen: true,
      saturdayClosingTime: '13:00'
    };
  }
};

/**
 * Détermine l'heure de fermeture applicable pour une date donnée (YYYY-MM-DD ou Date)
 */
const getClosingTimeForDate = (dateVal, schedule) => {
  let dateObj;
  if (typeof dateVal === 'string') {
    const datePart = dateVal.split('T')[0];
    dateObj = new Date(`${datePart}T12:00:00`);
  } else if (dateVal instanceof Date) {
    dateObj = dateVal;
  } else {
    dateObj = new Date();
  }

  const dayOfWeek = dateObj.getDay(); // 0 = Dimanche, 6 = Samedi

  if (dayOfWeek === 6 && schedule.saturdayOpen) { // Samedi
    return schedule.saturdayClosingTime || '13:00';
  }
  // En semaine (et sécurité par défaut) : heure de fermeture classique
  return schedule.closingTime || '18:00';
};

/**
 * Exécute la clôture automatique des présences expirées
 */
const autoCloseExpiredAttendances = async () => {
  try {
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('fr-CA', { timeZone: TIMEZONE }).format(now);
    const currentTimeStr = new Intl.DateTimeFormat('fr-FR', {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    const schedule = await getScheduleSettings();
    let totalClosed = 0;

    // 1. CLÔTURE DES DATES PASSÉES (date < todayStr)
    const pastUnclosed = await db.query(`
      SELECT a.id, a.date, a.child_id, a.check_in_time, a.notes, c.care_schedule
      FROM attendance a
      LEFT JOIN children c ON a.child_id = c.id
      WHERE a.date < $1 AND a.check_in_time IS NOT NULL AND a.check_out_time IS NULL
    `, [todayStr]);

    if (pastUnclosed.rows.length > 0) {
      for (const row of pastUnclosed.rows) {
        const isHalfDay = row.care_schedule === 'half_day';
        const closingTime = isHalfDay ? '13:00' : getClosingTimeForDate(row.date, schedule);
        const autoNote = isHalfDay
          ? `[Départ automatique - fin de demi-journée non pointée (13:00)]`
          : `[Départ automatique - fin de journée non pointée (fermeture ${closingTime})]`;
        const newNotes = row.notes ? `${row.notes} | ${autoNote}` : autoNote;

        await db.query(`
          UPDATE attendance
          SET check_out_time = (date + $1::time)::timestamp, notes = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [`${closingTime}:00`, newNotes, row.id]);
        totalClosed++;
      }
      console.log(`⏰ [Auto-Checkout] ${pastUnclosed.rows.length} présence(s) de date(s) passée(s) clôturée(s) automatiquement`);
    }

    // 2. CLÔTURE D'AUJOURD'HUI
    // 2.A : Clôture spécifique des demi-journées dès 13h00
    if (currentTimeStr >= '13:00') {
      const halfDayUnclosed = await db.query(`
        SELECT a.id, a.date, a.child_id, a.check_in_time, a.notes
        FROM attendance a
        JOIN children c ON a.child_id = c.id
        WHERE a.date = $1 
          AND a.check_in_time IS NOT NULL 
          AND a.check_out_time IS NULL
          AND c.care_schedule = 'half_day'
      `, [todayStr]);

      if (halfDayUnclosed.rows.length > 0) {
        for (const row of halfDayUnclosed.rows) {
          const autoNote = `[Départ automatique - fin de demi-journée (13:00)]`;
          const newNotes = row.notes ? `${row.notes} | ${autoNote}` : autoNote;

          await db.query(`
            UPDATE attendance
            SET check_out_time = (date + '13:00:00'::time)::timestamp, notes = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [newNotes, row.id]);
          totalClosed++;
        }
        console.log(`⏰ [Auto-Checkout] ${halfDayUnclosed.rows.length} demi-journée(s) d'aujourd'hui clôturée(s) à 13h00`);
      }
    }

    // 2.B : Clôture générale à l'heure de fermeture de la crèche (ex: 18h00)
    const todayClosingTime = getClosingTimeForDate(todayStr, schedule);
    const isPastClosing = currentTimeStr >= todayClosingTime;

    if (isPastClosing) {
      const todayUnclosed = await db.query(`
        SELECT id, date, child_id, check_in_time, notes
        FROM attendance
        WHERE date = $1 AND check_in_time IS NOT NULL AND check_out_time IS NULL
      `, [todayStr]);

      if (todayUnclosed.rows.length > 0) {
        for (const row of todayUnclosed.rows) {
          const autoNote = `[Départ automatique - fermeture de la crèche (${todayClosingTime})]`;
          const newNotes = row.notes ? `${row.notes} | ${autoNote}` : autoNote;

          await db.query(`
            UPDATE attendance
            SET check_out_time = (date + $1::time)::timestamp, notes = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `, [`${todayClosingTime}:00`, newNotes, row.id]);
          totalClosed++;
        }
        console.log(`⏰ [Auto-Checkout] ${todayUnclosed.rows.length} présence(s) d'aujourd'hui clôturée(s) à la fermeture (${todayClosingTime})`);
      }
    }

    return { success: true, totalClosed, todayClosingTime, isPastClosing };
  } catch (error) {
    console.error('❌ [Auto-Checkout] Erreur lors de la clôture automatique:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  autoCloseExpiredAttendances,
  getScheduleSettings,
  getClosingTimeForDate
};
