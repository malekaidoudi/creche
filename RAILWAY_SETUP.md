# 🚂 Nouveau Déploiement Railway - Guide Rapide

## 📋 Instructions Étape par Étape

### **1. Créer Nouveau Projet Railway**
1. Aller sur https://railway.app
2. Cliquer "New Project"
3. Sélectionner "Deploy from GitHub repo"
4. Choisir `malekaidoudi/creche`
5. **IMPORTANT** : Choisir la branche `main`

### **2. Ajouter Service MySQL**
1. Dans le projet, cliquer "New Service"
2. Sélectionner "Database" → "MySQL"
3. Railway va créer automatiquement les variables :
   - `MYSQLHOST`
   - `MYSQLPORT` 
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

### **3. Configurer Variables d'Environnement**
Dans les paramètres du service backend, ajouter :

```env
JWT_SECRET=creche-super-secret-jwt-key-production-2024
JWT_EXPIRES_IN=7d
UPLOADS_DIR=uploads
MAX_FILE_SIZE=5242880
NODE_ENV=production
FRONTEND_URL=https://malekaidoudi.github.io
NURSERY_NAME=Mima Elghalia
NURSERY_NAME_AR=ميما الغالية
NURSERY_ADDRESS=8 Rue Bizerte Medenine
NURSERY_ADDRESS_AR=8 نهج بنزرت مدنين 4100
NURSERY_PHONE=+216 25 95 35 32
NURSERY_EMAIL=contact@mimaelghalia.tn
NURSERY_WEBSITE=www.mimaelghalia.tn
```

### **4. Vérifier le Déploiement**
1. Attendre que le build termine (2-3 minutes)
2. Copier l'URL générée (ex: `https://backend-production-xxxx.up.railway.app`)
3. Tester : `curl https://votre-url/api/health`

### **5. Initialiser la Base de Données**
Une fois déployé, créer les utilisateurs :
```bash
curl "https://votre-url-railway/api/health?setup=true"
```

### **6. Tester la Connexion**
```bash
curl -X POST https://votre-url-railway/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@creche.test","password":"Password123!"}'
```

## 🎯 Comptes de Test Créés
- **admin@creche.test** / **Password123!**
- **staff@creche.test** / **Password123!**
- **parent@creche.test** / **Password123!**

## 🔄 Après Déploiement Réussi
1. Copier la nouvelle URL Railway
2. Mettre à jour `frontend/src/config/api.js`
3. Redéployer le frontend GitHub Pages

## ⚡ Configuration Railway Optimisée
- **Build Command** : Automatique (npm install)
- **Start Command** : `npm start`
- **Health Check** : `/api/health`
- **Port** : Automatique (Railway détecte PORT env var)
