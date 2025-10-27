# 🚀 Déploiement Simple - Railway + Vercel

## ⚡ Installation des CLI

```bash
# Railway CLI
npm install -g @railway/cli

# Vercel CLI
npm install -g vercel
```

## 🚀 Déploiement automatique

```bash
# Déploiement complet (recommandé)
npm run deploy

# Ou séparément
npm run deploy:backend   # Railway
npm run deploy:frontend  # Vercel
```

## 🔧 Configuration manuelle

### Backend (Railway)
1. `cd backend`
2. `railway login`
3. `railway up`
4. Ajouter MySQL via dashboard Railway
5. Configurer les variables d'environnement

### Frontend (Vercel)
1. `cd frontend`
2. `vercel login`
3. `vercel --prod`

## 🌐 URLs finales
- **Frontend**: https://creche-frontend.vercel.app
- **Backend**: https://creche-backend.railway.app

## 🔐 Variables d'environnement Railway

Configurer via dashboard ou CLI :
```bash
railway variables --set NODE_ENV=production
railway variables --set JWT_SECRET=your_secret_key
railway variables --set FRONTEND_URL=https://creche-frontend.vercel.app
```

## 🗄️ Base de données

1. Aller sur le dashboard Railway
2. Ajouter un service MySQL
3. Les variables de connexion seront automatiquement injectées

## ✅ CORS configuré

Le backend autorise automatiquement :
- Tous les domaines `*.vercel.app`
- `localhost` en développement
- GitHub Pages

## 👥 Comptes de test
- **Admin**: crechemimaelghalia@gmail.com / admin123
- **Staff**: staff@creche.com / staff123
- **Parent**: parent@creche.com / parent123

## 🔍 Vérification

Après déploiement, testez :
- Backend: `https://creche-backend.railway.app/api/health`
- Frontend: `https://creche-frontend.vercel.app`
