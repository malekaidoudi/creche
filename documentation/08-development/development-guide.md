# Guide du Développeur (Bonnes Pratiques & Conventions)

Ce guide résume les règles de codage et les conventions à respecter lors du développement de nouvelles fonctionnalités ou de la correction de bugs.

---

## 1. Conventions Backend (Express & PostgreSQL)

### Requêtage Base de Données
- Le projet n'utilise aucun ORM. Toutes les requêtes s'exécutent avec le connecteur SQL brut `pg` encapsulé par `db.query(sql, params)` (`backend/config/db_postgres.js`).
- **Paramétrage obligatoire** : Toujours utiliser des requêtes paramétrées avec des variables `$1, $2, ...` pour prévenir les injections SQL.
- Exemple recommandé :
  ```javascript
  const result = await db.query(
    'SELECT id, first_name, last_name FROM children WHERE parent_id = $1 AND is_active = true',
    [parentId]
  );
  ```

### Gestion des Erreurs et Réponses API
- Renvoyer systématiquement des objets JSON normalisés :
  ```javascript
  // Succès
  return res.json({ success: true, data: result.rows });

  // Erreur
  return res.status(400).json({ success: false, error: 'Message d\'erreur explicatif' });
  ```
- Entourer les opérations asynchrones de blocs `try / catch` et journaliser avec le module `logger`.

### Sécurisation des Routes
- Toute nouvelle route privée doit appliquer :
  1. `authenticateToken` : valide le jeton JWT.
  2. Un filtre de rôle (`requireRole('admin')`, `requireStaff`, etc.) ou de permission (`requirePermission('code')`).
  3. Pour l'accès aux enfants, utiliser le middleware `requireChildAccess` pour empêcher un parent d'accéder aux données d'un autre enfant.

---

## 2. Conventions Frontend (React & Vite)

### Gestion des Rôles et Permissions
- Ne pas se fier uniquement au masquage d'éléments dans le DOM.
- Utiliser le composant `<Can feature={FEATURES.CODE}>` ou le hook `useAccess(FEATURES.CODE)` issu de `src/access/` pour conditionner l'affichage des actions sensibles.
- Configurer les routes protégées dans `src/routes/AppRoutes.jsx` avec `<ProtectedRoute roles={['admin', 'staff']}>`.

### Internationalisation (i18n)
- L'application est bilingue Français / Arabe.
- Utiliser le hook `useTranslation()` :
  ```javascript
  const { t } = useTranslation();
  return <h1>{t('common.welcome')}</h1>;
  ```
- Les clés de traduction doivent être ajoutées à la fois dans les dictionnaires français et arabes correspondants.
- Prendre en compte le sens d'écriture `dir="rtl"` en mode arabe lors de l'application de classes CSS de marges et de positionnement.

---

## 3. Gestion du Versioning (Git)

- Ne jamais commiter de fichiers contenant des clés API, identifiants de base de données ou certificats.
- Ne pas commiter de fichiers générés dans `backend/backups/data/` ou `backend/uploads/`.
- Effectuer des commits atomiques avec des messages clairs suivant les conventions courantes (`feat: ...`, `fix: ...`, `docs: ...`).
