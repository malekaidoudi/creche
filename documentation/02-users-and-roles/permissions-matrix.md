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
| `medical.view` | medical | ✅ | ❌ non (aucun `userHasPermission` trouvé) | ✅ `MEDICAL_VIEW` |
| `medical.treatments.manage` | medical | ✅ | ❌ | ❌ |
| `children.documents.view` | medical | ❌ | ❌ | ❓ |
| `messages.parents` | messaging | ❌ | ✅ `staff-messages.js` | ✅ `MESSAGES_PARENTS` |
| `messages.direction` | messaging | ✅ | ❌ | ❌ |
| `announcements.view` | messaging | ✅ | ❌ | ❌ |
| `attendance.manage` | daily | ✅ | ✅ `POST /attendance/check-in`, `/check-out` | ✅ `ATTENDANCE_TODAY` |
| `daily_reports.manage` | daily | ✅ | ❌ (rôle admin/staff seulement) | ❌ |
| `children.photos.view` | daily | ✅ | ❌ | ❌ |
| `children.photos.manage` | daily | ❌ | ✅ `children.js` (`requireChildPhotoAccess`) | ❓ |
| `activities.photos.publish` | daily | ✅ | ✅ `POST /activities` | ✅ `ACTIVITIES_PUBLISH` |
| `absences.manage` | organisation | ❌ | ❌ | ❌ |
| `appointments.manage` | organisation | ❌ | ❌ | ❌ |
| `staff.planning.view` | organisation | ✅ | ❌ | ❌ |
| `supplies.manage` | organisation | ✅ | ❌ | ❌ |
| `tasks.manage` | organisation | ❌ | ❌ | ❌ |
| `parents.phone.view` | families | ❌ | ✅ `children.js` (masquage) | ❓ |
| `parents.email.view` | families | ❌ | ✅ `children.js` (masquage) | ❓ |
| `payments.alerts.view` | families | ❌ | ❌ | ❓ |

> **12 permissions sur 19** du catalogue ne sont **pas contrôlées côté API** : les cocher/décocher dans l'écran d'administration n'a donc aucun effet réel pour elles. (Le fichier `FEATURES.js` front ne référence que 4 permissions.)

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
| Voir toutes les absences / acquitter | ❌ | ✅ | ✅ | ✅ | |
| Rapports journaliers : écrire | ❌ | ✅ | ✅ | ❌ ❓ (`requireRole('admin','staff')`, developer mappé admin → ✅) | |
| Rapports journaliers : lire | 👨‍👧 | ✅ | ✅ | ✅ | |
| Fournitures : lire | ✅ ❓ | ✅ | ✅ | ✅ | |
| Fournitures : réapprovisionner/consommer | ❌ | ✅ | ✅ | ✅ | |
| Traitements : créer/modifier/annuler | ✅ (ses enfants) | ❓ | ❓ | ❓ | contrôle inline |
| Traitements : voir du jour / administrer | ❌ | ✅ | ✅ | ✅ | |
| RDV : créer / confirmer / contre-proposer / annuler | ✅ | ✅ | ✅ | ✅ | contrôle de propriété dans le service |
| RDV : liste du jour | ❌ | ✅ | ✅ | ✅ | |
| RDV : en attente / terminer | ❌ | ❌ / ✅ | ✅ | ✅ | |
| Tâches : créer / relancer / supprimer | ❌ | ❌ | ✅ | ✅ | `/api/tasks` |
| Tâches : mes tâches / changer statut | ✅ ❓ | ✅ | ✅ | ✅ | |
| Événements (CRUD, commentaires) | ⚠️ | ✅ | ✅ | ✅ | **aucun contrôle de rôle ni de propriété** |
| Messagerie interne (envoyer/lire) | ✅ | ✅ (vers parents : 🔑) | ✅ | ✅ | |
| Mémos personnels | ❓ | ✅ | ✅ | ✅ | |
| Annonces : créer/publier/supprimer/lister | ❌ | ❌ | ✅ | ✅ | |
| Annonces : lire les siennes | ✅ | ✅ | ✅ | ✅ | `/announcements/my` |
| Fil d'activités : lire / réagir / commenter | ✅ | ✅ | ✅ | ✅ | |
| Fil d'activités : publier | ❌ | 🔑 `activities.photos.publish` | ✅ | ✅ | |
| Documents d'inscription (liste/lecture) | ❌ | ✅ | ✅ | ✅ | |
| Documents administratifs : liste/téléchargement | ✅ ⚠️ | ✅ | ✅ | ✅ | tout utilisateur connecté |
| Documents administratifs : ajout/suppression | ❌ | ❌ | ✅ | ✅ | |
| Documents d'enfants : ajout | ✅ ❓ | ✅ | ✅ | ✅ | pas de contrôle de propriété visible |
| Utilisateurs : liste | ⚠️ | ✅ | ✅ | ✅ | `GET /api/users` ouvert à tout connecté |
| Utilisateurs : créer parent/personnel | ❌ | ❌ | ✅ | ✅ | `/user-workflow/*` |
| Utilisateurs : créer / modifier / désactiver / changer mot de passe via `/api/users/:id` | ⚠️ | ⚠️ | ⚠️ | ⚠️ | **sans authentification** |
| Permissions du personnel | ❌ | ❌ (lire les siennes ✅) | ✅ | ✅ | `/staff-permissions` |
| Paramètres de la crèche : lire | ✅ public | ✅ | ✅ | ✅ | |
| Paramètres de la crèche : modifier | ⚠️ | ⚠️ | ✅ | ✅ | routes **sans authentification** |
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

## 4. Écarts UI ↔ API à connaître

- Les pages `/dashboard/parents`, `/staff`, `/add-user`, `/settings`, `/general-stats`… n'ont **pas** de `ProtectedRoute` propre : seul le menu est filtré. Un membre du personnel qui tape l'URL voit la page (l'API doit alors refuser — ce qui n'est pas toujours le cas).
- Le front dit que « seul un admin peut créer un événement » ; le backend ne l'impose pas.
