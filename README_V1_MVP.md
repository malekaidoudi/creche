# 🏫 Système de Gestion de Crèche Mima Elghalia - Version 1 (MVP)

## 📋 Vue d'ensemble

Le **Système de Gestion de Crèche Mima Elghalia V1** est un MVP (Minimum Viable Product) complet qui couvre les fonctionnalités essentielles pour la gestion quotidienne d'une crèche. Cette version est prête pour un déploiement en production et l'utilisation par de vrais clients.

## ✨ Fonctionnalités implémentées

### 🔐 Authentification multi-rôles
- **3 rôles utilisateurs** : Admin, Staff, Parent
- **Système JWT** sécurisé avec expiration automatique
- **Comptes de démonstration** pré-configurés
- **Interface de connexion** bilingue (FR/AR)

### 👶 Gestion des enfants (CRUD complet)
- **Création d'enfants** avec informations complètes
- **Modification** des données enfants
- **Suppression** avec confirmation
- **Consultation** des fiches détaillées
- **Informations médicales** et contacts d'urgence
- **Photos de profil** (upload supporté)

### ⏰ Système de présences
- **Check-in/Check-out** en temps réel
- **Historique des présences** par enfant
- **Vue calendaire** des présences
- **Statistiques de fréquentation**
- **Interface tactile** optimisée pour tablettes

### 📝 Inscriptions
- **Formulaire public** multi-étapes pour les parents
- **Validation manuelle** par l'administration
- **Gestion des statuts** (en attente, approuvé, refusé)
- **Informations complètes** enfant + parent
- **Règlement intérieur** intégré

### 📊 Tableaux de bord par rôle

#### Admin Dashboard
- **Statistiques globales** : nombre d'enfants, présences du jour
- **Inscriptions en attente** à traiter
- **Taux de fréquentation** en temps réel
- **Accès à toutes les fonctionnalités**

#### Staff Dashboard  
- **Gestion quotidienne** des enfants
- **Présences du jour** avec actions rapides
- **Statistiques de présence**
- **Interface simplifiée** pour les tâches courantes

#### Parent Dashboard
- **Vue de ses enfants uniquement**
- **Statut de présence** en temps réel
- **Historique de fréquentation**
- **Informations médicales** importantes
- **Lien vers inscription** si aucun enfant

### 🌍 Interface bilingue
- **Français** (langue principale)
- **Arabe** avec support RTL complet
- **Commutation dynamique** sans rechargement
- **Traductions complètes** de l'interface

## 🚀 Installation et lancement

### Prérequis
- **Node.js** 18+ 
- **MySQL** 8.0+
- **npm** ou **yarn**

### Installation Backend

```bash
# Cloner le projet
git clone https://github.com/malekaidoudi/creche-site.git
cd creche-site

# Installer les dépendances backend
cd backend
npm install

# Configuration de la base de données
cp .env.example .env
# Éditer .env avec vos paramètres MySQL

# Initialiser la base de données
npm run init-db

# Lancer le serveur backend
npm run dev
```

Le backend sera accessible sur `http://localhost:3000`

### Installation Frontend

```bash
# Installer les dépendances frontend
cd ../frontend
npm install

# Lancer le serveur de développement
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173`

### Build de production

```bash
# Frontend
cd frontend
npm run build

# Backend
cd ../backend
npm run build
```

## 🔑 Comptes de démonstration

### Administrateur
- **Email :** admin@mimaelghalia.tn
- **Mot de passe :** admin123
- **Accès :** Toutes les fonctionnalités

### Personnel (Staff)
- **Email :** staff@mimaelghalia.tn  
- **Mot de passe :** staff123
- **Accès :** Gestion enfants et présences

### Parent
- **Email :** parent@mimaelghalia.tn
- **Mot de passe :** parent123
- **Accès :** Vue de ses enfants uniquement

## 📁 Structure du projet

```
creche-site/
├── frontend/                 # Application React
│   ├── src/
│   │   ├── components/      # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   │   ├── auth/       # Authentification
│   │   │   ├── dashboard/  # Tableaux de bord
│   │   │   ├── parent/     # Interface parent
│   │   │   └── public/     # Pages publiques
│   │   ├── services/       # Services API
│   │   ├── hooks/          # Hooks React personnalisés
│   │   ├── contexts/       # Contextes React
│   │   ├── i18n/          # Internationalisation
│   │   └── utils/         # Utilitaires
│   └── public/            # Assets statiques
├── backend/               # API Node.js
│   ├── routes/           # Routes API
│   ├── models/           # Modèles de données
│   ├── middleware/       # Middlewares Express
│   ├── config/          # Configuration
│   └── scripts/         # Scripts utilitaires
└── database/            # Schémas et migrations
```

## 🔧 Configuration

### Variables d'environnement Backend (.env)
```env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=creche_app

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Serveur
PORT=3000
NODE_ENV=development
```

### Variables d'environnement Frontend (.env)
```env
# API Backend
VITE_API_URL=http://localhost:3000/api

# Mode
VITE_MODE=development
```

## 🌐 Déploiement

### Frontend (GitHub Pages)
```bash
cd frontend
npm run deploy
```

### Backend (Heroku/VPS)
```bash
# Exemple pour Heroku
heroku create your-app-name
git push heroku main
```

## 🧪 Tests

### Frontend
```bash
cd frontend
npm test
```

### Backend  
```bash
cd backend
npm test
```

## 📱 Utilisation

### Pour les administrateurs
1. Se connecter avec le compte admin
2. Accéder au dashboard pour voir les statistiques
3. Gérer les enfants via "Enfants"
4. Traiter les inscriptions via "Inscriptions"
5. Suivre les présences via "Présences"

### Pour le personnel
1. Se connecter avec le compte staff
2. Gérer les présences quotidiennes
3. Consulter les informations des enfants
4. Effectuer les check-in/check-out

### Pour les parents
1. S'inscrire ou se connecter
2. Voir le statut de ses enfants
3. Consulter l'historique de présence
4. Inscrire de nouveaux enfants

## 🔒 Sécurité

- **Authentification JWT** avec expiration
- **Validation des données** côté client et serveur
- **Protection CORS** configurée
- **Hachage des mots de passe** avec bcrypt
- **Permissions par rôle** strictement appliquées

## 🐛 Dépannage

### Problèmes courants

**Erreur de connexion à la base de données**
```bash
# Vérifier que MySQL est démarré
sudo service mysql start

# Vérifier les paramètres dans .env
```

**Erreur CORS**
```bash
# Vérifier que VITE_API_URL pointe vers le bon serveur
# Vérifier la configuration CORS dans backend/server.js
```

**Problème de build**
```bash
# Nettoyer les dépendances
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

Pour toute question ou problème :
- **Email :** support@mimaelghalia.tn
- **Documentation :** Voir les fichiers dans `/docs`
- **Issues :** GitHub Issues du projet

## 🔄 Prochaines versions

La **Version 2** inclura :
- Messagerie en temps réel
- Galerie photos avancée
- Rapports financiers
- Application mobile
- Notifications push
- Intégrations tierces

---

**🎉 Le MVP Version 1 est prêt pour la production !**
