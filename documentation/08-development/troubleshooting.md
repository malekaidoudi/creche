# Guide de Dépannage et Résolution des Problèmes (Troubleshooting)

Ce document répertorie les erreurs et blocages les plus fréquemment rencontrés lors du développement ou de l'exploitation de l'application, ainsi que leurs solutions.

---

## 1. Problèmes de Connexion à la Base de Données

### Symptôme : Erreurs `ECONNREFUSED`, timeout ou déconnexions intermittentes
- **Cause 1** : L'URL PostgreSQL Serverless (Neon) est en veille ou l'accès SSL est désactivé.
- **Solution** : Vérifiez que l'option `?sslmode=require` est bien présente dans la variable `DATABASE_URL` et que `DB_SSL=true`.
- **Cause 2** : Épuisement du pool de connexions (pool fixé à 5 dans `db_postgres.js`).
- **Solution** : Vérifiez qu'aucune requête SQL ne bloque indéfiniment sans libérer son client.

---

## 2. Problèmes d'Authentification et JWT

### Symptôme : Erreur `401 Unauthorized - Jeton invalide` ou `Token manquant`
- **Cause 1** : Divergence de `JWT_SECRET`. Dans `backend/routes_postgres/auth.js`, un fallback en dur existe en cas d'absence de variable, mais dans `backend/middleware/auth.js`, aucun fallback n'est défini. Si la variable d'environnement `JWT_SECRET` n'est pas définie, le token généré au login est immédiatement rejeté lors des requêtes suivantes.
- **Solution** : Définissez explicitement une variable `JWT_SECRET` identique dans le `.env` du backend.

### Symptôme : Boucle de redirection sur l'interface
- **Cause** : Jeton expiré en `localStorage` ou utilisateur désactivé (`is_active = false`).
- **Solution** : Vider le `localStorage` du navigateur (`localStorage.removeItem('token')`) et se reconnecter.

---

## 3. Problèmes de Téléversement de Fichiers (Upload)

### Symptôme : Erreur 404 lors de l'envoi de documents ou photos
- **Cause** : Le composant frontend tente d'appeler l'URL `/api/uploads` ou `/api/uploads/multiple`.
- **Constat** : Ces routes ne sont pas montées dans `backend/server.js` (le contrôleur `uploadController` existe mais est orphelin).
- **Solution** : Utiliser les routes spécifiques dédiées (ex: `POST /api/profile/upload` ou upload direct Cloudinary `/api/cloudinary/signature`).

### Symptôme : Fichiers disparus après redémarrage du serveur
- **Cause** : Les fichiers uploadés ont été stockés sur le disque local du conteneur (Fly.io ou Render) dont le système de fichiers est éphémère.
- **Solution** : Basculer l'ensemble du stockage de fichiers vers Cloudinary.

---

## 4. Problèmes de Traduction et Affichage RTL

### Symptôme : Textes tronqués ou affichage inversé en arabe
- **Cause** : Des classes CSS Tailwind fixes (`ml-4`, `mr-2`) sont utilisées au lieu de classes logiques supportant le mode RTL (`ms-4`, `me-2`).
- **Solution** : Utiliser les utilitaires Tailwind `start` et `end` pour assurer un comportement symétrique automatique.
