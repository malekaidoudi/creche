# 07 — Catalogue des fonctionnalités

## Objectif
Inventaire des fonctionnalités réellement présentes dans le code (route frontend existante + API backend correspondante), regroupées par espace. Pour chaque fonctionnalité : rôles autorisés, chemin d'accès, résultat attendu, références code. Les procédures pas-à-pas détaillées pour l'utilisateur final sont dans les guides par rôle ([03](./03_GUIDE_PARENT.md) à [06](./06_GUIDE_DEVELOPPEUR_UTILISATEUR.md)).

Statuts utilisés : **Implémentée** (route frontend + API confirmées), **Partiellement implémentée** (fonctionnalité visible mais logique incomplète ou incohérente constatée), **Présente non vérifiée** (route existe, comportement non audité en détail), **Absente** (mentionnée dans d'anciens documents mais non trouvée dans le code).

---

## A. Site public (aucune connexion requise)

| Fonctionnalité | Chemin | Rôles | Statut | Références |
|---|---|---|---|---|
| Page d'accueil | `/` | Public | Implémentée | `pages/public/HomePage.jsx` |
| Formulaire d'inscription en ligne d'un enfant | `/inscription` | Public | Implémentée | `pages/public/EnrollmentPage.jsx`, `POST /api/enrollments` |
| Vérification de doublon en temps réel pendant la saisie | `/inscription` | Public | Implémentée | `POST /api/enrollments/check-child`, `/check-email` |
| Téléversement de documents d'inscription | `/inscription`, `/upload-documents` | Public | Implémentée | `pages/public/UploadDocumentsPage.jsx`, `POST /api/enrollments/:id/documents` |
| Suivi du statut d'un dossier d'inscription | — (lien direct) | Public | Implémentée | `GET /api/enrollments/:id/status` |
| Confirmation/contre-proposition de rendez-vous sans compte | — (lien e-mail) | Public (candidat) | Implémentée | `POST /api/appointments/public/confirm`, `/public/counter-propose` |
| Formulaire de contact | `/contact` | Public | Implémentée | `pages/public/ContactPageDynamic.jsx`, `POST /api/contacts` |
| Visite virtuelle (images) | `/visite-virtuelle` | Public | Implémentée | `pages/public/VirtualTourPage.jsx`, `GET /api/virtual-tour/images` |
| Page de localisation / présentation du lieu | `/preview-location` | Public | Présente non vérifiée | `pages/public/LocationShowcasePage.jsx` |
| Témoignages de parents (lecture) | intégré à la page d'accueil | Public | Implémentée | `GET /api/testimonials/approved` |
| Téléchargement du règlement intérieur | — | Public | Implémentée | `GET /api/documents/public/reglement` |
| Création de mot de passe après approbation | `/create-password` | Public (candidat approuvé) | Implémentée | `pages/public/CreatePasswordPage.jsx`, `POST /api/auth/create-password` |
| Inscription libre d'un compte parent | `/register` | Public | Implémentée (voir remarque §10.4 de [10_AUTHENTIFICATION.md](./10_AUTHENTIFICATION.md)) | `pages/auth/RegisterPage.jsx`, `POST /api/auth/register` |
| Mot de passe oublié / réinitialisation | `/forgot-password`, `/reset-password/:token` | Public | Implémentée | `pages/auth/ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx` |
| Page de récupération d'urgence (clé dédiée) | `/recovery` | Détenteur de `RECOVERY_KEY` | Implémentée | `pages/RecoveryPage.jsx`, `routes_postgres/recovery.js` |

## B. « Mon Espace » (parent, et accès limité admin/staff sur la racine)

| Fonctionnalité | Chemin | Rôles | Statut | Références |
|---|---|---|---|---|
| Tableau de bord parent (vue d'ensemble enfants) | `/mon-espace` | `parent` (+ `admin`/`staff` en lecture) | Implémentée | `pages/parent/MySpacePage.jsx` |
| Fil d'activités pédagogiques (lecture) | `/activites` | `parent`, `admin`, `staff`, `developer` (tout utilisateur connecté) | Implémentée | `pages/activities/ActivitiesPage.jsx`, protégé par `ProtectedRoute` (corrigé le 11/10/2026, `corrections.md` Fiche 58) ; monté sous `PublicLayout` mais hors du périmètre réellement public, cohérent avec `GET /api/activities` (`routes_postgres/activities.js` L66) qui exige `auth.authenticateToken` |
| Ajouter un enfant à son compte | `/mon-espace/ajouter-enfant` | `parent` | Implémentée | `pages/parent/AddChildPage.jsx` |
| Détails d'un enfant | `/mon-espace/child/:id/details` | `parent` (propriétaire) | Implémentée | `pages/parent/ChildDetailsPage.jsx`, `GET /api/children/:id` |
| Fiche médicale de l'enfant | `/mon-espace/child/:id/medical` | `parent` (propriétaire) | Implémentée | `pages/parent/ChildMedicalPage.jsx`, `GET/PUT /api/children/:id/medical` |
| Contacts d'urgence de l'enfant | `/mon-espace/child/:id/emergency-contacts` | `parent` (propriétaire) | Implémentée | `pages/parent/ChildEmergencyContactsPage.jsx` |
| Consultation des bilans journaliers de l'enfant | `/mon-espace/daily-reports` | `parent` (+ `admin`/`staff`) | Implémentée | `pages/parent/ChildDailyReportsPage.jsx`, `GET /api/daily-reports/parent/my-children` |
| Gestion des traitements médicaux de l'enfant | `/mon-espace/treatments` | `parent` | Implémentée | `pages/parent/TreatmentsPage.jsx`, `routes_postgres/treatments.js` |
| Consultation des présences | `/mon-espace/attendance-report`, `/attendance-parent` | `parent` | Implémentée | `pages/parent/AttendanceParentPage.jsx` |
| Déclarer une absence | `/mon-espace/absence-request` | `parent` | Implémentée | `pages/parent/AbsenceRequestPage.jsx`, `POST /api/absence-requests` |
| Consulter les annonces de la crèche | `/mon-espace/announcements` | `parent` | Implémentée | `pages/parent/AnnouncementsPage.jsx` |
| Calendrier parent | `/mon-espace/calendar` | `parent` | Implémentée | `pages/parent/ParentCalendarPage.jsx` |
| Messagerie avec le personnel | `/mon-espace/messages` | `parent` | Implémentée | `pages/messages/MessagesPage.jsx`, `routes_postgres/staff-messages.js` |
| Fil d'activités (vue parent) | `/mon-espace/activities` | `parent` | Implémentée | `pages/activities/ActivitiesPage.jsx` |
| Profil unifié (modification de ses propres informations) | `/profile` | `parent`, `staff`, `admin`, `developer` | Implémentée | `pages/UnifiedProfilePage.jsx`, `routes_postgres/profile.js` |
| Soumettre un témoignage | — (intégré) | `parent` | Implémentée | `POST /api/testimonials` |

## C. Tableau de bord (`admin`, `staff`, `developer`)

### C.1 Commun à tout le personnel (sans permission supplémentaire requise au niveau du rôle)
| Fonctionnalité | Chemin | Statut | Références |
|---|---|---|---|
| Accueil du tableau de bord (statistiques) | `/dashboard` | Implémentée | `pages/dashboard/DashboardHome.jsx`, `GET /api/dashboard/stats`, `/overview` |
| Liste des enfants | `/dashboard/children` | Implémentée | `pages/dashboard/ChildrenPage.jsx` |
| Présences du jour / historique / statistiques | `/dashboard/attendance*` | Implémentée (gestion restreinte par permission `attendance.manage`) | `pages/dashboard/AttendancePage.jsx` |
| Documents (téléchargement/consultation) | `/dashboard/documents*` | Implémentée | `pages/dashboard/DocumentsPage.jsx` |
| Gestion des absences signalées | `/dashboard/absence-management` | Implémentée (traitement restreint par permission `absences.manage`) | `pages/staff/AbsenceManagementPage.jsx` |
| Planning (calendrier mensuel/hebdomadaire) | `/dashboard/planning*`, `/events/calendar` | Implémentée | `pages/dashboard/MonthlyPlanningPage.jsx`, `WeeklyPlanningPage.jsx` |
| Envoyer un mémo/message à un parent | `/dashboard/staff/send-message` | Implémentée (restreinte en pratique par permission `messages.parents`) | `pages/staff/StaffMemoForm.jsx` |
| Messagerie interne | `/dashboard/messages` | Implémentée | `pages/messages/MessagesPage.jsx` |
| Annonces (consultation) | `/dashboard/announcements` | Implémentée (lecture) | `pages/parent/AnnouncementsPage.jsx` réutilisée |
| Tâches internes | `/dashboard/tasks` | Implémentée (gestion restreinte par permission `tasks.manage`) | `pages/tasks/TasksPage.jsx` |
| Fil d'activités (publication) | `/dashboard/activities` | Implémentée (publication restreinte par permission `activities.photos.publish`) | `pages/activities/ActivitiesPage.jsx` |
| Bilans journaliers des enfants | `/dashboard/daily-reports` | Implémentée (restreinte par permission `daily_reports.manage`) | `pages/dashboard/DailyReportsPage.jsx` |
| Traitements médicaux à administrer | `/dashboard/treatments` | Implémentée (restreinte par rôle `staff/admin/developer` + permission `medical.treatments.manage`) | `pages/dashboard/TreatmentsPage.jsx` |
| Paramètres personnels du personnel | `/dashboard/staff-settings` | Présente non vérifiée | `pages/dashboard/StaffSettingsPage.jsx` |

### C.2 Réservé à `admin`/`developer`
| Fonctionnalité | Chemin | Statut | Références |
|---|---|---|---|
| Ajouter un enfant (saisie directe par la direction) | `/dashboard/add-child` | Implémentée | `pages/dashboard/AddChildPage.jsx` |
| Gestion des inscriptions (liste, approbation, rejet) | `/dashboard/enrollments`, `/pending-enrollments`, `/enrollments/today\|history\|stats` | Implémentée | `pages/dashboard/EnrollmentsPage.jsx`, `PendingEnrollmentsPage.jsx` |
| Liste des parents | `/dashboard/parents` | Implémentée | `pages/dashboard/ParentsPage.jsx` |
| Liste du personnel | `/dashboard/staff` | Implémentée | `pages/dashboard/StaffPage.jsx` |
| Créer un utilisateur (parent ou personnel) | `/dashboard/add-user` | Implémentée | `pages/dashboard/AddUserPage.jsx`, `POST /api/users`, `/api/user-workflow/create-parent\|create-staff` |
| Attribution des permissions individuelles du personnel | intégré à la gestion du personnel (modale) | Implémentée | `components/modals/StaffPermissionsModal.jsx`, `routes_postgres/staffPermissions.js` |
| Statistiques générales | `/dashboard/general-stats` | Implémentée | `pages/dashboard/GeneralStatsPage.jsx` |
| Rapport de présence consolidé | `/dashboard/attendance-report` | Implémentée | `pages/dashboard/AttendanceReportPage.jsx` |
| Paramètres de la crèche | `/dashboard/settings` | Implémentée | `pages/dashboard/DashboardSettingsPage.jsx`, `routes_postgres/nurserySettings.js` |
| Fil d'activité agrégé (vue direction) | `/dashboard/activity-feed` | Implémentée | `pages/dashboard/ActivityFeedPage.jsx` |
| Messagerie — boîte de réception des messages de contact | `/dashboard/mailbox` | Implémentée | `pages/dashboard/MailboxPage.jsx`, `routes_postgres/contactMessages.js` |
| Modération des témoignages | `/dashboard/testimonials` | Implémentée | `pages/dashboard/TestimonialsManagementPage.jsx` |
| Sauvegardes (créer, lister, restaurer) | intégré aux paramètres (composant `BackupManager.jsx`) | Implémentée | `routes_postgres/backup.js` |

### C.3 Réservé exclusivement à `developer`
| Fonctionnalité | Chemin | Statut | Références |
|---|---|---|---|
| Journal d'activité technique (sécurité, alertes, rapports) | `/dashboard/activity-logs` | Implémentée | `pages/dashboard/ActivityLogPage.jsx`, `routes_postgres/activityLogs.js` |
| Explorateur de stockage Cloudinary | `/dashboard/storage` | Implémentée | `pages/dashboard/CloudinaryExplorerPage.jsx`, `routes_postgres/cloudinaryExplorer.js` |

## D. Fonctionnalités transverses
| Fonctionnalité | Statut | Références |
|---|---|---|
| Changement de langue FR/AR avec bascule RTL | Implémentée | `LanguageContext.jsx`, `i18n/config.js` |
| Thème clair/sombre | Implémentée | `hooks/useTheme.js` |
| Notifications in-app | Implémentée | `routes_postgres/notifications.js` |
| Cache local des données peu volatiles (paramètres, jours fériés) | Implémentée | `services/api.js` (`cachedGet`) |
| Jours fériés tunisiens pré-calculés | Implémentée | `utils/tunisianHolidays.js`, `routes_postgres/holidays.js` |

## E. Fonctionnalités mentionnées ailleurs mais non confirmées / absentes
| Fonctionnalité | Statut | Élément observé |
|---|---|---|
| Connexion sociale / OAuth (Google, Facebook...) | **Absente** | Seul un document de proposition existe (`docs/PRD_OAUTH_SOCIAL_LOGIN.md`), aucune route ni dépendance OAuth dans le code |
| Architecture multi-tenant (plusieurs crèches) | **Absente** | Document de planification uniquement (`docs/MULTI_TENANT_PLAN.md`), le modèle de données actuel est mono-établissement |
| Application mobile native | **Absente** | Un plan d'intégration existe (`docs/MOBILE_INTEGRATION_PLAN.md`) mais aucun code mobile natif trouvé ; seule une adaptation responsive web (`components/mobile/`) est implémentée |
| Rafraîchissement automatique du JWT (refresh token) | **Absente** | Voir [10_AUTHENTIFICATION.md](./10_AUTHENTIFICATION.md) |

## Limites et points à vérifier
- Contenu détaillé de plusieurs pages non ouvertes dans cet audit (`StaffSettingsPage`, `LocationShowcasePage`).
