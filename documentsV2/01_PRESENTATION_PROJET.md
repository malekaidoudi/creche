# 01 — Présentation du projet Mima Elghalia

## Objectif de ce document
Donner une vue d'ensemble, vérifiée dans le code, de ce qu'est l'application, à qui elle s'adresse et comment elle est hébergée.

## Périmètre
Présentation générale uniquement. Le détail fonctionnel est dans [07_CATALOGUE_FONCTIONNALITES.md](./07_CATALOGUE_FONCTIONNALITES.md), le détail technique dans [09_ARCHITECTURE_TECHNIQUE.md](./09_ARCHITECTURE_TECHNIQUE.md).

## 1. Présentation générale

**Mima Elghalia** (ميما الغالية) est une application web de gestion pour une crèche située à Médenine, Tunisie. Le nom et les coordonnées par défaut de l'établissement sont injectés en base via la table `nursery_settings` (voir migration `backend/migrations/versions/001_baseline_schema.js`, lignes 423-442) : nom « Crèche Mima Elghalia », adresse « 16 Rue Bizerte, Medenine 4100, Tunisie », capacité « 40 enfants ». Ces valeurs sont des données de seed par défaut et restent modifiables par l'administrateur via les paramètres (`/api/nursery-settings`, page `DashboardSettingsPage.jsx`) — elles ne doivent pas être considérées comme des faits immuables sur l'établissement réel.

L'application se compose de trois espaces, confirmés par le routeur frontend `frontend/src/routes/AppRoutes.jsx` :

1. **Site public** : accessible sans connexion — page d'accueil, formulaire d'inscription en ligne, contact, visite virtuelle, fil d'activités public, page de localisation.
2. **« Mon Espace »** (espace parent) : zone protégée sous `/mon-espace/*`, réservée aux rôles `parent` (et accessible en lecture à `admin`/`staff` pour la page racine `mon-espace`, cf. `AppRoutes.jsx` lignes 132-139).
3. **Tableau de bord** (`/dashboard/*`) : zone protégée réservée aux rôles `admin`, `staff`, `developer` (`AppRoutes.jsx` lignes 261-267), avec des sous-sections encore plus restreintes selon le rôle (voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md)).

## 2. Langues et accessibilité

- Internationalisation via `i18next` / `react-i18next`, avec dictionnaires français et arabe codés en dur dans `frontend/src/i18n/config.js`. Un mécanisme de chargement de traductions complémentaires par HTTP (`i18next-http-backend`, chemin `/locales/{{lng}}/{{ns}}.json`) est configuré mais aucun fichier de traduction correspondant n'a été localisé dans `frontend/public/` — **à vérifier** : ce canal semble inutilisé en pratique, les traductions visibles proviennent des objets `frTranslations`/`arTranslations` du même fichier.
- Le sens d'écriture (RTL/LTR) est piloté par `frontend/src/contexts/LanguageContext.jsx`, qui pose `document.documentElement.dir` selon la langue active (`rtl` pour l'arabe, `ltr` pour le français) et persiste le choix dans `localStorage` (`language`).
- Thème clair/sombre : géré par le hook `frontend/src/hooks/useTheme.js`, qui applique/retire la classe CSS `dark` sur `<html>` et sauvegarde la préférence dans `localStorage` (`theme`), avec détection de la préférence système (`prefers-color-scheme`) par défaut. Confirmé compatible avec Tailwind par `darkMode: ["class"]` dans `frontend/tailwind.config.js` (ligne 8).

## 3. Architecture technique (résumé, détails en §09)

