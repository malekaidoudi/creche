# 13 — Dictionnaire de données

## Objectif
Décrire chaque table identifiée, ses attributs principaux, ses relations, les rôles autorisés à la manipuler et les fichiers source qui l'utilisent. Voir [12_MODELE_DONNEES.md](./12_MODELE_DONNEES.md) pour la méthodologie et les réserves sur les sources.

## Légende des sources
- **[M-001]...[M-008]** : `backend/migrations/versions/001...008_*.js` (migrations actives)
- **[SQL]** : scripts `backend/migrations/*.sql` (exécution manuelle historique)
- **[SCRIPT]** : scripts `backend/scripts/*.js` (exploitation/seed, non exécutés automatiquement)
- **[APP]** : table créée à la demande par le code applicatif (`CREATE TABLE IF NOT EXISTS` dans un service/contrôleur)

---

## `users`
**Finalité** : compte de connexion (parent, personnel, direction, développeur).
**Source** : [M-001], complétée implicitement par les colonnes utilisées dans `auth.js`/`users.js` (`password_token`, `password_token_expires`, `password_set`, `reset_token`, `reset_token_expires`, `gender`, `staff_position`).
**Attributs principaux** : `id`, `email` (unique), `password` (hash bcrypt), `first_name`, `last_name`, `phone`, `role` (`admin|staff|parent|developer`), `profile_image`, `is_active`, `last_active`, `gender`, `staff_position`, `created_at`, `updated_at`.
**Relations** : parent de `children.parent_id` ; référencé par `enrollments.parent_id`, `attendance.created_by`, `notifications.user_id`, `staff_messages.sender_id/recipient_id`, `tasks`, `activity_logs.user_id`, `user_permissions.user_id`, `revoked_tokens.user_id`.
**CRUD** : création publique (`POST /api/auth/register`, forcé en `parent`) ou par un admin (`POST /api/users`, `POST /api/user-workflow/create-staff|create-parent`) ; lecture (`GET /api/users`, `/api/users/:id`, `/api/profile`) ; modification (`PUT /api/users/:id`, `/api/profile`, mot de passe via `/api/users/:id/password` ou `/change-password`) ; suppression (`DELETE /api/users/:id`, réservé `admin`/`developer`).
**Fichiers** : `routes_postgres/auth.js`, `routes_postgres/users.js`, `routes_postgres/userWorkflow.js`, `routes_postgres/profile.js`.

