# 🚀 Guide de Déploiement - Crèche Mima Elghalia

## 📋 Prérequis

- Compte Railway (pour le backend)
- Compte GitHub (pour le frontend)
- Node.js 18+ installé localement

## 🔧 Backend - Déploiement sur Railway

### 1. Préparation du projet

```bash
cd backend
npm install
```

### 2. Variables d'environnement Railway

Configurer les variables suivantes dans Railway :

```env
NODE_ENV=production
PORT=3003
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret_key
UPLOAD_PATH=/app/uploads
```

### 3. Base de données MySQL

Railway fournit automatiquement une base MySQL. Utiliser les variables :
- `MYSQLHOST`
- `MYSQLUSER` 
- `MYSQLPASSWORD`
- `MYSQLDATABASE`
- `MYSQLPORT`

### 4. Déploiement

1. Connecter le repository GitHub à Railway
2. Sélectionner le dossier `backend/`
3. Railway détectera automatiquement le `package.json`
4. Le déploiement se fera automatiquement

**URL Backend**: `https://your-app-name.up.railway.app`

## 🌐 Frontend - Déploiement sur GitHub Pages

### 1. Configuration

Le fichier `.github/workflows/deploy.yml` est déjà configuré.

### 2. Variables d'environnement

Modifier dans le workflow :

```yaml
env:
  VITE_API_URL: https://your-backend-url.up.railway.app
```

### 3. Activation GitHub Pages

1. Aller dans Settings > Pages
2. Source: GitHub Actions
3. Le déploiement se fera automatiquement à chaque push sur `main`

**URL Frontend**: `https://username.github.io/creche/`

## 🔗 Configuration CORS

Mettre à jour les origines autorisées dans `backend/server.js` :

```javascript
const allowedOrigins = [
  'https://username.github.io',
  'https://username.github.io/creche',
  // ... autres origines
];
```

## 📊 Monitoring

### Backend (Railway)
- Logs disponibles dans le dashboard Railway
- Métriques de performance automatiques
- Health check sur `/api/health`

### Frontend (GitHub Pages)
- Build logs dans Actions
- Déploiement automatique
- CDN global de GitHub

## 🔧 Maintenance

### Mise à jour Backend
1. Push sur la branche `main`
2. Railway redéploie automatiquement

### Mise à jour Frontend  
1. Push sur la branche `main`
2. GitHub Actions rebuild et redéploie

## 🚨 Dépannage

### Backend ne démarre pas
- Vérifier les variables d'environnement
- Consulter les logs Railway
- Tester la connexion DB

### Frontend ne se connecte pas
- Vérifier `VITE_API_URL`
- Contrôler la configuration CORS
- Vérifier les certificats SSL

## 📱 URLs Finales

- **Backend API**: `https://your-backend.up.railway.app/api`
- **Frontend**: `https://username.github.io/creche/`
- **Admin**: Email: `malekaidoudi@gmail.com` / Password: `admin123`

## 🔐 Sécurité Production

- [ ] Changer les mots de passe par défaut
- [ ] Configurer les variables d'environnement sécurisées
- [ ] Activer HTTPS uniquement
- [ ] Configurer les sauvegardes DB
- [ ] Monitorer les logs d'erreur
