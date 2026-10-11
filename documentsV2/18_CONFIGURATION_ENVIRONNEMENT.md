# 18 — Configuration et variables d'environnement

## Objectif
Inventorier les variables d'environnement utilisées par le backend et le frontend, leur fonction et leur caractère obligatoire/optionnel. **Aucune valeur réelle n'est reproduite ici** ; les exemples utilisent des marqueurs génériques.

## 1. Backend (`backend/`)

Sources croisées : `backend/.env.example`, `backend/render.yaml`, usages `process.env.*` relevés dans le code.

| Variable | Fonction | Modules utilisateurs | Obligatoire ? |
|---|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL` | Connexion PostgreSQL (Neon) | `config/db_postgres.js` | Oui (ou `DATABASE_URL`) |
| `DATABASE_URL` | URL de connexion complète, alternative aux variables `DB_*`, utilisée pour certains scripts de migration | `migrations/*.js` (certains scripts) | Optionnel (selon script) |
| `JWT_SECRET` | Clé de signature des jetons JWT | `middleware/auth.js`, `routes_postgres/auth.js` | **Oui — critique**. Depuis la correction du `corrections.md` (Fiche 56), le serveur refuse de démarrer si cette variable est absente (voir [20_SECURITE_ET_JOURNALISATION.md](./20_SECURITE_ET_JOURNALISATION.md)) |
| `JWT_EXPIRES_IN` | Durée de validité du jeton | `routes_postgres/auth.js` | Non (défaut `'7d'`) |
| `RESEND_API_KEY` | Clé API Resend (envoi d'e-mails prioritaire) | `emails/emailService.js` | Non (fonctionnalité dégradée si absent et pas de SMTP) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Configuration SMTP (repli si Resend absent) | `emails/emailService.js` | Non (voir ci-dessus) |
| `EMAIL_FROM` | Adresse d'expédition affichée | `emails/*` | Non |
| `CONTACT_EMAIL` | Adresse de réception des messages de contact (valeur par défaut, surclassée par `nursery_settings.contact_email` en base) | `emails/emailService.js` | Non |
| `FRONTEND_URL` | Base des liens générés dans les e-mails (réinitialisation de mot de passe, etc.) | `routes_postgres/auth.js` | Recommandé en production |
| `NODE_ENV` | Bascule entre comportements dev/production (CORS, logs Morgan, limites de débit) | `server.js` | Oui en production (`production`) |
| `PORT` | Port d'écoute du serveur Express | `server.js` | Non (défaut `3003` local, `8080` sur Render) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Accès au compte Cloudinary | `services/cloudinaryService.js` | Oui pour le stockage de fichiers (dégradation silencieuse sinon, voir [16_STOCKAGE_FICHIERS.md](./16_STOCKAGE_FICHIERS.md)) |
| `DEBUG_AUTH` | Active la journalisation du payload JWT décodé (développement uniquement) | `middleware/auth.js` | Non — **à ne jamais activer en production** |
| `DEBUG_SENSITIVE` | Active les logs marqués `logger.sensitive(...)` | `utils/logger.js` (déduit) | Non — développement uniquement |
| `RECOVERY_KEY` | Clé secrète permettant d'accéder à `/recovery` (restauration de sauvegarde) sans authentification applicative classique | `routes_postgres/recovery.js` | **Oui si le module de récupération est utilisé — critique**, à garder strictement secrète |
| `RENDER_EXTERNAL_URL` | URL publique du service Render, utilisée pour le ping keep-alive anti cold-start | `server.js` | Non (Render la fournit automatiquement) |
| `CLIENT_URL` | Origine autorisée supplémentaire pour CORS (déclarée dans `render.yaml`, valeur GitHub Pages) | `server.js` — **désormais lue** (voir §2, correction `corrections.md` Fiche 57) | Non |
| `CORS_ADDITIONAL_ORIGINS` | Liste d'origines CORS supplémentaires, séparées par des virgules | `server.js` | Non |

## 2. CORS : liste blanche codée en dur + variables d'environnement
`backend/server.js` combine, depuis la correction de l'anomalie #2 ([23_ANOMALIES_ET_RECOMMANDATIONS.md](./23_ANOMALIES_ET_RECOMMANDATIONS.md)) : une liste d'origines codée en dur (`DEFAULT_ALLOWED_ORIGINS` : `localhost:5173`, `mimaelghalia.tn`, `mima-elghalia.com`, le backend Render, IP LAN en dev...) **et** les origines fournies par les variables d'environnement `CLIENT_URL` (une seule origine) et `CORS_ADDITIONAL_ORIGINS` (plusieurs origines séparées par des virgules), fusionnées et dédupliquées une seule fois au démarrage du serveur. `CLIENT_URL` (déclarée dans `render.yaml`, valeur GitHub Pages) est donc maintenant effectivement prise en compte. Toute nouvelle origine de production peut être ajoutée sans modifier le code source, via ces variables.

## 3. Frontend (`frontend/`)

Sources : `frontend/.env`, `frontend/.env.production`, `frontend/src/config/api.js`.

| Variable | Fonction | Obligatoire ? |
|---|---|---|
| `VITE_API_URL` | URL de base de l'API backend. Si absente, `config/api.js` déduit automatiquement l'URL selon le contexte (localhost, IP LAN de développement, ou URL de production **codée en dur** `https://creche-lx4u.onrender.com`) | Non (mais recommandé en production pour éviter de dépendre de l'URL codée en dur) |
| `VITE_APP_NAME`, `VITE_APP_VERSION` | Métadonnées d'affichage | Non |
| `VITE_BASE_URL` | Base URL pour le déploiement Vercel | Non |
| `VITE_ENABLE_DEVTOOLS`, `VITE_LOG_LEVEL` | Comportement de debug | Non |
| `VITE_API_TIMEOUT` | Timeout des requêtes API (non branché de façon confirmée sur `services/api.js`, qui code en dur `30000`/`300000` ms — **à vérifier** si cette variable est réellement lue quelque part) | Non |
| `VITE_ENABLE_MOCK_DATA` | Active des données simulées (non localisé dans le code consulté — **à vérifier**) | Non |

**Point notable** : `frontend/src/config/api.js` contient l'URL de production du backend **en dur** (`https://creche-lx4u.onrender.com`) comme filet de sécurité si `VITE_API_URL` n'est pas définie au build. Un changement d'hébergeur backend nécessiterait donc, a minima, une recompilation du frontend.

## 4. Configuration de déploiement (non des variables d'env, mais liée)
- `backend/render.yaml` : déclare le service Render, lie la base `neon-postgres`, génère automatiquement `JWT_SECRET` (`generateValue: true`) si déployé via ce fichier — **à vérifier** si c'est la méthode de déploiement réellement utilisée ou si le secret est positionné manuellement dans le tableau de bord Render.
- `frontend/vercel.json` / `vercel.json` (racine) : configuration de build Vite pour Vercel, avec réécritures SPA.
- `.github/workflows/deploy-frontend.yml` : déploiement automatique vers GitHub Pages à chaque push sur `main`.

## 5. Comment configurer un environnement local (déduit du code, non testé dans cet audit)
1. Copier `backend/.env.example` vers `backend/.env` et renseigner au minimum : `DB_HOST/PORT/USER/PASSWORD/NAME`, `JWT_SECRET` (valeur aléatoire longue), et soit `RESEND_API_KEY` soit `SMTP_*` pour les e-mails.
2. Renseigner `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` pour activer le stockage de fichiers (sinon dégradation silencieuse, voir §16).
3. Côté frontend, laisser `VITE_API_URL` vide en local (le fichier `.env` du dépôt le précise explicitement en commentaire) : `frontend/src/config/api.js` basculera automatiquement sur `http://localhost:3003`.
4. Démarrer avec `npm run dev` à la racine (script `concurrently` lançant `backend` et `frontend` en parallèle, `package.json` racine).

## 6. Limites et points à vérifier
- Lecture effective de `VITE_API_TIMEOUT` et `VITE_ENABLE_MOCK_DATA` dans le code (non localisée).
- Mode de gestion réelle du secret `JWT_SECRET` en production (génération Render automatique vs valeur manuelle).
- Contenu exact de `backend/config/db_postgres.js` (paramètres de pool, gestion stricte du SSL) non audité en détail.
