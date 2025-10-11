# 🚂 Déploiement Railway - Guide Complet

## 📋 Prérequis

1. Compte Railway : https://railway.app
2. Repository GitHub connecté
3. Service MySQL Railway configuré

## 🚀 Étapes de Déploiement

### 1. Créer un Nouveau Projet Railway

1. Aller sur https://railway.app
2. Cliquer sur "New Project"
3. Sélectionner "Deploy from GitHub repo"
4. Choisir le repository `malekaidoudi/creche`

### 2. Configurer le Service MySQL

1. Dans le projet Railway, cliquer sur "New Service"
2. Sélectionner "Database" → "MySQL"
3. Railway va automatiquement créer les variables d'environnement :
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

### 3. Configurer les Variables d'Environnement

Dans les paramètres du service backend, ajouter :

```env
# JWT Configuration
JWT_SECRET=votre-cle-secrete-jwt-super-forte-pour-production
JWT_EXPIRES_IN=7d

# Upload Configuration
UPLOADS_DIR=uploads
MAX_FILE_SIZE=5242880

# Server Configuration
NODE_ENV=production

# Frontend URL (pour CORS)
FRONTEND_URL=https://malekaidoudi.github.io

# Informations de la crèche
NURSERY_NAME=Mima Elghalia
NURSERY_NAME_AR=ميما الغالية
NURSERY_ADDRESS=8 Rue Bizerte Medenine
NURSERY_ADDRESS_AR=8 نهج بنزرت مدنين 4100
NURSERY_PHONE=+216 25 95 35 32
NURSERY_EMAIL=contact@mimaelghalia.tn
NURSERY_WEBSITE=www.mimaelghalia.tn
```

### 4. Configuration du Build

Railway détecte automatiquement le `railway.json` :

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm install"
  },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 5. Initialiser la Base de Données

Une fois déployé, exécuter le script de setup :

```bash
# Via Railway CLI (optionnel)
railway run npm run railway:setup

# Ou via l'API directement
curl -X POST https://votre-url-railway.railway.app/api/setup/create-test-users
```

### 6. Mettre à Jour l'URL Frontend

1. Copier l'URL Railway générée (ex: `https://backend-production-xxxx.up.railway.app`)
2. Mettre à jour `frontend/src/config/api.js` :

```javascript
// Production GitHub Pages - Backend Railway
return 'https://votre-url-railway.railway.app';
```

## 🔧 Scripts Disponibles

- `npm start` : Démarre le serveur en production
- `npm run railway:setup` : Initialise la base de données Railway
- `npm run dev` : Développement local

## 📊 Monitoring

- **Health Check** : `/api/health`
- **Logs** : Disponibles dans le dashboard Railway
- **Metrics** : CPU, RAM, Réseau dans Railway

## 🔒 Sécurité

1. **JWT_SECRET** : Utiliser une clé forte en production
2. **CORS** : Configuré pour GitHub Pages uniquement
3. **Rate Limiting** : Activé pour toutes les routes
4. **Validation** : Toutes les entrées sont validées

## 🎯 Comptes de Test

Après déploiement, ces comptes seront disponibles :

- **Admin** : `admin@creche.test` / `Password123!`
- **Staff** : `staff@creche.test` / `Password123!`
- **Parent** : `parent@creche.test` / `Password123!`

## 🔄 Redéploiement

Railway redéploie automatiquement à chaque push sur `main`.

Pour forcer un redéploiement :
1. Aller dans le dashboard Railway
2. Cliquer sur "Deploy" → "Redeploy"

## 🐛 Dépannage

### Erreur de Connexion Base de Données
- Vérifier que le service MySQL est démarré
- Vérifier les variables d'environnement MySQL

### Erreur 500 au Démarrage
- Vérifier les logs Railway
- S'assurer que toutes les variables d'environnement sont définies

### CORS Errors
- Vérifier que `FRONTEND_URL` pointe vers GitHub Pages
- Mettre à jour l'URL Railway dans le frontend

## 📞 Support

En cas de problème :
1. Vérifier les logs Railway
2. Tester l'endpoint `/api/health`
3. Vérifier la configuration des variables d'environnement
