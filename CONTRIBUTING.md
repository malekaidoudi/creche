# 🤝 Guide de Contribution

Merci de votre intérêt pour contribuer au système de gestion de crèche ! Ce guide vous aidera à contribuer efficacement au projet.

## 📋 Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer](#comment-contribuer)
- [Standards de Développement](#standards-de-développement)
- [Processus de Pull Request](#processus-de-pull-request)
- [Configuration de l'Environnement](#configuration-de-lenvironnement)
- [Tests](#tests)
- [Documentation](#documentation)

## 📜 Code de Conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite :

- **Respectueux** : Traiter tous les contributeurs avec respect
- **Inclusif** : Accueillir les contributions de tous niveaux
- **Constructif** : Donner des retours constructifs et utiles
- **Professionnel** : Maintenir un environnement professionnel

## 🚀 Comment Contribuer

### Types de Contributions

- 🐛 **Corrections de bugs**
- ✨ **Nouvelles fonctionnalités**
- 📚 **Amélioration de la documentation**
- 🎨 **Améliorations UI/UX**
- ⚡ **Optimisations de performance**
- 🔒 **Améliorations de sécurité**
- 🧪 **Ajout de tests**

### Processus de Contribution

1. **Fork** le repository
2. **Créer** une branche pour votre fonctionnalité
3. **Développer** en suivant nos standards
4. **Tester** vos modifications
5. **Commiter** avec des messages clairs
6. **Pousser** vers votre fork
7. **Créer** une Pull Request

## 🛠 Standards de Développement

### Structure des Commits

Utilisez la convention [Conventional Commits](https://www.conventionalcommits.org/) :

```
type(scope): description

[body optionnel]

[footer optionnel]
```

**Types acceptés :**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage, point-virgules manquants, etc.
- `refactor`: Refactoring du code
- `test`: Ajout de tests
- `chore`: Maintenance

**Exemples :**
```
feat(auth): ajouter authentification à deux facteurs
fix(dashboard): corriger l'affichage des statistiques
docs(readme): mettre à jour les instructions d'installation
```

### Standards de Code

#### Backend (Node.js)

```javascript
// ✅ Bon
const getUserById = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    return user;
  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'utilisateur:', error);
    throw error;
  }
};

// ❌ Mauvais
function getUser(id) {
  return User.findById(id);
}
```

**Règles Backend :**
- Utiliser `async/await` au lieu de callbacks
- Gestion d'erreurs explicite avec try/catch
- Validation des entrées avec Joi
- Logs structurés avec des niveaux appropriés
- Tests unitaires pour chaque fonction

#### Frontend (React)

```jsx
// ✅ Bon
const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await api.getUser(userId);
        setUser(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!user) return <NotFound />;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      {/* ... */}
    </div>
  );
};
```

**Règles Frontend :**
- Composants fonctionnels avec hooks
- Props destructurées
- Gestion d'état locale avec useState
- Effets de bord avec useEffect
- Classes TailwindCSS pour le styling
- Tests avec React Testing Library

### Conventions de Nommage

#### Fichiers et Dossiers
```
backend/
├── routes/
│   ├── auth.js          # kebab-case pour les fichiers
│   └── users.js
├── models/
│   ├── User.js          # PascalCase pour les modèles
│   └── Child.js
└── utils/
    ├── validation.js    # camelCase pour les utilitaires
    └── helpers.js

frontend/
├── components/
│   ├── ui/
│   │   ├── Button.jsx   # PascalCase pour les composants
│   │   └── Modal.jsx
│   └── forms/
│       └── LoginForm.jsx
├── pages/
│   ├── HomePage.jsx     # PascalCase pour les pages
│   └── DashboardPage.jsx
└── hooks/
    ├── useAuth.js       # camelCase pour les hooks
    └── useApi.js
```

#### Variables et Fonctions
```javascript
// Variables et fonctions : camelCase
const userName = 'John Doe';
const getUserData = () => {};

// Constantes : SCREAMING_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

// Composants React : PascalCase
const UserProfile = () => {};
const NavigationBar = () => {};
```

## 🔄 Processus de Pull Request

### Checklist Avant Soumission

- [ ] **Code testé** : Tous les tests passent
- [ ] **Linting** : Code formaté avec Prettier et ESLint
- [ ] **Documentation** : Fonctionnalités documentées
- [ ] **Commits** : Messages de commit clairs
- [ ] **Conflits** : Aucun conflit avec la branche main
- [ ] **Performance** : Pas de régression de performance
- [ ] **Sécurité** : Pas de vulnérabilité introduite

### Template de Pull Request

```markdown
## 📝 Description

Brève description des changements apportés.

## 🎯 Type de Changement

- [ ] 🐛 Correction de bug
- [ ] ✨ Nouvelle fonctionnalité
- [ ] 💥 Changement cassant
- [ ] 📚 Documentation
- [ ] 🎨 Amélioration UI/UX
- [ ] ⚡ Performance
- [ ] 🔒 Sécurité

## 🧪 Tests

- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests d'intégration ajoutés/mis à jour
- [ ] Tests manuels effectués

## 📸 Screenshots (si applicable)

Avant | Après
-------|-------
![avant](url) | ![après](url)

## 📋 Checklist

- [ ] Code testé localement
- [ ] Documentation mise à jour
- [ ] Pas de console.log oubliés
- [ ] Variables d'environnement documentées
- [ ] Migrations de DB incluses (si applicable)

## 🔗 Issues Liées

Closes #123
Relates to #456
```

## 🧪 Tests

### Exécution des Tests

```bash
# Tous les tests
npm test

# Tests backend seulement
cd backend && npm test

# Tests frontend seulement
cd frontend && npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

### Écriture de Tests

#### Tests Backend (Jest + Supertest)

```javascript
describe('User API', () => {
  let authToken;

  beforeAll(async () => {
    // Setup test data
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    authToken = response.body.token;
  });

  describe('GET /api/users', () => {
    it('should return users list for authenticated admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });
  });
});
```

#### Tests Frontend (React Testing Library)

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../LoginForm';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('LoginForm', () => {
  it('should submit form with valid credentials', async () => {
    const mockOnSubmit = jest.fn();
    
    renderWithRouter(<LoginForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /connexion/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
```

## 📚 Documentation

### Documentation du Code

```javascript
/**
 * Récupère un utilisateur par son ID
 * @param {number} id - L'ID de l'utilisateur
 * @returns {Promise<Object>} L'utilisateur trouvé
 * @throws {Error} Si l'utilisateur n'existe pas
 */
const getUserById = async (id) => {
  // Implementation
};
```

### Documentation des API

Utilisez JSDoc pour documenter les routes :

```javascript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Récupère un utilisateur par ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *       404:
 *         description: Utilisateur non trouvé
 */
```

## 🆘 Besoin d'Aide ?

- **Issues** : Consultez les issues existantes
- **Discussions** : Utilisez les GitHub Discussions
- **Documentation** : Lisez le README et la documentation
- **Contact** : Contactez les mainteneurs

## 🎉 Reconnaissance

Tous les contributeurs seront ajoutés au fichier CONTRIBUTORS.md et mentionnés dans les releases notes.

Merci de contribuer à améliorer ce projet ! 🚀
