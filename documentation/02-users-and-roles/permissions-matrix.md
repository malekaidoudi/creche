# Matrice des permissions

Cette matrice décrit **ce que le backend autorise réellement** (contrôle fait dans les routes), avec en dernière colonne les écarts avec l'interface.
Légende : ✅ autorisé · ❌ refusé · 🔑 selon permission fine · 👨‍👧 limité à ses propres enfants · ⚠️ **ouvert à tort** (voir [security-findings](../09-audit/security-findings.md)) · ❓ à vérifier.

## 1. Mécanismes

1. **Rôle** : `requireRole(...)` (JWT → `req.user.role`). `developer` est traité comme `admin`.
2. **Permission fine** (personnel) : `requirePermission(code)` → `permissionsService.userHasPermission` (tables `permissions`, `user_permissions`, cache 10 s).
3. **Propriété** : `requireChildAccess`, `requireEnrollmentAccess`, `requireDocumentAccess`, contrôles inline pour les parents.
4. **UI** : `ProtectedRoute roles=[…]`, menu filtré (`DashboardSidebar`), `<Can feature>` / `useAccess()`.

## 2. Catalogue des permissions du personnel

(`backend/services/permissionsService.js` — « commune » = accordée par défaut)

| Code | Module | Commune | Appliquée côté **API** ? | Appliquée côté **UI** ? |
|---|---|:-:|---|---|
| `medical.view` | medical | ✅ | ✅ `children.js` (`filterMedicalInfo`, `/:id/medical`) | ✅ `MEDICAL_VIEW` |
| `medical.treatments.manage` | medical | ❌ | ✅ `treatments.js` (`requirePermission`) | ✅ `TREATMENTS_MANAGE` |
| `attendance.manage` | daily | ✅ | ✅ `POST /attendance/check-in`, `/check-out` | ✅ `ATTENDANCE_TODAY` |
| `daily_reports.manage` | daily | ✅ | ✅ `daily-reports.js`, `supplies.js` | ✅ `DAILY_REPORTS_MANAGE`, `CHILD_SUPPLIES_MANAGE` |
| `activities.photos.publish` | daily | ✅ | ✅ `POST /activities` | ✅ `ACTIVITIES_PUBLISH` |
| `children.photos.manage` | daily | ❌ | ✅ `children.js` (`requireChildPhotoAccess`) | ✅ `CHILDREN_PHOTOS_MANAGE` |
| `parents.phone.view` | families | ❌ | ✅ `children.js` (masquage serveur & téléphone urgence) | ✅ `PARENTS_PHONE_VIEW` |
| `parents.email.view` | families | ❌ | ✅ `children.js` (masquage serveur) | ✅ `PARENTS_EMAIL_VIEW` |
| `children.documents.view` | families | ❌ | ✅ `documents.js` (`requireChildDocumentAccess`, `stats`) | ✅ `CHILDREN_DOCUMENTS_VIEW` |
| `messages.parents` | messaging | ❌ | ✅ `staff-messages.js` | ✅ `MESSAGES_PARENTS` |
| `announcements.view` | messaging | ✅ | ✅ `announcements.js` | ✅ `ANNOUNCEMENTS_VIEW` |
| `staff.planning.view` | organisation | ✅ | ✅ `events.js` (`requirePlanningAccess`) | ✅ `STAFF_PLANNING_VIEW` |
| `absences.manage` | organisation | ❌ | ✅ `absenceRequests.js` (`requirePermission`) | ✅ `ABSENCES_MANAGE` |
| `tasks.manage` | organisation | ❌ | ✅ `tasks.js` (`requirePermission`) | ✅ `TASKS_MANAGE` |

> Le catalogue a été assaini et restructuré en **5 pôles métier clairs (14 permissions)**. Les 4 permissions obsolètes ou redondantes (`payments.alerts.view`, `messages.direction`, `children.photos.view`, `appointments.manage`) ont été purgées.

## 3. Matrice fonctionnelle (backend)

