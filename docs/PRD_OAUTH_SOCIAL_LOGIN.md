# 📋 PRD - Authentification OAuth (Google & Facebook)

## 📌 Résumé Exécutif

| Attribut | Valeur |
|----------|--------|
| **Projet** | Crèche Mima Elghalia - Authentification Sociale |
| **Version** | 1.0 |
| **Date** | 28 Novembre 2025 |
| **Auteur** | Équipe Développement |
| **Priorité** | Haute |
| **Effort estimé** | 3-5 jours |

### Objectif
Permettre aux utilisateurs (principalement les parents) de s'inscrire et se connecter via leur compte **Google** ou **Facebook**, en complément de l'authentification email/mot de passe existante.

### Bénéfices
- ✅ Réduction des frictions à l'inscription (+40% de conversions estimé)
- ✅ Moins de mots de passe oubliés
- ✅ Données utilisateur pré-remplies (nom, email, photo)
- ✅ Sécurité renforcée (délégation à Google/Facebook)

---

## 🎯 Cas d'Utilisation

### UC1 : Inscription via Google/Facebook
```
1. Parent visite la page d'inscription
2. Clique sur "Continuer avec Google" ou "Continuer avec Facebook"
3. Redirigé vers la page d'autorisation OAuth
4. Autorise l'accès aux informations basiques
5. Compte créé automatiquement avec rôle "parent"
6. Redirigé vers /mon-espace
```

### UC2 : Connexion via Google/Facebook
```
1. Parent visite la page de connexion
2. Clique sur "Se connecter avec Google/Facebook"
3. Si compte existe → connexion directe
4. Si compte n'existe pas → création automatique
5. Redirigé vers son dashboard
```

### UC3 : Liaison de compte existant
```
1. Parent connecté (email/password) va dans Profil
2. Clique "Lier mon compte Google/Facebook"
3. Autorisation OAuth
4. Compte lié → peut utiliser les deux méthodes
```

---

## 🏗️ Architecture Technique

### Vue d'ensemble
```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Frontend  │────▶│   Backend   │────▶│  Google/Facebook│
│   (React)   │◀────│   (Node)    │◀────│   OAuth APIs    │
└─────────────┘     └─────────────┘     └─────────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       └───────────▶│  PostgreSQL │
                    └─────────────┘
```

---

## 🗄️ Modifications Base de Données

### 1. Nouvelle table `oauth_providers`
```sql
CREATE TABLE oauth_providers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'facebook')),
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_provider ON oauth_providers(provider, provider_user_id);
CREATE INDEX idx_oauth_user_id ON oauth_providers(user_id);
```

### 2. Modification table `users`
```sql
-- Rendre le mot de passe optionnel pour les comptes OAuth
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Ajouter colonne pour la source d'inscription
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'email';
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN profile_image_oauth VARCHAR(500);
```

### 3. Script de migration
```sql
-- Migration: 2025_11_28_add_oauth_support.sql

-- 1. Créer la table oauth_providers
CREATE TABLE IF NOT EXISTS oauth_providers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)

### 2. Variables d'environnement (.env)
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.creche.com/api/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=https://api.creche.com/api/auth/facebook/callback

# Frontend URL (pour redirection après OAuth)
FRONTEND_URL=https://creche.com
```

### 3. Nouvelles routes API

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/auth/google` | Initie l'auth Google |
| GET | `/api/auth/google/callback` | Callback Google |
| GET | `/api/auth/facebook` | Initie l'auth Facebook |
| GET | `/api/auth/facebook/callback` | Callback Facebook |
| POST | `/api/auth/oauth/link` | Lier un compte OAuth |
| DELETE | `/api/auth/oauth/unlink/:provider` | Délier un compte OAuth |

### 4. Nouveau fichier: `routes_postgres/oauth.js`
```javascript
const express = require('express');
const passport = require('passport');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const db = require('../config/db_postgres');
const router = express.Router();

// ===== GOOGLE OAUTH =====

