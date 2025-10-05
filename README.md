# 🏫 Système de Gestion de Crèche - Mima Elghalia

Une application web complète et moderne pour la gestion de la crèche **Mima Elghalia** (ميما الغالية), située à Medenine, Tunisie. Développée avec React.js et Node.js.

## ✨ Aperçu

Ce système offre une solution complète pour gérer tous les aspects d'une crèche : inscriptions, suivi des enfants, gestion du personnel, communication avec les parents, et bien plus encore.

## 🏢 Informations de la Crèche

**Mima Elghalia** (ميما الغالية)
- 📍 **Adresse** : 8 Rue Bizerte, Medenine 4100, Tunisie
- 📞 **Téléphone** : +216 25 95 35 32
- 📧 **Email** : contact@mimaelghalia.tn
- 🌐 **Site Web** : www.mimaelghalia.tn
- 🕒 **Horaires** : 
  - Lundi - Vendredi : 07h00 - 18h00
  - Samedi : 08h00 - 12h00
- 👶 **Âge des enfants** : 2 mois à 3 ans
- 💰 **Devise** : Dinar Tunisien (TND)

### 🎯 Fonctionnalités Principales

- **🏠 Site Web Public** : Vitrine moderne avec visite virtuelle
- **👨‍💼 Back-office Complet** : Gestion administrative complète
- **📱 Interface Responsive** : Optimisé mobile-first
- **🌍 Multilingue** : Support Français/Arabe (RTL)
- **🔒 Sécurisé** : Authentification JWT, validation robuste
- **📊 Rapports & Analytics** : Tableaux de bord et statistiques
- **🎨 UI/UX Moderne** : Design professionnel avec TailwindCSS

## ✨ Fonctionnalités

### 🔐 Authentification & Autorisation
- Système JWT avec rôles (admin, staff, parent)
- Gestion sécurisée des sessions
- Protection des routes selon les rôles

### 👥 Gestion des Utilisateurs
- CRUD complet des utilisateurs
- Rôles et permissions
- Profils personnalisés

### 👶 Gestion des Enfants
- Enregistrement des informations des enfants
- Suivi médical et contacts d'urgence
- Photos et documents

### 📝 Inscriptions
- Formulaire d'inscription en ligne
- Workflow d'approbation
- Notifications automatiques

### 📅 Gestion des Présences
- Check-in/Check-out des enfants
- Historique des présences
- Rapports de fréquentation

### 📰 Contenu & Communication
- Articles multilingues (FR/AR)
- Actualités et événements
- Système de contact
- Upload de médias

### 🌍 Multilingue
- Support complet FR/AR
- Interface RTL pour l'arabe
- Traductions dynamiques

## 🛠️ Stack Technique

### Backend
- **Node.js** avec Express.js
- **MySQL** pour la base de données
- **JWT** pour l'authentification
- **Multer** pour l'upload de fichiers
- **bcryptjs** pour le hashage des mots de passe

### Frontend
- **React 18** avec hooks
- **Vite** pour le build et dev server
- **TailwindCSS** pour le styling
- **React Router** pour la navigation
- **React Query** pour la gestion d'état
- **React Hook Form** pour les formulaires
- **React i18next** pour l'internationalisation

## 🚀 Installation

### Prérequis
- Node.js 18+
- MySQL (MAMP recommandé sur Mac)
- npm ou yarn

### 1. Cloner le projet
```bash
git clone <repository-url>
cd creche-site
```

### 2. Installer les dépendances
```bash
npm run install:all
```

### 3. Configuration de la base de données
1. Démarrer MAMP
2. Créer la base de données :
```bash
mysql -u root -p < database/schema.sql
```
3. Créer les utilisateurs de test :
```bash
mysql -u root -p < database/seed_users.sql
```

### 4. Configuration de l'environnement
```bash
cp .env.example .env
```

Modifier le fichier `.env` avec vos paramètres :
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=root
DB_NAME=creche_app
JWT_SECRET=your-super-secret-key
PORT=3001
```

### 5. Démarrage en développement
```bash
# Démarrer backend et frontend
npm run dev

