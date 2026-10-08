# Structure du Projet

Ce document présente l'organisation physique des répertoires et fichiers du projet.

---

## 1. Arborescence générale

```
creche/
├── backend/                  # Application serveur Express / Node.js
│   ├── backups/              # Stockage local des sauvegardes JSON (data/)
│   ├── config/               # Configuration DB (db_postgres.js)
│   ├── controllers/          # Contrôleurs Express (certains actifs, certains orphelins)
│   ├── database/             # Documentation d'audit DB historique
│   ├── emails/               # Service e-mail, types et templates HTML
│   ├── jobs/                 # Tâches planifiées (backupJob.js)
│   ├── middleware/           # Authentification, logs d'activité, upload
│   ├── migrations/           # Scripts SQL ponctuels
│   ├── routes/               # Anciens routeurs / routeurs alternatifs (ex: optimized-settings)
│   ├── routes_postgres/      # Routeurs réels connectés dans server.js (35+ fichiers)
│   ├── scripts/              # Utilitaires de maintenance et de diagnostic
│   ├── services/             # Services métier (permissions, logs, événements, alertes...)
│   ├── tests/                # Tests unitaires Jest
│   ├── uploads/              # Stockage local des fichiers uploadés (documents, photos)
│   ├── utils/                # Loggers, formateurs de réponses API
│   ├── fly.toml              # Configuration de déploiement Fly.io
│   ├── render.yaml           # Configuration Render
│   ├── railway.json          # Configuration Railway
│   ├── Dockerfile            # Image conteneur pour déploiement backend
│   └── server.js             # Point d'entrée principal de l'API (Express)
│
├── frontend/                 # Application client React (Vite)
│   ├── public/               # Actifs statiques publics
│   ├── src/
│   │   ├── access/           # Système de contrôle des fonctionnalités (Can, useAccess, FEATURES)
│   │   ├── assets/           # Images et ressources packagées
│   │   ├── components/       # Composants React réutilisables
│   │   │   ├── common/       # Boutons, modales, spinners, cartes
│   │   │   ├── dashboard/    # Sidebar, Header, Widgets de statistiques
│   │   │   └── ...           # Composants métier (présences, enfants...)
│   │   ├── contexts/         # Contextes React (AuthContext, ThemeContext)
│   │   ├── hooks/            # Hooks React personnalisés
│   │   ├── i18n/             # Fichiers de traduction FR et AR
│   │   ├── pages/            # Pages des espaces public, parent et dashboard
│   │   ├── routes/           # Configuration React Router (AppRoutes.jsx)
│   │   ├── services/         # Clients API Axios (authService, etc.)
│   │   ├── test/             # Tests Vitest du frontend
│   │   ├── App.jsx           # Composant racine
│   │   ├── index.css         # Styles Tailwind CSS et styles globaux
│   │   └── main.jsx          # Point d'entrée Vite
│   ├── index.html            # Document HTML racine
│   ├── vite.config.js        # Configuration Vite
│   └── tailwind.config.js    # Configuration Tailwind CSS
│
├── documentation/            # Documentation complète du projet (dossier courant)
├── scratch/                  # Scripts d'analyse temporaires (routes, guards)
└── package.json              # Scripts npm globaux pour orchestrer dev et tests
```

---

## 2. Remarques d'architecture sur la structure

- **Point d'entrée racine** : Le fichier `server.js` situé directement à la racine du dépôt fait 0 octet (vide). L'unique point d'entrée réel du backend est `backend/server.js`.
- **Dualité des dossiers de routes** :
  - `backend/routes/` contient des fichiers historiques ou non utilisés (`optimized-settings.js`).
  - `backend/routes_postgres/` regroupe les routes effectives montées sur l'application dans `backend/server.js`.
- **Fichiers uploadés traqués dans Git** : Le dossier `backend/uploads/` contient des documents réels (pièces justificatives d'inscription, photos) qui ont été indexés dans le gestionnaire de versions Git au lieu d'être exclus dans `.gitignore`.