## `children`
**Finalité** : fiche d'un enfant inscrit (identité, médical, filiation, croissance).
**Source** : [M-001] (base) + [M-002] (allergies, notes, médecin, médicaments JSONB, groupe sanguin) + [M-003] (père/mère, titulaire du compte, contact d'urgence, personnes de confiance) + [M-004] (suppression des colonnes `second_parent_*`) + [M-006] (poids, taille).
**Attributs principaux** : identité (`first_name`, `last_name`, `birth_date`, `gender`), médical (`medical_info`, `allergies`, `medical_notes`, `doctor_name`, `doctor_phone`, `medications` JSONB, `conditions` JSONB, `blood_type`, `special_needs`), urgence (`emergency_contact_name/phone`, `emergency_contact_choice`, `trusted_contacts` JSONB), filiation (`father_name/phone`, `mother_name/phone`, `account_holder`), croissance (`weight_kg`, `height_cm`, `growth_measured_at`), photo (`photo_url`, `photo_shared_with_staff`), statut (`is_active`, `archived_at`, `archived_by`, `archive_reason`), `parent_id`.
**Relations** : rattaché à `users` (parent) ; parent de `enrollments`, `attendance`, `daily_reports`, `child_treatments`, `absence_requests`, `child_growth_records`, `children_documents`, `child_supplies`, `daily_supplies_brought`.
**CRUD** : création (`POST /api/children`, formulaire admin) ; lecture (`GET /api/children`, `/:id`, filtrée par accès parent via `requireChildAccess`) ; modification (`PUT /api/children/:id`, `/:id/medical`, `/:id/emergency-contacts`) ; suspension/réactivation (`PUT /:id/suspend`, `/:id/reactivate`) ; suppression réservée `admin` (`DELETE /:id`).
**Fichiers** : `routes_postgres/children.js`.

## `enrollments`
**Finalité** : dossier de demande d'inscription d'un enfant, de la candidature à la décision.
**Source** : [M-001] (base), refondue en profondeur par [SQL] `001_refactor_enrollments_workflow.sql` (champs `applicant_*`, `child_*`, statuts enum `enrollment_status`, `parent_id` devenu nullable) et [M-005] (`emergency_contact_choice`).
**Attributs principaux (après refonte)** : identité du candidat (`applicant_first_name/last_name/email/phone/address`), identité de l'enfant déclarée (`child_first_name/last_name/birth_date/gender/medical_info`), contact d'urgence (`emergency_contact_name/phone/choice`), statut (`new_status` enum : `pending|in_progress|approved|rejected_incomplete|rejected_deleted|archived` ; colonne historique `status` conservée en parallèle), décision (`decision_notes`, `approved_by/at`, `rejected_by/at`), rattachement différé (`parent_id`, `child_id` nullable), `lunch_assistance`, `regulation_accepted`, `submission_source`.
**Relations** : `enrollment_documents.enrollment_id`, `appointments.enrollment_id`, devient `children.id`/`users.id` après approbation.
**CRUD** : création publique sans authentification (`POST /api/enrollments`) ; vérification de doublon (`POST /check-child`, `/check-email`) ; upload de documents (`POST /:id/documents`) ; consultation par la direction (`GET /`, `/:id`, réservé `admin`/`developer`) ; décision (`POST /:id/approve`, `PUT /:id/reject`, réservés `admin`/`developer`) ; choix de RDV par le candidat (`POST /:id/choose-appointment`) ; suppression (`DELETE /:id`).
**Fichiers** : `routes_postgres/enrollments.js`, `controllers/enrollmentsController.js`.

## `enrollment_documents` / `children_documents`
**Finalité** : pièces justificatives jointes respectivement à un dossier d'inscription (avant approbation) et à un enfant déjà créé (après approbation).
**Source** : [SQL] `001_refactor_enrollments_workflow.sql`, `create_enrollment_documents_table.sql`.
**Attributs principaux** : `filename`, `original_filename`, `file_path` (ou URL Cloudinary selon l'évolution du stockage, voir [16_STOCKAGE_FICHIERS.md](./16_STOCKAGE_FICHIERS.md)), `mime_type`, `file_size`, `document_type` (`carnet_medical|acte_naissance|certificat_medical|...`), `uploaded_by`, `is_verified`, `verified_by/at`, `notes` ; `children_documents` ajoute `transferred_from_enrollment` (traçabilité de la migration enrollment → enfant).
**Accès** : parent limité à ses propres documents (`requireDocumentAccess`) ; staff avec permission `children.documents.view` ; admin/developer sans restriction.
**Fichiers** : `routes_postgres/documents.js`, `routes_postgres/enrollments.js`, `services/cloudinaryService.js` (migration des fichiers du dossier `enrollments/enrollment_{id}` vers `children/child_{id}` après approbation).

## `attendance`
**Finalité** : présence quotidienne d'un enfant (arrivée/départ).
**Source** : [M-001].
**Attributs** : `child_id`, `date`, `check_in_time`, `check_out_time`, `notes`, `status` (`present|absent|late|early_departure`), `created_by`.
**Contrainte** : unique par `(child_id, date)`.
**CRUD** : `POST /api/attendance/check-in`, `/check-out` (permission `attendance.manage`) ; lecture (`/today`, `/date/:date`, `/stats`, `/child/:id/month`) ; clôture automatique de fin de journée par le job `jobs/attendanceJob.js`.
**Fichiers** : `routes_postgres/attendance.js`.

## `appointments`
**Finalité** : rendez-vous de visite/entretien lié à un dossier d'inscription.
**Source** : [M-001].
**Attributs** : `enrollment_id`, `parent_id`, `appointment_date/time`, `status` (`scheduled|completed|cancelled|rescheduled|no_show|failed`), `notes`, `admin_notes`, `created_by`.
**CRUD** : création par la direction lors de l'approbation ; confirmation/contre-proposition par le candidat (`PATCH /:id/confirm`, `/:id/counter-propose`, y compris en public via `/public/confirm`, `/public/counter-propose` sans authentification pour un candidat qui n'a pas encore de compte) ; clôture (`/:id/complete`, `/:id/failed`, réservés `admin`/`staff`).
**Fichiers** : `routes_postgres/appointments.js`, `controllers/appointmentsController.js`.

## `absence_requests`
**Finalité** : signalement/déclaration d'absence d'un enfant par un parent.
**Source** : [M-001].
**Attributs** : `child_id`, `parent_id`, `start_date`, `end_date`, `reason`, `status` (`pending|approved|rejected`), `admin_notes`.
**CRUD** : création par le parent (`POST /`) ; traitement par le staff avec permission `absences.manage` (`PUT /:id/acknowledge`) ; vue du jour pour le staff (`GET /today`).
**Fichiers** : `routes_postgres/absenceRequests.js`.

## `daily_reports`, `daily_meals`, `daily_diaper_changes`
**Finalité** : bilan journalier détaillé d'un enfant (repas, sommeil, couches, observations), rédigé par le personnel et consultable par les parents.
**Source** : [M-001].
**Attributs de `daily_reports`** : `child_id`, `report_date` (unique par enfant/jour), `report_type` (`baby|child`), `status` (`draft|completed|sent`), `temperature`, `medication`, `meals_count`, `meal_type`, `period`, `appetite`(+notes), `diaper_changes`, `diaper_nature`(+notes), `skin_condition`(+notes), `sleep_quality`, `sleep_start/end`(+notes), `activities`, `observations`, `created_by`.
**Tables liées** : `daily_meals` (repas détaillés par créneau), `daily_diaper_changes` (changes détaillés).
**CRUD** : création/consultation par le staff avec permission `daily_reports.manage` ; consultation par le parent concerné (`GET /parent/my-children`, `/:childId/history`).
**Fichiers** : `routes_postgres/dailyReports.js`, `controllers/dailyReportsController.js`.

## `child_supplies`, `daily_supplies_brought`
**Finalité** : suivi du stock de fournitures d'un enfant (couches, lingettes, crème) et des apports quotidiens par les parents.
**Source** : [M-001].
**Attributs** : `child_supplies` : `supply_type`, `quantity`, `alert_threshold`, `last_refill_date/quantity` (unique par enfant/type) ; `daily_supplies_brought` : `brought_date`, `supply_type`, `quantity`, `description`, `recorded_by`.
**Fichiers** : `routes_postgres/supplies.js`, `controllers/suppliesController.js`. Fonctionnalité fusionnée côté permission avec `daily_reports.manage` (voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md)).

