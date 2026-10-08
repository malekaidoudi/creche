# Les rôles

Rôles confirmés par le code (`backend/middleware/auth.js`, `frontend/src/contexts/AuthContext.jsx`) : **`parent`, `staff`, `admin`, `developer`**.

| Rôle | Pour qui ? | Création du compte | Accès principal |
|---|---|---|---|
| Parent | Parents d'enfants inscrits | Automatique après approbation d'une inscription, ou créé par l'admin, ou auto-inscription (voir avertissement) | Site public + « Mon Espace » |
| Personnel (`staff`) | Éducatrices/employés | Créé par l'admin (lien d'activation par e-mail) | Tableau de bord (selon permissions) |
| Admin (`admin`) | Direction | Hors application (script/seed) — **À vérifier** : aucun écran de création d'admin | Tableau de bord complet |
| Développeur (`developer`) | Équipe technique | Hors application — **À vérifier** | Admin + journal technique + explorateur de stockage ; **invisible** dans la liste des utilisateurs |

## Règles de fonctionnement

1. **`developer` = `admin`** pour toutes les vérifications `requireRole('admin')` (alias dans `auth.requireRole`, `permissionsService.resolveEffectiveRole`, `DashboardSidebar.hasAccess`). Les routes `requireDeveloper` ne sont **pas** accessibles aux admin.
2. **`admin`/`developer` possèdent implicitement toutes les permissions** du catalogue.
3. **`staff`** reçoit automatiquement les permissions « communes » à la création ; les autres sont activées par l'admin ([admin](admin.md)).
4. **`parent`** n'accède qu'aux données de ses enfants (contrôle inline dans les routes, pas de mécanisme global — voir [authorization](../06-technical/authorization.md)).
5. Un admin/staff peut aussi avoir des enfants : le menu « Mon Espace » apparaît alors (`useHasChildren`).

> [!WARNING]
> Un rôle `direction` est cité dans `treatments.js` et `treatmentsController.js` mais **n'existe pas** dans les données ni l'interface. Il n'a aucun effet.

> [!NOTE]
> La contrainte SQL de `init_database.js` ne liste que `admin, staff, parent` pour `users.role`. La base de production peut différer : **À vérifier** que `developer` est accepté.

Voir : [matrice des permissions](permissions-matrix.md).
