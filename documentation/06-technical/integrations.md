# Intégrations et services tiers

Ce document détaille l'ensemble des intégrations externes identifiées dans le code source.

---

## 1. Cloudinary (Gestion des médias)

- **Fichiers source** : `backend/services/cloudinaryService.js` (1053 lignes), `backend/routes_postgres/cloudinary.js`, `backend/routes_postgres/cloudinaryExplorer.js`.
- **Rôle** :
  - Hébergement et transformation des photos de profil, photos d'enfants, documents et médias d'activités (photos et vidéos).
  - Génération de signatures cryptographiques pour l'envoi direct depuis le client (`POST /api/cloudinary/signature`), notamment pour les fichiers vidéo volumineux sans surcharger le serveur Express.
  - Outil d'administration : Explorateur Cloudinary complet réservé aux rôles `admin` et `developer` (`/api/cloudinary-explorer/*` : consultation des dossiers, statistiques de stockage, renommage, suppression, déplacement).

---

## 2. Services d'envoi d'e-mails (Resend & SMTP / Nodemailer)

- **Fichiers source** : `backend/emails/emailService.js`, `backend/emails/emailTypes.js`, `backend/emails/templates/`.
- **Rôle** :
  - **Resend** : Détecté si la clé d'environnement `RESEND_API_KEY` est présente. Permet un envoi transactionnel direct par API HTTP.
  - **Nodemailer (SMTP)** : Mécanisme alternatif si Resend n'est pas configuré, s'appuyant sur les paramètres SMTP classiques.
  - **Templates HTML** : 12 modèles bilingues gérés (confirmation d'inscription, acceptation, rejet, convocation au rendez-vous, bienvenue parent, réinitialisation de mot de passe, etc.).
  - **Journalisation** : Chaque tentative d'envoi est tracée dans la table PostgreSQL `email_logs` (statuts : `pending`, `sent`, `failed`, `bounced`).

---

## 3. Base de données PostgreSQL Neon

- **Fichiers source** : `backend/config/db_postgres.js`.
- **Rôle** :
  - PostgreSQL managé Serverless (Neon.tech).
  - Gestion d'un pool `pg` limité à 5 connexions simultanées, avec fonction `query` intégrant un mécanisme de retry automatique en cas de déconnexion réseau ou coupure transitoire.

---

## 4. Notifications Push mobiles (Expo Push)

- **Fichiers source** : `backend/services/pushNotificationService.js`.
- **Rôle** :
  - Prévu pour relayer les notifications vers des appareils mobiles via l'API Expo Push (à partir du champ `push_token` dans la table `users`).
  - **Constat d'audit** : Aucun projet d'application mobile (React Native / Flutter / Android / iOS) n'est présent dans le dépôt Git analysé. Cette intégration est donc pour l'instant inutilisée en production par des clients mobiles réels.

---

## 5. Plateformes d'hébergement & déploiement

- **Fly.io** : Fichier `backend/fly.toml` (application `creche-backend-mima`, port applicatif `3003`).
- **Render** : Fichier `backend/render.yaml` + script de ping automatique toutes les 14 minutes (`RENDER_EXTERNAL_URL`) pour maintenir l'instance active sur le plan gratuit.
- **Railway** : Fichier `backend/railway.json` (healthcheck sur `/api/health`).
- **GitHub Pages / Vercel** : Fichiers `.github/workflows/deploy-frontend.yml` et `vercel.json`.
