# 🚀 Guide de Déploiement Backend sur Render

## Étapes de Déploiement

### 1. **Créer un compte Render**
- Allez sur [render.com](https://render.com)
- Connectez-vous avec votre compte GitHub

### 2. **Créer un nouveau Web Service**
- Cliquez sur "New +" → "Web Service"
- Connectez votre repository GitHub `malekaidoudi/creche`
- Sélectionnez la branche `main`

### 3. **Configuration du Service**

#### **Paramètres de base :**
- **Name:** `creche-backend`
- **Region:** `Frankfurt (EU Central)` ou `Oregon (US West)`
- **Branch:** `main`
- **Root Directory:** `backend`

#### **Build & Deploy :**
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

#### **Plan :**
- **Instance Type:** `Free` (pour commencer)

### 4. **Variables d'Environnement**

Ajoutez ces variables dans l'onglet "Environment" :

```env
NODE_ENV=production
PORT=10000

# Base de données PostgreSQL Neon (EXISTANTE)
DB_HOST=ep-lucky-math-agxmasfs-pooler.c-2.eu-central-1.aws.neon.tech
DB_PORT=5432
DB_USER=neondb_owner
DB_PASSWORD=npg_ioMNXW9K2sbw
DB_NAME=mima_elghalia_db
DB_SSL=require

# JWT Secret (générer une nouvelle clé pour la production)
JWT_SECRET=your-production-jwt-secret-key-here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=crechemimaelghalia@gmail.com
SMTP_PASSWORD=qeyp kwpf yhhe voax
EMAIL_FROM=crechemimaelghalia@gmail.com

# Frontend URL (à mettre à jour après déploiement frontend)
CLIENT_URL=https://malekaidoudi.github.io
```

### 5. **Déploiement**
- Cliquez sur "Create Web Service"
- Render va automatiquement :
  1. Cloner votre repository
  2. Installer les dépendances (`npm install`)
  3. Démarrer le serveur (`npm start`)

### 6. **URL Publique**
Après déploiement, vous obtiendrez une URL du type :
```
https://creche-backend-xxxx.onrender.com
```

### 7. **Vérification**
Testez votre API avec :
```bash
curl https://creche-backend-xxxx.onrender.com/api/health
```

## 🔧 Configuration Frontend

Après déploiement, mettez à jour le frontend :

### Dans `frontend/src/services/api.js` :
```javascript
const API_BASE_URL = `https://creche-backend-xxxx.onrender.com`
```

### Dans `frontend/src/config/api.js` :
```javascript
const API_CONFIG = {
  BASE_URL: 'https://creche-backend-xxxx.onrender.com',
  // ...
}
```

## 📊 Monitoring

### Logs
- Accédez aux logs via le dashboard Render
- Surveillez les erreurs de connexion à la base de données

### Performance
- Le plan gratuit a des limitations :
  - 512 MB RAM
  - 0.1 CPU
  - Sleep après 15 min d'inactivité

### Upgrade
Pour un usage en production, considérez :
- **Starter Plan** ($7/mois) : 512 MB RAM, pas de sleep
- **Standard Plan** ($25/mois) : 2 GB RAM, plus de CPU

## 🔒 Sécurité

### Variables Sensibles
- ✅ JWT_SECRET : Générer une nouvelle clé forte
- ✅ DB_PASSWORD : Déjà sécurisée (Neon)
- ✅ SMTP_PASSWORD : Mot de passe d'application Gmail

### CORS
- ✅ Configuré pour accepter le frontend GitHub Pages
- ✅ Credentials activés pour l'authentification

## 🚨 Troubleshooting

### Erreurs communes :
1. **Build Failed** : Vérifier `package.json` et dépendances
2. **Database Connection** : Vérifier les variables d'environnement
3. **CORS Errors** : Ajouter l'URL frontend dans `allowedOrigins`

### Commandes de debug :
```bash
# Tester la connexion DB
curl https://your-backend.onrender.com/api/health

# Tester l'authentification
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"crechemimaelghalia@gmail.com","password":"admin123"}'
```

## 📝 Notes Importantes

1. **Base de données** : Utilise la base Neon existante (pas de migration nécessaire)
2. **Fichiers uploads** : Render a un système de fichiers éphémère
3. **Cold starts** : Le plan gratuit peut avoir des délais de démarrage
4. **SSL** : HTTPS automatique fourni par Render

## ✅ Checklist Post-Déploiement

- [ ] Backend déployé et accessible
- [ ] Variables d'environnement configurées
- [ ] Base de données connectée
- [ ] API health check fonctionne
- [ ] Login admin fonctionne
- [ ] CORS configuré pour le frontend
- [ ] URL backend mise à jour dans le frontend
