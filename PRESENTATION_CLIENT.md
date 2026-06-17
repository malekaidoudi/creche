# 🏠 Crèche Mima El Ghalia
## Système de Gestion Complète de Crèche

---

# 📋 Table des Matières

1. [Présentation Générale](#1-présentation-générale)
2. [Fonctionnalités Principales](#2-fonctionnalités-principales)
3. [Interfaces Utilisateur](#3-interfaces-utilisateur)
4. [Architecture Technique](#4-architecture-technique)
5. [Sécurité](#5-sécurité)
6. [Déploiement & Hébergement](#6-déploiement--hébergement)
7. [Guide des Screenshots](#7-guide-des-screenshots)

---

# 1. Présentation Générale

## 🎯 Objectif du Projet

**Mima El Ghalia** est une application web moderne de gestion de crèche qui permet de :

- ✅ Gérer les inscriptions des enfants en ligne
- ✅ Suivre la présence quotidienne
- ✅ Communiquer entre parents et staff
- ✅ Gérer les documents administratifs
- ✅ Visualiser les statistiques et rapports

## 🌐 URLs du Projet

| Environnement | URL |
|---------------|-----|
| **Site Web (Production)** | https://mima-elghalia.com |
| **Backend API** | https://[votre-url].onrender.com |
| **Base de données** | PostgreSQL sur Neon.tech |

## 👥 Types d'Utilisateurs

| Rôle | Accès |
|------|-------|
| **Admin** | Accès complet à toutes les fonctionnalités |
| **Staff** | Gestion des enfants et présences |
| **Parent** | Consultation de son espace personnel |

---

# 2. Fonctionnalités Principales

## 📝 Module Inscription

### Inscription Publique (sans compte)
- Formulaire d'inscription en ligne complet
- Upload de documents (carnet de santé, photos, etc.)
- Sélection de créneaux de rendez-vous
- Validation du règlement intérieur obligatoire
- Confirmation par email automatique

### Gestion Admin des Inscriptions
- Liste des demandes en attente
- Validation/Rejet avec motif
- Planification de rendez-vous
- Envoi d'emails personnalisés
- Création automatique du compte parent après validation

---

## 👶 Module Enfants

### Fiche Enfant Complète
- Informations personnelles
- Contacts d'urgence
- Informations médicales (allergies, régime, etc.)
- Documents associés
- Photo de profil

### Gestion des Documents
- Upload multi-fichiers
- Catégorisation (carnet santé, certificats, etc.)
- Visualisation et téléchargement
- Historique des documents

---

## 📊 Module Présence

### Enregistrement Quotidien
- Pointage arrivée/départ
- Vue calendrier mensuel
- Statistiques de présence
- Export des rapports

### Rapport de Présence
- Filtrage par période
- Statistiques par enfant
- Taux de présence global
- Graphiques visuels

---

## 💬 Module Communication

### Messagerie Interne
- Conversations en temps réel
- Échange entre parents et staff
- Notifications de nouveaux messages
- Historique des conversations

### Annonces
- Publication d'annonces générales
- Ciblage par groupe d'utilisateurs
- Pièces jointes supportées

---

## 📅 Module Jours Fériés

### Calendrier des Fermetures
- Jours fériés nationaux tunisiens (automatique)
- Jours fériés religieux islamiques
- Vacances scolaires
- Fermetures exceptionnelles

### Administration
- Activation/désactivation par toggle
- Filtres par type (national, religieux, scolaire)
- Impact automatique sur le calcul de présence

---

## ⚙️ Module Paramètres

### Paramètres de la Crèche
- Informations générales
- Horaires d'ouverture
- Capacité d'accueil
- Logo et images

### Gestion des Utilisateurs
- Création de comptes staff
- Attribution des rôles
- Désactivation de comptes

---

# 3. Interfaces Utilisateur

## 🎨 Design & UX

### Thèmes
- **Mode Clair** : Interface lumineuse et professionnelle
- **Mode Sombre** : Confort visuel en faible luminosité
- Basculement instantané via bouton

### Multilingue
- **Français** : Langue principale
- **Arabe** : Support RTL complet
- Basculement dynamique

### Responsive Design
- **Desktop** : Interface complète avec sidebar
- **Tablette** : Navigation adaptée
- **Mobile** : Interface optimisée tactile

---

## 📱 Pages Principales

### Page d'Accueil Publique
- Présentation de la crèche
- Galerie photos
- Informations de contact
- Bouton d'inscription

### Dashboard Admin
- Statistiques en temps réel
- Actions rapides
- Activités récentes
- Alertes et notifications

### Espace Parent
- Mes enfants
- Suivi de présence
- Messages
- Documents

---

# 4. Architecture Technique

## 🔧 Stack Technologique

### Frontend
| Technologie | Usage |
|-------------|-------|
| **React 18** | Framework UI |
| **Vite** | Build tool ultra-rapide |
| **TailwindCSS** | Styling utilitaire |
| **Framer Motion** | Animations fluides |
| **React Router v6** | Navigation SPA |
| **Axios** | Requêtes HTTP |

### Backend
| Technologie | Usage |
|-------------|-------|
| **Node.js 18** | Runtime JavaScript |
| **Express.js** | Framework API REST |
| **PostgreSQL** | Base de données relationnelle |
| **JWT** | Authentification sécurisée |
| **Nodemailer** | Envoi d'emails |
| **Multer** | Upload de fichiers |
| **Cloudinary** | Stockage images cloud |

### Infrastructure
| Service | Rôle |
|---------|------|
| **Vercel** | Hébergement frontend |
| **Render** | Hébergement backend |
| **Neon** | Base de données PostgreSQL |
| **Cloudinary** | CDN images |
| **UptimeRobot** | Monitoring 24/7 |

---

## 📁 Structure du Projet

```
creche/
├── frontend/                 # Application React
│   ├── src/
│   │   ├── components/       # Composants réutilisables
│   │   ├── pages/            # Pages de l'application
│   │   ├── hooks/            # Hooks personnalisés
│   │   ├── services/         # Services API
│   │   ├── contexts/         # Contextes React
│   │   └── utils/            # Utilitaires
│   ├── public/               # Assets statiques
│   └── package.json
│
├── backend/                  # API Node.js
│   ├── routes/               # Routes API
│   ├── controllers/          # Logique métier
│   ├── middleware/           # Middlewares (auth, etc.)
│   ├── models/               # Modèles de données
│   ├── emails/               # Templates emails
│   ├── config/               # Configuration
│   └── server.js             # Point d'entrée
│
└── README.md
```

---

## 🗄️ Schéma Base de Données

### Tables Principales

```
┌─────────────────┐     ┌─────────────────┐
│     users       │     │    children     │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ email           │     │ first_name      │
│ password_hash   │────>│ last_name       │
│ first_name      │     │ birth_date      │
│ last_name       │     │ parent_id       │
│ role            │     │ status          │
│ phone           │     │ medical_info    │
│ is_active       │     │ created_at      │
└─────────────────┘     └─────────────────┘
         │                      │
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌─────────────────┐
│   enrollments   │     │   attendance    │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ child_name      │     │ child_id        │
│ parent_email    │     │ date            │
│ status          │     │ check_in        │
│ documents       │     │ check_out       │
│ appointment     │     │ status          │
└─────────────────┘     └─────────────────┘
```

### Autres Tables
- `holidays` : Jours fériés et fermetures
- `messages` : Messagerie interne
- `documents` : Documents uploadés
- `nursery_settings` : Paramètres crèche
- `admin_documents` : Documents réglementaires

---

# 5. Sécurité

## 🔐 Authentification

### JWT (JSON Web Tokens)
- Token signé avec secret fort
- Expiration configurable (24h par défaut)
- Refresh token pour sessions longues
- Stockage sécurisé côté client

### Mots de Passe
- Hashage bcrypt (12 rounds)
- Validation de complexité
- Réinitialisation par email sécurisé

---

## 🛡️ Protection des Données

### Validation des Entrées
- Sanitization de toutes les entrées
- Validation avec Joi/Express-validator
- Protection contre injections SQL
- Protection XSS

### Contrôle d'Accès
- Middleware d'authentification sur toutes les routes protégées
- Vérification des rôles (RBAC)
- Un parent ne voit que ses propres enfants

### HTTPS
- Certificat SSL/TLS
- Redirection HTTP → HTTPS automatique
- Headers de sécurité (HSTS, CSP, etc.)

---

## 📧 Emails Sécurisés

### Configuration
- SMTP via Hostinger (port 465, SSL)
- Alternative : API Resend pour délivrabilité optimale
- Templates HTML professionnels

### Types d'Emails
- Confirmation d'inscription
- Validation de compte
- Réinitialisation mot de passe
- Notifications importantes

---

# 6. Déploiement & Hébergement

## 🌐 Architecture de Déploiement

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────>│   Render    │────>│    Neon     │
│  Frontend   │     │   Backend   │     │  PostgreSQL │
│   (React)   │     │  (Node.js)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ Cloudinary  │     │ UptimeRobot │
│   Images    │     │  Monitoring │
└─────────────┘     └─────────────┘
```

## 💰 Coûts d'Hébergement

| Service | Plan | Coût Mensuel |
|---------|------|--------------|
| Vercel | Hobby | **Gratuit** |
| Render | Free | **Gratuit** |
| Neon | Free | **Gratuit** |
| Cloudinary | Free | **Gratuit** |
| UptimeRobot | Free | **Gratuit** |
| **TOTAL** | | **0 TND/mois** |

---

## 📊 Monitoring & Uptime

### UptimeRobot
- Ping toutes les 5 minutes
- Alerte email si panne
- Historique de disponibilité
- Page de statut publique

### Logs
- Console Render pour backend
- Vercel Analytics pour frontend
- Erreurs trackées et alertées

---

# 7. Guide des Screenshots

## 📸 Screenshots à Capturer pour l'Exposé

### 1. Page d'Accueil
**URL** : `https://mima-elghalia.com`
- [ ] Vue desktop complète
- [ ] Section hero avec logo
- [ ] Galerie photos
- [ ] Footer avec contacts

### 2. Page d'Inscription
**URL** : `https://mima-elghalia.com/inscription`
- [ ] Formulaire vide
- [ ] Formulaire rempli avec validation
- [ ] Upload de documents
- [ ] Sélection rendez-vous

### 3. Page de Connexion
**URL** : `https://mima-elghalia.com/login`
- [ ] Formulaire de connexion
- [ ] Mode sombre

### 4. Dashboard Admin
**URL** : `https://mima-elghalia.com/dashboard`
- [ ] Vue d'ensemble avec statistiques
- [ ] Graphiques de présence
- [ ] Actions rapides
- [ ] Activités récentes

### 5. Gestion des Inscriptions
**URL** : `https://mima-elghalia.com/dashboard/pending-enrollments`
- [ ] Liste des demandes en attente
- [ ] Détail d'une demande
- [ ] Modal de validation/rejet

### 6. Gestion des Enfants
**URL** : `https://mima-elghalia.com/dashboard/children`
- [ ] Liste des enfants
- [ ] Fiche détaillée d'un enfant
- [ ] Section documents

### 7. Rapport de Présence
**URL** : `https://mima-elghalia.com/dashboard/attendance-report`
- [ ] Calendrier mensuel
- [ ] Statistiques
- [ ] Filtres par enfant

### 8. Messagerie
**URL** : `https://mima-elghalia.com/dashboard/messages`
- [ ] Liste des conversations
- [ ] Conversation ouverte
- [ ] Envoi de message

### 9. Paramètres Jours Fériés
**URL** : `https://mima-elghalia.com/dashboard/holidays-settings`
- [ ] Liste avec toggles
- [ ] Filtres par type
- [ ] Mode sombre

### 10. Espace Parent
**URL** : `https://mima-elghalia.com/mon-espace`
- [ ] Vue enfants du parent
- [ ] Suivi de présence
- [ ] Mode mobile

### 11. Page de Maintenance
**URL** : `https://mima-elghalia.com/maintenance.html`
- [ ] Version française
- [ ] Version arabe

---

## 🎬 Démo Vidéo Suggérée

### Scénario de Démonstration (5-10 min)

1. **Introduction** (30s)
   - Présenter le site web
   - Expliquer l'objectif

2. **Inscription Parent** (2 min)
   - Remplir le formulaire
   - Uploader documents
   - Choisir rendez-vous
   - Recevoir confirmation

3. **Validation Admin** (2 min)
   - Connexion admin
   - Voir la demande
   - Valider avec rendez-vous
   - Email envoyé au parent

4. **Gestion Quotidienne** (2 min)
   - Pointer une arrivée
   - Voir le rapport
   - Envoyer un message

5. **Fonctionnalités Avancées** (2 min)
   - Jours fériés
   - Thème sombre
   - Version arabe

6. **Conclusion** (30s)
   - Résumé des avantages
   - Questions

---

# 📞 Contact & Support

| Information | Détail |
|-------------|--------|
| **Développeur** | Malek Aidoudi |
| **Email** | malekaidoudi@gmail.com |
| **Site** | https://mima-elghalia.com |

---

# ✅ Résumé des Points Forts

| Caractéristique | Avantage |
|-----------------|----------|
| 🚀 **Performance** | Chargement rapide (< 2s) |
| 📱 **Responsive** | Fonctionne sur tous les appareils |
| 🌙 **Thème Sombre** | Confort visuel |
| 🌍 **Bilingue** | Français + Arabe (RTL) |
| 🔐 **Sécurisé** | JWT + HTTPS + Validation |
| 💰 **Économique** | Hébergement 100% gratuit |
| 📊 **Complet** | Inscription → Présence → Communication |
| 🔄 **Automatisé** | Emails, calculs, rappels |

---

*Document généré le 17 Juin 2025*
*Version 1.0.0*
