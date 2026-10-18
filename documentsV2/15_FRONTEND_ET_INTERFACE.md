# 15 — Frontend et interface

## Objectif
Décrire l'organisation du frontend React, ses mécanismes transverses (routage, formulaires, état, traduction, thèmes) et la façon d'y ajouter un module en respectant les conventions existantes.

## 1. Protection des routes (`ProtectedRoute.jsx`)
`frontend/src/components/auth/ProtectedRoute.jsx` :
1. Affiche un spinner tant que `AuthContext.loading` est vrai (vérification du token en cours).
2. Redirige vers `/` (ou `redirectTo`) si non authentifié, en conservant la page demandée dans `location.state.from` (pour y revenir après connexion — **à vérifier** si ce retour est effectivement exploité par la page de connexion, non auditée).
3. Si une liste `roles` est fournie et que le rôle de l'utilisateur n'y figure pas, affiche `ForbiddenPage` **sans redirection** (l'URL ne change pas).

Ce composant est le **seul point de contrôle d'accès par rôle côté frontend** ; le contrôle par permission fine passe par `useAccess()`/`<Can>` (voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md)).

## 2. Layouts
- **`PublicLayout.jsx`** : utilisé pour le site public ET « Mon Espace » (toutes deux montées sous le même `<Route path="/">` dans `AppRoutes.jsx`). Compose `PublicHeader`, `PublicFooter`, un `ErrorBoundary` autour du contenu, et un système d'aide contextuel (`HelpSystem`). Applique une police différente selon la direction (`font-arabic` vs `font-sans`).
- **`DashboardLayout.jsx`** : utilisé pour `/dashboard/*`. Compose `DashboardSidebar` (menu latéral, collapsible, persistance du type de menu dans `localStorage` sous la clé `menuType`), `DashboardHeader`, un bouton d'action flottant mobile, et bascule vers une navigation mobile dédiée selon `useIsMobile()`.

## 3. Routage (`frontend/src/routes/AppRoutes.jsx`)
- Toutes les pages sont chargées en *lazy loading* (`React.lazy`) avec un fallback commun (`LoadingSpinner`).
- Chemins principaux : voir le répertoire canonique exhaustif dans [25_DICTIONNAIRE_DES_ROUTES_ET_NAVIGATION.md](./25_DICTIONNAIRE_DES_ROUTES_ET_NAVIGATION.md) et la matrice de contrôle d'accès dans [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md). Résumé des familles de routes : publiques (`/`, `/inscription`, `/contact`, `/visite-virtuelle`, `/activites`), authentification (`/forgot-password`, `/reset-password/:token`), workflow d'inscription (`/create-password`, `/upload-documents`), espace parent (`/mon-espace/*`), tableau de bord (`/dashboard/*`), récupération d'urgence (`/recovery`, hors de tout layout), pages d'erreur (`NotFoundPage`, `ForbiddenPage`, `ServerErrorPage`).
- Ajout d'une page : créer le composant dans le sous-dossier `pages/<domaine>/`, l'importer en lazy dans `AppRoutes.jsx`, ajouter la `<Route>` dans le bon layout avec, si besoin, `<ProtectedRoute roles={[...]}>`, et mettre à jour le dictionnaire [25_DICTIONNAIRE_DES_ROUTES_ET_NAVIGATION.md](./25_DICTIONNAIRE_DES_ROUTES_ET_NAVIGATION.md) ainsi que `frontend/src/utils/routeValidator.js`.

## 4. État global et données serveur
- **Authentification** : `AuthContext` (`useReducer`, voir [10_AUTHENTIFICATION.md](./10_AUTHENTIFICATION.md)).
- **Données serveur** : `@tanstack/react-query` est installé et son `QueryClient` est monté globalement (`main.jsx`, `retry: 1`, pas de refetch au focus), mais l'essentiel des appels observés dans les services passe directement par le client Axios `services/api.js` avec son propre cache maison (`cachedGet`, voir [09_ARCHITECTURE_TECHNIQUE.md](./09_ARCHITECTURE_TECHNIQUE.md)) plutôt que par les hooks `useQuery`/`useMutation` de React Query — **à vérifier** l'étendue réelle d'usage de React Query dans les pages (non auditée exhaustivement).
- **Paramètres de la crèche** : `SettingsContext.jsx` (non audité en détail).
- **Dialogues/confirmations** : `DialogContext.jsx` + `utils/dialogHelper` (utilisé notamment par les intercepteurs d'erreur Axios).

## 5. Formulaires
`react-hook-form` et `react-select`/`react-datepicker`/`flowbite-datepicker` sont les bibliothèques de formulaire observées dans les dépendances (`frontend/package.json`). La validation côté client s'appuie sur ces bibliothèques (règles de champ) et, pour le formulaire d'inscription en particulier, sur une logique métier étendue (ex. `EnrollmentPage.jsx`, volumineux d'après le grep des mentions RTL/dark — non audité ligne à ligne). La validation serveur (`express-validator`) reste la source de vérité finale (voir [20_SECURITE_ET_JOURNALISATION.md](./20_SECURITE_ET_JOURNALISATION.md)).

## 6. Gestion des états de chargement et d'erreur
- Chargement : `LoadingSpinner` générique, utilisé comme fallback de route et dans `ProtectedRoute`.
- Erreurs de rendu : `ErrorBoundary.jsx` (composant de classe React, utilisé à plusieurs niveaux : autour de `<Outlet>` dans `PublicLayout`, autour de pages spécifiques comme `DashboardSettingsPage`, `StaffSettingsPage`).
- Erreurs réseau/API : centralisées dans les intercepteurs Axios de `services/api.js` (401, 403, 429, 5xx, voir [09_ARCHITECTURE_TECHNIQUE.md](./09_ARCHITECTURE_TECHNIQUE.md)), affichées via `dialogHelper` (toasts/dialogues), complété par `react-hot-toast` (`<Toaster>` monté dans `AppRoutes.jsx`).
- Pages d'erreur dédiées : `NotFoundPage` (404), `ForbiddenPage` (403 applicatif, affiché par `ProtectedRoute`), `ServerErrorPage` (500).

## 7. Internationalisation, RTL et thèmes
Voir [01_PRESENTATION_PROJET.md](./01_PRESENTATION_PROJET.md) §2 pour la synthèse. Composants transverses : `LanguageContext` (direction, bascule FR/AR, formatage localisé), hook `useTheme` (clair/sombre, classe CSS `dark` + Tailwind `darkMode: ["class"]`). Les deux préférences sont indépendantes l'une de l'autre et persistées séparément dans `localStorage` (`language`, `theme`).

## 8. Organisation des composants réutilisables (`frontend/src/components/`)
Organisés par domaine fonctionnel plutôt que par type technique : `attendance/`, `calendar/`, `activities/`, `modals/`, `widgets/`, `mobile/` (composants dédiés à une présentation mobile alternative, ex. `MobileAttendance.jsx`, `MobileParentSpace.jsx`, `MobileNavigation.jsx` — suggère une adaptation responsive significative au-delà du simple CSS responsive), `settings/`, `testimonials/`, `help/` (système d'aide contextuel), `ui/` (primitives génériques : boutons, inputs, `DatePicker.jsx`, `LoadingSpinner`, `ErrorBoundary`).

## 9. Convention d'ajout d'un module (déduite des patterns observés)
1. Backend : créer `routes_postgres/<domaine>.js` (+ `controllers/<domaine>Controller.js` si la logique est substantielle), monter dans `server.js`, protéger avec `auth.authenticateToken` + `requireRole`/`requirePermission` selon le besoin.
2. Si le module introduit une permission assignable individuellement au personnel : ajouter l'entrée dans `PERMISSIONS_CATALOG` (`permissionsService.js`) et la clé correspondante dans `FEATURES.js` côté frontend.
3. Frontend : créer la page dans `pages/<domaine>/`, le ou les composants dans `components/<domaine>/`, un service d'appel API si nécessaire (`services/<domaine>Service.js`, pattern observé pour `authService`), ajouter la route dans `AppRoutes.jsx` avec `ProtectedRoute` si besoin, utiliser `useAccess()`/`<Can>` pour les contrôles fins d'affichage.
4. Ajouter les clés de traduction nécessaires dans `frontend/src/i18n/config.js` (objets `frTranslations`/`arTranslations`).

## 10. Limites et points à vérifier
- Étendue réelle d'usage de React Query par rapport à l'appel direct d'Axios (non quantifiée).
- Contenu détaillé de `SettingsContext.jsx`, `DialogContext.jsx`, `Can.jsx`.
- Détail du système d'aide contextuel `HelpSystem` (non audité).
