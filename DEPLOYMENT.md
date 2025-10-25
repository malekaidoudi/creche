# 🚀 Guide de Déploiement - Crèche Mima Elghalia

## 📋 Prérequis

- Compte GitHub (pour le frontend)
- Node.js 18+ installé localement

## 🔧 Backend - Déploiement sur serveur

### 1. Préparation du projet

```bash
cd backend
npm install
```

### 2. Variables d'environnement

Configurer les variables suivantes dans un fichier `.env` :

```env
NODE_ENV=production
PORT=3003
DB_HOST=localhost
DB_USER=creche_user
DB_PASSWORD=secure_password
DB_NAME=mima_elghalia_db
JWT_SECRET=your-super-secret-jwt-key-here
UPLOAD_PATH=/var/www/uploads
```

### 3. Base de données MySQL

Créer la base de données et l'utilisateur :

```sql
CREATE DATABASE mima_elghalia_db;
CREATE USER 'creche_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON mima_elghalia_db.* TO 'creche_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Déploiement

1. Cloner le repository sur le serveur
2. Installer les dépendances : `npm install`
3. Configurer les variables d'environnement
4. Démarrer avec PM2 ou équivalent

**URL Backend**: `https://your-domain.com/api`

## 🌐 Frontend - Déploiement sur GitHub Pages

### 1. Configuration

Le fichier `.github/workflows/deploy.yml` est déjà configuré.

### 2. Variables d'environnement

Modifier dans le workflow :

```yaml
env:
  VITE_API_URL: https://your-backend-url.com
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

### Backend
- Logs serveur via PM2 ou système de logs
- Monitoring des performances et erreurs

### Frontend (GitHub Pages)
- Actions disponibles dans l'onglet Actions du repository
- Logs de build visibles dans chaque workflow

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
