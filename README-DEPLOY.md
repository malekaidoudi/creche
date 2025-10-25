# 🚀 Déploiement Simple - Railway + Vercel

## Installation des CLI

```bash
# Railway CLI
npm install -g @railway/cli

# Vercel CLI
npm install -g vercel
```

## Déploiement automatique

```bash
# Déploiement complet
npm run deploy

# Ou séparément
npm run deploy:backend   # Railway
npm run deploy:frontend  # Vercel
```

## Configuration manuelle

### Backend (Railway)
1. `cd backend`
2. `railway login`
3. `railway up`

### Frontend (Vercel)
1. `cd frontend`
2. `vercel login`
3. `vercel --prod`

## URLs finales
- Frontend: https://creche-frontend.vercel.app
- Backend: https://creche-backend.railway.app

## Variables d'environnement

Le backend Railway aura automatiquement :
- `NODE_ENV=production`
- `PORT=3000`
- Base de données MySQL (à ajouter via dashboard Railway)

## Comptes de test
- Admin: malekaidoudi@gmail.com / admin123
- Staff: staff@creche.com / staff123
- Parent: parent@creche.com / parent123
