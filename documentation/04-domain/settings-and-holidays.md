# Entités : Paramètres et jours fériés

## Paramètres (`nursery_settings`)
Schéma réel utilisé : `setting_key`, `value_fr`, `value_ar`, `category`, `is_active`. ⚠️ `init_database.js` crée un ancien schéma clé/valeur (incohérence). Vacances annuelles : `annual_vacation_enabled/start_date/end_date`.
API : `/api/nursery-settings` (lecture, `/raw`, `/annual-vacation`, `simple-update`, `PUT /:key`, `POST /`) — **écritures sans authentification** ⚠️.

## Jours fériés (`holidays`, `holiday_policies`)
`name`, `date`, `is_closed`. API `/api/holidays` : lecture publique, `check/:date` public ; POST/PUT/DELETE/sync : admin/developer (contrôle dans le handler) ; `POST /init` **sans authentification** ⚠️.
Jours fermés d'un mois : `/api/schedule-settings/closed-days/:year/:month`.

**Sources** : `routes_postgres/nurserySettings.js`, `holidays.js`, `schedule-settings.js`.
