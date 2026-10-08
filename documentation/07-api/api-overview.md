# Présentation de l'API REST

L'API est développée en **Node.js avec le framework Express** (version déclarée 2.1.0 dans `backend/server.js`).

---

## 1. Principes généraux

- **Protocole & Format** : HTTP / JSON pour toutes les requêtes et réponses.
- **Port d'écoute par défaut** : `3003` (ou variable d'environnement `PORT`).
- **Préfixe global des routes** : Toutes les routes applicatives sont préfixées par `/api/`.
- **Statut de santé (Healthcheck)** :
  - `GET /api/health` : État global de l'application.
  - `GET /api/health/db` : Test direct de la connectivité avec la base PostgreSQL Neon.
  - `GET /api/health/detailed` : Rapport détaillé (mémoire, uptime, configuration).

---

## 2. Format standard des réponses

### Réponse avec succès
```json
{
  "success": true,
  "data": { ... },
  "message": "Opération effectuée avec succès"
}
```

### Réponse en cas d'erreur
```json
{
  "success": false,
  "error": "Message explicatif de l'erreur",
  "details": [ ... ]
}
```

---

## 3. Middlewares globaux

Dans `backend/server.js`, chaque requête traverse :
1. `helmet()` : En-têtes de sécurité HTTP.
2. `cors(corsOptions)` : Contrôle des origines autorisées (localhost, `mimaelghalia.tn`, `mima-elghalia.com`, déploiements Netlify).
3. `compression()` : Compression gzip/deflate des réponses.
4. `express.json()` et `express.urlencoded()` : Analyse des corps de requêtes.
5. `morgan('dev')` : Journalisation des requêtes HTTP en console.
6. `express-rate-limit` :
   - Mode production : 1 000 requêtes par tranche de 15 minutes par IP.
   - Mode développement : 10 000 requêtes par tranche de 15 minutes.
7. `activityLogger` : Tracé automatique en base de données de certaines actions utilisateur.

---

## 4. Familles de routes principales

| Préfixe | Description |
|---|---|
| `/api/auth` | Authentification, sessions, mots de passe |
| `/api/users` & `/api/user-workflow` | Gestion des comptes et parcours d'onboarding |
| `/api/children` | Dossiers enfants, contacts d'urgence, médical |
| `/api/enrollments` | Inscriptions et flux d'admission |
| `/api/appointments` | Gestion et négociation des rendez-vous |
| `/api/attendance` & `/api/absence-requests` | Pointages, statistiques et absences |
| `/api/daily-reports` & `/api/supplies` | Suivi journalier et gestion des stocks par enfant |
| `/api/treatments` | Traitements médicaux et administration des doses |
| `/api/staff-messages` & `/api/personal-memos` | Messagerie interne et mémos |
| `/api/notifications` | Notifications internes |
| `/api/events` & `/api/tasks` & `/api/announcements` | Calendrier, tâches et communications officielles |
| `/api/activities` | Fil de vie de la crèche (photos, commentaires, réactions) |
| `/api/documents` | Gestion documentaire (enfants, administration) |
| `/api/nursery-settings` & `/api/holidays` | Paramétrage de la structure et jours fériés |
| `/api/backup` & `/api/recovery` | Sauvegardes JSON et récupération |
| `/api/activity-logs` & `/api/cloudinary-explorer` | Outils d'administration technique et développeur |
