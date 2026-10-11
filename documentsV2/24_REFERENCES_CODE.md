# 24 — Références code (index rapide)

## Objectif
Index de correspondance rapide « sujet → fichier(s) » pour un nouveau développeur, en complément des références déjà données dans chaque document thématique.

## Backend
| Sujet | Fichier(s) |
|---|---|
| Point d'entrée serveur | `backend/server.js` |
| Connexion base de données | `backend/config/db_postgres.js` |
| Exécution des migrations au démarrage | `backend/migrations/runner.js` |
| Migrations versionnées actives | `backend/migrations/versions/001_baseline_schema.js` à `008_allow_images_media_type.js` |
| Authentification JWT | `backend/middleware/auth.js`, `backend/routes_postgres/auth.js` |
| Révocation de jetons | `backend/services/tokenBlacklistService.js` |
| Permissions granulaires | `backend/services/permissionsService.js`, `backend/routes_postgres/staffPermissions.js` |
| Journal d'activité technique | `backend/services/activityLogService.js`, `backend/middleware/activityLogger.js`, `backend/routes_postgres/activityLogs.js`, `backend/controllers/activityLogController.js` |
| Envoi d'e-mails | `backend/emails/emailService.js`, `backend/emails/emailTypes.js`, `backend/emails/templates/` |
| Stockage Cloudinary | `backend/services/cloudinaryService.js`, `backend/routes_postgres/cloudinary.js`, `backend/routes_postgres/cloudinaryExplorer.js` |
| Upload disque local | `backend/middleware/upload.js` |
| Inscriptions | `backend/routes_postgres/enrollments.js`, `backend/controllers/enrollmentsController.js` |
| Rendez-vous | `backend/routes_postgres/appointments.js`, `backend/controllers/appointmentsController.js` |
| Enfants | `backend/routes_postgres/children.js` |
| Présences | `backend/routes_postgres/attendance.js`, `backend/jobs/attendanceJob.js` |
| Bilans journaliers / fournitures | `backend/routes_postgres/dailyReports.js`, `backend/controllers/dailyReportsController.js`, `backend/routes_postgres/supplies.js`, `backend/controllers/suppliesController.js` |
| Traitements médicaux | `backend/routes_postgres/treatments.js`, `backend/controllers/treatmentsController.js`, `backend/jobs/treatmentJob.js` |
| Tâches internes | `backend/routes_postgres/tasks.js`, `backend/controllers/tasksController.js` |
| Événements/planning | `backend/routes_postgres/events.js`, `backend/jobs/eventJobs.js` |
| Messagerie interne | `backend/routes_postgres/staff-messages.js`, `backend/services/staffMessageService.js` |
| Notifications | `backend/routes_postgres/notifications.js`, `backend/services/notificationService.js` |
| Annonces | `backend/routes_postgres/announcements.js`, `backend/services/announcementService.js` |
| Activités (fil pédagogique) | `backend/routes_postgres/activities.js`, `backend/services/activityService.js` |
| Documents administratifs | `backend/routes_postgres/documents.js` |
| Témoignages | `backend/routes_postgres/testimonials.js` |
| Paramètres de la crèche | `backend/routes_postgres/nurserySettings.js`, `backend/services/SettingsService.js` |
| Jours fériés | `backend/routes_postgres/holidays.js`, `backend/utils/tunisianHolidays.js` |
| Sauvegardes | `backend/routes_postgres/backup.js`, `backend/jobs/backupJob.js`, `backend/scripts/backup.js` |
| Récupération d'urgence | `backend/routes_postgres/recovery.js` |
| Santé du service | `backend/routes_postgres/health.js` |
| Logger technique | `backend/utils/logger.js` |
| Réponses API standardisées | `backend/utils/apiResponse.js` |
| GeoIP | `backend/utils/geoip.js` |
| Schéma historique (obsolète) | `backend/database/schema_postgres.sql` |
| Audit base de données (équipe) | `backend/database/DB_AUDIT_REPORT.md`, `backend/database/db-audit-report.json` |

## Frontend
| Sujet | Fichier(s) |
|---|---|
| Point d'entrée / providers globaux | `frontend/src/main.jsx` |
| Routage | `frontend/src/routes/AppRoutes.jsx` |
| Protection de route par rôle | `frontend/src/components/auth/ProtectedRoute.jsx` |
| Session / authentification | `frontend/src/contexts/AuthContext.jsx`, `frontend/src/services/authService.js` (déduit) |
| Permissions granulaires (frontend) | `frontend/src/access/FEATURES.js`, `frontend/src/access/useAccess.js`, `frontend/src/access/Can.jsx` |
| Client API centralisé | `frontend/src/services/api.js`, `frontend/src/config/api.js` |
| Langue / RTL | `frontend/src/contexts/LanguageContext.jsx`, `frontend/src/i18n/config.js` |
| Thème clair/sombre | `frontend/src/hooks/useTheme.js`, `frontend/tailwind.config.js` |
| Layouts | `frontend/src/layouts/PublicLayout.jsx`, `frontend/src/layouts/DashboardLayout.jsx` |
| Pages parent | `frontend/src/pages/parent/` |
| Pages tableau de bord | `frontend/src/pages/dashboard/` |
| Pages publiques | `frontend/src/pages/public/` |
| Composants mobiles dédiés | `frontend/src/components/mobile/` |
| Build / configuration Vite | `frontend/vite.config.js` |

## Configuration et déploiement
| Sujet | Fichier(s) |
|---|---|
| Variables d'environnement backend (exemple) | `backend/.env.example` |
| Déploiement backend (Render) | `backend/render.yaml`, `backend/Dockerfile` |
| Déploiement frontend (GitHub Pages) | `.github/workflows/deploy-frontend.yml` |
| Déploiement frontend (Vercel) | `frontend/vercel.json`, `vercel.json` |
| Scripts npm racine | `package.json` |

## Comment utiliser cet index
Pour toute question technique, identifier d'abord le document thématique correspondant ([09](./09_ARCHITECTURE_TECHNIQUE.md) à [20](./20_SECURITE_ET_JOURNALISATION.md)), qui contient l'explication du comportement ; revenir à cet index pour localiser rapidement le fichier exact à ouvrir.
