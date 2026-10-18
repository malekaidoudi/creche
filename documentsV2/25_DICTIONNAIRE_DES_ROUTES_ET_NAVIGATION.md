# 25 — Dictionnaire des Routes et Navigation Frontend

## Objectif
Ce document constitue le **référentiel canonique absolu** de toutes les routes de navigation côté client (`frontend/src/routes/AppRoutes.jsx`) pour l'application de la crèche **Mima Elghalia**. Il sert de source de vérité pour :
1. Les développeurs concevant de nouvelles vues ou menus.
2. Le système d'aide contextuel (`HelpSystem.jsx`).
3. L'Assistant Virtuel IA (Google Gemini via `aiAssistantService.js`) pour garantir qu'**aucun lien 404, page inexistante ou URL non autorisée** ne soit jamais proposé aux utilisateurs.

---

## 1. Table Complète des Routes Canoniques Frontend

### A. Routes Publiques et Authentification (Non connectés ou Tous rôles)
| Route Frontend | Composant Page | Rôles Autorisés | Description & Fonctionnalités |
|---|---|---|---|
| `/` | `HomePage.jsx` | Tous (`visitor`, `parent`, `staff`, `admin`, `developer`) | Accueil public, présentation de la crèche et **formulaire de connexion intégré** (`LoginFormHero.jsx`). |
| `/inscription` | `EnrollmentPage.jsx` | Tous | Formulaire d'inscription en ligne d'un nouvel enfant avec téléversement de documents. |
| `/contact` | `ContactPageDynamic.jsx` | Tous | Formulaire de contact, coordonnées téléphoniques, adresse et horaires. |
| `/visite-virtuelle` | `VirtualTourPage.jsx` | Tous | Visite immersive 360° des salles d'éveil, dortoirs et extérieurs. |
| `/preview-location` | `LocationShowcasePage.jsx` | Tous | Présentation de l'emplacement géographique et accès. |
| `/forgot-password` | `ForgotPasswordPage.jsx` | Tous | Demande de réinitialisation de mot de passe par e-mail (lien sécurisé d'1 heure). |
| `/reset-password/:token`| `ResetPasswordPage.jsx` | Tous | Saisie du nouveau mot de passe via jeton d'invitation ou de récupération. |
| `/create-password` | `CreatePasswordPage.jsx` | Tous | Création du mot de passe initial suite à l'approbation du dossier d'inscription. |
| `/upload-documents` | `UploadDocumentsPage.jsx` | Tous | Dépôt complémentaire de pièces justificatives pour une inscription en cours. |
| `/recovery` | `RecoveryPage.jsx` | Tous | Page technique d'urgence (hors layout principal). |

---

### B. Espace Commun (Connectés tous rôles)
| Route Frontend | Composant Page | Rôles Autorisés | Description & Fonctionnalités |
|---|---|---|---|
| `/activites` | `ActivitiesPage.jsx` | `parent`, `staff`, `admin`, `developer` | Galerie et rétrospective des activités pédagogiques et sorties. |
| `/profile` | `UnifiedProfilePage.jsx` | `parent`, `staff`, `admin`, `developer` | Profil utilisateur, mise à jour des coordonnées et changement de mot de passe. |

---

### C. Espace Famille / Parents (`/mon-espace/*`)
> **Note de sécurité** : L'accès aux pages `/mon-espace/*` est strictement réservé au rôle `parent` (la direction peut y accéder en consultation/test). Les parents ne voient **que leurs propres enfants**.

| Route Frontend | Composant Page | Rôles Autorisés | Description & Fonctionnalités |
|---|---|---|---|
| `/mon-espace` | `MySpacePage.jsx` | `parent`, `staff`, `admin` | Tableau de bord parent : fiches des enfants, alertes, synthèses. |
| `/mon-espace/absence-request` | `AbsenceRequestPage.jsx` | `parent` | Déclaration d'absence imprévue ou congés (dates, motifs, justificatifs). |
| `/mon-espace/treatments` | `TreatmentsPage.jsx` | `parent` | Déclaration des traitements médicaux prescrits (ordonnance, posologie, horaires). |
| `/mon-espace/attendance-report`| `AttendanceParentPage.jsx` | `parent` | Historique détaillé des heures d'arrivée et de départ de l'enfant. |
| `/mon-espace/daily-reports` | `ChildDailyReportsPage.jsx`| `parent`, `staff`, `admin` | Consultation en temps réel des bilans journaliers (repas, siestes, changes). |
| `/mon-espace/messages` | `MessagesPage.jsx` | `parent` | Messagerie sécurisée avec l'équipe pédagogique et la direction. |
| `/mon-espace/calendar` | `ParentCalendarPage.jsx` | `parent` | Calendrier des activités, ateliers et jours fériés de la crèche. |
| `/mon-espace/announcements`| `AnnouncementsPage.jsx` | `parent` | Annonces et notes d'information officielles de la crèche. |
| `/mon-espace/activities` | `ActivitiesPage.jsx` | `parent` | Activités et photos du groupe de l'enfant. |
| `/mon-espace/ajouter-enfant` | `AddChildPage.jsx` | `parent` | Ajout d'une fiche enfant supplémentaire pour une fratrie. |
| `/mon-espace/child/:id/details` | `ChildDetailsPage.jsx` | `parent` | Détails d'état civil et habitudes de l'enfant. |
| `/mon-espace/child/:id/medical` | `ChildMedicalPage.jsx` | `parent` | Dossier médical, allergies et carnet vaccinal. |
| `/mon-espace/child/:id/emergency-contacts` | `ChildEmergencyContactsPage.jsx` | `parent` | Gestion des personnes de confiance autorisées (jusqu'à 2 personnes majeures). |

---

### D. Tableau de Bord Opérationnel Personnel / Staff (`/dashboard/*`)
> **Rôles autorisés** : `staff`, `admin`, `developer`.

| Route Frontend | Composant Page | Rôles Autorisés | Description & Fonctionnalités |
|---|---|---|---|
| `/dashboard` | `DashboardHome.jsx` | `staff`, `admin`, `developer` | Vue générale quotidienne (enfants présents, alertes du jour, mémos). |
| `/dashboard/attendance` | `AttendancePage.jsx` | `staff`, `admin`, `developer` | **Pointage des présences** : Check-in à l'arrivée, Check-out au départ. |
| `/dashboard/absence-management`| `AbsenceManagementPage.jsx`| `staff`, `admin`, `developer` | Consultation et validation des absences signalées par les parents. |
| `/dashboard/daily-reports` | `DailyReportsPage.jsx` | `staff`, `admin`, `developer` | Saisie des rapports quotidiens : quantités mangées, sommeil, humeur. |
| `/dashboard/treatments` | `TreatmentsPage.jsx` | `staff`, `admin`, `developer` | Administration des médicaments (requiert permission individuelle spécifique). |
| `/dashboard/planning` | `WeeklyPlanningPage.jsx` | `staff`, `admin`, `developer` | Planning hebdomadaire des salles et affectations du personnel. |
| `/dashboard/planning/calendar` | `MonthlyPlanningPage.jsx`| `staff`, `admin`, `developer` | Vue mensuelle du calendrier d'établissement. |
| `/dashboard/children` | `ChildrenPage.jsx` | `staff`, `admin`, `developer` | Répertoire des enfants inscrits avec filtres par section. |
| `/dashboard/documents` | `DocumentsPage.jsx` | `staff`, `admin`, `developer` | Centre de gestion des documents administratifs et modèles. |
| `/dashboard/messages` | `MessagesPage.jsx` | `staff`, `admin`, `developer` | Messagerie interne d'établissement. |
| `/dashboard/announcements`| `AnnouncementsPage.jsx` | `staff`, `admin`, `developer` | Publication des avis et annonces à destination des familles. |
| `/dashboard/tasks` | `TasksPage.jsx` | `staff`, `admin`, `developer` | Gestion des tâches internes de l'équipe. |
| `/dashboard/staff-settings`| `StaffSettingsPage.jsx` | `staff`, `admin`, `developer` | Préférences personnelles de l'éducatrice. |

---

### E. Modules d'Administration et Direction (`/dashboard/*` admin/dev)
> **Rôles autorisés** : `admin`, `developer`. Le personnel standard (`staff`) y reçoit une erreur 403 Forbidden.

| Route Frontend | Composant Page | Rôles Autorisés | Description & Fonctionnalités |
|---|---|---|---|
| `/dashboard/enrollments` | `EnrollmentsPage.jsx` | `admin`, `developer` | Examen des dossiers d'inscription, validation et fixation des rendez-vous. |
| `/dashboard/pending-enrollments`| `PendingEnrollmentsPage.jsx`| `admin`, `developer` | Vue filtrée des inscriptions en attente d'arbitrage. |
| `/dashboard/staff` | `StaffPage.jsx` | `admin`, `developer` | **Gestion du personnel ET attribution des 14 permissions** (via `StaffPermissionsModal.jsx`). |
| `/dashboard/parents` | `ParentsPage.jsx` | `admin`, `developer` | Annuaire complet des comptes parents et contacts. |
| `/dashboard/add-child` | `AddChildPage.jsx` | `admin`, `developer` | Création administrative directe d'une fiche enfant. |
| `/dashboard/add-user` | `AddUserPage.jsx` | `admin`, `developer` | Création d'un compte utilisateur (éducatrice, administrateur). |
| `/dashboard/general-stats` | `GeneralStatsPage.jsx` | `admin`, `developer` | Statistiques globales de fréquentation, taux de remplissage et ratios. |
| `/dashboard/attendance-report` | `AttendanceReportPage.jsx` | `admin`, `developer` | Rapports consolidés de présence pour facturation ou audit. |
| `/dashboard/settings` | `DashboardSettingsPage.jsx`| `admin`, `developer` | Paramètres généraux de la crèche, horaires, politique de mot de passe. |
| `/dashboard/settings#section-holidays` | `DashboardSettingsPage.jsx`| `admin`, `developer` | **Gestion des 28 jours fériés tunisiens** (activation/désactivation). |
| `/dashboard/settings#section-backups` | `DashboardSettingsPage.jsx`| `admin`, `developer` | Déclenchement de sauvegardes manuelles et téléchargement des archives. |
| `/dashboard/activity-feed` | `ActivityFeedPage.jsx` | `admin`, `developer` | Flux chronologique des actions administratives et alertes. |
| `/dashboard/mailbox` | `MailboxPage.jsx` | `admin`, `developer` | Boîte de réception des messages soumis via le formulaire public `/contact`. |
| `/dashboard/testimonials` | `TestimonialsManagementPage.jsx` | `admin`, `developer` | Modération des témoignages de parents affichés sur la page d'accueil. |

---

### F. Modules Développeur Exclusifs (`/dashboard/*` dev only)
> **Rôle autorisé** : `developer` uniquement (fermé même à `admin`).

| Route Frontend | Composant Page | Rôles Autorisés | Description & Fonctionnalités |
|---|---|---|---|
| `/dashboard/activity-logs` | `ActivityLogPage.jsx` | `developer` | Journal technique de sécurité (`activity_logs`), traçabilité des requêtes. |
| `/dashboard/storage` | `CloudinaryExplorerPage.jsx`| `developer` | Explorateur brut du stockage Cloudinary (photos, documents, avatars). |

---

## 2. Clarification Critique : Pourquoi `/staff-permissions` n'est PAS une page valide

### Le Constat
Plusieurs utilisateurs et prompts IA avaient tendance à générer l'URL intuitive `/staff-permissions`.
Cependant :
- **`/staff-permissions` n'existe pas en tant que route frontend** dans `AppRoutes.jsx`. Tenter de s'y rendre déclenche une erreur **404 Not Found** (`NotFoundPage.jsx`).
- Côté backend, `/api/staff-permissions` est un préfixe d'API REST (`routes_postgres/staffPermissions.js`), pas une page HTML.
- Dans l'interface utilisateur, la gestion des permissions s'effectue au sein de la page **Staff** :
  - **Route réelle** : `/dashboard/staff`
  - **Composant** : `frontend/src/components/modals/StaffPermissionsModal.jsx`
  - **Action utilisateur** : Sur la fiche de chaque éducatrice, l'administrateur clique sur le bouton **« Gérer les accès »** (ou « الصلاحيات ») qui ouvre la modale des 14 permissions individuelles.

---

## 3. Système Automatique de Résolution et Validation (`routeValidator.js`)

Pour immuniser totalement l'application contre les liens brisés (qu'ils proviennent d'une réponse de l'IA ou d'un raccourci d'un composant), le module `frontend/src/utils/routeValidator.js` a été mis en place :

### A. Table de Redirection des Alias (Smart Resolving)
Le validateur intercepte les alias informels et les redirige automatiquement vers la bonne route en fonction du **rôle actif de l'utilisateur** :

| Alias Suggéré | Rôle Actif | Route Canonique Résolue |
|---|---|---|
| `/staff-permissions` ou `/permissions` | `admin`, `developer` | `/dashboard/staff` |
| `/staff-permissions` ou `/permissions` | `staff`, `parent` | `/dashboard` (repli sécurisé) |
| `/attendances` ou `/attendance` | `parent` | `/mon-espace/attendance-report` |
| `/attendances` ou `/attendance` | `staff`, `admin`, `dev` | `/dashboard/attendance` |
| `/absences` ou `/absence` | `parent` | `/mon-espace/absence-request` |
| `/absences` ou `/absence` | `staff`, `admin`, `dev` | `/dashboard/absence-management` |
| `/daily-reports` ou `/bilans` | `parent` | `/mon-espace/daily-reports` |
| `/daily-reports` ou `/bilans` | `staff`, `admin`, `dev` | `/dashboard/daily-reports` |
| `/treatments` ou `/medicaments` | `parent` | `/mon-espace/treatments` |
| `/treatments` ou `/medicaments` | `staff`, `admin`, `dev` | `/dashboard/treatments` |
| `/rendez-vous` ou `/appointments` | `admin`, `developer` | `/dashboard/enrollments` |
| `/holidays` ou `/jours-feries` | `admin`, `developer` | `/dashboard/settings#section-holidays` |
| `/backups` ou `/sauvegardes` | `admin`, `developer` | `/dashboard/settings` |
| `/login` ou `/connexion` | Tous | `/` (formulaire d'authentification) |
| `/activities` | `parent` | `/mon-espace/activities` |
| `/activities` | `staff`, `admin`, `dev` | `/dashboard/activities` (ou `/activites`) |

### B. Filtrage Préventif avant Affichage (`filterValidActions`)
Avant d'afficher un bouton d'action dans le chat du Centre d'Aide :
1. `filterValidActions(actions, role)` est exécuté.
2. Tout lien inconnu ou non autorisé pour le rôle connecté est **immédiatement écarté**.
3. Aucun bouton menant vers une erreur 404 ou 403 ne peut donc s'afficher à l'écran.

---

## 4. Consignes pour l'Assistant IA (Google Gemini)

Dans le service backend `aiAssistantService.js` :
1. Le prompt système (`getSystemInstruction()`) intègre la liste stricte des routes autorisées ci-dessus.
2. Une règle impérative est fixée :
   > *"N'invente JAMAIS d'autres routes. Pour la gestion des permissions, utilise /dashboard/staff. Pour les présences staff, utilise /dashboard/attendance."*
3. Même en cas d'erreur du modèle de langage, la méthode de désinfection backend `sanitizeAction(action, role)` convertit automatiquement les alias fréquents avant d'envoyer la réponse JSON au frontend.
