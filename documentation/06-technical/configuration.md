# Configuration et variables d'environnement

Ce document répertorie l'ensemble des variables d'environnement et configurations identifiées dans le code du backend et du frontend.

> [!CAUTION]
> **Aucun secret réel n'est reproduit ici.** Les valeurs sensibles sont indiquées sous forme de jetons symboliques (`<SECRET>`, `<API_KEY>`, etc.).
> Les fichiers `.env`, `.env.production`, `backend/.env`, `backend/.env.postgres`, `frontend/.env` et `frontend/.env.production` ont été détectés comme **suivis par Git** dans le dépôt d'origine, ce qui constitue une vulnérabilité critique (voir [security-findings](../09-audit/security-findings.md)).

---

## 1. Backend (`backend/`)

Le chargement des variables d'environnement s'effectue via `dotenv` :
- `backend/server.js` exécute `dotenv.config()`.
- `backend/config/db_postgres.js` charge explicitement `../../.env` (la racine du dépôt) en priorité.

### Variables de base de données
| Variable | Description | Exemple / Défaut dans le code |
|---|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL complète (prioritaire si définie) | `postgresql://<USER>:<PASS>@<HOST>/<DB>?sslmode=require` |
| `DB_HOST` | Hôte du serveur PostgreSQL (ex: Neon) | `ep-xxx.neon.tech` |
| `DB_PORT` | Port d'écoute PostgreSQL | `5432` |
| `DB_USER` | Utilisateur PostgreSQL | `<DB_USER>` |
| `DB_PASSWORD` | Mot de passe de la base de données | `<DB_PASSWORD>` |
| `DB_NAME` | Nom de la base de données | `neondb` ou nom spécifique |
| `DB_SSL` | Activation SSL pour le pool `pg` | `true` ou `false` |

### Authentification & Sécurité
| Variable | Description | Comportement / Valeur par défaut |
|---|---|---|
| `JWT_SECRET` | Clé secrète de signature des jetons JWT | *Important* : `auth.js` utilise un fallback de dev, alors que le middleware `authenticateToken` exige la variable sans fallback. |
| `JWT_EXPIRES_IN` | Durée de validité des jetons émis | `7d` (7 jours) par défaut |
| `RECOVERY_KEY` | Clé d'accès à l'API d'urgence `/api/recovery` | Chaîne secrète pour opérations de secours |

### E-mails (Nodemailer / Resend)
| Variable | Description | Notes |
|---|---|---|
| `RESEND_API_KEY` | Clé d'API Resend pour envoi transactionnel | Si définie, Resend est utilisé en priorité |
| `SMTP_HOST` | Serveur SMTP pour Nodemailer | Utilisé si `RESEND_API_KEY` est absente |
| `SMTP_PORT` | Port du serveur SMTP | Ex: `465` ou `587` |
| `SMTP_SECURE` | Connexion sécurisée SSL/TLS | `true` ou `false` |
| `SMTP_USER` | Utilisateur d'authentification SMTP | Compte d'envoi e-mail |
| `SMTP_PASS` | Mot de passe d'authentification SMTP | `<SMTP_PASS>` |
| `EMAIL_FROM` | Adresse d'expédition des e-mails | `contact@mima-elghalia.com` |
| `CONTACT_EMAIL` | Adresse de réception des contacts | Utilisé pour notifier l'administration |

### Stockage externe (Cloudinary)
| Variable | Description |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Nom du compte Cloudinary |
| `CLOUDINARY_API_KEY` | Clé API publique Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret d'API Cloudinary |

### Système et environnement
| Variable | Description |
|---|---|
| `NODE_ENV` | Mode d'exécution (`development` ou `production`) |
| `PORT` | Port d'écoute du serveur Express (défaut : `3003`) |
| `FRONTEND_URL` | URL de l'application cliente pour les liens e-mails (validation, réinitialisation) |
| `REGLEMENT_INTERIEUR_URL` | URL de redirection optionnelle pour le règlement intérieur |
| `RENDER_EXTERNAL_URL` | Si définie, active un auto-ping toutes les 14 minutes pour empêcher l'endormissement du service |

---

## 2. Frontend (`frontend/`)

Variables préfixées par `VITE_` injectées au build par Vite :

| Variable | Description | Comportement par défaut |
|---|---|---|
| `VITE_API_URL` | URL de base de l'API backend | En mode dev : `http://localhost:3003`<br>En production sans variable : repli vers `https://creche-backend-mima.fly.dev` |

---

## 3. Paramètres applicatifs en base de données (`nursery_settings`)

Les paramètres configurables fonctionnellement (heures d'ouverture, coordonnées, vacances annuelles) sont stockés dans la table `nursery_settings` bilingue :
- `setting_key` : clé unique (ex: `nursery_name`, `opening_hours`, etc.)
- `value_fr` : valeur en langue française
- `value_ar` : valeur en langue arabe
- `category` : catégorie de configuration
- `annual_vacation_enabled`, `annual_vacation_start_date`, `annual_vacation_end_date` : dates de fermeture annuelle de la structure.
