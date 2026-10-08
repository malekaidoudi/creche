# Cartographie fonctionnelle

Légende : ✅ implémentée · 🟡 partielle / à vérifier · 🔴 absente · 💡 suggérée par le code

| Domaine | Fonctionnalité | Statut | Sources principales |
|---|---|---|---|
| **Site public** | Accueil, contact (formulaire → table + e-mail), visite virtuelle (images gérées par admin), activités | ✅ | `frontend/src/pages/public/*`, `backend/routes_postgres/contacts.js`, `virtualTour.js` |
| **Inscription** | Formulaire public, vérification enfant/e-mail, documents, approbation/rejet, création de compte parent | ✅ | `routes_postgres/enrollments.js`, `controllers/enrollmentsController.js` |
| **Authentification** | Connexion JWT, mot de passe oublié, création de mot de passe par lien, changement de mot de passe | ✅ | `routes_postgres/auth.js`, `userWorkflow.js` |
| **Utilisateurs** | Création parent/personnel (admin), activation/désactivation, profil, photo | ✅ | `userWorkflow.js`, `users.js`, `profile.js` |
| **Permissions personnel** | 18 permissions assignables par membre du personnel | 🟡 (6 appliquées côté API) | `services/permissionsService.js`, `staffPermissions.js` |
| **Enfants** | Fiche, liste/filtres, ajout (admin/parent), photo, infos médicales, contacts d'urgence, rattachement parent, désactivation/suppression | ✅ | `routes_postgres/children.js`, `services/childLifecycleService.js` |
| **Présences** | Pointage arrivée/départ, historique, stats, rapport, calendrier enfant | ✅ (API dupliquée et partiellement non protégée) | `routes_postgres/attendance.js` |
| **Absences** | Demande parent, prise en compte par le personnel | ✅ | `absenceRequests.js` |
| **Rapports journaliers** | Repas, couches, sommeil, température, peau, observations ; statut brouillon/terminé/envoyé ; consultation parent | ✅ | `controllers/dailyReportsController.js` |
| **Traitements médicaux** | Création par le parent, administration par le personnel, historique, rappels | ✅ | `controllers/treatmentsController.js`, `jobs/treatmentJob.js` |
| **Fournitures** | Stock par enfant (couches, lingettes, crème, autre), réapprovisionnement, consommation, apports quotidiens, alerte seuil | ✅ | `controllers/suppliesController.js` |
| **Rendez-vous** | Proposition/acceptation/contre-proposition/annulation (parent ↔ direction) + RDV d'inscription | ✅ | `services/appointmentService.js`, `routes_postgres/appointments.js` |
| **Tâches / événements / mémos** | Événements typés (tâche, rdv, mémo, anniversaire…), kanban, commentaires, rappels | ✅ | `services/eventService.js`, `taskService.js`, `routes_postgres/events.js`, `tasks.js` |
| **Planning** | Calendrier mensuel, planning hebdomadaire | ✅ UI ; **règles précises du planning hebdo : à vérifier** | `pages/dashboard/MonthlyPlanningPage.jsx`, `WeeklyPlanningPage.jsx` |
| **Affectation du personnel** | Tranche d'âge (bébé/enfant/les deux) par membre du personnel | ✅ | `staffAssignments.js` |
| **Messagerie** | Messages 1-à-1 avec fil de réponse (personnel ↔ direction ↔ parents) ; mémos personnels | ✅ | `staff-messages.js`, `personal-memos.js` |
| **Annonces** | Annonces ciblées (tous / enfants précis), publication, notification | ✅ | `announcements.js`, `services/announcementService.js` |
| **Fil d'activités** | Publications photo/vidéo, épinglage, réactions, commentaires | ✅ | `activities.js`, `services/activityService.js` |
| **Documents** | Documents d'inscription, documents d'enfant, documents administratifs (règlement intérieur…) | ✅ | `documents.js`, `services/cloudinaryService.js` |
| **Notifications** | Notifications internes (cloche), e-mails, push Expo | ✅ interne/e-mail · 🟡 push (application mobile **non présente** dans le dépôt) | `notifications.js`, `emails/`, `pushNotificationService.js` |
| **Jours fériés / vacances** | Calendrier tunisien, fermetures, vacances annuelles | ✅ | `holidays.js`, `nurserySettings.js`, `utils/tunisianHolidays.js` |
| **Paramètres** | Informations crèche FR/AR | ✅ (écriture non protégée côté API) | `nurserySettings.js` |
| **Témoignages** | Dépôt par parent, modération admin, affichage public | ✅ | `testimonials.js` |
| **Courrier** | Boîte des messages du formulaire de contact, réponse par e-mail | ✅ | `contactMessages.js` |
| **Rappels de paiement** | Alerte aux familles | 🟡 | `paymentAlerts.js` (pas de module de facturation) |
| **Paiements / facturation** | — | 🔴 absent (aucune table ni route de facturation) | — |
| **Statistiques** | Tableau de bord, stats générales, rapport de présences | ✅ | `dashboardStats.js`, pages `GeneralStatsPage`, `AttendanceReportPage` |
| **Journal d'activité (technique)** | Logs, alertes, rapports quotidiens/hebdo/mensuels, archives | ✅ développeur | `activityLogs.js`, `middleware/activityLogger.js` |
| **Fil d'activité direction** | Synthèse simplifiée | ✅ | `activityFeed.js` |
| **Explorateur de stockage** | Gestion des fichiers Cloudinary | ✅ développeur | `cloudinaryExplorer.js` |
| **Sauvegarde / récupération** | JSON quotidien, restauration, mode récupération d'urgence | ✅ (voir limites) | `backup.js`, `recovery.js`, `jobs/backupJob.js` |
| **OAuth / connexion sociale** | `docs/PRD_OAUTH_SOCIAL_LOGIN.md` | 💡 prévue, **non implémentée** | — |
| **Multi-crèches (multi-tenant)** | `docs/MULTI_TENANT_PLAN.md` | 💡 plan uniquement | — |
| **Application mobile** | composants `frontend/src/components/mobile/*` = UI responsive web ; token push Expo côté backend | 🟡 app native **non présente** | — |
