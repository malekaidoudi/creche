# 10 — Authentification

## Objectif
Décrire précisément le mécanisme d'authentification réellement implémenté, à partir du code, sans supposer de mécanisme non observé.

## Périmètre
Création de compte, connexion, déconnexion, jeton, expiration, récupération de mot de passe. L'autorisation (rôles/permissions) est traitée dans [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md).

## 1. Mécanisme : JWT stateless + liste de révocation en base

L'authentification est **confirmée par le code** comme étant basée sur **JSON Web Token (JWT)**, signé avec la bibliothèque `jsonwebtoken`, **sans session serveur** et **sans fournisseur d'identité externe** (pas d'OAuth, pas de SSO observé dans le code actuel — un document `docs/PRD_OAUTH_SOCIAL_LOGIN.md` existe mais décrit une fonctionnalité **non implémentée**, voir [22_ETAT_DES_FONCTIONNALITES.md](./22_ETAT_DES_FONCTIONNALITES.md)).

- **Secret** : `process.env.JWT_SECRET`, avec une valeur par défaut codée en dur `'your-secret-key-change-in-production'` utilisée si la variable d'environnement est absente (`backend/middleware/auth.js` ligne 7, `backend/routes_postgres/auth.js` ligne 14). **Risque de sécurité si `JWT_SECRET` n'est pas positionné en production** — voir [20_SECURITE_ET_JOURNALISATION.md](./20_SECURITE_ET_JOURNALISATION.md).
- **Durée de validité** : `process.env.JWT_EXPIRES_IN`, par défaut `'7d'` (`backend/routes_postgres/auth.js` ligne 15).
- **Contenu du payload** : `{ userId, email, role }` (signé à la connexion, à l'inscription, à la création de mot de passe et à la réinitialisation de mot de passe).
- **Transport** : en-tête HTTP `Authorization: Bearer <token>`, lu côté backend par `authenticateToken` (`backend/middleware/auth.js` lignes 56-110) et ajouté automatiquement côté frontend par l'intercepteur Axios de `frontend/src/services/api.js` (lignes 14-34).
- **Stockage côté client** : `localStorage` du navigateur, clé `token` (et `user` dans certains flux, ex. `AuthContext.setAuthData`). **Pas de cookie httpOnly** : le jeton est donc accessible en JavaScript, ce qui expose à un risque de vol par XSS si une faille d'injection de script existait (voir [20_SECURITE_ET_JOURNALISATION.md](./20_SECURITE_ET_JOURNALISATION.md)).
- **Pas de rafraîchissement automatique (refresh token)** : aucun mécanisme de renouvellement silencieux n'a été trouvé. À l'expiration (7 jours), le prochain appel API renvoie 401, l'intercepteur réponse d'Axios purge le jeton et redirige vers `/` (`services/api.js` lignes 76-87) : l'utilisateur doit se reconnecter manuellement.

## 2. Révocation côté serveur (déconnexion réelle)

Contrairement à un JWT stateless pur, cette application implémente une **liste de révocation en base** pour permettre une vraie déconnexion côté serveur :
- Table `revoked_tokens` (`id, token, user_id, expires_at, created_at`), créée par `backend/migrations/versions/001_baseline_schema.js` (lignes 410-420).
- Service `backend/services/tokenBlacklistService.js` (non lu intégralement, interface utilisée : `isTokenRevoked(token)`, `revokeToken(token)`).
- À chaque requête authentifiée, `authenticateToken` vérifie d'abord si le jeton est révoqué (`backend/middleware/auth.js` lignes 69-81) avant de le décoder ; si révoqué → 401 `TOKEN_REVOKED`.
- `POST /api/auth/logout` (`backend/routes_postgres/auth.js` lignes 183-197) appelle `tokenBlacklistService.revokeToken(token)` pour invalider le jeton courant immédiatement, même s'il n'est pas encore expiré.

## 3. Flux de connexion (`POST /api/auth/login`)

Fichier : `backend/routes_postgres/auth.js` lignes 18-85.

1. Validation : `email` doit être un email valide, `password` non vide (`express-validator`).
2. Recherche de l'utilisateur par email en base (`SELECT ... FROM users WHERE email = $1`).
3. Si introuvable → `401 { error: 'Email ou mot de passe incorrect' }` (message volontairement générique, pas d'énumération des comptes).
4. Si `is_active = false` → `401 { error: 'Compte désactivé' }`.
5. Vérification du mot de passe avec `bcrypt.compare` (hash stocké en base, colonne `users.password`).
6. Si valide : génération du JWT, journalisation de la connexion réussie (`logLoginSuccess`, `backend/middleware/activityLogger.js`), renvoi de `{ message, token, user }` (le mot de passe est retiré de l'objet `user` renvoyé).

## 4. Inscription publique (`POST /api/auth/register`)

Fichier : `backend/routes_postgres/auth.js` lignes 88-147.
- Champs requis : email valide, mot de passe ≥ 6 caractères, prénom, nom (téléphone optionnel).
- **Le rôle est forcé à `'parent'`** côté serveur, quel que soit ce qui est envoyé par le client (commentaire explicite dans le code : « Sécurité SEC-03 : Forcer strictement le rôle 'parent' pour toute inscription publique », ligne 105). Il est donc **impossible de créer un compte `staff`/`admin`/`developer` via cette route publique**, même en modifiant la requête côté client.
- Hash du mot de passe avec `bcrypt` (10 rounds).
- Retourne directement un JWT (connexion automatique après inscription).

**Remarque fonctionnelle** : cette route de création de compte « libre » coexiste avec un second parcours de création de compte piloté par la direction après approbation d'une demande d'inscription d'enfant (`POST /api/auth/create-password`, voir §5 et [21_FLUX_METIER.md](./21_FLUX_METIER.md)). Les deux parcours sont actifs dans le code ; **à vérifier côté produit** lequel est réellement exposé/utilisé dans le parcours public actuel (la page `RegisterPage.jsx` existe dans les routes frontend : `/register`).

## 5. Création de mot de passe après approbation (`POST /api/auth/create-password`)

Fichier : `backend/routes_postgres/auth.js` lignes 199-369. Utilisé après qu'une demande d'inscription d'enfant (`enrollments`) a été approuvée par la direction : un compte parent est créé par le backend (sans mot de passe utilisable), et un lien contenant un `password_token` est envoyé par e-mail au parent (voir [21_FLUX_METIER.md](./21_FLUX_METIER.md)).
- Recherche prioritaire dans `users` par `password_token` + `email` + `is_active = true`.
- Vérifie l'expiration (`password_token_expires`) et que le mot de passe n'a pas déjà été défini (`password_set`).
- Hash et enregistre le nouveau mot de passe, invalide le jeton (`password_token = NULL`), connecte automatiquement l'utilisateur (nouveau JWT).
- **Chemin de compatibilité ascendante** : si aucun utilisateur ne correspond, le code retombe sur une recherche dans `enrollments.password_token` (ancien workflow où le compte parent n'existait pas encore) et crée alors le compte `users` à la volée. Les deux chemins sont actifs simultanément dans le code actuel.

## 6. Réinitialisation de mot de passe (mot de passe oublié)

Fichiers : `backend/routes_postgres/auth.js` lignes 372-580.
- `POST /api/auth/forgot-password` : recherche l'utilisateur par email ; **répond toujours avec succès** (`{ success: true, message: 'Si cet email existe...' }`), que l'email existe ou non et que le compte soit actif ou non — bonne pratique anti-énumération d'e-mails. Si trouvé et actif : génère un jeton aléatoire (`crypto.randomBytes(32).toString('hex')`), l'enregistre (`reset_token`, `reset_token_expires` = +1h), et envoie un e-mail (`emailService.sendResetPasswordEmail`) contenant un lien `${FRONTEND_URL}/reset-password/${resetToken}`.
- `GET /api/auth/verify-reset-token/:token` : vérifie la validité du jeton avant d'afficher le formulaire de réinitialisation côté frontend (page `ResetPasswordPage.jsx`).
- `POST /api/auth/reset-password` : vérifie le jeton et son expiration, hash le nouveau mot de passe, l'enregistre, invalide le jeton, et connecte automatiquement l'utilisateur.

## 7. Changement de mot de passe (utilisateur connecté)

`PUT /api/users/change-password` (`backend/routes_postgres/users.js` ligne 751) — route authentifiée, non détaillée dans cet audit (**à vérifier** : vérification de l'ancien mot de passe avant changement). Utilisée par `AuthContext.changePassword()` côté frontend.

## 8. Vérification du jeton au chargement de l'application

Côté frontend, `AuthContext.jsx` (`useEffect`, lignes 68-96) relit le `token` du `localStorage` au montage de l'application et appelle `authService.verifyToken(token)` (probablement `GET /api/auth/me`). En cas d'échec, le jeton est supprimé et l'utilisateur est considéré déconnecté.

Côté backend, `GET /api/auth/me` (`backend/routes_postgres/auth.js` lignes 150-180) décode le jeton directement avec `jwt.verify` (sans passer par `authenticateToken`, donc **sans vérifier la liste de révocation** — incohérence potentielle : un jeton révoqué via `/logout` resterait accepté par `/api/auth/me` ; voir [23_ANOMALIES_ET_RECOMMANDATIONS.md](./23_ANOMALIES_ET_RECOMMANDATIONS.md)) puis recharge l'utilisateur en base.

## 9. Différences notables entre frontend et backend
- Le frontend ne décode jamais le JWT lui-même : il fait confiance à l'objet `user` renvoyé par le backend à la connexion/vérification, stocké dans le state React (`AuthContext`). Aucune logique de rôle n'est déduite du contenu du token côté client.
- Le backend normalise `userId`/`id` dans les deux sens dès le décodage (`authenticateToken`, lignes 93-100), pour absorber l'hétérogénéité historique du payload entre les différentes routes qui génèrent des jetons.

## 10. Schéma du flux de connexion

Voir `documentsV2/diagrams/authentification.mmd`.

## 11. Limites et points à vérifier
- Contenu exact de `tokenBlacklistService.js` (purge des jetons expirés de `revoked_tokens`, fréquence) — non lu intégralement.
- Vérification de l'ancien mot de passe dans `PUT /api/users/change-password` — à confirmer.
- Usage réel de la page `/register` (inscription libre `parent`) par rapport au parcours d'inscription d'enfant (`/inscription`) qui crée lui aussi un compte parent après approbation : à clarifier avec le responsable produit, car les deux routes de création de compte parent coexistent.
