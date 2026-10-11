# 20 — Sécurité et journalisation

## Objectif
Analyser les mécanismes de sécurité HTTP, la journalisation applicative, la validation des entrées et les risques identifiés dans le code. **Aucune modification de sécurité n'a été appliquée** : les problèmes sont uniquement signalés ici et consolidés dans [23_ANOMALIES_ET_RECOMMANDATIONS.md](./23_ANOMALIES_ET_RECOMMANDATIONS.md).

## 1. En-têtes de sécurité HTTP et CORS
- **Helmet** (`backend/server.js` lignes 105-121) : CSP personnalisée, `crossOriginResourcePolicy: 'cross-origin'`. La CSP autorise `scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"]` — **`'unsafe-eval'` et `'unsafe-inline'` affaiblissent sensiblement la protection contre le XSS** offerte par la CSP, ce qui est à mettre en regard du fait que le jeton JWT est stocké en `localStorage` (voir [10_AUTHENTIFICATION.md](./10_AUTHENTIFICATION.md)) : une injection de script réussie pourrait exfiltrer le jeton de session.
- **CORS** : liste blanche d'origines codée en dur + règles additionnelles pour le développement local (voir [18_CONFIGURATION_ENVIRONNEMENT.md](./18_CONFIGURATION_ENVIRONNEMENT.md) §2), `credentials: true`.
- **Rate limiting global** : `express-rate-limit`, 1000 requêtes/15 min en production (10000 en développement), appliqué à toute l'API sans distinction de route sensible (ex. `/api/auth/login` n'a pas de limite plus stricte spécifique identifiée, ce qui expose à un risque de force brute sur les mots de passe — voir §5).
- **`rateLimitPublic`** (`middleware/auth.js`) : limiteur en mémoire additionnel, disponible pour des routes publiques spécifiques, mais son usage effectif n'a pas été confirmé sur `/api/auth/login` dans le code lu.

## 2. Authentification et secrets
- Voir [10_AUTHENTIFICATION.md](./10_AUTHENTIFICATION.md) pour le détail. Point de sécurité principal : **valeur par défaut de `JWT_SECRET` codée en dur** (`'your-secret-key-change-in-production'`) si la variable d'environnement est absente, présente à deux endroits (`middleware/auth.js` ligne 7, `routes_postgres/auth.js` ligne 14). Si cette variable n'était pas correctement positionnée en production, un attaquant connaissant le code source pourrait forger des jetons valides pour n'importe quel rôle.
- Mots de passe hachés avec `bcrypt`/`bcryptjs` (10 rounds), jamais stockés ni renvoyés en clair dans les réponses API (vérifié sur `/login`, `/register`, `/me`).
- `RECOVERY_KEY` (voir [19_TESTS_DEPLOIEMENT_MAINTENANCE.md](./19_TESTS_DEPLOIEMENT_MAINTENANCE.md)) constitue un **accès privilégié parallèle au système d'authentification habituel** : sa fuite donnerait accès à la restauration de sauvegardes sans passer par un compte `admin`.

## 3. Validation des entrées et injections
- **SQL** : toutes les requêtes observées utilisent des requêtes paramétrées (`$1, $2...` avec `pg`), aucune concaténation de chaînes SQL avec une entrée utilisateur n'a été repérée dans les fichiers audités — **risque d'injection SQL classique jugé faible** sur le périmètre vérifié.
- **Validation applicative** : `express-validator` (`body(...).isEmail()`, `.isLength()`, `.isIn()`, `.isISO8601()`...) utilisé sur la majorité des routes de création (`auth.js`, `enrollments.js`, `notifications.js`, `users.js`). Plusieurs routes `PUT`/`PATCH` ne déclarent pas de validation explicite au niveau du routeur (la validation peut alors être déléguée au contrôleur, ou absente — à vérifier module par module, signalé en [23_ANOMALIES_ET_RECOMMANDATIONS.md](./23_ANOMALIES_ET_RECOMMANDATIONS.md)).
- **Uploads** : filtrage de type MIME et taille côté `multer` (voir [16_STOCKAGE_FICHIERS.md](./16_STOCKAGE_FICHIERS.md)) ; pas de scan antivirus/anti-malware identifié sur les fichiers reçus avant transfert vers Cloudinary.

## 4. Journalisation applicative

### 4.1 Logger technique (`backend/utils/logger.js`)
Niveaux `error|warn|info|debug`, pilotés par `LOG_LEVEL` (défaut `info` en production, `debug` en développement). Fonctions spécialisées : `logger.security(event, meta)` (utilisée par `middleware/auth.js` pour `PERMISSION_DENIED`, `REVOKED_TOKEN_USED`, `TOKEN_VERIFICATION_FAILED`, `ACCESS_DENIED`), `logger.sensitive(...)` (actif uniquement si `DEBUG_SENSITIVE=true`), `logger.dbDebug(...)` (actif si `DEBUG_DB=true`). Ce logger écrit sur la console standard (`console.log/warn/error`), sans agrégation externe identifiée (pas de Sentry, Logtail ou équivalent dans les dépendances `backend/package.json`).

