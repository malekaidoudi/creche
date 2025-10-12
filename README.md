# 🏠 Mima Elghalia - Système de Gestion de Crèche

Système complet de gestion pour la crèche **Mima Elghalia** (ميما الغالية) située à Médenine, Tunisie.

## 🌟 Fonctionnalités Principales

### 🔐 **Authentification & Sécurité**
- **JWT sécurisé** : Authentification avec tokens
- **Rôles utilisateurs** : Admin, Staff, Parent
- **Permissions** : Accès contrôlé selon les rôles
- **Sessions** : Gestion automatique des connexions

### 📊 **Dashboard Administratif**
- **Tableau de bord** : Vue d'ensemble avec statistiques
- **Gestion enfants** : CRUD complet avec statuts
- **Approbation** : Système d'approbation/rejet des demandes
- **Documents** : Gestion des documents par enfant
- **Présences** : Suivi des présences (en développement)

### 👤 **Gestion Utilisateurs**
- **Profils complets** : Informations personnelles
- **Photos de profil** : Upload et gestion d'images
- **Mon Espace** : Page personnalisée pour chaque utilisateur
- **Association** : Liaison enfants-parents/staff

### 🎨 **Interface Utilisateur**
- **🌍 Multilingue** : Support complet Français/Arabe avec RTL
- **🌙 Thème sombre** : Mode jour/nuit avec animations
- **📱 Responsive** : Design mobile-first optimisé
- **⚡ Performance** : Interface rapide et fluide
- **🎨 Design moderne** : Interface épurée avec Tailwind CSS

## 🏢 Informations de la Crèche

- **Nom :** Mima Elghalia / ميما الغالية
- **Adresse :** 8 Rue Bizerte, Medenine 4100, Tunisie / 8 نهج بنزرت، مدنين 4100، تونس
- **Téléphone :** +216 25 95 35 32
- **Email :** contact@mimaelghalia.tn
- **Horaires :** 
  - Lun-Ven: 7h00-18h00, Sam: 8h00-12h00
  - الإثنين - الجمعة: 7:00 - 18:00، السبت: 8:00 - 12:00

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ 
- npm ou yarn
- MySQL (pour le backend)

### Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/malekaidoudi/creche.git
   cd creche-site
   ```

2. **Frontend (Vite + React)**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   → Site disponible sur http://localhost:5173

3. **Backend (Express + MySQL)**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configurer la base de données
   npm start
   ```
   → API disponible sur http://localhost:3001

## 📁 Structure du Projet

```
creche-site/
├── frontend/          # Application React (Vite)
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages du site
│   │   ├── layouts/       # Layouts principaux
│   │   ├── contexts/      # Contextes React
│   │   ├── hooks/         # Hooks personnalisés
│   │   ├── services/      # Services API
│   │   └── utils/         # Utilitaires
│   └── public/        # Assets statiques
├── backend/           # API Express
│   ├── routes/        # Routes API
│   ├── models/        # Modèles de données
│   ├── config/        # Configuration
│   └── middleware/    # Middlewares
└── Dockerfile         # Déploiement Railway
```

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool moderne
- **Tailwind CSS** - Framework CSS
- **React Router** - Navigation
- **React Hook Form** - Gestion des formulaires
- **Framer Motion** - Animations
- **React Query** - Gestion d'état serveur
- **i18next** - Internationalisation

### Backend
- **Express.js** - Framework Node.js
- **MySQL** - Base de données
- **Multer** - Upload de fichiers
- **CORS** - Gestion des requêtes cross-origin
- **Helmet** - Sécurité
- **Rate Limiting** - Protection contre le spam

## 🌐 Déploiement

### Frontend - GitHub Pages
Le frontend est automatiquement déployé sur GitHub Pages via GitHub Actions.

### Backend - Railway
Le backend est déployé sur Railway avec le Dockerfile inclus.

## 📝 Scripts Disponibles

### Frontend
```bash
npm run dev          # Développement
npm run build        # Build production
npm run preview      # Aperçu du build
npm run lint         # Linting
```

### Backend
```bash
npm start            # Démarrage production
npm run dev          # Développement avec nodemon
```

## 🔑 **Comptes de Test**

### Administrateur
- **Email :** `malekaidoudi@gmail.com`
- **Mot de passe :** `admin123`
- **Accès :** Toutes les fonctionnalités

### Personnel (Staff)
- **Email :** `staff@creche.com`
- **Mot de passe :** `staff123`
- **Accès :** Gestion enfants, présences

### Parent
- **Email :** `parent@creche.com`
- **Mot de passe :** `parent123`
- **Accès :** Espace parent, ses enfants

## 🛠️ **Technologies Utilisées**

### Frontend
- **React 18** : Framework JavaScript moderne
- **Vite** : Build tool rapide
- **TailwindCSS** : Framework CSS utilitaire
- **Framer Motion** : Animations fluides
- **React Router** : Navigation SPA
- **React Hook Form** : Gestion des formulaires
- **Lucide React** : Icônes modernes

### Backend
- **Node.js** : Runtime JavaScript
- **Express.js** : Framework web
- **MySQL** : Base de données relationnelle
- **JWT** : Authentification sécurisée
- **Multer** : Upload de fichiers
- **bcryptjs** : Hachage des mots de passe

## 🚀 **Installation & Démarrage**

### Prérequis
- Node.js 18+
- MySQL 8+
- npm ou yarn

### Installation
```bash
# Cloner le projet
git clone https://github.com/username/creche-site.git
cd creche-site

# Installer les dépendances backend
cd backend
npm install

# Installer les dépendances frontend
cd ../frontend
npm install

# Configuration base de données
# Créer la base de données MySQL
# Importer le schéma depuis backend/database/

# Variables d'environnement
# Copier .env.example vers .env
# Configurer les variables DB et JWT
```

### Démarrage
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Contact

Pour toute question concernant le projet :
- **Email :** contact@mimaelghalia.tn
- **Téléphone :** +216 25 95 35 32

---

**Développé par Aiuoudi Malek pour la crèche Mima Elghalia**
