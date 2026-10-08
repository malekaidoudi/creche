# Journalisation

| Mécanisme | Fichier | Détail |
|---|---|---|
| Journal d'activité automatique | `middleware/activityLogger.js`, `services/activityLogService.js` | login réussi/échoué, géolocalisation IP (geoip), alertes (`alertService`), rapports quotidien/hebdo/mensuel (`reportService`), archivage/export |
| Logger applicatif | `utils/logger.js` | niveaux sécurité ; données sensibles en dev uniquement |
| HTTP | morgan | |
| Table `logs` | `/api/logs` | `GET /`, `POST /` |
| `email_logs` | `/api/logs/email` | consultation admin/staff/developer, suppression |
| Fil d'activité admin | `/api/activity-feed` | `/`, `/summary`, `/calendar/:year/:month`, `/user/:userId` |
| Journal technique | `/api/activity-logs/*` | développeur ; archive/cleanup/create : admin |

Les tests existants : `tests/utils/logger.test.js`.
