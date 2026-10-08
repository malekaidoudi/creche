# Déploiement et Mise en Production

Ce document décrit les mécanismes de déploiement identifiés dans le code pour le frontend et le backend.

---

## 1. Déploiement du Backend

Le backend Node.js / Express peut être déployé sur plusieurs plateformes selon les fichiers de configuration détectés :

### A. Fly.io (Configuration active par défaut)
- **Fichier de configuration** : `backend/fly.toml`
- **Application cible** : `creche-backend-mima`
- **Port interne** : `3003`
- Déploiement via la CLI Fly :
  ```bash
  cd backend
  fly deploy
  ```

### B. Conteneurisation Docker
- **Fichier** : `backend/Dockerfile`
- Permet de builder une image conteneur standard pour tout orchestrateur (Kubernetes, AWS ECS, Google Cloud Run) :
  ```bash
  cd backend
  docker build -t creche-backend:latest .
  docker run -p 3003:3003 --env-file .env creche-backend:latest
  ```

### C. Render & Railway
- `backend/render.yaml` : Déclaration de service Web Render avec plan gratuit. Le backend intègre une routine de keep-alive (`RENDER_EXTERNAL_URL`) pour maintenir l'instance éveillée.
- `backend/railway.json` : Déclaration de service Railway pointant le healthcheck sur `/api/health`.

---

## 2. Déploiement du Frontend (React / Vite)

### A. Build de production
Le build génère une suite de fichiers statiques HTML, JS et CSS optimisés dans le dossier `frontend/dist/` :
```bash
cd frontend
npm run build
```

### B. Hébergement Statique
- **Vercel** : Fichier `vercel.json` configurant la réécriture des routes SPA vers `index.html`.
- **GitHub Pages** : Fichier `.github/workflows/deploy-frontend.yml` (action GitHub automatisant le build et le push sur la branche `gh-pages`).

---

## 3. Précautions critiques avant mise en production

> [!CAUTION]
> Avant toute mise en production ou ouverture à des utilisateurs externes, vous devez impérativement :
> 1. **Corriger les routes non protégées** signalées dans le rapport de sécurité ([security-findings](../09-audit/security-findings.md)).
> 2. **Régénérer tous les secrets** (`JWT_SECRET`, mots de passe de base de données, clés Cloudinary) car ils ont été exposés dans les fichiers d'environnement suivis par Git.
> 3. **Désactiver ou protéger l'API `/api/setup/create-admin`**.
> 4. **Supprimer les comptes et données de test** par défaut créés par `init_database.js`.
> 5. **Externaliser les fichiers uploadés vers Cloudinary ou un bucket S3**, car les disques locaux sur Fly.io et Render sont éphémères et réinitialisés à chaque déploiement.
