# 🚀 Déploiement Manuel Simple

## Étape 1: Backend Railway

```bash
cd backend
railway login
railway init
railway up
```

## Étape 2: Frontend Vercel

```bash
cd frontend
vercel login
vercel
```

## Étape 3: Configuration

### Railway Dashboard
1. Aller sur https://railway.app/dashboard
2. Ajouter MySQL service
3. Configurer variables:
   - NODE_ENV=production
   - JWT_SECRET=your_secret_key

### Vercel Dashboard  
1. Aller sur https://vercel.com/dashboard
2. Configurer variables:
   - VITE_API_URL=https://your-railway-url.railway.app

## URLs finales
- Backend: https://your-project.railway.app
- Frontend: https://your-project.vercel.app
