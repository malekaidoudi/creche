# Audit de Sécurité et Vulnérabilités Identifiées

> [!WARNING]
> L'analyse approfondie du code source a mis en évidence plusieurs **vulnérabilités critiques**. 
> Il est impératif de corriger ces failles avant toute mise en ligne publique de l'application.

---

## Synthèse des Risques de Sécurité

| Réf | Problème | Localisation | Impact | Statut |
|---|---|---|---|:---:|
| **SEC-01** | Changement de mot de passe arbitraire sans authentification | `backend/routes_postgres/users.js` (`PUT /:id/password`) | Prise de contrôle totale de n'importe quel compte utilisateur | ✅ **Corrigé** (Correction n°06) |
| **SEC-02** | Modification et suppression d'utilisateurs sans authentification | `backend/routes_postgres/users.js` (`PUT /:id`, `DELETE /:id`) | Altération ou destruction non autorisée de comptes | ✅ **Corrigé** (Correction n°06) |
| **SEC-03** | Élévation de privilèges lors de l'enregistrement de compte | `backend/routes_postgres/auth.js` (`POST /register`) | Auto-attribution du rôle `admin` dans le corps JSON | ✅ **Corrigé** (Correction n°07) |
| **SEC-04** | Création publique d'un compte administrateur | `backend/routes_postgres/setup.js` (`POST /create-admin`) | Création non sollicitée d'un super-administrateur | ✅ **Corrigé** (Correction n°07) |
| **SEC-05** | Exposition de secrets et clés privées dans Git | `.env`, `.env.production`, `backend/.env`, etc. | Fuite des identifiants PostgreSQL, Cloudinary, etc. | ✅ **Corrigé** (Correction n°09) |
| **SEC-06** | Modification sans authentification des paramètres de la crèche | `backend/routes_postgres/nurserySettings.js` | Altération des horaires, des vacances et des textes du site | ✅ **Corrigé** (Correction n°08) |
| **SEC-07** | Consultation et manipulation des inscriptions sans authentification | `backend/routes_postgres/enrollments.js` | Fuite de données personnelles de familles (RGPD) | ✅ **Corrigé** (Correction n°12) |
| **SEC-08** | Données médicales et pièces d'identité sensibles suivies dans Git | `backend/uploads/documents/` (~36 PDFs réels) | Violation de la confidentialité de santé d'enfants | ✅ **Corrigé** (Correction n°09) |
| **SEC-09** | Risque de traversée de répertoire (Path Traversal) | `backup.js`, `recovery.js`, `children.js` | Lecture / suppression arbitraire de fichiers hors dossier | ✅ **Corrigé** (Correction n°13) |
| **SEC-10** | Procédure de restauration de base de données non transactionnelle | `backup.js` & `recovery.js` | Perte définitive de données en cas d'erreur (`TRUNCATE`) | ✅ **Corrigé** (Correction n°14) |
| **SEC-11** | Émission de jetons JWT avec clé par défaut non synchronisée | `backend/routes_postgres/auth.js` vs `middleware/auth.js` | Rejet de jetons ou signature avec une clé prédictible | ✅ **Corrigé** (Correction n°09) |
| **SEC-12** | Dépendance vis-à-vis d'un stockage de fichiers local éphémère | `backend/uploads/` sur hébergeur Cloud | Perte de pièces jointes au redémarrage conteneur | ✅ **Géré** (Cloudinary actif) |

---

## Analyse Détaillée des Vulnérabilités Principales

### 1. SEC-01 : Réinitialisation forcée de mot de passe (`PUT /api/users/:id/password`)
- **Code source** :
  ```javascript
  // backend/routes_postgres/users.js - Ligne 538
  router.put('/:id/password', [
    body('newPassword').isLength({ min: 6 })
  ], async (req, res) => {
    // AUCUN middleware authenticateToken n'est appliqué !
    const { id } = req.params;
    const { newPassword } = req.body;
    // Le mot de passe de l'utilisateur 'id' est hashé et mis à jour immédiatement en base
  ```
- **Exploitation** : Une simple requête `PUT /api/users/1/password` avec `{ "newPassword": "nouveau_pass" }` écrase le mot de passe du compte administrateur n°1 sans nécessiter la moindre connexion.
- **Correction** : Ajouter immédiatement `auth.authenticateToken` et vérifier que l'utilisateur est soit administrateur, soit modifie son propre mot de passe en fournissant l'ancien mot de passe (`currentPassword`).

---

### 2. SEC-03 : Auto-attribution de rôle dans l'enregistrement (`POST /api/auth/register`)
- **Code source** :
  ```javascript
  // backend/routes_postgres/auth.js - Ligne 102
  const { email, password, first_name, last_name, phone, role = 'parent' } = req.body;
  // L'insertion SQL utilise directement 'role' sans filtrer les rôles 'admin' ou 'staff'
  ```
- **Exploitation** : Un attaquant envoie `{ "email": "hacker@test.com", "password": "...", "role": "admin" }` et obtient immédiatement un compte administrateur complet.
- **Correction** : Forcer systématiquement `role = 'parent'` pour les inscriptions publiques.

---

### 3. SEC-04 : Endpoint de configuration non verrouillé (`/api/setup/create-admin`)
- **Code source** : Le fichier `backend/routes_postgres/setup.js` permet d'invoquer `POST /api/setup/create-admin` sans authentification pour créer un compte administrateur.
- **Correction** : Supprimer cette route ou la conditionner à une variable d'environnement temporaire `ALLOW_INITIAL_SETUP=true`, désactivée en production.

---

### 4. SEC-05 & SEC-08 : Fichiers sensibles suivis par Git
- **Constat** :
  - Les fichiers `.env`, `.env.production`, `backend/.env`, etc., sont présents dans l'historique Git avec des identifiants Neon, Mailgun/Resend et Cloudinary.
  - Environ 36 fichiers PDF réels (actes de naissance, carnets de santé, certificats) et 25 photos de profil sont présents dans le répertoire `backend/uploads/` et suivis par Git.
- **Correction** :
  1. Révoquer et renouveler immédiatement tous les secrets et clés d'API auprès des fournisseurs tiers.
  2. Ajouter `*.env`, `backend/uploads/` et `backend/backups/` dans le fichier `.gitignore`.
  3. Nettoyer l'historique Git (via `git-filter-repo` ou BFG Repo-Cleaner) pour supprimer définitivement les documents personnels des familles.
