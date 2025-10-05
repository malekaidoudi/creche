# 🚂 Guide de Déploiement Railway - Crèche Site

## 📋 Vue d'Ensemble
Ce guide vous explique comment déployer votre backend sur Railway, une plateforme cloud gratuite qui inclut une base de données MySQL.

## 🎯 Pourquoi Railway ?
- ✅ **Gratuit** : 500h/mois (≈ 20 jours continus)
- ✅ **Base de données incluse** : MySQL automatiquement configuré
- ✅ **Déploiement simple** : Git push et c'est déployé
- ✅ **Variables d'environnement** : Interface graphique simple
- ✅ **Logs en temps réel** : Debugging facile

## 🚀 Étapes de Déploiement

### 1. Créer un Compte Railway
1. Aller sur [railway.app](https://railway.app)
2. Se connecter avec GitHub
3. Autoriser Railway à accéder à vos repos

### 2. Créer un Nouveau Projet
1. Cliquer sur "New Project"
2. Sélectionner "Deploy from GitHub repo"
3. Choisir le repo `malekaidoudi/creche`
4. Railway va automatiquement détecter votre backend Node.js

### 3. Ajouter une Base de Données MySQL
1. Dans votre projet Railway, cliquer sur "New Service"
2. Sélectionner "Database" → "MySQL"
3. Railway va créer automatiquement une DB MySQL
4. Les variables de connexion sont générées automatiquement

### 4. Variables d'Environnement Automatiques
Railway génère automatiquement ces variables :
```bash
# Variables MySQL (générées automatiquement)
MYSQLHOST=containers-us-west-xxx.railway.app
MYSQLPORT=6543
MYSQLUSER=root
MYSQLDATABASE=railway
MYSQLPASSWORD=xxx-xxx-xxx

# Variables Railway (générées automatiquement)
RAILWAY_ENVIRONMENT=production
RAILWAY_PUBLIC_DOMAIN=your-app.railway.app
```

### 5. Variables Personnalisées à Ajouter
Dans l'onglet "Variables" de votre service backend :
```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://malekaidoudi.github.io
```

## 🔧 Configuration Automatique

### Fichiers de Configuration Inclus
- `railway.json` : Configuration Railway
- `nixpacks.toml` : Instructions de build
- Backend adapté avec CORS multi-origins

### CORS Pré-configuré
Le backend accepte automatiquement :
- `http://localhost:5173` (développement)
- `https://malekaidoudi.github.io` (production)
- Votre domaine personnalisé (si configuré)

## 🗄️ Base de Données

### Migration Automatique
Railway va automatiquement :
1. Créer une base MySQL vide
2. Vous devrez importer votre schéma existant

### Import du Schéma (À faire manuellement)
1. Exporter votre DB locale :
```bash
mysqldump -u root -p creche_app > creche_schema.sql
```

2. Se connecter à Railway MySQL :
```bash
mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -p MYSQLDATABASE < creche_schema.sql
```

## 🌍 URL de Production
Après déploiement, votre API sera disponible sur :
```
https://your-app-name.railway.app/api
```

## 🔍 Monitoring et Logs
- **Logs en temps réel** : Onglet "Logs" dans Railway
- **Métriques** : CPU, RAM, réseau automatiquement trackés
- **Alertes** : Email si l'app crash

## 💰 Limites Gratuites
- **500 heures/mois** : Largement suffisant pour démarrer
- **1GB RAM** : Parfait pour une API Node.js
- **1GB stockage DB** : Suffisant pour des milliers d'enregistrements

## 🔄 Déploiement Automatique
Chaque `git push` sur votre branche principale déclenche automatiquement :
1. Build du backend
2. Tests (si configurés)
3. Déploiement
4. Redémarrage du service

## 🛠️ Commandes Utiles

### Logs en Local
```bash
# Voir les logs Railway
railway logs

# Se connecter à la DB
railway connect mysql
```

### Variables d'Environnement
```bash
# Lister toutes les variables
railway variables

# Ajouter une variable
railway variables set KEY=value
```

## 🚨 Troubleshooting

### Erreur de Connexion DB
- Vérifier que MySQL service est démarré
- Vérifier les variables MYSQL* dans l'onglet Variables

### Erreur CORS
- Vérifier que FRONTEND_URL est correctement configuré
- Les logs montrent les origins refusées

### App qui ne démarre pas
- Vérifier les logs dans l'onglet "Logs"
- S'assurer que le PORT est bien configuré

## 📞 Support
- [Documentation Railway](https://docs.railway.app)
- [Discord Railway](https://discord.gg/railway)
- [GitHub Issues](https://github.com/railwayapp/railway/issues)

---

## ✅ Checklist de Déploiement
- [ ] Compte Railway créé
- [ ] Projet connecté au repo GitHub
- [ ] Service MySQL ajouté
- [ ] Variables d'environnement configurées
- [ ] Schéma de base importé
- [ ] Test de l'API en production
- [ ] Frontend configuré avec la nouvelle URL