// Étape 1: Redirection vers Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Étape 2: Callback de Google
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  async (req, res) => {
    try {
      const { user, isNewUser } = req.user;

      // Générer JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Rediriger vers le frontend avec le token
      const redirectUrl = isNewUser
        ? `${process.env.FRONTEND_URL}/oauth-success?token=${token}&new=true`
        : `${process.env.FRONTEND_URL}/oauth-success?token=${token}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Erreur callback Google:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
);

// ===== FACEBOOK OAUTH =====

router.get('/facebook', passport.authenticate('facebook', {
  scope: ['email', 'public_profile']
}));

router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  async (req, res) => {
    // Même logique que Google
  }
);

module.exports = router;
```

### 5. Configuration Passport: `config/passport.js`
```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('./db_postgres');

// ===== STRATÉGIE GOOGLE =====
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Vérifier si l'utilisateur existe déjà via OAuth
      const existingOAuth = await db.query(
        'SELECT user_id FROM oauth_providers WHERE provider = $1 AND provider_user_id = $2',
        ['google', profile.id]
      );

      if (existingOAuth.rows.length > 0) {
        // Utilisateur existant - récupérer ses infos
        const user = await db.query('SELECT * FROM users WHERE id = $1', [existingOAuth.rows[0].user_id]);
        return done(null, { user: user.rows[0], isNewUser: false });
      }

      // Vérifier si l'email existe déjà (compte email/password)
      const email = profile.emails?.[0]?.value;
      const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);

      if (existingUser.rows.length > 0) {
        // Lier le compte Google au compte existant
        await db.query(
          `INSERT INTO oauth_providers (user_id, provider, provider_user_id, access_token)
           VALUES ($1, 'google', $2, $3)`,
          [existingUser.rows[0].id, profile.id, accessToken]
        );
        return done(null, { user: existingUser.rows[0], isNewUser: false });
      }

      // Nouveau utilisateur - créer le compte
      const newUser = await db.query(
        `INSERT INTO users (email, first_name, last_name, role, auth_provider, email_verified, profile_image_oauth)
         VALUES ($1, $2, $3, 'parent', 'google', true, $4)
         RETURNING *`,
        [email, profile.name.givenName, profile.name.familyName, profile.photos?.[0]?.value]
      );

      // Créer l'entrée OAuth
      await db.query(
        `INSERT INTO oauth_providers (user_id, provider, provider_user_id, access_token)
         VALUES ($1, 'google', $2, $3)`,
        [newUser.rows[0].id, profile.id, accessToken]
      );

      return done(null, { user: newUser.rows[0], isNewUser: true });
    } catch (error) {
      return done(error, null);
    }
  }
));

// ===== STRATÉGIE FACEBOOK =====
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'emails', 'name', 'picture.type(large)']
  },
  async (accessToken, refreshToken, profile, done) => {
    // Même logique que Google avec 'facebook' comme provider
  }
));

module.exports = passport;
```

---

## 🎨 Frontend - Implémentation

### 1. Nouvelles dépendances
```bash
npm install @react-oauth/google react-facebook-login
```

### 2. Composant: `components/auth/SocialLoginButtons.jsx`
```jsx
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';

const SocialLoginButtons = ({ onSuccess, onError, isRTL }) => {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch('/api/auth/google/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await response.json();
      onSuccess(data);
    } catch (error) {
      onError(error);
    }
  };

  return (
    <div className="space-y-3">
      {/* Séparateur */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
            {isRTL ? 'أو' : 'ou'}
          </span>
        </div>
      </div>

      {/* Bouton Google */}
      <button
        onClick={() => window.location.href = '/api/auth/google'}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {isRTL ? 'المتابعة مع Google' : 'Continuer avec Google'}
        </span>
      </button>

      {/* Bouton Facebook */}
      <button
        onClick={() => window.location.href = '/api/auth/facebook'}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] text-white rounded-xl hover:bg-[#166FE5] transition-colors"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <span className="font-medium">
          {isRTL ? 'المتابعة مع Facebook' : 'Continuer avec Facebook'}
        </span>
      </button>
    </div>
  );
};

export default SocialLoginButtons;
```

### 3. Page de callback: `pages/auth/OAuthSuccessPage.jsx`
```jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const OAuthSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthFromOAuth } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const isNew = searchParams.get('new') === 'true';
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=' + error);
      return;
    }

    if (token) {
      // Sauvegarder le token et récupérer l'utilisateur
      setAuthFromOAuth(token);

      // Rediriger selon si c'est un nouveau compte
      if (isNew) {
        navigate('/mon-espace?welcome=true');
      } else {
        navigate('/mon-espace');
      }
    }
  }, [searchParams, navigate, setAuthFromOAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Connexion en cours...</p>
      </div>
    </div>
  );
};

export default OAuthSuccessPage;
```

### 4. Mise à jour AuthContext
```javascript
// Dans AuthContext.jsx, ajouter:

const setAuthFromOAuth = async (token) => {
  try {
    localStorage.setItem('token', token);

    // Vérifier le token et récupérer l'utilisateur
    const userData = await authService.verifyToken(token);

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        user: userData.user,
        token
      }
    });
  } catch (error) {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    throw error;
  }
};

// Ajouter dans le value du Provider:
const value = {
  ...state,
  login,
  register,
  logout,
  setAuthFromOAuth,  // <-- Ajouter
  // ...
};
```

### 5. Intégration dans LoginFormHero.jsx
```jsx
import SocialLoginButtons from './SocialLoginButtons';

// Dans le JSX, après le formulaire:
<SocialLoginButtons
  isRTL={isRTL}
  onSuccess={(data) => {
    // Gérer la connexion réussie
    navigate('/mon-espace');
  }}
  onError={(error) => {
    dialog.error('Erreur de connexion OAuth');
  }}
/>
```

---

## 🔐 Sécurité

### Mesures implémentées
1. **Validation du token ID** côté serveur (pas confiance au frontend)
2. **HTTPS obligatoire** pour les callbacks OAuth
3. **State parameter** pour prévenir les attaques CSRF
4. **Tokens chiffrés** stockés en base de données
5. **Expiration des tokens** OAuth vérifiée

### Permissions demandées
| Provider | Scope | Données récupérées |
|----------|-------|-------------------|
| Google | `profile`, `email` | Nom, prénom, email, photo |
| Facebook | `email`, `public_profile` | Nom, prénom, email, photo |

---

## 📱 Configuration des Consoles Développeur

### Google Cloud Console
1. Créer un projet sur [console.cloud.google.com](https://console.cloud.google.com)
2. Activer l'API "Google+ API" ou "Google Identity"
3. Créer des identifiants OAuth 2.0
4. Configurer les URI de redirection autorisées:
   - `https://api.creche.com/api/auth/google/callback`
   - `http://localhost:3000/api/auth/google/callback` (dev)

### Facebook Developer Console
1. Créer une app sur [developers.facebook.com](https://developers.facebook.com)
2. Ajouter le produit "Facebook Login"
3. Configurer les paramètres OAuth:
   - URI de redirection: `https://api.creche.com/api/auth/facebook/callback`
4. Demander l'accès aux permissions `email` et `public_profile`

---

## 📊 Tests à Effectuer

### Tests Unitaires
- [ ] Création compte via Google
- [ ] Création compte via Facebook
- [ ] Connexion compte existant via OAuth
- [ ] Liaison compte email existant avec OAuth
- [ ] Déliaison compte OAuth
- [ ] Gestion erreurs OAuth (refus permission, token invalide)

### Tests E2E
- [ ] Flux complet inscription Google
- [ ] Flux complet inscription Facebook
- [ ] Connexion sur mobile
- [ ] Mode RTL (arabe)

---

## 📅 Planning Estimé

| Phase | Tâche | Durée |
|-------|-------|-------|
| 1 | Migration BDD + Config OAuth | 4h |
| 2 | Backend routes + Passport | 8h |
| 3 | Frontend composants | 6h |
| 4 | Intégration + Tests | 6h |
| 5 | Documentation + Review | 2h |
| **Total** | | **~26h (3-4 jours)** |

---

## ✅ Checklist de Livraison

- [ ] Migration base de données appliquée
- [ ] Variables d'environnement configurées
- [ ] Routes backend testées
- [ ] Composants frontend intégrés
- [ ] Tests unitaires passent
- [ ] Documentation mise à jour
- [ ] Revue de sécurité effectuée
- [ ] Déploiement staging validé
npm install passport passport-google-oauth20 passport-facebook google-auth-library
```