| Fonctionnalité | Parent | Personnel | Admin | Developer | Remarques |
|---|:-:|:-:|:-:|:-:|---|
| Se connecter / profil / changer sa photo | ✅ | ✅ | ✅ | ✅ | `/api/auth/*`, `/api/profile` |
| Soumettre une inscription (public) | ✅ | ✅ | ✅ | ✅ | aucune authentification |
| Voir les inscriptions | ❌ | ✅ | ✅ | ✅ | UI : menu réservé admin |
| Approuver / rejeter / supprimer inscription | ❌ | ❌ | ✅ | ✅ | |
| Ajouter un enfant à son compte (demande) | ✅ (`/enrollments/add-child`) | ❌ | ❌ | ❌ | rôle `parent` strict |
| Voir la liste des enfants | 👨‍👧 | ✅ | ✅ | ✅ | filtrage interne ❓ |
| Créer un enfant | ❌ | ✅ (API) | ✅ | ✅ | UI : admin uniquement |
| Modifier un enfant | 👨‍👧 | ✅ | ✅ | ✅ | `requireChildAccess` |
| Supprimer un enfant | ❌ | ❌ | ✅ | ✅ | `childLifecycleService` |
| Associer / désactiver parent d'un enfant | ❌ | ❌ | ✅ | ✅ | |
| Photo de l'enfant | 👨‍👧 ❓ | 🔑 `children.photos.manage` | ✅ | ✅ | |
| Infos médicales (lecture/écriture) | 👨‍👧 | ✅ (sans contrôle de permission) | ✅ | ✅ | |
| Contacts d'urgence | 👨‍👧 | ✅ | ✅ | ✅ | |
| Pointer arrivée/départ | ❌ | 🔑 `attendance.manage` | ✅ | ✅ | |
| Lire les présences (routes protégées) | 👨‍👧 ❓ | ✅ | ✅ | ✅ | |
| Lire/créer/modifier/supprimer présences (routes « legacy ») | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ouvertes à **tout le monde** (même sans compte) |
| Demande d'absence (créer) | ✅ | ✅ | ✅ | ✅ | |
| Voir toutes les absences / acquitter | ❌ | 🔑 `absences.manage` | ✅ | ✅ | `absenceRequests.js` |
| Rapports journaliers : écrire | ❌ | 🔑 `daily_reports.manage` | ✅ | ✅ | `dailyReports.js` |
| Rapports journaliers : lire | 👨‍👧 | ✅ | ✅ | ✅ | |
| Fournitures : lire | ✅ ❓ | ✅ | ✅ | ✅ | |
| Fournitures : réapprovisionner/consommer | ❌ | 🔑 `daily_reports.manage` | ✅ | ✅ | `supplies.js` (unifié avec le bilan journalier) |
| Traitements : créer/modifier/annuler | ✅ (ses enfants) | ❓ | ❓ | ❓ | contrôle inline |
| Traitements : voir du jour / administrer | ❌ | ✅ | ✅ | ✅ | |
| RDV : créer / confirmer / contre-proposer / annuler | ✅ | ✅ | ✅ | ✅ | contrôle de propriété dans le service |
| RDV : liste du jour | ❌ | ✅ | ✅ | ✅ | |
| RDV : en attente / terminer | ❌ | ❌ / ✅ | ✅ | ✅ | |
| Tâches : créer / relancer / modifier / supprimer | ❌ | 🔑 `tasks.manage` | ✅ | ✅ | `/api/tasks` |
| Tâches : mes tâches / changer statut | ✅ ❓ | ✅ | ✅ | ✅ | |
| Événements (CRUD, commentaires) | ⚠️ | ✅ | ✅ | ✅ | **aucun contrôle de rôle ni de propriété** |
| Messagerie interne (envoyer/lire) | ✅ | ✅ (vers parents : 🔑) | ✅ | ✅ | |
| Mémos personnels | ❓ | ✅ | ✅ | ✅ | |
| Annonces : créer/publier/supprimer | ❌ | ❌ | ✅ | ✅ | |
| Annonces : lire les siennes / crèche | ✅ | 🔑 `announcements.view` | ✅ | ✅ | `/announcements/my` |
| Fil d'activités : lire / réagir / commenter | ✅ | ✅ | ✅ | ✅ | |
| Fil d'activités : publier | ❌ | 🔑 `activities.photos.publish` | ✅ | ✅ | |
| Documents d'inscription (liste/lecture) | ❌ | ✅ | ✅ | ✅ | |
| Documents administratifs crèche (généraux) : liste | ✅ | ✅ | ✅ | ✅ | tout utilisateur connecté |
| Documents administratifs enfants : liste/téléchargement | 👨‍👧 (ses enfants) | 🔑 `children.documents.view` | ✅ | ✅ | `documents.js` (`requireChildDocumentAccess`) |
| Documents administratifs : ajout/suppression | ❌ | ❌ | ✅ | ✅ | admin / developer |
| Documents d'enfants : ajout | ✅ ❓ | ✅ | ✅ | ✅ | pas de contrôle de propriété visible |
| Utilisateurs : liste | ❌ (403) | 🔑 `tasks.manage` (vue anonymisée staff/admin) / ❌ sinon | ✅ | ✅ | `GET /api/users` restreint à la direction (ou staff avec `tasks.manage`) |
| Utilisateurs : créer parent/personnel | ❌ | ❌ | ✅ | ✅ | `/user-workflow/*` |
| Utilisateurs : créer / modifier / désactiver / changer mot de passe via `/api/users/:id` | ❌ (son profil seul) | ❌ (son profil seul) | ✅ | ✅ | Protégé par rôle (`admin`/`developer`) ou ID propre |
| Permissions du personnel | ❌ | ❌ (lire les siennes ✅) | ✅ | ✅ | `/staff-permissions` |
| Paramètres de la crèche : lire | ✅ public | ✅ | ✅ | ✅ | |
| Paramètres de la crèche : modifier | ❌ | ❌ | ✅ | ✅ | Réservé admin / developer |
| Jours fériés : lire | ✅ public | | | | |
| Jours fériés : écrire | ❌ | ❌ | ✅ | ✅ | (`/holidays/init` ouvert ⚠️) |
| Témoignages : déposer | ✅ | ✅ | ✅ | ✅ | |
| Témoignages : modérer | ❌ | ❌ | ✅ | ✅ | |
| Courrier (contact) | ❌ | ❌ | ✅ | ✅ | UI : menu admin+staff ❓ ; **`GET /api/contacts` ouvert** ⚠️ |
| Alertes de paiement | ❌ | ✅ | ✅ | ✅ | pas de contrôle `payments.alerts.view` |
| Affectation tranche d'âge | ❌ | lire la sienne | ✅ | ✅ | |
| Visite virtuelle : modifier | ❌ | ❌ | ✅ | ✅ | |
| Sauvegardes (créer/lister/télécharger/supprimer/restaurer) | ❌ | ❌ | ✅ | ✅ | |
| Récupération d'urgence | clé secrète (sans compte) | | | | |
| Journal technique / alertes / rapports | ❌ | ❌ | ❌ | ✅ | `requireDeveloper` |
| Archive/nettoyage du journal | ❌ | ❌ | ✅ | ✅ | |
| Explorateur Cloudinary | ❌ | ❌ | ✅ (API) | ✅ | UI : développeur seul |
| Notifications : lire les siennes | ✅ | ✅ | ✅ | ✅ | |
| Notifications : créer / diffuser / supprimer / compteurs | ⚠️ | ⚠️ | ⚠️ | ⚠️ | plusieurs routes sans authentification |

## 4. Écarts UI ↔ API et Sécurité (État post-Chantier 2)

- ✅ **Résolu (Correction n°35)** : Les pages d'administration `/dashboard/parents`, `/dashboard/staff`, `/dashboard/add-user`, `/dashboard/settings`, `/dashboard/general-stats`, `/dashboard/attendance-report`, `/dashboard/activity-feed`, `/dashboard/add-child`, `/dashboard/pending-enrollments`, `/dashboard/enrollments` sont désormais toutes enveloppées avec `<ProtectedRoute roles={['admin', 'developer']}>`. Toute tentative d'accès direct par URL déclenche immédiatement `<ForbiddenPage />` sans montage des composants ni requêtes API.
- ✅ **Résolu (Correction n°35)** : L'annuaire utilisateur `GET /api/users` et la consultation unitaire `GET /api/users/:id` sont strictement cloisonnés : accès complet pour la direction (`admin`, `developer`), accès restreint aux seuls collègues staff/admin sans coordonnées privées pour le staff disposant de `tasks.manage`, et rejet strict HTTP 403 pour tout autre profil.
- Le front dit que « seul un admin peut créer un événement » ; le backend ne l'impose pas.

