# 🏥 Système de Paramètres Dynamiques - Crèche

## 📋 Vue d'ensemble

Le système de paramètres dynamiques permet de gérer tous les aspects configurables de la crèche depuis une interface d'administration centralisée. Les paramètres sont stockés en base de données et appliqués automatiquement sur le site public.

## 🗄️ Structure de la Base de Données

### Table `creche_settings`

```sql
CREATE TABLE creche_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json', 'image') DEFAULT 'string',
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 📂 Catégories de Paramètres

### 🏢 **Général** (`general`)
- `nursery_name` - Nom de la crèche
- `nursery_logo` - Logo de la crèche (image)
- `director_name` - Nom de la directrice

### 📞 **Contact** (`contact`)
- `nursery_address` - Adresse complète
- `nursery_phone` - Numéro de téléphone
- `nursery_email` - Email de contact
- `nursery_website` - Site web

### 👥 **Capacité** (`capacity`)
- `total_capacity` - Nombre total de places (number)
- `available_spots` - Places disponibles (number)
- `min_age_months` - Âge minimum en mois (number)
- `max_age_months` - Âge maximum en mois (number)

### ⏰ **Horaires** (`schedule`)
- `opening_hours` - Horaires d'ouverture par jour (json)
- `closure_periods` - Périodes de fermeture (json)

### 📝 **Contenu** (`content`)
- `welcome_message_fr` - Message d'accueil français
- `welcome_message_ar` - Message d'accueil arabe
- `about_description_fr` - Description à propos français
- `about_description_ar` - Description à propos arabe

### 🎨 **Apparence** (`appearance`)
- `site_theme` - Thème du site (light/dark/auto)
- `primary_color` - Couleur primaire (#hex)
- `secondary_color` - Couleur secondaire (#hex)
- `accent_color` - Couleur d'accent (#hex)

### 🔧 **Système** (`system`)
- `enrollment_enabled` - Inscription en ligne activée (boolean)
- `maintenance_mode` - Mode maintenance (boolean)
- `google_analytics_id` - ID Google Analytics

## 🚀 Installation et Configuration

### 1. Initialisation de la Base de Données

```bash
# Depuis le dossier backend
npm run settings:init
```

### 2. Gestion des Paramètres

```bash
# Lister tous les paramètres
npm run settings:list

# Mettre à jour un paramètre
npm run settings:update nursery_name "Ma Nouvelle Crèche"
npm run settings:update total_capacity 50 number
npm run settings:update site_theme dark
```

## 🔌 API Endpoints

### Paramètres Publics
```http
GET /api/settings/public
```
Retourne tous les paramètres publics (is_public = true)

### Administration (Authentification requise)
```http
GET /api/settings                    # Tous les paramètres
GET /api/settings/categories         # Liste des catégories
GET /api/settings/category/:category # Paramètres par catégorie
PUT /api/settings/:key              # Mettre à jour un paramètre
PUT /api/settings                   # Mettre à jour plusieurs paramètres
POST /api/settings                  # Créer un paramètre
DELETE /api/settings/:key           # Supprimer un paramètre
POST /api/settings/upload/:key      # Upload d'image
```

## 🎯 Utilisation Frontend

### Context Provider

```jsx
import { SettingsProvider, useSettings } from './contexts/SettingsContext';

// Dans App.jsx
<SettingsProvider>
  <App />
</SettingsProvider>
```

### Hooks Disponibles

```jsx
const {
  settings,           // Tous les paramètres
  loading,           // État de chargement
  error,             // Erreurs éventuelles
  getSetting,        // Obtenir un paramètre spécifique
  getNurseryInfo,    // Informations de base
  getCapacityInfo,   // Informations de capacité
  getWelcomeMessages,// Messages de bienvenue
  getThemeInfo,      // Informations de thème
  getOpeningHours,   // Horaires d'ouverture
  refreshSettings    // Rafraîchir les paramètres
} = useSettings();
```

### Exemples d'Utilisation

```jsx
// Afficher le nom de la crèche
const nurseryInfo = getNurseryInfo();
<h1>{nurseryInfo.name}</h1>

// Afficher la capacité
const capacity = getCapacityInfo();
<p>{capacity.available} places disponibles sur {capacity.total}</p>

// Messages de bienvenue multilingues
const messages = getWelcomeMessages();
<p>{isRTL ? messages.ar : messages.fr}</p>

// Thème dynamique
const theme = getThemeInfo();
// Le thème est appliqué automatiquement via CSS
```

## 🎨 Interface d'Administration

### Page de Paramètres (`/admin/settings`)

L'interface d'administration permet de :

- **Visualiser** tous les paramètres par catégorie
- **Modifier** les valeurs en temps réel
- **Uploader** des images (logos, etc.)
- **Basculer** entre paramètres publics/privés
- **Sauvegarder** les modifications

### Fonctionnalités

- ✅ Interface par onglets (catégories)
- ✅ Validation des types de données
- ✅ Upload d'images avec prévisualisation
- ✅ Sauvegarde en lot
- ✅ Feedback utilisateur (toast notifications)
- ✅ Support RTL complet

## 🔒 Sécurité

### Permissions
- **Paramètres publics** : Accessibles à tous
- **Paramètres privés** : Admin seulement
- **Modification** : Admin seulement
- **Upload d'images** : Admin seulement

### Validation
- Types de données validés côté serveur
- Taille des fichiers limitée (5MB)
- Extensions d'images autorisées seulement
- Protection contre l'injection SQL

## 🎯 Thème Dynamique

Le système applique automatiquement :

### Classes CSS
```css
:root {
  --color-primary: #3B82F6;    /* Depuis primary_color */
  --color-secondary: #8B5CF6;  /* Depuis secondary_color */
  --color-accent: #F59E0B;     /* Depuis accent_color */
}
```

### Thème Sombre/Clair
- **light** : Force le thème clair
- **dark** : Force le thème sombre  
- **auto** : Suit la préférence système

## 📱 Responsive Design

L'interface s'adapte automatiquement :
- **Mobile** : Navigation par onglets verticaux
- **Tablet** : Interface hybride
- **Desktop** : Sidebar + contenu principal

## 🔄 Synchronisation

### Temps Réel
- Les modifications sont appliquées immédiatement
- Le contexte se met à jour automatiquement
- Les composants se re-rendent avec les nouvelles valeurs

### Cache
- Paramètres publics mis en cache côté client
- Rafraîchissement automatique après modification
- Fallback sur valeurs par défaut en cas d'erreur

## 🚀 Déploiement

### Variables d'Environnement
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=creche_db
```

### Scripts de Déploiement
```bash
# Initialiser en production
NODE_ENV=production npm run settings:init

# Configurer les paramètres de base
npm run settings:update nursery_name "Votre Crèche"
npm run settings:update nursery_email "contact@votrecreche.com"
npm run settings:update primary_color "#your-color"
```

## 🎉 Fonctionnalités Avancées

### 🌐 Multilingue
- Messages en français et arabe
- Support RTL automatique
- Interface d'admin multilingue

### 🎨 Personnalisation
- 3 couleurs personnalisables
- Logo uploadable
- Thèmes prédéfinis

### 📊 Analytics
- Intégration Google Analytics
- Suivi des modifications
- Logs d'administration

---

**✨ Le système de paramètres dynamiques rend votre site de crèche entièrement personnalisable sans modification de code !**
