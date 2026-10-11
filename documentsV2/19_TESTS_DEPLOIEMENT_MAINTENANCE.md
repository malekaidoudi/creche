# 19 — Tests, maintenance et déploiement

## Objectif
Documenter les commandes de développement, les tests existants, et les procédures de déploiement réellement présentes dans le dépôt, en distinguant ce qui est vérifié de ce qui est seulement déduit.

## 1. Commandes de développement (`package.json` racine)
| Commande | Effet |
|---|---|
| `npm run install` | Installe les dépendances backend puis frontend |
| `npm start` / `npm run dev` | Lance backend (`nodemon`) et frontend (`vite`) en parallèle via `concurrently` |
| `npm run build` | Build frontend (`vite build`) |
| `npm test` | Lance les tests backend (`jest`) puis frontend (`vitest`) |
| `npm run seed` / `db:seed` | Exécute `backend/scripts/seed.js` |
| `npm run backup` / `backup:list` / `backup:restore` | Exécute `backend/scripts/backup.js` avec les options correspondantes |

Backend (`backend/package.json`) : `npm run dev` (nodemon), `npm test` (`jest --coverage`), `npm run db:init`/`db:migrate` (`migrations/runner.js`), `npm run db:migrate:status`, `npm run migrate:cloudinary`.
Frontend (`frontend/package.json`) : `npm run dev` (Vite), `npm run build`/`build:github`, `npm run test`/`test:ui`/`test:coverage` (Vitest), `npm run lint`/`lint:fix` (ESLint), `npm run deploy` (`gh-pages -d dist`).

## 2. Tests existants

### Backend (Jest)
| Fichier | Portée |
|---|---|
| `backend/tests/middleware/auth.test.js` | Middleware d'authentification JWT (mocks de `db`, `tokenBlacklistService`, `logger`) |
| `backend/tests/utils/logger.test.js` | Utilitaire de journalisation |
| `backend/tests/utils/apiResponse.test.js` | Format de réponse standardisé |
| `backend/tests/enrollments.test.js` | Flux d'inscription (test d'intégration, probablement via `supertest`) |
| `backend/tests/routes/supplies_access.test.js`, `users_access.test.js`, `children_photo_access.test.js` | Contrôle d'accès de routes spécifiques |

Configuration Jest (`backend/package.json`) : couverture collectée sur `utils/`, `middleware/`, `controllers/` uniquement (pas sur `routes_postgres/` directement, ce qui limite la mesure de couverture sur la majorité de la logique métier qui y réside, voir [09_ARCHITECTURE_TECHNIQUE.md](./09_ARCHITECTURE_TECHNIQUE.md)).

### Frontend (Vitest + Testing Library)
| Fichier | Portée |
|---|---|
| `frontend/src/test/HomePage.test.jsx` | Rendu de la page d'accueil |
| `frontend/src/test/components/StatsCard.test.jsx` | Composant `StatsCard` |
| `frontend/src/test/setup.js` | Configuration globale (jsdom) |

**Constat** : la couverture de tests automatisés est **limitée** au regard du volume de code (48 fichiers de routes backend, plusieurs dizaines de pages frontend). La majorité des parcours métier (inscription, présence, permissions, messagerie) ne sont pas couverts par des tests automatisés identifiés, en dehors de `enrollments.test.js` et des trois tests de contrôle d'accès. Voir [22_ETAT_DES_FONCTIONNALITES.md](./22_ETAT_DES_FONCTIONNALITES.md).

### Autres scripts de test présents dans le dépôt (hors suite Jest/Vitest)
Le dossier `tests/` à la racine contient une collection Postman (`Creche_API.postman_collection.json`), un script de test de responsivité Playwright/Puppeteer (`responsive-test.js`) et de nombreux comptes-rendus manuels au format Markdown (`BUGS_CORRIGES.md`, `CORRECTIONS_*.md`...) qui documentent un historique de sessions de test manuelles, mais ne constituent pas des tests automatisés exécutables en CI. `backend/create_test_users.js` et plusieurs scripts `scripts/create_test_staff.js`/`reset_test_users.js` créent des comptes de test pour une vérification manuelle.