| Composant | Technologie observée | Preuve |
|---|---|---|
| Frontend | React 18.2 + Vite 5, SPA avec `react-router-dom` v6 | `frontend/package.json`, `frontend/vite.config.js` |
| Backend | Node.js + Express 4.18, API REST | `backend/package.json`, `backend/server.js` |
| Base de données | PostgreSQL (hébergée sur Neon en production, cf. `backend/render.yaml`) | `backend/config/db_postgres.js`, `.env.example` |
| Stockage fichiers | Cloudinary (SDK `cloudinary`) | `backend/services/cloudinaryService.js` |
| E-mails | Resend (API HTTP, prioritaire) avec repli SMTP (`nodemailer`) | `backend/emails/emailService.js` |
| Authentification | JWT (`jsonwebtoken`) + liste de révocation en base | `backend/middleware/auth.js`, `backend/services/tokenBlacklistService.js` |

L'architecture déclarée dans la mission (React+Vite / Express / PostgreSQL Neon / Cloudinary / Resend-SMTP) est donc **confirmée par le code**.

## 4. Rôles

Quatre rôles existent au niveau de la contrainte de base de données (`CHECK (role IN ('admin', 'staff', 'parent', 'developer'))`, `backend/migrations/versions/001_baseline_schema.js` ligne 23) :

| Rôle (valeur technique) | Rôle fonctionnel | Remarque vérifiée dans le code |
|---|---|---|
| `parent` | Parent | Rôle attribué automatiquement à toute inscription publique (`backend/routes_postgres/auth.js` ligne 105, commentaire « Sécurité SEC-03 ») |
| `staff` | Personnel / éducatrice | Permissions « communes » accordées automatiquement à la création (`backend/services/permissionsService.js`) |
| `admin` | Direction | Possède implicitement **toutes** les permissions granulaires (`permissionsService.getUserPermissionCodes`, lignes 290-296) |
| `developer` | Développeur | Traité comme un alias d'`admin` dans la majorité des contrôles (`auth.requireRole`, `permissionsService.resolveEffectiveRole`), mais dispose aussi de pages **exclusives** côté frontend (ex. `/dashboard/activity-logs`, `/dashboard/storage`) où `admin` seul n'est pas autorisé — voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md) |

Aucune inscription publique ne permet de créer un compte `staff`, `admin` ou `developer` : seule la création par un administrateur (page `AddUserPage.jsx`, route `/dashboard/add-user`) le permet. **À vérifier** : le détail exact des contrôles serveur sur la route de création d'utilisateur est traité en §11.

## 5. Hébergement et déploiement (constaté)

- **Backend** : déployé sur **Render** (`backend/render.yaml`, service `creche-backend`, plan free, build `npm install`, start `npm start`), connecté à une base Neon Postgres déclarée comme ressource externe (`fromDatabase: neon-postgres`).
- **Frontend** : deux cibles de déploiement sont présentes dans le dépôt :
  - **GitHub Pages**, via le workflow `.github/workflows/deploy-frontend.yml` (déclenché sur push vers `main`, build Vite, publication du dossier `frontend/dist` sur la branche `gh-pages`) et le script `npm run deploy` (`gh-pages -d dist`) dans `frontend/package.json`.
  - **Vercel**, via `frontend/vercel.json` (configuration Vite classique avec réécriture SPA) et un `vercel.json` à la racine qui désactive le déploiement automatique sur la branche `gh-pages`.
  - **À vérifier** : quelle cible est réellement utilisée en production actuellement (GitHub Pages et/ou Vercel) ; les deux configurations coexistent dans le dépôt sans indication explicite de laquelle est active.
- **Base de données** : PostgreSQL Neon (nom de ressource `neon-postgres` dans `render.yaml`), connexion via `pg` (`backend/config/db_postgres.js`).

## 6. Documentation préexistante dans le dépôt (non utilisée comme source)

Le dépôt contient déjà plusieurs dossiers de documentation (`documentation/`, `docs/`, `documents/`, de nombreux fichiers `*.md` à la racine et dans `tests/`). Conformément à la consigne de la mission, **aucun contenu de ces dossiers n'a été repris tel quel** : ils ont pu servir de repères pour savoir où chercher dans le code, mais chaque affirmation de `documentsV2/` a été re-vérifiée dans le code source. Ces anciens dossiers restent inchangés.
