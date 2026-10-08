# Guide d'Installation et Configuration Locale (Setup)

Ce guide décrit la procédure pour installer et exécuter le projet en local sur une machine de développement.

---

## 1. Prérequis logiciels

- **Node.js** : Version 18 LTS ou 20 LTS recommandée.
- **npm** : Version 9 ou supérieure (fournie avec Node.js).
- **PostgreSQL** : Une instance PostgreSQL accessible (locale ou instance managée Neon Serverless).
- **Git** : Pour cloner et gérer le dépôt.

---

## 2. Structure du dépôt et installation

Le projet est organisé en deux sous-dossiers principaux à la racine :

```bash
creche/
├── backend/          # API Express & logique métier
├── frontend/         # Application client React (Vite)
└── package.json      # Scripts racine d'orchestration
```

### Installation des dépendances

À la racine du projet, vous pouvez installer l'ensemble des modules en exécutant :

```bash
# Installation à la racine
npm install

# Installation des dépendances du backend
cd backend && npm install

# Installation des dépendances du frontend
cd ../frontend && npm install
cd ..
```

---

## 3. Configuration des environnements (.env)

> [!IMPORTANT]
> Ne commitez jamais vos clés réelles dans Git. Vérifiez que `.env` est bien ignoré dans `.gitignore`.

### A. Backend (`backend/.env`)
Créez ou vérifiez le fichier `backend/.env` avec les variables suivantes :

```env
PORT=3003
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Connexion PostgreSQL (Neon ou local)
DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?sslmode=require
DB_SSL=true

# Sécurité JWT
JWT_SECRET=<VOTRE_CLE_SECRETE_ALEATOIRE_MIN_32_CARACTERES>
JWT_EXPIRES_IN=7d

# Clé de secours
RECOVERY_KEY=<CLE_SECRETE_RECOVERY>

# E-mails (Resend OU SMTP)
RESEND_API_KEY=<CLE_API_RESEND_OPTIONNELLE>
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=contact@mima-elghalia.com
SMTP_PASS=<MOT_DE_PASSE_SMTP>
EMAIL_FROM=contact@mima-elghalia.com
CONTACT_EMAIL=direction@mima-elghalia.com

# Stockage Cloudinary
CLOUDINARY_CLOUD_NAME=<VOTRE_CLOUD_NAME>
CLOUDINARY_API_KEY=<VOTRE_API_KEY>
CLOUDINARY_API_SECRET=<VOTRE_API_SECRET>
```

### B. Frontend (`frontend/.env`)
Créez ou vérifiez le fichier `frontend/.env` :

```env
VITE_API_URL=http://localhost:3003
```

---

## 4. Initialisation de la base de données

Le script `backend/init_database.js` permet de créer la structure de base et d'insérer les utilisateurs de test :

```bash
cd backend
node init_database.js
```

Ce script initialise les tables fondamentales (`users`, `children`, `enrollments`, `attendance`, `holidays`, `nursery_settings`, `daily_reports`, etc.) et crée des comptes de démonstration par défaut si la table `users` est vide.

> [!WARNING]
> En environnement de production, modifiez impérativement les mots de passe des comptes de test générés par ce script (`password`).

---

## 5. Démarrage en local

Depuis la racine du projet, des scripts npm facilitent le lancement simultané :

```bash
# Démarrer le backend et le frontend simultanément (via concurrently)
npm run dev

# OU démarrer chaque service séparément dans deux terminaux :
# Terminal 1 - Backend :
cd backend && npm run dev    # écoute sur http://localhost:3003

# Terminal 2 - Frontend :
cd frontend && npm run dev   # écoute sur http://localhost:5173
```
