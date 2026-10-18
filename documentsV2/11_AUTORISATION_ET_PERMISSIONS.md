# 11 — Autorisation et contrôle d'accès

## Objectif
Décrire le système de rôles et de permissions granulaires réellement implémenté, préciser où chaque contrôle est appliqué (frontend, backend, ou les deux), et fournir une matrice des permissions.

## Périmètre
Rôles, permissions individuelles du personnel, protection des routes frontend, middlewares d'autorisation backend, restrictions sur les données d'un parent. Base de l'authentification : voir [10_AUTHENTIFICATION.md](./10_AUTHENTIFICATION.md).

## 1. Deux couches de contrôle d'accès, qui coexistent

Le code distingue clairement deux mécanismes, confirmés par les commentaires des fichiers sources eux-mêmes :

1. **Contrôle par rôle** (`admin`, `staff`, `parent`, `developer`) : pour des distinctions catégorielles (ex. seules la direction et le développeur accèdent au tableau de bord). Implémenté par `auth.requireRole(...)` côté backend et `roles={[...]}` dans `ProtectedRoute` côté frontend.
2. **Contrôle par permission granulaire** : pour des droits assignables individuellement à un membre du personnel (ex. « peut administrer les médicaments »), indépendamment de son rôle `staff`. Implémenté par `backend/services/permissionsService.js` + `auth.requirePermission(code)` côté backend, et `frontend/src/access/useAccess.js` + `FEATURES.js` + `<Can>` côté frontend.

Le commentaire de tête de `permissionsService.js` est explicite : **la seule fonction qui connaît la règle « admin/developer a implicitement toutes les permissions » est `getUserPermissionCodes`** — aucune autre couche ne doit réimplémenter de bypass par rôle pour les permissions.

## 2. Rôles : définition et portée

| Rôle | Valeur DB | Accès frontend (`ProtectedRoute`) | Remarque |
|---|---|---|---|
| Parent | `parent` | `/mon-espace/*` (toutes les sous-routes), `/profile`, `/attendance-parent` | Jamais d'accès à `/dashboard/*` |
| Personnel | `staff` | `/dashboard` (racine + modules sans restriction de rôle supplémentaire : présences, messages, annonces, tâches, activités, planning, traitements, bilans journaliers) | N'a PAS accès par rôle à : `add-child`, `enrollments`, `pending-enrollments`, `parents`, `staff`, `add-user`, `general-stats`, `attendance-report`, `settings`, `activity-feed`, `mailbox`, `testimonials` (réservés `admin`/`developer`) |
| Direction | `admin` | Tout `/dashboard/*`, sauf `activity-logs` et `storage` (réservés exclusivement à `developer`, voir ci-dessous) | Dispose implicitement de toutes les permissions granulaires |
| Développeur | `developer` | Tout ce qu'`admin` a, **plus** deux pages exclusives | Alias d'`admin` dans la logique métier (`permissionsService.resolveEffectiveRole`), mais **pas un simple sous-ensemble côté frontend** |