## 3. Intégration continue
Un seul workflow GitHub Actions a été trouvé : `.github/workflows/deploy-frontend.yml`, qui **build et déploie** le frontend vers GitHub Pages à chaque push sur `main` — **il n'exécute aucun test** avant déploiement (pas d'étape `npm test` ou `npm run lint` dans ce workflow). **Aucun pipeline CI dédié aux tests backend n'a été trouvé.**

## 4. Déploiement (constaté, voir aussi [01_PRESENTATION_PROJET.md](./01_PRESENTATION_PROJET.md) §5 et [18_CONFIGURATION_ENVIRONNEMENT.md](./18_CONFIGURATION_ENVIRONNEMENT.md))
- **Backend** : Render (`backend/render.yaml`), build `npm install`, démarrage `npm start`. Un fichier `backend/.render-deploy-trigger` existe, probablement utilisé pour forcer un redéploiement (vide ou contenant un horodatage — **à vérifier**).
- **Base de données** : Neon Postgres, migrations exécutées automatiquement au démarrage du serveur (`migrations/runner.js`), pattern baseline décrit en [12_MODELE_DONNEES.md](./12_MODELE_DONNEES.md).
- **Frontend** : GitHub Pages (workflow Actions) et/ou Vercel (`vercel.json`) — double configuration présente, cible active non confirmée avec certitude (voir [01_PRESENTATION_PROJET.md](./01_PRESENTATION_PROJET.md)).
- **Dockerfile** : `backend/Dockerfile` existe, suggérant une capacité de conteneurisation du backend — **non audité en détail dans ce document**, et son usage réel (Render utilise `buildCommand`/`startCommand` Node natifs, pas explicitement Docker dans `render.yaml`) est à vérifier.

## 5. Sauvegardes et restauration
- **Sauvegarde automatique quotidienne** : `backend/jobs/backupJob.js`, démarré au lancement du serveur, planifié à 02h00 (confirmé par le message de log `server.js` ligne 495).
- **Gestion manuelle** : `backend/scripts/backup.js` (`--list`, `--restore`), exposé également via l'API `routes_postgres/backup.js` (lister, créer, télécharger, supprimer, restaurer une sauvegarde — réservé `admin`/`developer`).
- **Procédure de récupération d'urgence** : `routes_postgres/recovery.js` et page frontend `RecoveryPage.jsx` (route `/recovery`), protégées par une clé partagée `RECOVERY_KEY` (variable d'environnement) plutôt que par le système d'authentification applicatif habituel — conçue pour fonctionner même si la base de données ou le système d'authentification est indisponible. Documentée également dans `BACKUP_GUIDE.md` à la racine du dépôt (document préexistant, non repris tel quel ici mais cohérent avec le code observé).
- **Précaution confirmée par le code** : les migrations suivent un pattern « additif seulement » (`ADD COLUMN IF NOT EXISTS`, pas de `DROP COLUMN` dans les migrations actives sauf la 004 qui supprime explicitement deux colonnes identifiées comme obsolètes après vérification de migration des données) — limitant le risque de perte de données lors d'un déploiement.

## 6. Procédures de diagnostic
- `GET /api/health`, `/api/health/db`, `/api/health/detailed` (`routes_postgres/health.js`) : vérification de disponibilité du service et de la base.
- `routes_postgres/debugEnrollments.js` (`/api/debug/*`, réservé `admin`) : requêtes de diagnostic ad hoc sur les inscriptions, parents orphelins, association manuelle enfant/parent.
- `routes_postgres/activityLogs.js` : rapports périodiques (quotidien/hebdomadaire/mensuel) et alertes du journal technique, réservés au rôle `developer`.

## 7. Limites et points à vérifier
- Usage réel du `Dockerfile` backend (conteneurisation effective en production ou fichier préparatoire non utilisé).
- Contenu et finalité exacte de `backend/.render-deploy-trigger`.
- Existence d'un pipeline CI pour le backend (non trouvé) — à confirmer avec l'équipe si un pipeline externe à GitHub Actions est utilisé (ex. déploiement automatique Render sur push, configuré côté interface Render et non visible dans le dépôt).