## `child_treatments`, `treatment_administrations`
**Finalité** : traitements médicaux prescrits à un enfant (médicament, posologie, planning) et traçabilité de chaque administration.
**Source** : [APP] — créées à la demande par `controllers/treatmentsController.js` (`initTreatmentsTables`).
**Attributs de `child_treatments`** : `child_id`, `parent_id`, `medication_name`, `dose`, `notes`, `timing_type` (`interval`...), `interval_hours`, `specific_times` (tableau), `start_date/end_date`, `duration_days`, `status`.
**Attributs de `treatment_administrations`** : `treatment_id`, `administered_by`, `administered_at`, `scheduled_time`, `notes`.
**CRUD** : création/modification/annulation par le parent (`POST /`, `PUT /:id`, `DELETE /:id`) ; consultation et administration par le staff avec rôle `staff|admin|developer` **et** permission `medical.treatments.manage` (`GET /today`, `POST /:id/administer`) ; vérification planifiée par le job `jobs/treatmentJob.js`.
**Fichiers** : `routes_postgres/treatments.js`, `controllers/treatmentsController.js`.

## `child_growth_records`
**Finalité** : historique des mesures de croissance (poids/taille) d'un enfant.
**Source** : [M-006].
**Attributs** : `child_id`, `weight_kg`, `height_cm`, `measured_at`, `recorded_by`.
**Fichiers** : non localisé de route dédiée dans le catalogue d'endpoints observé — **à vérifier** si une route expose cette table (elle alimente potentiellement `children.weight_kg/height_cm/growth_measured_at` en copie de la dernière mesure).