**Point notable vérifié dans le code** (`frontend/src/routes/AppRoutes.jsx` lignes 360-364 et 376-380) : les routes `/dashboard/activity-logs` (journal d'activité technique) et `/dashboard/storage` (explorateur Cloudinary) utilisent `roles={['developer']}` **sans `'admin'`** — un compte `admin` n'ayant pas le rôle technique `developer` ne peut donc **pas** accéder à ces deux pages précises depuis le menu, bien qu'il ait toutes les permissions applicatives. C'est une exception volontaire à la règle « developer = admin + rien de plus » habituellement appliquée ailleurs.

Côté backend, ces deux domaines ont été **alignés sur le frontend** (correction #64) : `backend/routes_postgres/cloudinaryExplorer.js` exige désormais `requireRole('developer')` sur ses 12 endpoints, et `backend/routes_postgres/activityLogs.js` exige `requireDeveloper` sur **tous** ses endpoints (les 4 routes autrefois `admin` — `archive` ×2, `cleanup`, `create` — ont été reclassées). Modèle validé : `developer` = super admin technique, `admin` = direction métier sans accès aux outils techniques (stockage brut, journaux, archives). Voir [23_ANOMALIES_ET_RECOMMANDATIONS.md](./23_ANOMALIES_ET_RECOMMANDATIONS.md).

Le rôle `director` a été retiré des contrôles d'accès de `backend/routes_postgres/children.js` (`/suspend`, `/reactivate`, correction #63) car il n'existe pas dans la contrainte `CHECK` de la table `users` (seuls `admin|staff|parent|developer` sont autorisés en base). `director` demeure une valeur valide du **poste** `staff_position` (cf. `userWorkflow.js`), ce qui correspond au sens métier : le directeur est un membre du personnel titulaire du rôle `admin`. Voir [23_ANOMALIES_ET_RECOMMANDATIONS.md](./23_ANOMALIES_ET_RECOMMANDATIONS.md).

## 3. Middlewares d'autorisation backend (`backend/middleware/auth.js`)

| Middleware | Rôle |
|---|---|
| `authenticateToken` | Décode et valide le JWT, vérifie la révocation, peuple `req.user` |
| `requireRole(...roles)` | Vérifie `req.user.role` ∈ roles, avec résolution `developer → admin` en plus du rôle littéral |
| `requireAdmin` / `requireStaff` / `requireParent` / `requireDeveloper` | Raccourcis pré-composés de `requireRole` |
| `requirePermission(code)` | Délègue entièrement à `permissionsService.userHasPermission(userId, code, role)` — ne contient aucune logique de rôle |
| `requireOwnershipOrStaff(resourceType)` | Vérifie que l'utilisateur est `admin`/`developer`/`staff`, OU que la ressource (`enrollment`, `child`, `attendance`) appartient bien au parent connecté, via des jointures SQL croisant plusieurs sources de la relation parent-enfant (`children.parent_id`, `parent_children`, `enrollments.status = 'approved'`) |
| `requireDocumentAccess` | Même logique pour l'accès aux documents (`enrollment_documents`, `children_documents`) |
| `rateLimitPublic(max, windowMs)` | Limitation de requêtes en mémoire pour des routes publiques spécifiques (distinct du rate limiting global Express) |

Raccourcis dérivés : `requireEnrollmentAccess`, `requireChildAccess`, `requireAttendanceAccess` = `requireOwnershipOrStaff('enrollment'|'child'|'attendance')`.

## 4. Permissions granulaires du personnel

Source canonique unique : `PERMISSIONS_CATALOG` dans `backend/services/permissionsService.js` (lignes 19-155). 14 permissions réparties en 5 modules :

| Module | Code | Commune par défaut ? | Libellé (FR) |
|---|---|---|---|
| medical | `medical.view` | ✅ Oui | Consulter le dossier médical |
| medical | `medical.treatments.manage` | ❌ Non | Administrer les médicaments & traitements prescrits |
| daily | `attendance.manage` | ✅ Oui | Enregistrer les arrivées & départs |
| daily | `daily_reports.manage` | ✅ Oui | Rédiger les bilans journaliers & fournitures (fusionné avec `supplies.manage`, voir alias ci-dessous) |
| daily | `activities.photos.publish` | ✅ Oui | Publier les activités & photos pédagogiques |
| daily | `children.photos.manage` | ❌ Non | Mettre à jour la photo de profil de l'enfant |
| families | `parents.phone.view` | ❌ Non | Voir les numéros de téléphone |
| families | `parents.email.view` | ❌ Non | Voir les adresses email des parents |
| families | `children.documents.view` | ❌ Non | Consulter les documents administratifs de l'enfant |
| messaging | `messages.parents` | ❌ Non | Échanger des messages avec les parents |
| messaging | `announcements.view` | ✅ Oui | Consulter les annonces internes |
| organisation | `staff.planning.view` | ✅ Oui | Consulter le planning de l'équipe |
| organisation | `absences.manage` | ❌ Non | Traiter les signalements d'absence |
| organisation | `tasks.manage` | ❌ Non | Gérer les tâches internes |

Comportements vérifiés dans `permissionsService.js` :
- **Un `admin`/`developer` possède implicitement TOUTES les permissions** (`getUserPermissionCodes`, lignes 290-296), quel que soit le contenu de `user_permissions`.
- Les permissions « communes » sont accordées automatiquement à **tout le staff existant** lors de l'initialisation du schéma (`ensureSchema`, backfill lignes 225-237) et à **tout nouveau compte staff**, via un appel confirmé à `grantCommonPermissionsToUser(newUser.id)` dans les deux points de création de compte staff : `routes_postgres/userWorkflow.js` (ligne 354, route `create-staff`) et `routes_postgres/users.js` (ligne 364, création générique d'utilisateur).
- Un alias de compatibilité existe : le code historique `supplies.manage` est automatiquement traité comme équivalent à `daily_reports.manage` (`userHasPermission`, lignes 317-324 ; `setUserPermissions`, lignes 356-357) suite à la fusion du module « fournitures » dans le bilan journalier.
- Cache mémoire de 10 secondes par utilisateur (`userPermissionsCache`) pour limiter les requêtes SQL répétées sur chaque appel de middleware.
- Gestion administrative : `GET /api/staff-permissions/catalog` (catalogue complet), `GET /api/staff-permissions/me` (permissions de l'utilisateur connecté — **unique source de vérité pour le frontend**, interrogée par `useAccess.js`), `GET/PUT /api/staff-permissions/:userId` (consultation/modification par un `admin`/`developer`), tous dans `backend/routes_postgres/staffPermissions.js`.

### Frontend : `useAccess()` / `<Can>` / `FEATURES`
- `frontend/src/access/FEATURES.js` : registre statique faisant correspondre une clé lisible (ex. `TREATMENTS_MANAGE`) au code de permission backend (`medical.treatments.manage`). Le commentaire du fichier précise explicitement qu'aucun composant ne doit coder un code de permission en dur.
- `frontend/src/access/useAccess.js` : charge une fois par session les permissions de l'utilisateur via `GET /api/staff-permissions/me`, expose `can(featureKeyOrCode)`. En cas d'erreur réseau, retombe sur **aucun accès** (`setCodes(new Set())`) par prudence.
- `frontend/src/access/Can.jsx` : composant de rendu conditionnel (non lu intégralement — **à vérifier** le comportement exact pendant le chargement).
- **Limite de sécurité inhérente** : ce contrôle frontend est uniquement un filtre d'affichage/UX. La sécurité réelle dépend entièrement du middleware `requirePermission` côté backend sur chaque route correspondante (voir tableau ci-dessous) — un accès direct à l'API sans passer par l'UI ne serait bloqué que si la route backend porte elle-même le contrôle.

## 5. Matrice des permissions (backend, vérifiée par lecture des routes)

| Fonctionnalité | Permission / rôle backend | Fichier |
|---|---|---|
| Check-in / check-out présence | `requirePermission('attendance.manage')` | `routes_postgres/attendance.js` L443, L486 |
| Créer/modifier/rappeler/supprimer une tâche | `requirePermission('tasks.manage')` | `routes_postgres/tasks.js` |
| Voir/administrer un traitement du jour | `requireRole('staff','admin','developer')` **+** `requirePermission('medical.treatments.manage')` | `routes_postgres/treatments.js` L33, L36 |
| Gérer les signalements d'absence | `requirePermission('absences.manage')` | `routes_postgres/absenceRequests.js` L7, L236 |
| Mettre à jour/supprimer la photo d'un enfant | Middleware local `requireChildPhotoAccess` (`children.js` L92) : `admin`/`developer` autorisés d'office, `staff` autorisé uniquement avec la permission `children.photos.manage`, `parent` autorisé uniquement s'il est le parent de l'enfant | `routes_postgres/children.js` L1841, L1917 |
| Consulter la liste/les documents administratifs d'un enfant | Middlewares locaux `requireChildDocumentAccess` / `requireSingleChildDocumentAccess` (`documents.js` L22, L61) : `staff` doit avoir la permission `children.documents.view` ; `parent` refusé sur la liste globale, autorisé sur un enfant précis uniquement s'il lui est rattaché | `routes_postgres/documents.js` L368, L400 |
| Gérer les paramètres de la crèche | `requireRole('admin','developer')` (contrôle par **rôle**, pas par permission) | `routes_postgres/nurserySettings.js` |
| Gérer les permissions du personnel | `requireRole('admin','developer')` | `routes_postgres/staffPermissions.js` |
| Approuver une inscription (`POST /:id/approve`) / Rejeter (`PUT /:id/reject`) | `requireRole('admin','developer')` explicite sur la route, en plus de la logique métier dans `enrollmentsController.approveEnrollment`/`rejectEnrollment` | `routes_postgres/enrollments.js` L522-540, L546-566 |
| Accès aux ressources d'un enfant/dossier par son parent propriétaire | `requireChildAccess` / `requireEnrollmentAccess` / `requireAttendanceAccess` | `middleware/auth.js` |

## 6. Restrictions sur les données d'un parent

Un compte `parent` ne peut accéder qu'aux ressources liées à ses propres enfants, selon une relation vérifiée par trois sources croisées (voir `requireOwnershipOrStaff`, §3) : `children.parent_id`, table de rattachement `parent_children`, ou `enrollments.status = 'approved'` liant `parent_id` et `child_id`. Cette redondance est documentée dans le code comme voulue (« pour éviter les faux négatifs si l'une des tables n'a pas été synchronisée »), ce qui témoigne d'une évolution progressive du modèle de données (voir [12_MODELE_DONNEES.md](./12_MODELE_DONNEES.md)) plutôt que d'une relation parent-enfant unique et stable dès l'origine.

## 7. Diagramme

Voir `documentsV2/diagrams/controle-acces.mmd`.

## 8. Risques identifiés (résumé, détail en §20/§23)
- Incohérence `admin` vs `developer` entre frontend et backend sur le module Cloudinary Explorer (§2).
- Rôle `director` mort dans le code (`children.js`), sans risque direct mais source de confusion.
- Valeur par défaut de `JWT_SECRET` codée en dur si la variable d'environnement est absente (voir §10 et §20).
- ~~`GET /api/auth/me` ne vérifie pas la révocation de jeton~~ → corrigé (correction #66) : `/me` passe désormais par `authenticateToken`.

## 9. Limites et points à vérifier
- Composant `frontend/src/access/Can.jsx` : comportement exact pendant le chargement des permissions (affichage par défaut masqué/visible) non vérifié ligne à ligne.
- Détail complet du contenu métier de `enrollmentsController.approveEnrollment`/`rejectEnrollment` (création de compte, envoi d'e-mail) : voir [21_FLUX_METIER.md](./21_FLUX_METIER.md).
