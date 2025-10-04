# 🚀 Guide de Démarrage Rapide

Ce guide vous permettra de lancer l'application de gestion de crèche en quelques minutes.

## 📋 Prérequis

- **Node.js** (version 18 ou supérieure)
- **MySQL** (MAMP recommandé pour Mac)
- **Git**

## ⚡ Installation Express (5 minutes)

### 1. Cloner et installer

```bash
# Cloner le projet
git clone <votre-repo>
cd creche-site

# Installer toutes les dépendances
npm run install:all
```

### 2. Configuration de la base de données

**Avec MAMP :**
1. Démarrer MAMP
2. Créer une base de données `creche_app`
3. Importer le schéma :

```bash
# Via MAMP
/Applications/MAMP/Library/bin/mysql -u root -proot creche_app < database/schema.sql

# Ou via MySQL standard
mysql -u root -p creche_app < database/schema.sql
```

### 3. Configuration de l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env avec vos paramètres
# Pour MAMP, utilisez généralement :
# DB_HOST=127.0.0.1
# DB_PORT=8889
# DB_USER=root
# DB_PASS=root
```

### 4. Lancement

```bash
# Démarrer l'application complète
npm run dev
```

🎉 **C'est tout !** L'application est maintenant accessible sur :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3003

## 👤 Comptes par défaut

Après l'import du schéma, vous aurez ces comptes :

### Administrateur
- **Email** : admin@creche.ma
- **Mot de passe** : admin123

### Staff
- **Email** : staff@creche.ma  
- **Mot de passe** : staff123

### Parent
- **Email** : parent@creche.ma
- **Mot de passe** : parent123

## 🔧 Commandes Utiles

```bash
# Développement
npm run dev              # Lancer frontend + backend
npm run dev:frontend     # Frontend seulement
npm run dev:backend      # Backend seulement

# Tests
npm test                 # Tous les tests
npm run test:backend     # Tests backend
npm run test:frontend    # Tests frontend

# Production
npm run build           # Build pour production
npm run start           # Démarrer en production

# Utilitaires
npm run lint            # Vérifier le code
npm run format          # Formatter le code
```

## 🚨 Résolution de Problèmes

### Erreur de connexion MySQL
```bash
# Vérifier que MAMP est démarré
# Vérifier les paramètres dans .env
# Tester la connexion :
mysql -h 127.0.0.1 -P 8889 -u root -proot
```

### Port déjà utilisé
```bash
# Tuer les processus sur le port
lsof -ti:3003 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Problème de dépendances
```bash
# Nettoyer et réinstaller
rm -rf node_modules frontend/node_modules backend/node_modules
rm package-lock.json frontend/package-lock.json backend/package-lock.json
npm run install:all
```

## 📱 Fonctionnalités Principales

### 🏠 Site Public
- Page d'accueil moderne avec hero section
- Articles et actualités
- Formulaire d'inscription
- Visite virtuelle interactive
- Contact

### 👨‍💼 Back-office Admin
- Dashboard avec statistiques
- Gestion des utilisateurs
- Gestion des enfants et inscriptions
- Suivi de présence
- Gestion du contenu (articles/news)
- Rapports et analyses
- Paramètres système
- Gestion des médias

### 🌍 Fonctionnalités Avancées
- **Multilingue** : Français / Arabe (RTL)
- **Responsive** : Mobile-first design
- **Sécurisé** : JWT, bcrypt, validation
- **Performance** : Cache, compression, optimisations
- **Tests** : Backend + Frontend
- **CI/CD** : GitHub Actions configuré

## 🎯 Prochaines Étapes

1. **Personnaliser** les informations de la crèche dans les paramètres
2. **Ajouter** des utilisateurs et enfants
3. **Configurer** l'email (SMTP)
4. **Déployer** en production avec le script fourni
5. **Monitorer** avec les routes de santé

## 📞 Support

Pour toute question ou problème :
1. Consultez la documentation complète dans `README.md`
2. Vérifiez les logs : `backend/logs/`
3. Testez les routes de santé : http://localhost:3003/api/health

---

**Temps d'installation estimé : 5-10 minutes** ⏱️
