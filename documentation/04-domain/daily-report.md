# Entité : Rapport journalier

**Tables** : `daily_reports`, `daily_meals`, `daily_diaper_changes`.
**Attributs principaux** : child_id, date, type (`baby` | `child`), status (`draft` | `completed` | `sent`), nombreux champs à contraintes CHECK (détail dans `backend/init_database.js`).
**Cycle** : brouillon → terminé → envoyé.
**Qui** : saisie personnel/admin ; lecture parent (`/parent/my-children`).
**API** : `/api/daily-reports` (`/children/today`, `POST /`, `PATCH /:id/status`, `DELETE /:id`, `/:childId/history`, `/:childId/:date`).
**Sources** : `routes_postgres/dailyReports.js`, `controllers/dailyReportsController`.
**Limites** : non incluse dans les sauvegardes.
