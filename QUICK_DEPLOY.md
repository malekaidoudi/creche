# 🚀 Déploiement Rapide - Mima Elghalia

Guide express pour déployer votre système de gestion de crèche en 10 minutes.

## ⚡ Déploiement Express (Frontend uniquement)

### 1. Prérequis (2 min)
```bash
# Vérifier Node.js
node --version  # Doit être 18+

# Vérifier Git
git --version
```

### 2. Préparer le repository GitHub (3 min)
```bash
# 1. Créer un nouveau repository sur GitHub nommé "creche-site"
# 2. Dans votre terminal :

git init
git add .
git commit -m "🎉 Initial commit - Système Mima Elghalia"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/creche-site.git
git push -u origin main
```

### 3. Déployer automatiquement (5 min)
```bash
# Installer les dépendances
npm run install:all

# Déployer sur GitHub Pages
./scripts/deploy-github.sh
```

### 4. Configurer GitHub Pages
1. Aller sur GitHub → Votre repository → **Settings**
2. Section **Pages**
3. Source: **Deploy from a branch**
4. Branch: **gh-pages**
5. Folder: **/ (root)**
6. **Save**

**🎉 Votre site est maintenant live sur :** `https://VOTRE-USERNAME.github.io/creche-site/`

---

## 🔧 Déploiement Complet (Frontend + Backend)

### Option A: Heroku (Recommandé)

#### Backend sur Heroku
```bash
# 1. Installer Heroku CLI
# 2. Créer l'app
heroku create mima-elghalia-api

# 3. Ajouter une base de données
heroku addons:create jawsdb-maria:kitefin

# 4. Configurer les variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)

# 5. Déployer
git subtree push --prefix backend heroku main

# 6. Initialiser la DB
heroku run npm run db:init
```

#### Mettre à jour le frontend
```bash
# Modifier frontend/.env.production
echo "VITE_API_URL=https://mima-elghalia-api.herokuapp.com" > frontend/.env.production

# Redéployer
./scripts/deploy-github.sh
```

### Option B: Railway (Alternative)

```bash
# 1. Installer Railway CLI
npm install -g @railway/cli

# 2. Login et déployer
railway login
cd backend
railway init
railway up

# 3. Configurer les variables dans le dashboard Railway
# 4. Mettre à jour VITE_API_URL dans le frontend
```

---

## 🎯 Comptes par défaut

Après déploiement, connectez-vous avec :

```
👑 Admin:
Email: admin@mimaelghalia.tn
Mot de passe: Admin123!

👥 Staff:
Email: staff@mimaelghalia.tn  
Mot de passe: Staff123!
```

**⚠️ IMPORTANT :** Changez ces mots de passe immédiatement après la première connexion !

---

## 🔍 Vérification

### Frontend
- ✅ Site accessible sur GitHub Pages
- ✅ Pages se chargent correctement
- ✅ Responsive sur mobile

### Backend (si déployé)
- ✅ API répond sur `/api/health`
- ✅ Connexion possible avec les comptes par défaut
- ✅ Base de données initialisée

---

## 🆘 Problèmes courants

### "npm run deploy" ne fonctionne pas
```bash
# Solution :
cd frontend
npm install --save-dev gh-pages
npm run deploy
```

### GitHub Pages ne se met pas à jour
```bash
# Forcer le redéploiement :
git commit --allow-empty -m "Force redeploy"
git push origin main
```

### Backend inaccessible
```bash
# Vérifier les logs Heroku :
heroku logs --tail --app mima-elghalia-api

# Vérifier les variables :
heroku config --app mima-elghalia-api
```

---

## 📞 Support

- 📧 **Email :** support@mimaelghalia.tn
- 📱 **Téléphone :** +216 71 000 000
- 💬 **GitHub Issues :** [Créer un ticket](https://github.com/VOTRE-USERNAME/creche-site/issues)

---

**🎉 Félicitations ! Votre système Mima Elghalia est maintenant déployé !**

**Prochaines étapes :**
1. Personnaliser les paramètres dans l'interface admin
2. Ajouter vos utilisateurs et enfants
3. Configurer un domaine personnalisé (optionnel)
4. Mettre en place les sauvegardes automatiques