# Ou séparément
npm run dev:backend
npm run dev:frontend
```

## 📁 Structure du Projet

```
creche-site/
├── backend/                 # API Node.js/Express
│   ├── config/             # Configuration DB
│   ├── middleware/         # Middleware d'auth
│   ├── models/            # Modèles de données
│   ├── routes/            # Routes API
│   └── server.js          # Point d'entrée
├── frontend/              # Application React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── contexts/      # Contextes React
│   │   ├── hooks/         # Hooks personnalisés
│   │   ├── i18n/          # Traductions
│   │   ├── layouts/       # Layouts de pages
│   │   ├── pages/         # Pages de l'application
│   │   ├── services/      # Services API
│   │   └── utils/         # Utilitaires
│   └── public/            # Assets statiques
├── database/              # Scripts SQL
└── docs/                  # Documentation
```

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev                # Démarrer backend + frontend
npm run dev:backend        # Backend seulement
npm run dev:frontend       # Frontend seulement

# Build
npm run build             # Build complet
npm run build:backend     # Build backend
npm run build:frontend    # Build frontend

# Tests
npm test                  # Tous les tests
npm run test:backend      # Tests backend
npm run test:frontend     # Tests frontend

# Qualité de code
npm run lint              # Linting
npm run format            # Formatage
```

## 🌐 URLs

- **Frontend** : http://localhost:5174/ (ou 5173 si disponible)
- **Backend API** : http://localhost:3003/api
- **Documentation API** : http://localhost:3003/api-docs (à venir)

## 👤 Comptes de Test

✅ **Comptes vérifiés et fonctionnels :**

```
Admin:
Email: admin@mimaelghalia.tn
Mot de passe: admin123
→ Accès: Tableau de bord complet

Staff:
Email: staff@mimaelghalia.tn
Mot de passe: staff123
→ Accès: Gestion enfants, présences, contenus

Parent:
Email: parent@mimaelghalia.tn
Mot de passe: parent123
→ Accès: Espace parent dédié
```

**Note :** Les mots de passe ont été vérifiés et réinitialisés. Si vous avez des problèmes de connexion, exécutez :
```bash
cd backend && node scripts/init-users.js
```

## 🧪 Tests

```bash
# Tests unitaires backend
cd backend && npm test

# Tests unitaires frontend
cd frontend && npm test

# Tests avec couverture
npm run test:coverage
```

## 🚀 Déploiement

### Déploiement rapide sur GitHub Pages

```bash
# 1. Créer un repository GitHub
# 2. Pousser le code
git init
git add .
git commit -m "Initial commit - Mima Elghalia"
git remote add origin https://github.com/votre-username/creche-site.git
git push -u origin main

# 3. Déployer automatiquement
./scripts/deploy-github.sh
```

### Options de déploiement

- **Frontend**: GitHub Pages (gratuit)
- **Backend**: Heroku, Railway, VPS
- **Base de données**: MySQL sur PlanetScale, Railway, ou VPS

### Configuration rapide

1. **Frontend** → Automatique via GitHub Actions
2. **Backend** → Suivre le guide dans [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **Variables d'environnement** → Configurer selon votre hébergeur

**📖 Guide complet**: Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions détaillées.

### Scripts disponibles

```bash
npm run deploy              # Déploiement complet
npm run deploy:frontend     # Frontend uniquement
./scripts/deploy-github.sh  # GitHub Pages avec vérifications
```

## 📱 Responsive Design

L'application est entièrement responsive et optimisée pour :
- 📱 Mobile (320px+)
- 📱 Tablette (768px+)
- 💻 Desktop (1024px+)

## 🌍 Internationalisation

- **Français** : Langue par défaut
- **Arabe** : Support RTL complet
- Changement de langue dynamique
- Traductions contextuelles

## 🔒 Sécurité

- Authentification JWT sécurisée
- Validation des données côté client et serveur
- Protection CORS
- Rate limiting
- Hashage des mots de passe avec bcrypt
- Validation des uploads

## 🚀 Déploiement

### Production
```bash
# Build
npm run build

# Variables d'environnement
NODE_ENV=production
DB_HOST=your-production-db
JWT_SECRET=your-production-secret
```

### CI/CD
Configuration GitHub Actions incluse pour :
- Tests automatiques
- Build et déploiement
- Vérification de la qualité du code

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou support :
- 📧 Email : support@creche.ma
- 📱 Téléphone : +212 5 22 XX XX XX

## 🙏 Remerciements

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/deploy?referrer=github&template=https://github.com/malekaidoudi/creche)
---

Développé avec ❤️ par l'équipe Creche Management
