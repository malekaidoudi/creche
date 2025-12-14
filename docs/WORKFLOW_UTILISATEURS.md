# Workflow Utilisateurs - Crèche Mima Elghalia

## Vue d'ensemble

Ce document décrit les workflows de création d'utilisateurs (parents et personnel) implémentés dans l'application.

---

## 1. Inscription d'un enfant par l'administrateur

### Flux
1. Admin accède à **Dashboard → Enfants → Ajouter un enfant**
2. Admin saisit les informations de l'enfant
3. L'enfant est créé avec:
   - `enrollment_status = 'enrolled'` (inscrit directement)
   - `parent_id = NULL` (enfant "orphelin")
4. Écran de succès avec option de créer un compte parent

### Endpoints
- `POST /api/children` - Créer un enfant

### Fichiers modifiés
- `frontend/src/pages/dashboard/AddChildPage.jsx`
- `backend/routes_postgres/children.js`

---

## 2. Création du compte parent par l'administrateur

### Flux
1. Admin accède à **Dashboard → Utilisateurs → Ajouter un utilisateur**
2. Admin sélectionne le rôle "Parent"
3. Admin saisit les informations du parent (nom, email, téléphone, sexe)
4. Admin sélectionne un enfant orphelin dans la liste
5. Optionnel: Admin saisit un contact d'urgence différent
6. Soumission du formulaire:
   - Compte parent créé (sans mot de passe)
   - Enfant associé au parent (`parent_id` mis à jour)
   - Email envoyé avec lien de création de mot de passe
7. Le parent reçoit l'email et crée son mot de passe

### Endpoints
- `GET /api/children/orphans` - Liste des enfants sans parent
- `POST /api/user-workflow/create-parent` - Créer un compte parent
- `POST /api/user-workflow/set-password` - Définir le mot de passe

### Email envoyé
- Template: `parent-welcome.html`
- Sujet: "Bienvenue à la crèche Mima Elghalia - Créez votre mot de passe"
- Contenu: Lien de création de mot de passe (valide 7 jours)

### Fichiers modifiés
- `frontend/src/pages/dashboard/AddUserPage.jsx`
- `backend/routes_postgres/userWorkflow.js`
- `backend/emails/templates/parent-welcome.html`

---

## 3. Création du compte personnel par l'administrateur

### Flux
1. Admin accède à **Dashboard → Utilisateurs → Ajouter un utilisateur**
2. Admin sélectionne le rôle "Personnel"
3. Admin saisit les informations (nom, email, téléphone, sexe, poste)
4. Soumission du formulaire:
   - Compte personnel créé (sans mot de passe)
   - Email envoyé avec lien de création de mot de passe
5. Le personnel reçoit l'email et crée son mot de passe

### Postes disponibles
- `director` - Directeur/Directrice
- `educator` - Éducateur/Éducatrice
- `health` - Personnel de santé
- `cleaning` - Personnel d'entretien
- `security` - Agent de sécurité
- `kitchen` - Personnel de cuisine
- `other` - Autre

### Endpoints
- `POST /api/user-workflow/create-staff` - Créer un compte personnel
- `POST /api/user-workflow/set-password` - Définir le mot de passe

### Email envoyé
- Template: `staff-welcome.html`
- Sujet: "Bienvenue dans l'équipe de la crèche Mima Elghalia"
- Contenu: Lien de création de mot de passe (valide 7 jours)

### Fichiers modifiés
- `frontend/src/pages/dashboard/AddUserPage.jsx`
- `backend/routes_postgres/userWorkflow.js`
- `backend/emails/templates/staff-welcome.html`

---

## 4. Inscription parent depuis le site (self-service)

### Flux
1. Parent accède à `/inscription-parent`
2. Choix entre:
   - **"Mon enfant est déjà inscrit"** → Sélection d'un enfant orphelin
   - **"Je souhaite inscrire mon enfant"** → Redirection vers `/inscription`
3. Si "déjà inscrit":
   - Saisie des informations personnelles
   - Recherche et sélection de l'enfant
   - Création du compte avec mot de passe
   - Association automatique avec l'enfant

### Endpoints
- `GET /api/children/orphans?search=...` - Rechercher un enfant orphelin
- `POST /api/user-workflow/register-parent` - Inscription self-service

### Fichiers créés
- `frontend/src/pages/public/ParentRegisterPage.jsx`
- `frontend/src/services/userWorkflowService.js`

---

## Schéma de base de données

### Modifications apportées

#### Table `children`
```sql
ALTER TABLE children ADD COLUMN parent_id INTEGER REFERENCES users(id);
ALTER TABLE children ADD COLUMN enrollment_status VARCHAR(20) DEFAULT 'enrolled';
```

#### Table `users`
```sql
ALTER TABLE users ADD COLUMN gender VARCHAR(10);
ALTER TABLE users ADD COLUMN staff_position VARCHAR(50);
ALTER TABLE users ADD COLUMN password_token VARCHAR(255);
ALTER TABLE users ADD COLUMN password_token_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN password_set BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN emergency_contact_name VARCHAR(100);
ALTER TABLE users ADD COLUMN emergency_contact_phone VARCHAR(20);
```

#### Nouvelle table `parent_children`
```sql
CREATE TABLE parent_children (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER NOT NULL REFERENCES users(id),
    child_id INTEGER NOT NULL REFERENCES children(id),
    relationship VARCHAR(20) DEFAULT 'parent',
    is_primary BOOLEAN DEFAULT FALSE,
    is_emergency_contact BOOLEAN DEFAULT FALSE,
    UNIQUE(parent_id, child_id)
);
```

### Migration
Exécuter: `node backend/scripts/run-workflow-migration.js`

---

## Diagramme de flux

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW ADMIN                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Inscrire   │───▶│   Enfant     │───▶│   Créer      │       │
│  │   Enfant     │    │   Orphelin   │    │   Parent     │       │
│  └──────────────┘    └──────────────┘    └──────┬───────┘       │
│                                                  │               │
│                                                  ▼               │
│                                          ┌──────────────┐       │
│                                          │  Email avec  │       │
│                                          │  lien MDP    │       │
│                                          └──────┬───────┘       │
│                                                  │               │
│                                                  ▼               │
│                                          ┌──────────────┐       │
│                                          │  Parent crée │       │
│                                          │  son MDP     │       │
│                                          └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW SELF-SERVICE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Parent     │───▶│  Sélection   │───▶│   Compte     │       │
│  │   s'inscrit  │    │   Enfant     │    │   Créé       │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sécurité

- Les tokens de création de mot de passe expirent après **7 jours**
- Les mots de passe sont hashés avec **bcrypt** (10 rounds)
- Les routes admin sont protégées par `auth.requireRole('admin')`
- Les emails sont envoyés via **Resend**

---

## Tests

Pour tester le workflow:

1. **Exécuter la migration**:
   ```bash
   cd backend && node scripts/run-workflow-migration.js
   ```

2. **Démarrer le serveur**:
   ```bash
   npm run dev
   ```

3. **Tester le workflow admin**:
   - Se connecter en tant qu'admin
   - Créer un enfant
   - Créer un compte parent avec l'enfant

4. **Tester le workflow self-service**:
   - Accéder à `/inscription-parent`
   - Sélectionner "Mon enfant est déjà inscrit"
   - Compléter l'inscription
