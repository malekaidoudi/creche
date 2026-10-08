# Authentification

| Élément | Constat (code) |
|---|---|
| Login | `POST /api/auth/login`, bcryptjs |
| Jeton | JWT `{userId, email, role}`, durée `JWT_EXPIRES_IN` (défaut 7 j), **pas de refresh token** |
| Stockage client | `localStorage('token')` |
| Déconnexion | côté client uniquement (`POST /logout` renvoie un message) |
| Secret | `auth.js` : `process.env.JWT_SECRET \|\| '<valeur par défaut codée en dur>'` ; le middleware `authenticateToken` n'a pas de repli → **incohérence** : si `JWT_SECRET` est absent, les jetons émis sont rejetés |
| Création de mot de passe | jeton users/enrollments (`/auth/create-password`) ; `password_token` 32 octets hex, 7 j |
| Réinitialisation | jeton 1 h, anti-énumération |
| Inscription libre | `POST /api/auth/register` : **accepte `role` du corps** ⚠️ |
| Frontend | `AuthContext` accepte un jeton `mock_token_*` stocké en localStorage (contournement UI uniquement) |
| Compte `setup` | `POST /api/setup/create-admin` sans authentification ⚠️ |

Comptes de test créés par `init_database.js` si la table `users` est vide (mot de passe trivial, hash bcrypt) : à supprimer en production.

Sources : `backend/routes_postgres/auth.js`, `backend/middleware/auth.js`, `frontend/src/contexts/AuthContext*`.
