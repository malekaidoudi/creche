# Fonctionnalités Incomplètes et Code Inutilisé

Ce document recense les fonctionnalités inachevées, les flux partiellement câblés ainsi que les fichiers de code morts ou orphelins découverts lors de l'audit.

---

## 1. Fonctionnalités Partiellement Implémentées

### A. Archivage des Inscriptions en Échec — Câblé & Opérationnel ✅
- **Constat** : La méthode `markAppointmentFailed` dans `appointmentsController.js` et le bouton du modal frontend `AppointmentActionModal.jsx` étaient prêts, mais la route `POST /api/appointments/:id/failed` n'était pas déclarée dans `routes_postgres/appointments.js`, retournant un HTTP 404 lors des clics.
- **Action réalisée** : Route `POST /api/appointments/:id/failed` formellement déclarée et sécurisée par rôle (`admin`, `staff`, `developer`). Les deux issues (reprogrammation avec compteur d'échecs `failed_appointments_count` ou abandon avec archivage dans `enrollments_archive` et suppression du compte parent temporaire) sont désormais 100% opérationnelles.

### B. Contrôle d'Accès par Permissions (Staff Permissions) — Déploiement en cours (Chantier 1 achevé ✅)
- **Constat** : Le service `permissionsService.js` définit un catalogue restructuré en **5 pôles métier canoniques (14 permissions)** et fournit une API d'attribution granulaire pour le personnel.
- **Progression** :
  - **Santé & Traitements Médicaux ✅** :
    - `medical.view` : vérification backend sur `GET /api/children/:id/medical` et `PUT /api/children/:id/medical`, et filtrage/masquage systématique des champs médicaux (`medical_info`, `medical_notes`, `allergies`, `medications`, `conditions`, `blood_type`) dans `GET /api/children` et `GET /api/children/:id` pour les membres du personnel sans cette permission.
    - `medical.treatments.manage` : vérification backend sur `GET /api/treatments/today` et `POST /api/treatments/:id/administer`. Protection de la page `TreatmentsPage.jsx`, du menu latéral `DashboardSidebar.jsx`, et de la barre mobile `MobileNavigation.jsx` via `can('TREATMENTS_MANAGE')`.
  - **Pôle Vie quotidienne & Familles (Chantier 1 - Option A) ✅** :
    - `daily_reports.manage` : vérification backend (`GET /children/today`, `POST /`, `PATCH /:id/status`, `DELETE /:id`) et protection UI (`DailyReportsPage.jsx`, menus desktop et mobile).
    - `children.photos.manage` : protection backend de `POST /api/children/:id/photo` et désactivation UI du sélecteur d'image avec badge cadenas.
    - `supplies.manage` : protection backend des mutations (`refill`, `use`, `daily-brought`) et protection UI dans les formulaires de saisie desktop et mobile.
    - `children.documents.view` : vérification backend fine (`requireChildDocumentAccess`, `requireSingleChildDocumentAccess`, masquage du compteur `childrenTotal`) et masquage UI avec cadenas dans `DocumentsPage.jsx`.
  - **Pôle Organisation & Communications (Chantier 1 - Suite) ✅** :
    - `announcements.view` : vérification backend (`GET /announcements`, `GET /announcements/my`), protection UI (`AnnouncementsPage.jsx`, widget `UpcomingEventsWidget.jsx`).
    - `staff.planning.view` : vérification backend (`GET /api/events/views/calendar`, `GET /api/events` globaux), protection UI (`WeeklyPlanningPage.jsx`, `MonthlyPlanningPage.jsx`), menus desktop et mobile.
    - `absences.manage` : protection backend de `GET /api/absence-requests/all` et `PUT /:id/acknowledge`, protection UI dans `AbsenceManagementPage.jsx` et menu latéral.
    - `tasks.manage` : protection backend des mutations (`POST /tasks`, `PATCH /:id`, `POST /:id/remind`, `DELETE /:id`) et déblocage UI dans `TasksPage.jsx` pour le staff habilité.
  - **Prochaines étapes** :
    - Chantier 2 : Verrouillage strict des rôles (`GET /api/users`, `ProtectedRoute roles=['admin', 'developer']` sur les pages d'administration globale).

### C. Notifications Push Mobiles (Expo Push) — Purge effectuée ✅
- **Constat** : Le service `backend/services/pushNotificationService.js` relayait des alertes vers l'API Expo Push pour une application mobile native qui a été reportée.
- **Action réalisée** : L'ensemble des briques Expo Push (`pushNotificationService.js`, appels dans `notificationService.js` et `staffMessageService.js`, route orpheline `POST /push-token` dans `users.js`) ont été **définitivement supprimées** lors de l'audit (Correction n°16). Les notifications web internes et e-mails restent 100% opérationnels.

### D. Déconnexion Côté Serveur (Révocation de JWT) — Corrigé ✅
- **Constat** : La route `POST /api/auth/logout` se contentait de répondre `{ message: "Déconnecté" }` sans invalider le jeton côté serveur.
- **Action réalisée** : Implémentation complète d'un système de liste noire hybride ([`tokenBlacklistService.js`](file:///Volumes/Data/Works/Windsurf/creche/backend/services/tokenBlacklistService.js)) avec table PostgreSQL `revoked_tokens` et cache RAM (0 ms). La route `POST /api/auth/logout` révoque immédiatement le jeton, et le middleware `authenticateToken` bloque toute utilisation ultérieure avec HTTP 401 (`TOKEN_REVOKED`). Côté frontend, `AuthContext` et `authService` ont été mis à jour pour notifier le serveur avant d'effacer le stockage local.

---

## 2. Contrôleurs et Modules Inutilisés (Code Mort) — Nettoyé ✅

Les fichiers suivants situés dans `backend/controllers/` ou `backend/routes/` n'étaient pas importés ni branchés dans le point d'entrée `backend/server.js`. **Ils ont été définitivement supprimés lors de l'assainissement de l'audit** (voir [`corrections.md`](09-audit/corrections.md)) :

| Fichier orphelin | Rôle supposé d'origine | Cause de non-utilisation | Statut |
|---|---|---|:---:|
| `backend/controllers/uploadController.js` | Gestion générique des uploads (`/uploads`, `/uploads/multiple`) | Jamais monté dans `server.js` | 🗑️ Supprimé |
| `backend/controllers/userController.js` | Gestion CRUD des utilisateurs | Doublon avec la logique de `routes_postgres/users.js` | 🗑️ Supprimé |
| `backend/controllers/settingsController.js` | Gestion des paramètres de crèche | Remplacé par `routes_postgres/nurserySettings.js` | 🗑️ Supprimé |
| `backend/controllers/reportsController.js` | Génération de rapports | Non référencé | 🗑️ Supprimé |
| `backend/controllers/attendanceController.js` | Contrôleur des présences | Inliné dans `routes_postgres/attendance.js` | 🗑️ Supprimé |
| `backend/controllers/logsController.js` | Contrôleur des journaux | Inliné dans `routes_postgres/logs.js` | 🗑️ Supprimé |
| `backend/controllers/documentsController.js`| Gestion des documents | Doublé par `routes_postgres/documents.js` | 🗑️ Supprimé |
| `backend/routes/optimized-settings.js` | Routeur alternatif de paramètres | Jamais monté dans `server.js` (dossier `routes/` supprimé) | 🗑️ Supprimé |
| `backend/middleware/cacheMiddleware.js` | Cache mémoire Express | Jamais appliqué aux routes actives | 🗑️ Supprimé |
| `server.js` (à la racine du projet) | Ancien lanceur racine | Fichier vide de 0 octet | 🗑️ Supprimé |
