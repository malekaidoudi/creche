/**
 * Génération des dates effectives de fermeture à partir des politiques de
 * jours fériés (table `holidays`). Logique centralisée pour être réutilisée
 * à la fois par la route GET /api/holidays?effective=true (affichage widgets)
 * et par le job de rappel de fermeture (jobs/holidayReminderJob.js).
 */

const { getIslamicHolidays } = require('./tunisianHolidays');

/**
 * Génère les dates effectives des jours fériés basées sur les politiques actives.
 * Pour les fêtes multi-jours (Aïd), chaque jour est généré individuellement
 * avec son `day_index` (1 = premier jour de la fermeture).
 */
function generateEffectiveHolidays(holidays) {
  const effective = [];
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];

  for (const holiday of holidays) {
    if (!holiday.is_active) continue;

    // Pour les fêtes multi-jours (Aïd), générer les jours individuels
    if ((holiday.holiday_key === 'eid_fitr' || holiday.holiday_key === 'eid_adha') && holiday.days_count > 1) {
      for (const year of years) {
        const islamicHolidays = getIslamicHolidays(year);
        const eidDays = islamicHolidays.filter(h => h.holiday_key === holiday.holiday_key && h.day_index);

        for (const day of eidDays) {
          if (day.day_index <= holiday.days_count) {
            effective.push({
              id: holiday.id,
              name: day.name,
              name_ar: day.name_ar,
              date: day.date,
              type: holiday.type,
              is_closed: true,
              holiday_key: holiday.holiday_key,
              day_index: day.day_index,
              days_count: holiday.days_count
            });
          }
        }
      }
    } else if (holiday.fixed_day && holiday.fixed_month) {
      // Jours nationaux avec date fixe
      for (const year of years) {
        const date = `${year}-${String(holiday.fixed_month).padStart(2, '0')}-${String(holiday.fixed_day).padStart(2, '0')}`;
        effective.push({
          id: holiday.id,
          name: holiday.name,
          name_ar: holiday.name_ar,
          date: date,
          type: holiday.type,
          is_closed: true,
          holiday_key: holiday.holiday_key,
          days_count: 1
        });
      }
    } else {
      // Jours religieux avec date variable
      for (const year of years) {
        const islamicHolidays = getIslamicHolidays(year);
        const match = islamicHolidays.find(h => h.holiday_key === holiday.holiday_key && !h.day_index);
        if (match) {
          effective.push({
            id: holiday.id,
            name: holiday.name,
            name_ar: holiday.name_ar,
            date: match.date,
            type: holiday.type,
            is_closed: true,
            holiday_key: holiday.holiday_key,
            days_count: 1
          });
        }
      }
    }
  }

  // Trier par date et filtrer les dates passées (garder 30 derniers jours)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return effective
    .filter(h => new Date(h.date) >= thirtyDaysAgo)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Trouve les fermetures dont le PREMIER jour tombe exactement sur `dateStr`
 * (YYYY-MM-DD). Pour une fête multi-jours (Aïd), ne retourne un résultat que
 * pour day_index === 1, afin de ne notifier qu'une seule fois, la veille du
 * début de la fermeture (pas chaque jour de la période).
 */
function findClosuresStartingOn(holidays, dateStr) {
  const effective = generateEffectiveHolidays(holidays);
  return effective.filter(h => h.date === dateStr && (!h.day_index || h.day_index === 1));
}

module.exports = {
  generateEffectiveHolidays,
  findClosuresStartingOn
};
