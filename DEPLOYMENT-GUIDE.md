# 🚀 Guide de Déploiement Automatisé - Crèche Management System

## 📋 Vue d'ensemble

Ce guide vous permet de déployer automatiquement votre application full stack :
- **Frontend React** → Vercel
- **Backend Node.js** → Heroku  
- **Base de données** → MySQL Cloud (ClearDB)

## 🛠️ Prérequis

### Outils requis
```bash
# Vérifier les versions
node --version    # >= 18.0.0
npm --version     # >= 8.0.0
git --version     # Dernière version

# Installer les CLI
npm install -g vercel@latest
npm install -g heroku
```

### Comptes nécessaires
- [GitHub](https://github.com) (gratuit)
- [Vercel](https://vercel.com) (gratuit)
- [Heroku](https://heroku.com) (gratuit avec limitations)

## 🔧 Configuration initiale

### 1. Cloner et préparer le projet
```bash
git clone https://github.com/malekaidoudi/creche.git
cd creche
npm install
```

### 2. Configurer les secrets GitHub
Dans votre repository GitHub, allez dans **Settings > Secrets and variables > Actions** :

```bash
# Secrets requis
HEROKU_API_KEY=your_heroku_api_key
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
JWT_SECRET=your_super_secret_jwt_key_64_chars_minimum
```

### 3. Obtenir les tokens

#### Heroku API Key
```bash
heroku auth:login
heroku auth:token
```

#### Vercel Token
1. Aller sur [Vercel Dashboard](https://vercel.com/account/tokens)
2. Créer un nouveau token
3. Copier le token généré

#### Vercel Org ID et Project ID
```bash
# Dans le dossier frontend
cd frontend
vercel link
# Suivre les instructions, puis :
cat .vercel/project.json
```

## 🚀 Déploiement automatique

### Option 1: Script automatisé (Recommandé)
```bash
# Rendre le script exécutable
chmod +x deploy.js

# Lancer le déploiement complet
node deploy.js
```

### Option 2: Déploiement manuel

#### Backend sur Heroku
```bash
# Créer l'app Heroku
heroku create creche-backend-api --region eu

# Ajouter MySQL ClearDB
heroku addons:create cleardb:ignite --app creche-backend-api

# Configurer les variables d'environnement
heroku config:set NODE_ENV=production --app creche-backend-api
heroku config:set JWT_SECRET=your_jwt_secret --app creche-backend-api
heroku config:set UPLOAD_PATH=/tmp/uploads --app creche-backend-api

# Déployer
cd backend
git init
git add .
git commit -m "Deploy to Heroku"
heroku git:remote -a creche-backend-api
git push heroku main
```

#### Frontend sur Vercel
```bash
cd frontend

# Configurer l'environnement
echo "VITE_API_URL=https://creche-backend-api.herokuapp.com" > .env.production

# Déployer
vercel --prod
```

## 🔄 CI/CD avec GitHub Actions

Le workflow automatique se déclenche sur chaque push vers `main` :

1. **Tests** - Exécute les tests backend et frontend
2. **Deploy Backend** - Déploie sur Heroku
3. **Deploy Frontend** - Déploie sur Vercel  
4. **Health Check** - Vérifie que tout fonctionne

## 🗄️ Configuration de la base de données

### ClearDB (MySQL Cloud)
```bash
# Récupérer l'URL de connexion
heroku config:get CLEARDB_DATABASE_URL --app creche-backend-api

# Format: mysql://username:password@hostname:port/database_name
# Le script configure automatiquement les variables :
# DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
```

### Initialisation des tables
```bash
# Les tables sont créées automatiquement au premier démarrage
# Voir backend/config/database.js pour la logique d'initialisation
```

## 🌐 URLs finales

Après déploiement réussi :

- **Frontend** : https://creche-frontend.vercel.app
- **Backend** : https://creche-backend-api.herokuapp.com
- **API Health** : https://creche-backend-api.herokuapp.com/api/health

## 🔍 Monitoring et logs

### Heroku (Backend)
```bash
# Voir les logs en temps réel
heroku logs --tail --app creche-backend-api

# Redémarrer l'application
heroku restart --app creche-backend-api

# Voir les métriques
heroku ps --app creche-backend-api
```

### Vercel (Frontend)
- Dashboard : https://vercel.com/dashboard
- Logs disponibles dans l'interface web
- Analytics intégrés

## 🐛 Dépannage

### Erreurs communes

#### Backend ne démarre pas
```bash
# Vérifier les logs
heroku logs --app creche-backend-api

# Vérifier les variables d'environnement
heroku config --app creche-backend-api

# Redémarrer
heroku restart --app creche-backend-api
```

#### Frontend ne se connecte pas au backend
```bash
# Vérifier la configuration API
cat frontend/.env.production

# Tester l'API manuellement
curl https://creche-backend-api.herokuapp.com/api/health
```

#### Base de données inaccessible
```bash
# Vérifier ClearDB
heroku addons:info cleardb --app creche-backend-api

# Tester la connexion
heroku run node -e "require('./config/database').testConnection()" --app creche-backend-api
```

## 📊 Coûts estimés

### Gratuit (Tier Free)
- **Vercel** : 100GB bandwidth/mois
- **Heroku** : 550-1000 heures/mois (avec vérification carte)
- **ClearDB** : 5MB storage, 4 connexions simultanées

### Payant (Production)
- **Vercel Pro** : $20/mois (domaine custom, analytics)
- **Heroku Eco** : $5/mois (pas de sleep, métriques)
- **ClearDB Ignite** : $9.99/mois (1GB, 15 connexions)

## 🔒 Sécurité

### Variables d'environnement
- Jamais de secrets dans le code
- Utilisation de GitHub Secrets
- Rotation régulière des tokens

### CORS
```javascript
// Backend configuré pour accepter seulement :
const allowedOrigins = [
  'https://creche-frontend.vercel.app',
  'http://localhost:5173' // dev seulement
];
```

### HTTPS
- Vercel : HTTPS automatique
- Heroku : HTTPS par défaut

## 📈 Optimisations

### Performance
- Compression gzip activée (backend)
- Assets optimisés (frontend)
- CDN Vercel (frontend)

### Monitoring
- Health checks automatiques
- Logs centralisés
- Métriques de performance

## 🆘 Support

En cas de problème :
1. Consulter les logs (Heroku/Vercel)
2. Vérifier les variables d'environnement
3. Tester les endpoints manuellement
4. Redéployer si nécessaire

---

**🎉 Votre application est maintenant déployée et accessible au monde entier !**