### 4.2 Journal d'activité métier (`activity_logs`, `activity_logger.js`, `activityLogService.js`)
Middleware `activityLogger` (`backend/middleware/activityLogger.js`) : table de correspondance `ROUTE_CONFIG` associant des routes précises (`POST /api/auth/login`, `/api/enrollments`, `/:id/approve`, `/:id/reject`...) à une action, une catégorie (`AUTH`, `ACCOUNT`, `ENROLLMENT`...), un titre et une sévérité (`INFO|WARNING|DEBUG`...). Ce journal alimente le module « Journal d'activité » réservé au rôle `developer` (dashboard, statistiques, alertes automatiques, rapports périodiques exportables), voir [14_API_REST.md](./14_API_REST.md). Les échecs d'envoi d'e-mail y sont également remontés comme alertes critiques (voir [17_MESSAGERIE_ET_NOTIFICATIONS.md](./17_MESSAGERIE_ET_NOTIFICATIONS.md)).

### 4.3 Risque de fuite d'information dans les logs
- `DEBUG_AUTH=true` journalise le **payload JWT décodé** (id, rôle) — à n'activer qu'en développement (commentaire explicite dans le code et `.env.example`).
- Les messages d'erreur serveur (500) sont masqués en production par le gestionnaire d'erreurs global (`server.js`), mais plusieurs routes individuelles renvoient `details: error.message` directement au client même sans ce garde-fou central (ex. `enrollments.js` ligne ~511) — **risque mineur de divulgation d'informations techniques** (nom de colonne SQL, etc.) au client final selon le module.
- Les logs HTTP Morgan (`combined` en production) peuvent contenir des paramètres de requête ou adresses IP ; aucun mécanisme de redaction spécifique n'a été identifié.

### 4.4 Autres journaux dans la base
`logs` (journal applicatif générique), `email_logs` (historique d'envois), `activity_logs` (sécurité/traçabilité détaillée) — voir [13_DICTIONNAIRE_DONNEES.md](./13_DICTIONNAIRE_DONNEES.md) pour la distinction précise entre ces tables.

## 5. Risques identifiés (synthèse)
| Risque | Preuve | Sévérité estimée |
|---|---|---|
| `JWT_SECRET` par défaut codé en dur si variable absente | `middleware/auth.js` L7, `routes_postgres/auth.js` L14 | Élevée si mal configuré en prod |
| Pas de limite de débit spécifique sur `/api/auth/login` (force brute) | `server.js` (rate limit global uniquement), `routes_postgres/auth.js` | Moyenne |
| CSP avec `'unsafe-inline'`/`'unsafe-eval'` | `server.js` L105-121 | Moyenne (amplifie l'impact d'un XSS) |
| JWT stocké en `localStorage` (pas de cookie httpOnly) | `frontend/src/contexts/AuthContext.jsx`, `services/api.js` | Moyenne (exposition en cas de XSS) |
| `GET /api/auth/me` ne vérifie pas la liste de révocation | `routes_postgres/auth.js` L150-180 vs `middleware/auth.js` L69-81 | Faible/Moyenne |
| Plusieurs `GET` de `children.js` sans middleware d'authentification apparent | `routes_postgres/children.js` (`/birthdays/month`, `/stats`, `/unassociated`, `/stats/overview`) | Moyenne (fuite d'agrégats internes) |
| Rôle `director` mort mais présent dans des contrôles d'accès | `routes_postgres/children.js` L757, L792 | Faible (cosmétique) |
| Tables historiques jugées obsolètes toujours présentes (`contacts`, `documents`, `uploads`) | `backend/database/DB_AUDIT_REPORT.md` | Faible (hygiène/surface d'attaque résiduelle) |
| Fichiers servis statiquement sans contrôle d'accès (`/uploads/*`) | `server.js` L233 | Faible/Moyenne selon sensibilité des fichiers qui y transitent |
| `RECOVERY_KEY` : accès privilégié parallèle | `routes_postgres/recovery.js` | Élevée si la clé fuite |

## 6. Dépendances
Aucun audit de vulnérabilités (`npm audit`) n'a été exécuté dans le cadre de cette mission (action qui modifierait potentiellement le `package-lock.json` ou nécessiterait un accès réseau non garanti ici). **À vérifier régulièrement** via `npm audit` côté `backend/` et `frontend/` en dehors de cet audit documentaire.

## 7. Limites et points à vérifier
- Couverture exacte de la validation `express-validator` sur chaque route `PUT`/`PATCH` du dépôt (vérifiée par sondage, pas exhaustivement route par route).
- Présence éventuelle d'un rate limiting dédié sur `/api/auth/login`/`register` au-delà du rate limiting global.
- État réel des dépendances (vulnérabilités connues) — nécessite un `npm audit` à faire exécuter par l'équipe.
