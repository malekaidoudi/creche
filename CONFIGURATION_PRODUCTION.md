# 🚀 Configuration Production - Mima Elghalia

## 🌐 URLs de Production

### **Domaines Disponibles:**
1. **Domaine Principal:** `https://mima-elghalia.com`
2. **Vercel (Alternative):** `https://creche.vercel.app`

---

## ⚙️ Configuration Backend

### **Variables d'Environnement (.env.production):**

```env
# Base de données PostgreSQL Neon
DB_HOST=ep-lucky-math-agxmasfs-pooler.c-2.eu-central-1.aws.neon.tech
DB_USER=neondb_owner
DB_PASSWORD=npg_ioMNXW9K2sbw
DB_NAME=mima_elghalia_db
DB_PORT=5432
DB_SSLMODE=require

# JWT
JWT_SECRET=jesuissuredemonsecretilestsuperfort
JWT_EXPIRES_IN=7d

# Serveur
PORT=3003
NODE_ENV=production

# Frontend URL (IMPORTANT)
FRONTEND_URL=https://mima-elghalia.com
# ou
# FRONTEND_URL=https://creche.vercel.app

# Email (à configurer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app
```

---

## 🔄 Détection Automatique des URLs

Le système détecte automatiquement l'environnement:

```javascript
// Dans enrollmentsController.js
let frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  // Fallback automatique selon l'environnement
  frontendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://mima-elghalia.com'  // Production
    : 'http://localhost:5173';      // Développement
}
```

### **Comportement:**
- ✅ **Développement:** `http://localhost:5173`
- ✅ **Production avec FRONTEND_URL:** Utilise la valeur configurée
- ✅ **Production sans FRONTEND_URL:** Utilise `https://mima-elghalia.com`

---

## 📧 Liens dans les Emails

### **1. Création de Mot de Passe:**
```
https://mima-elghalia.com/create-password?token=xxx&email=xxx
```

### **2. Upload Documents Manquants:**
```
https://mima-elghalia.com/upload-documents?token=xxx&enrollment=xxx
```

### **3. Autres Liens:**
- Dashboard: `https://mima-elghalia.com/dashboard`
- Inscription: `https://mima-elghalia.com/inscription`
- Contact: `https://mima-elghalia.com/contact`

---

## 🎯 Déploiement Backend (Render/Railway)

### **1. Variables d'Environnement à Configurer:**

```bash
# Base de données
DB_HOST=ep-lucky-math-agxmasfs-pooler.c-2.eu-central-1.aws.neon.tech
DB_USER=neondb_owner
DB_PASSWORD=npg_ioMNXW9K2sbw
DB_NAME=mima_elghalia_db
DB_PORT=5432
DB_SSLMODE=require

# JWT
JWT_SECRET=votre-secret-jwt-securise
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=https://mima-elghalia.com

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=crechemimaelghalia@gmail.com
EMAIL_PASS=votre-mot-de-passe-app

# Serveur
NODE_ENV=production
PORT=3003
```

### **2. Commandes de Déploiement:**

```bash
# Build (si nécessaire)
npm install

# Démarrer
npm start

# Ou avec PM2
pm2 start server_postgres.js --name creche-backend
```

---

## 🌐 Déploiement Frontend (Vercel)

### **1. Variables d'Environnement Vercel:**

```bash
# API Backend
VITE_API_URL=https://votre-backend.onrender.com

# ou
VITE_API_URL=https://votre-backend.railway.app
```

### **2. Configuration vercel.json:**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### **3. Domaine Personnalisé:**

Dans Vercel Dashboard:
1. Settings → Domains
2. Ajouter: `mima-elghalia.com`
3. Configurer DNS:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

---

## 🔒 CORS Configuration

### **Backend (server_postgres.js):**

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',           // Développement
    'https://mima-elghalia.com',       // Production principale
    'https://www.mima-elghalia.com',   // Avec www
    'https://creche.vercel.app'        // Vercel
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## 📋 Checklist Déploiement

### **Backend:**
- [ ] Variables d'environnement configurées
- [ ] `FRONTEND_URL` défini sur `https://mima-elghalia.com`
- [ ] Base de données PostgreSQL Neon accessible
- [ ] Email SMTP configuré
- [ ] CORS configuré pour les deux domaines
- [ ] Tests des endpoints API

### **Frontend:**
- [ ] `VITE_API_URL` pointant vers le backend
- [ ] Build Vite réussi
- [ ] Déployé sur Vercel
- [ ] Domaine `mima-elghalia.com` configuré
- [ ] DNS configuré correctement
- [ ] Tests de navigation

### **Emails:**
- [ ] Tester email d'approbation inscription
- [ ] Vérifier lien création mot de passe
- [ ] Tester email documents manquants
- [ ] Vérifier lien upload documents
- [ ] Tester alertes de paiement

---

## 🧪 Tests Post-Déploiement

### **1. Test Inscription:**
```bash
# Créer une inscription
POST https://votre-backend/api/enrollments

# Approuver l'inscription
POST https://votre-backend/api/enrollments/:id/approve

# Vérifier l'email reçu
# Le lien doit pointer vers: https://mima-elghalia.com/create-password
```

### **2. Test Alerte Paiement:**
```bash
# Envoyer une alerte
POST https://votre-backend/api/payment-alerts
{
  "recipient_type": "all",
  "amount": 150,
  "due_date": "2025-12-31",
  "message": "Test"
}

# Vérifier notification parent
GET https://votre-backend/api/notifications
```

### **3. Test CORS:**
```bash
# Depuis https://mima-elghalia.com
fetch('https://votre-backend/api/health')
  .then(r => r.json())
  .then(console.log)
```

---

## 🔧 Dépannage

### **Problème: Liens email incorrects**
```bash
# Vérifier la variable
echo $FRONTEND_URL

# Doit afficher:
https://mima-elghalia.com
```

### **Problème: CORS bloqué**
```javascript
// Ajouter dans corsOptions:
origin: [
  'https://mima-elghalia.com',
  'https://www.mima-elghalia.com',
  'https://creche.vercel.app'
]
```

### **Problème: Email non envoyé**
```bash
# Vérifier configuration SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=crechemimaelghalia@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # App password
```

---

## 📊 Monitoring

### **URLs à Surveiller:**
- Backend Health: `https://votre-backend/api/health`
- Frontend: `https://mima-elghalia.com`
- Alternative: `https://creche.vercel.app`

### **Logs à Vérifier:**
- Logs backend (Render/Railway)
- Logs Vercel
- Logs base de données Neon
- Emails envoyés

---

## 🎯 Résumé Configuration

### **Développement:**
```
Frontend: http://localhost:5173
Backend:  http://localhost:3003
Emails:   http://localhost:5173/create-password
```

### **Production:**
```
Frontend: https://mima-elghalia.com
Backend:  https://votre-backend.onrender.com
Emails:   https://mima-elghalia.com/create-password
```

---

**Date:** 15/11/2025  
**Version:** 2.1.0  
**Domaines:** mima-elghalia.com, creche.vercel.app
