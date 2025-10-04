# 🚀 Guide de Déploiement - Mima Elghalia

Ce guide vous explique comment déployer le système de gestion de crèche Mima Elghalia sur différentes plateformes.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Déploiement Frontend (GitHub Pages)](#déploiement-frontend-github-pages)
3. [Déploiement Backend](#déploiement-backend)
4. [Configuration des domaines](#configuration-des-domaines)
5. [Variables d'environnement](#variables-denvironnement)
6. [Monitoring et maintenance](#monitoring-et-maintenance)

## 🔧 Prérequis

- Node.js 18+ installé
- Git installé et configuré
- Compte GitHub
- Compte sur une plateforme de déploiement backend (Heroku, Railway, etc.)

## 🌐 Déploiement Frontend (GitHub Pages)

### Étape 1: Préparer le repository GitHub

```bash
# 1. Créer un nouveau repository sur GitHub
# 2. Cloner ou initialiser le repository local
git init
git remote add origin https://github.com/votre-username/creche-site.git

# 3. Ajouter tous les fichiers
git add .
git commit -m "Initial commit - Système Mima Elghalia"
git push -u origin main
```

### Étape 2: Configuration pour GitHub Pages

```bash
# Installer les dépendances
npm run install:all

# Configurer l'URL de base dans vite.config.js (déjà fait)
# Modifier frontend/.env.production avec votre URL backend
```

### Étape 3: Déploiement automatique

```bash
# Option 1: Script automatique
./scripts/deploy-github.sh

# Option 2: Manuel
cd frontend
npm install --save-dev gh-pages
npm run deploy
```

### Étape 4: Configuration GitHub Pages

1. Aller sur GitHub → Votre repository → Settings
2. Section "Pages"
3. Source: "Deploy from a branch"
4. Branch: `gh-pages`
5. Folder: `/ (root)`
6. Save

**URL finale:** `https://votre-username.github.io/creche-site/`

## 🖥️ Déploiement Backend

### Option 1: Heroku

```bash
# 1. Installer Heroku CLI
# 2. Créer une app Heroku
heroku create mima-elghalia-backend

# 3. Configurer les variables d'environnement
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=votre-secret-super-securise
heroku config:set DB_HOST=votre-db-host
heroku config:set DB_USER=votre-db-user
heroku config:set DB_PASS=votre-db-password
heroku config:set DB_NAME=votre-db-name

# 4. Déployer
git subtree push --prefix backend heroku main
```

### Option 2: Railway

```bash
# 1. Installer Railway CLI
npm install -g @railway/cli

# 2. Login et créer un projet
railway login
railway init

# 3. Déployer le backend
cd backend
railway up
```

### Option 3: VPS/Serveur dédié

```bash
# 1. Copier les fichiers sur le serveur
scp -r backend/ user@votre-serveur:/var/www/mima-elghalia/

# 2. Sur le serveur
cd /var/www/mima-elghalia/backend
npm ci --only=production

# 3. Configurer PM2
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

## 🌍 Configuration des domaines

### Domaine personnalisé pour GitHub Pages

1. Acheter un domaine (ex: mimaelghalia.tn)
2. Configurer les DNS:
   ```
   Type: CNAME
   Name: www
   Value: votre-username.github.io
   
   Type: A
   Name: @
   Values: 
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
3. Dans GitHub Pages settings, ajouter le domaine personnalisé
4. Activer "Enforce HTTPS"

### SSL/HTTPS

- GitHub Pages: SSL automatique
- Backend: Utiliser Let's Encrypt ou certificat de votre hébergeur

## ⚙️ Variables d'environnement

### Frontend (.env.production)

```env
VITE_API_URL=https://votre-backend.herokuapp.com
VITE_APP_NAME=Mima Elghalia
VITE_BASE_URL=/creche-site/
```

### Backend (.env.production)

```env
NODE_ENV=production
PORT=3003
JWT_SECRET=votre-secret-super-securise-changez-moi
JWT_EXPIRES_IN=7d

# Base de données
DB_HOST=votre-db-host
DB_PORT=3306
DB_USER=votre-db-user
DB_PASS=votre-db-password
DB_NAME=mima_elghalia_prod

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=contact@mimaelghalia.tn
EMAIL_PASS=votre-mot-de-passe-app

# Sécurité
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Monitoring et maintenance

### Surveillance

```bash
# Logs PM2
pm2 logs

# Monitoring PM2
pm2 monit

# Status des services
pm2 status
```

### Sauvegardes automatiques

```bash
# Créer un script de sauvegarde
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME > backup_$DATE.sql
```

### Mises à jour

```bash
# 1. Tester localement
npm run test

# 2. Commit et push
git add .
git commit -m "Update: description des changements"
git push origin main

# 3. Le déploiement se fait automatiquement via GitHub Actions
```

## 🔄 CI/CD avec GitHub Actions

Les workflows sont déjà configurés dans `.github/workflows/`:

- `deploy.yml`: Déploiement automatique du frontend
- `backend-deploy.yml`: Tests et build du backend

### Activation

1. Push sur la branche `main` déclenche automatiquement le déploiement
2. Les tests doivent passer pour que le déploiement continue
3. Le frontend est automatiquement déployé sur GitHub Pages

## 🆘 Dépannage

### Erreurs communes

1. **Build frontend échoue**
   ```bash
   # Vérifier les dépendances
   cd frontend && npm ci
   # Vérifier la configuration Vite
   npm run build
   ```

2. **Backend inaccessible**
   ```bash
   # Vérifier les logs
   heroku logs --tail
   # Vérifier les variables d'environnement
   heroku config
   ```

3. **Base de données non accessible**
   ```bash
   # Tester la connexion
   mysql -h $DB_HOST -u $DB_USER -p $DB_NAME
   ```

### Support

- 📧 Email: support@mimaelghalia.tn
- 📱 Téléphone: +216 71 000 000
- 💬 GitHub Issues: [Créer un ticket](https://github.com/votre-username/creche-site/issues)

## 📝 Checklist de déploiement

- [ ] Tests passent en local
- [ ] Variables d'environnement configurées
- [ ] Base de données créée et migrée
- [ ] Domaine configuré (optionnel)
- [ ] SSL activé
- [ ] Monitoring configuré
- [ ] Sauvegardes automatiques configurées
- [ ] Documentation mise à jour

---

**🎉 Félicitations ! Votre système Mima Elghalia est maintenant déployé et accessible au public !**