## `holidays`, `holiday_policies`, `nursery_settings`
**Finalité** : jours de fermeture/fériés et paramètres généraux de la crèche (nom, adresse, horaires, vacances annuelles), bilingues (FR/AR).
**Source** : [M-001] (`holidays`, `nursery_settings`), [SCRIPT] `seed.js` (`holiday_policies`).
**Attributs notables de `nursery_settings`** : `setting_key` (unique), `value_fr`, `value_ar`, `category`, `annual_vacation_enabled/start_date/end_date`.
**CRUD** : lecture publique (page d'accueil, contact) ; modification réservée `admin`/`developer` (`PUT /api/nursery-settings/:key`, `/annual-vacation`).
**Fichiers** : `routes_postgres/nurserySettings.js`, `routes_postgres/holidays.js`, `services/SettingsService.js`, `utils/tunisianHolidays.js`.

## `notifications`
**Finalité** : notifications internes affichées dans l'interface utilisateur.
**Source** : [M-001].
**Attributs** : `user_id`, `title`, `message`, `type` (`info|success|warning|error`), `is_read`, `related_id`, `related_type`.
**Fichiers** : `routes_postgres/notifications.js`, `services/notificationService.js`.

## `staff_messages`
**Finalité** : messagerie interne entre personnel/direction et parents (conversation point à point).
**Source** : [M-001].
**Attributs** : `sender_id`, `recipient_id`, `subject`, `content`, `is_read`, `read_at`.
**Accès** : rôles `staff`, `admin`, `parent` uniquement (pas de restriction par permission granulaire sur la lecture, mais la fonctionnalité d'ouverture de conversation avec un parent est conditionnée côté frontend par la permission `messages.parents` pour le staff).
**Fichiers** : `routes_postgres/staff-messages.js`, `services/staffMessageService.js`.

## `personal_memos`
**Finalité** : pense-bêtes personnels d'un membre du personnel (non partagés).
**Source** : [SCRIPT]/évolution applicative (non présent dans la migration 001, table manipulée par `services/personalMemoService.js`).
**Attributs** : non lus intégralement — **à vérifier** (champs visibles via les routes : contenu, date d'échéance, statut complété).
**Fichiers** : `routes_postgres/personal-memos.js`, `services/personalMemoService.js`.

## `tasks`
**Finalité** : tâches internes assignées à un membre du personnel.
**Source** : [SCRIPT] `init_production.js`/`init_production_full.js` (table absente de `migrations/versions/`).
**Attributs observés (hors colonnes signalées obsolètes par `DB_AUDIT_REPORT.md`, voir §12)** : `created_by`, `assigned_to`, statut, échéance, rappel (`/:id/remind`). Colonnes dénormalisées historiques `parent_name/email/phone`, `child_name`, `is_confirmed`, `confirmed_at`, `original_date`, `reschedule_count` signalées comme non utilisées.
**CRUD** : gestion réservée à la permission `tasks.manage` ; consultation personnelle (`GET /my`, `/today`, `/overdue`) ouverte à tout utilisateur authentifié.
**Fichiers** : `routes_postgres/tasks.js`, `controllers/tasksController.js`.

## `events`, `event_comments`, `event_history`, `event_reminders`
**Finalité** : système de planning/calendrier plus riche que `tasks` (événements avec récurrence, participants, rappels, historique de modification).
**Source** : [M-001] pour `events` ; [SCRIPT] `init_production_full.js` pour `event_reminders`/`event_history`.
**Attributs de `events`** : `title`, `description`, `type`, `start_date/end_date`, `all_day`, `is_recurring`, `recurrence_rule` (JSONB), `status`, `priority`, `created_by`, `assigned_to`, `child_id`, `enrollment_id`, `reminder_enabled/offset`, `color`, `attendees` (JSONB), `metadata` (JSONB), `completed_at`.
**Fichiers** : `routes_postgres/events.js`.

## `announcements`
**Finalité** : annonces/actualités diffusées aux parents (ciblage par audience).
**Source** : [SCRIPT] `init_production.js` (table absente de `migrations/versions/`).
**Attributs** : `title`, `content`, `type`, `target_audience` (`all|...`), `is_active`, `start_date/end_date`, `created_by`.
**CRUD** : création/publication/suppression réservées `admin` (`POST /`, `PATCH /:id/publish`, `DELETE /:id`) ; lecture conditionnée par un middleware local `requireAnnouncementAccess` (non lu intégralement — **à vérifier**).
**Fichiers** : `routes_postgres/announcements.js`.

## `activities`, `activity_comments`, `activity_reactions`
**Finalité** : fil d'activités pédagogiques publié par le personnel (photos/vidéos, commentaires, réactions), visible sur le site public et dans « Mon Espace ».
**Source** : évolution applicative, enrichie par [M-007] (`media_urls` JSONB pour plusieurs photos) et [M-008] (type de média `images`).
**Attributs notables** : `media_url`, `media_urls` (JSONB), `media_type` (`image|images|video|live|none`), `media_thumbnail_url`, `cloudinary_public_id`.
**CRUD** : publication réservée à la permission `activities.photos.publish` ; réactions/commentaires ouverts à tout utilisateur authentifié (`POST /:id/reactions`, `/:id/comments`).
**Fichiers** : `routes_postgres/activities.js`.

## `activity_logs` (journal technique direction) vs `logs` (journal applicatif générique)
**Attention à l'homonymie** : deux tables distinctes coexistent.
- **`activity_logs`** [M-001] : journal d'activité détaillé orienté sécurité/traçabilité (`user_id`, `action`, `description`, `entity_type/id`, `ip_address`, `user_agent`), exploité par le module « Journal d'activité » réservé au `developer` (dashboard, alertes, rapports périodiques). Fichiers : `routes_postgres/activityLogs.js`, `controllers/activityLogController.js`, `services/activityLogService.js`.
- **`logs`** [SCRIPT] `add-missing-tables.js`/`init_production_full.js` : journal plus simple, exposé par `routes_postgres/logs.js` (`GET/POST /api/logs`) et par la page `ActivityFeedPage`/widgets. Relation avec `email_logs` (historique des e-mails envoyés, voir [17_MESSAGERIE_ET_NOTIFICATIONS.md](./17_MESSAGERIE_ET_NOTIFICATIONS.md)).

## `contact_messages` (vs `contacts`, jugée obsolète)
**Finalité** : messages soumis via le formulaire de contact public.
**Source** : [SCRIPT] `add-missing-tables.js`.
**CRUD** : création publique (`POST /api/contacts`) ; gestion par la direction (`routes_postgres/contactMessages.js` : liste, réponse, changement de statut, suppression, statistiques).
**Remarque** : la table `contacts`, plus ancienne, est signalée comme doublon non utilisé par `DB_AUDIT_REPORT.md`.

## `testimonials`
**Finalité** : témoignages de parents affichés sur le site public après modération.
**Source** : [M-001].
**Attributs** : `parent_name`, `child_name`, `content`, `rating` (1-5), `status` (`pending|approved|rejected`), `is_featured`, `approved_by/at`.
**CRUD** : soumission par un parent connecté (`POST /`) ; modération par `admin`/`developer` (`PUT /:id/approve`, `/reject`, `/feature`) ; lecture publique des témoignages approuvés (`GET /approved`).
**Fichiers** : `routes_postgres/testimonials.js`.

## `admin_documents`
**Finalité** : documents administratifs généraux de la crèche (règlement intérieur, formulaires), distincts des documents liés à un enfant.
**Source** : [M-001].
**Attributs** : `title`, `description`, `document_type`, `cloudinary_url/public_id`, `is_public`, `is_required`, `uploaded_by`.
**Fichiers** : `routes_postgres/documents.js` (`/admin`, `/public/reglement`).

## `payment_reminders`
**Finalité** : alertes de paiement/relances financières.
**Source** : évolution applicative (table listée dans `DB_AUDIT_REPORT.md`, non retrouvée dans les migrations versionnées).
**Fichiers** : `routes_postgres/paymentAlerts.js` (`POST /`, `GET /history`, réservés `admin`/`staff`). **À vérifier** : structure exacte des colonnes.

## `revoked_tokens`
**Finalité** : liste de révocation des jetons JWT (déconnexion serveur). Voir [10_AUTHENTIFICATION.md](./10_AUTHENTIFICATION.md).
**Source** : [M-001].

## `permissions`, `user_permissions`
**Finalité** : catalogue des permissions granulaires et permissions accordées par utilisateur. Voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md).
**Source** : [APP] `services/permissionsService.js`.

## `staff_age_assignments`
**Finalité** : affectation d'un membre du personnel à une tranche d'âge (`baby|child|both`), utilisée pour cibler certaines vues/filtres.
**Source** : [M-001].
**Fichiers** : `routes_postgres/staffAssignments.js`, `controllers/staffAssignmentsController.js`.

## Tables jugées obsolètes par l'audit interne (présentes en base, non documentées davantage ici)
`contacts`, `documents`, `uploads`, `enrollments_archive`, `children_archive` — voir [12_MODELE_DONNEES.md](./12_MODELE_DONNEES.md) §5 et [23_ANOMALIES_ET_RECOMMANDATIONS.md](./23_ANOMALIES_ET_RECOMMANDATIONS.md).

## Limites et points à vérifier
- Structure exacte de `personal_memos`, `payment_reminders`, `parent_children` : non confirmée par lecture complète du DDL.
- Existence et contenu de `holiday_policies` en production (créée par un script de seed, pas par la pipeline de migration automatique).
- Toute colonne ajoutée par un script d'exploitation listé en §1 de [12_MODELE_DONNEES.md](./12_MODELE_DONNEES.md) mais non confirmée comme exécutée en production.
