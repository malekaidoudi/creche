# API d'Authentification et Gestion des Sessions

L'authentification repose sur des jetons **JSON Web Tokens (JWT)** transmis dans l'en-tête HTTP :
`Authorization: Bearer <TOKEN>`

Fichiers d'implémentation : `backend/routes_postgres/auth.js`, `backend/routes_postgres/userWorkflow.js`, `backend/middleware/auth.js`.

---

## 1. Endpoints d'authentification (`/api/auth/*`)

### Connexion (`POST /api/auth/login`)
- **Accès** : Public
- **Corps de requête** :
  ```json
  {
    "email": "utilisateur@example.com",
    "password": "motdepasse"
  }
  ```
- **Réponse avec succès (200)** :
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": 1,
      "email": "utilisateur@example.com",
      "first_name": "Prénom",
      "last_name": "Nom",
      "role": "parent"
    }
  }
  ```
- **Contrôles** : Vérification du mot de passe avec `bcryptjs.compare`, vérification du statut `is_active = true`. Met à jour `last_active`.

---

### Inscription directe (`POST /api/auth/register`)
- **Accès** : Public
- **Corps de requête** : `email`, `password`, `first_name`, `last_name`, `phone`, `role` (optionnel, défaut `parent`).
- > [!WARNING]
  > **Faille de sécurité critique** : Cette route accepte le paramètre `role` fourni par le client sans restriction d'autorisation. Un attaquant peut ainsi créer un compte avec le rôle `admin` directement (voir [security-findings](../09-audit/security-findings.md)).

---

### Utilisateur courant (`GET /api/auth/me`)
- **Accès** : Authentifié (`authenticateToken`)
- **En-tête** : `Authorization: Bearer <TOKEN>`
- **Réponse** : Informations du compte connecté (hors mot de passe).

---

### Déconnexion (`POST /api/auth/logout`)
- **Accès** : Public
- **Description** : Renvoie simplement un message de confirmation. Aucune révocation de jeton n'est gérée côté serveur (pas de liste noire de jetons).

---

### Création du premier mot de passe (`POST /api/auth/create-password`)
- **Accès** : Public
- **Corps de requête** :
  ```json
  {
    "token": "hex32_token",
    "password": "nouveaumotdepasse"
  }
  ```
- **Description** : Valide le jeton d'invitation (table `users` ou `enrollments`), définit le mot de passe hashé, passe `password_set = true`, annule le jeton et renvoie un JWT valide.

---

### Mot de passe oublié (`POST /api/auth/forgot-password`)
- **Accès** : Public
- **Corps de requête** : `{ "email": "adresse@domaine.com" }`
- **Description** : Génère un jeton temporaire d'une heure (`reset_token`), envoie un e-mail de réinitialisation. Retourne un message générique pour éviter l'énumération des comptes existants.

---

### Réinitialisation du mot de passe (`POST /api/auth/reset-password`)
- **Accès** : Public
- **Corps de requête** : `{ "token": "...", "password": "..." }`
- **Description** : Vérifie l'expiration et met à jour le mot de passe.

---

### Vérification du jeton de réinitialisation (`GET /api/auth/verify-reset-token/:token`)
- **Accès** : Public
- **Description** : Permet au formulaire web de contrôler la validité du lien avant de présenter les champs de saisie.

---

## 2. Parcours utilisateur avancé (`/api/user-workflow/*`)

- `POST /api/user-workflow/create-parent` : Réservé `admin`. Crée le compte parent et envoie le lien par e-mail (`PARENT_WELCOME`).
- `POST /api/user-workflow/create-staff` : Réservé `admin`. Crée le compte personnel et envoie le lien (`STAFF_WELCOME`).
- `POST /api/user-workflow/set-password` : Public. Définition du mot de passe via le jeton de workflow.
- `POST /api/user-workflow/register-parent` : Public. Enregistrement direct parent avec envoi de confirmation.
- `POST /api/user-workflow/resend-password-link` : Réservé `admin`. Régénère et renvoie un lien valide 7 jours.
