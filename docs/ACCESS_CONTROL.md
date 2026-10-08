# Système de gestion des accès (rôles & permissions)

Ce document explique comment fonctionne le contrôle d'accès dans l'application,
pour qu'une prochaine intervention (ajout/retrait d'une restriction) soit
rapide et cohérente avec l'existant.

## 1. Les deux niveaux de contrôle d'accès

On distingue volontairement deux choses différentes, à ne jamais confondre :

| | Rôle (`role`) | Permission |
|---|---|---|
| **C'est quoi** | La catégorie d'utilisateur : `admin`, `staff`, `parent` (+ `developer`, équivalent à `admin`) | Une action précise qu'un utilisateur peut faire : `attendance.manage`, `activities.photos.publish`, `messages.parents`... |
| **Où c'est défini** | Colonne `users.role` | Table `permissions` + `user_permissions` (catalogue dans `permissionsService.js`) |
| **Qui peut le changer** | Fixé à la création du compte | Modifiable à tout moment par un admin, par membre du staff, via "Gérer les accès" |
| **Usage typique** | Choisir QUEL tableau de bord afficher, protéger une page entière réservée à l'admin (ex: paramètres système, gestion des utilisateurs) | Activer/désactiver une fonctionnalité précise pour un membre du staff donné (ex: cette éducatrice a le droit d'écrire aux parents, celle-là non) |

**Règle d'or : si une restriction peut un jour varier d'un membre du staff à
l'autre, c'est une permission, pas un rôle.** Le rôle ne doit jamais être
multiplié pour simuler des permissions (on n'a pas `staff_with_messages`,
`staff_without_messages`...).

Un admin (et `developer`, qui a les mêmes droits) possède **implicitement
toutes les permissions du catalogue**, sans qu'une seule ligne ne soit
nécessaire dans `user_permissions`. Cette règle est centralisée à un seul
endroit (voir § 2) : aucun autre module de l'app ne doit réimplémenter un
test "si admin alors ok".

---

## 2. Backend

### 2.1 Le catalogue des permissions : `backend/services/permissionsService.js`

C'est **la seule source de vérité** sur la liste des permissions qui existent.

```js
const PERMISSIONS_CATALOG = [
  { code: 'attendance.manage', module: 'daily', isCommon: true,
    label: { fr: 'Enregistrer les présences (arrivée/départ)', ar: '...' } },
  { code: 'messages.parents', module: 'messaging', isCommon: false,
    label: { fr: 'Envoyer/recevoir des messages avec les parents', ar: '...' } },
  // ...
];
```

- `isCommon: true` → accordée automatiquement à tout nouveau membre du staff.
- `isCommon: false` → désactivée par défaut, à activer au cas par cas par l'admin.

Au démarrage du serveur, `ensureSchema()` crée les tables `permissions` et
`user_permissions` si besoin (migration additive, sans danger pour la prod)
et synchronise le catalogue en base.

**Pour ajouter une nouvelle permission** : ajouter une entrée dans
`PERMISSIONS_CATALOG` avec un `code` unique, choisir `isCommon`, redémarrer
le serveur (le catalogue se synchronise tout seul). Rien d'autre à faire côté
backend pour que "Gérer les accès" la propose.

### 2.2 Les fonctions clés de `permissionsService.js`

- `getUserPermissionCodes(userId, role)` → `Set` des codes accordés à
  l'utilisateur. **C'est ici, et uniquement ici, que vit la règle "admin a
  tout"** : si le rôle (resolu via `role` ou récupéré en base si absent) est
  `admin`/`developer`, retourne la totalité du catalogue.
- `userHasPermission(userId, code, role)` → booléen, utilisé par le
  middleware de route.
- `getCatalogForUser(userId, role)` → catalogue complet + statut
  accordé/non, utilisé par la modale "Gérer les accès" de l'admin.
- `setUserPermissions(userId, codes, grantedBy)` → remplace entièrement les
  permissions accordées à un utilisateur.

### 2.3 Protéger une route : `auth.requirePermission(code)`

Dans `backend/middleware/auth.js` :

```js
router.post('/check-in',
  auth.authenticateToken,
  auth.requirePermission('attendance.manage'),
  async (req, res) => { ... }
);
```

