# Fonctionnalités Incomplètes et Code Inutilisé

Ce document recense les fonctionnalités inachevées, les flux partiellement câblés ainsi que les fichiers de code morts ou orphelins découverts lors de l'audit.

---

## 1. Fonctionnalités Partiellement Implémentées

### A. Archivage des Inscriptions en Échec — Câblé & Opérationnel ✅
- **Constat** : La méthode `markAppointmentFailed` dans `appointmentsController.js` et le bouton du modal frontend `AppointmentActionModal.jsx` étaient prêts, mais la route `POST /api/appointments/:id/failed` n'était pas déclarée dans `routes_postgres/appointments.js`, retournant un HTTP 404 lors des clics.
- **Action réalisée** : Route `POST /api/appointments/:id/failed` formellement déclarée et sécurisée par rôle (`admin`, `staff`, `developer`). Les deux issues (reprogrammation avec compteur d'échecs `failed_appointments_count` ou abandon avec archivage dans `enrollments_archive` et suppression du compte parent temporaire) sont désormais 100% opérationnelles.

### B. Contrôle d'Accès par Permissions (Staff Permissions)
- **Constat** : Le service `permissionsService.js` définit un catalogue complet de **19 permissions** granulaires et fournit une API d'attribution pour le personnel.
- **Problème** : Seules **6 permissions** sont réellement vérifiées au niveau des routes de l'API. Les 13 autres permissions ne sont pas vérifiées par le backend (l'utilisateur peut effectuer l'action s'il envoie directement la requête HTTP).

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
