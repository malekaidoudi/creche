# 🚀 Guide de Démarrage Rapide - Déploiement Automatisé

## ⚡ Installation en 3 étapes

### **Étape 1: Installation des prérequis**
```bash
# Installation automatique des outils CLI
npm run install:prerequisites
```

**Ou installation manuelle :**
```bash
# GitHub CLI
brew install gh

# Vercel CLI  
npm install -g vercel@latest

# Heroku CLI
brew tap heroku/brew && brew install heroku
```

### **Étape 2: Configuration des secrets**
```bash
# Configuration automatique des secrets GitHub
npm run deploy:setup
```

**Vous devrez fournir :**
- Heroku API Key (`heroku auth:token`)
- Vercel Token (https://vercel.com/account/tokens)
- Vercel Org ID et Project ID (`vercel link` puis `cat .vercel/project.json`)

### **Étape 3: Déploiement**
```bash
# Déploiement complet automatique
npm run deploy
```

## 🎯 URLs finales

Après déploiement réussi :
- **Frontend** : https://creche-frontend.vercel.app
- **Backend** : https://creche-backend-api.herokuapp.com

## 🔧 Commandes utiles

```bash
# Vérifier les prérequis
npm run install:prerequisites

# Configurer les secrets GitHub
npm run deploy:setup

# Déploiement complet
npm run deploy

# Déploiement backend seulement
npm run deploy:backend

# Déploiement frontend seulement  
npm run deploy:frontend

# Vérifier le déploiement
npm run deploy:check
```

## 🆘 Dépannage

### Erreur "CLI non installé"
```bash
npm run install:prerequisites
```

### Erreur "Secrets manquants"
```bash
npm run deploy:setup
```

### Erreur de déploiement
```bash
# Vérifier les logs
heroku logs --tail --app creche-backend-api
vercel logs
```

## 📱 Comptes de test

- **Admin** : malekaidoudi@gmail.com / admin123
- **Staff** : staff@creche.com / staff123  
- **Parent** : parent@creche.com / parent123

---

**🎉 Votre application sera déployée et accessible au monde entier !**