Ce middleware délègue entièrement à `permissionsService.userHasPermission()`
— il ne connaît pas les rôles lui-même. Si refusé → `403` avec
`code: 'PERMISSION_DENIED'`.

Pour une restriction **de rôle** (pas de permission), on garde
`auth.requireRole('admin', 'staff')`, qui reste indépendant et légitime pour
les cas purement catégoriels (ex: seul un `admin` peut gérer les comptes
utilisateurs).

### 2.4 Exposer les permissions au frontend : `routes_postgres/staffPermissions.js`

| Route | Usage |
|---|---|
| `GET /api/staff-permissions/me` | L'utilisateur connecté récupère **ses propres** codes accordés. Utilisé par le frontend (`useAccess`). Admin → reçoit tout le catalogue. |
| `GET /api/staff-permissions/catalog` | (admin only) Catalogue complet, pour afficher la liste des permissions disponibles. |
| `GET /api/staff-permissions/:userId` | (admin only) Catalogue + statut accordé/non pour un membre du staff donné → alimente la modale "Gérer les accès". |
| `PUT /api/staff-permissions/:userId` | (admin only) Remplace les permissions accordées à un membre du staff. |

### 2.5 Routes actuellement protégées par une permission

| Permission | Route(s) protégée(s) |
|---|---|
| `attendance.manage` | `POST /api/attendance/check-in`, `POST /api/attendance/check-out` |
| `activities.photos.publish` | `POST /api/activities` |
| `messages.parents` | `POST /api/staff-messages` (si le destinataire est un parent) |

**Tenir cette table à jour** à chaque nouvelle restriction : c'est le seul
endroit qui liste "quelle permission protège quelle route" pour l'audit.

---

## 3. Frontend : module `frontend/src/access/`

Tout le frontend passe par ce module unique. **Aucun composant ne doit
écrire un code de permission en dur, ni réimplémenter une logique
`isAdmin() || hasPermission(...)`.**

```
Composants
    ↓
useAccess() / <Can>
    ↓
FEATURES (registre)
    ↓
permissions utilisateur (GET /api/staff-permissions/me)
```

### 3.1 `access/FEATURES.js` — le registre déclaratif

```js
export const FEATURES = {
  ATTENDANCE_TODAY:   { permission: 'attendance.manage' },
  ACTIVITIES_PUBLISH: { permission: 'activities.photos.publish' },
  MESSAGES_PARENTS:   { permission: 'messages.parents' },
};
```

C'est la seule table de correspondance "fonctionnalité UI" → "code de
permission backend". Pas de champ `roles` ici : inutile, puisque le backend
accorde déjà tout à un admin (§1).

**Pour ajouter une nouvelle restriction** :
1. Ajouter la permission dans `PERMISSIONS_CATALOG` côté backend (§2.1) si
   elle n'existe pas déjà.
2. Ajouter une clé dans `FEATURES` qui pointe vers ce code.
3. Utiliser `can('MA_CLE')` ou `<Can feature="MA_CLE">` dans les composants
   concernés (§3.2).
4. Protéger la route backend correspondante avec
   `auth.requirePermission('mon.code')` (§2.3), et l'ajouter au tableau du §2.5.

### 3.2 `useAccess()` et `<Can>` — les deux seules APIs à utiliser

Convention d'équipe, à respecter strictement :

- Besoin de la valeur dans une **logique JS** (variable, condition complexe,
  redirection...) → `const { can, loading } = useAccess(); if (can('X')) {...}`
- Simplement **afficher/cacher un bloc JSX** → `<Can feature="X">...</Can>`

```jsx
import { useAccess, Can } from '../../access';

// Cas 1 : logique JS
const { can } = useAccess();
const canCreate = can('ACTIVITIES_PUBLISH');

// Cas 2 : affichage conditionnel simple
<Can feature="ATTENDANCE_TODAY">
  <button onClick={...}>Présences</button>
</Can>

// Avec fallback
<Can feature="ATTENDANCE_TODAY" fallback={<p>Accès non autorisé</p>}>
  ...
</Can>
```

`useAccess()` appelle `GET /api/staff-permissions/me` une fois par montage
(via le `user` du contexte `AuthContext`) et expose :
- `can(featureKey)` : booléen (`false` tant que le chargement n'est pas
  terminé ou en cas d'erreur réseau — **fail-safe, jamais fail-open**).
- `loading` : à utiliser pour éviter un flash "accès refusé" avant que les
  permissions soient chargées (voir `AttendancePage.jsx` pour un exemple de
  redirection qui attend `!loading`).

### 3.3 Ce qui reste légitimement basé sur le rôle (pas une régression)

Certains composants utilisent encore `isAdmin()` / `isStaff()` / `role` —
**c'est voulu**, pas un oubli de migration, quand la restriction n'est pas
une permission assignable individuellement :
- Choix du menu de navigation à afficher (parent vs staff/admin : ce sont
  des interfaces structurellement différentes, pas un "toggle").
- Actions strictement réservées à l'admin par design (ex: créer un
  événement, gérer les comptes utilisateurs, accéder aux paramètres
  système) : il n'existe pas de permission `events.manage` assignable à un
  staff au cas par cas, donc un simple contrôle de rôle suffit.

Si un jour une de ces restrictions doit devenir "activable au cas par cas
pour tel ou tel membre du staff", c'est le signal qu'il faut lui créer une
vraie permission (§2.1) et migrer vers `FEATURES`/`useAccess`.

### 3.4 Fichiers migrés vers ce système (référence)

| Fichier | Fonctionnalité contrôlée |
|---|---|
| `pages/activities/ActivitiesPage.jsx` | Bouton "Nouvelle activité" |
| `pages/dashboard/AttendancePage.jsx` | Onglet/accès "Aujourd'hui" (+ redirection si accès direct par URL) |
| `pages/messages/MessagesPage.jsx` | Visibilité des contacts parents |
| `components/layout/DashboardSidebar.jsx` | Sous-menu "Présences → Aujourd'hui" |
| `components/mobile/MobileNavigation.jsx` | Entrée "Présences" (nav mobile + menu "Plus") |
| `components/dashboard/MobileDashboardComplete.jsx` | Bouton rapide "Présences" |
| `components/ui/FloatingActionButton.jsx` | Action rapide "Enregistrer présence" |
| `components/mobile/MobileAttendance.jsx` | Boutons check-in/check-out (prop `canManage`, calculée par la page parente) |

---

## 4. Checklist pour ajouter une nouvelle restriction d'accès

1. **Backend** : ajouter le code dans `PERMISSIONS_CATALOG`
   (`backend/services/permissionsService.js`), choisir `isCommon`.
2. **Backend** : protéger la/les route(s) concernée(s) avec
   `auth.requirePermission('mon.code')`.
3. **Backend** : documenter la route dans le tableau du §2.5 de ce fichier.
4. **Frontend** : ajouter une clé dans `frontend/src/access/FEATURES.js`
   pointant vers ce code.
5. **Frontend** : dans le(s) composant(s) concerné(s), utiliser
   `useAccess().can('MA_CLE')` ou `<Can feature="MA_CLE">` — jamais de
   chaîne de permission en dur, jamais de nouvelle fonction `hasXxx()`.
6. **Frontend** : mettre à jour le tableau du §3.4 de ce fichier.
7. **Tester** : avec un compte admin (doit toujours passer) et un compte
   staff avec/sans la permission (voir §5 pour la procédure de test rapide).

---

## 5. Tester une permission rapidement (sans passer par l'UI)

```bash
# 1. Se connecter en admin et en staff
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"crechemimaelghalia@gmail.com","password":"password"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

STAFF_TOKEN=$(curl -s -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff-test@creche.com","password":"password"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# 2. Voir les permissions accordées au staff de test
curl -s http://localhost:3003/api/staff-permissions/me \
  -H "Authorization: Bearer $STAFF_TOKEN"

# 3. Retirer/ajouter une permission (remplacer 25 par l'id du staff)
curl -s -X PUT http://localhost:3003/api/staff-permissions/25 \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"codes": ["medical.view", "..."]}'

# 4. Vérifier le blocage réel sur la route
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3003/api/attendance/check-in \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" \
  -d '{"child_id":1}'
# → 403 attendu sans la permission, 200 avec
```

Compte de test staff disponible : `staff-test@creche.com` / `password`
(créé via `backend/scripts/create_test_staff.js`, voir aussi `COMPTES_TEST.txt`).
