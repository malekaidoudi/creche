# 🗄️ Appliquer la Migration SQL sur Neon

## 🚨 **PROBLÈME ACTUEL**

L'upload de documents échoue avec erreur 500 car la table `enrollment_documents` n'existe pas dans la base de données Neon.

**Erreur** :
```
Failed to load resource: the server responded with a status of 500
❌ API Error: {success: false, error: "Erreur lors de l'upload des documents"}
```

---

## ✅ **SOLUTION : Créer la table enrollment_documents**

### **Méthode 1 : Via Neon SQL Editor (Recommandé)**

1. **Aller sur Neon Dashboard**
   - URL : https://console.neon.tech
   - Se connecter avec votre compte

2. **Sélectionner le projet**
   - Cliquer sur votre projet de base de données
   - Aller dans l'onglet **"SQL Editor"**

3. **Copier le script SQL**
   - Ouvrir le fichier : `/backend/migrations/create_enrollment_documents_table.sql`
   - Copier tout le contenu

4. **Exécuter le script**
   - Coller dans le SQL Editor de Neon
   - Cliquer sur **"Run"** ou **"Execute"**
   - Attendre la confirmation

5. **Vérifier la création**
   - Le script affiche automatiquement la structure de la table
   - Vérifier que les colonnes sont bien créées

---

### **Méthode 2 : Via psql (Ligne de commande)**

Si vous avez `psql` installé :

```bash
# 1. Récupérer l'URL de connexion depuis Neon Dashboard
# Format: postgresql://user:password@host/database

# 2. Exécuter la migration
psql "postgresql://user:password@host/database" \
  -f backend/migrations/create_enrollment_documents_table.sql

# 3. Vérifier la table
psql "postgresql://user:password@host/database" \
  -c "SELECT table_name FROM information_schema.tables WHERE table_name = 'enrollment_documents';"
```

---

### **Méthode 3 : Via Neon API (Avancé)**

```bash
# Récupérer l'API key depuis Neon Dashboard
NEON_API_KEY="your_api_key"
PROJECT_ID="your_project_id"

# Lire le fichier SQL
SQL_CONTENT=$(cat backend/migrations/create_enrollment_documents_table.sql)

# Exécuter via API
curl -X POST "https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches/main/query" \
  -H "Authorization: Bearer ${NEON_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL_CONTENT}\"}"
```

---

## 🔍 **VÉRIFICATION POST-MIGRATION**

### **1. Vérifier que la table existe**

Dans Neon SQL Editor, exécuter :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'enrollment_documents';
```

**Résultat attendu** :
```
 table_name
-------------------
 enrollment_documents
```

### **2. Vérifier la structure de la table**

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'enrollment_documents'
ORDER BY ordinal_position;
```

**Résultat attendu** :
```
 column_name       | data_type         | is_nullable | column_default
-------------------+-------------------+-------------+----------------
 id                | integer           | NO          | nextval(...)
 enrollment_id     | integer           | NO          | 
 filename          | character varying | NO          | 
 original_filename | character varying | NO          | 
 file_path         | text              | NO          | 
 mime_type         | character varying | YES         | 
 file_size         | integer           | YES         | 
 document_type     | character varying | YES         | 
 uploaded_by       | integer           | YES         | 
 uploaded_at       | timestamp         | YES         | CURRENT_TIMESTAMP
 is_verified       | boolean           | YES         | false
 verified_by       | integer           | YES         | 
 verified_at       | timestamp         | YES         | 
 notes             | text              | YES         | 
```

### **3. Tester une insertion**

```sql
-- Test avec un enrollment existant (ID 26 ou 27)
INSERT INTO enrollment_documents (
  enrollment_id, 
  document_type, 
  filename, 
  original_filename, 
  file_path, 
  file_size, 
  mime_type
) VALUES (
  26, 
  'test', 
  'test.pdf', 
  'test.pdf', 
  '/tmp/test.pdf', 
  1000, 
  'application/pdf'
) RETURNING *;
```

**Si succès** : La table est bien créée et fonctionnelle ✅

**Si erreur** : 
- `relation "enrollment_documents" does not exist` → Table pas créée
- `foreign key constraint` → Enrollment ID n'existe pas
- Autre erreur → Vérifier les logs

---

## 🧪 **TESTER L'UPLOAD APRÈS MIGRATION**

1. **Attendre 10 secondes** (pour que les connexions DB se rafraîchissent)

2. **Aller sur le site**
   - https://malekaidoudi.github.io/creche

3. **Créer une nouvelle inscription**
   - Remplir le formulaire
   - Noter l'ID de l'enrollment (ex: 28)

4. **Uploader les documents**
   - Sélectionner les 3 fichiers
   - Cliquer sur "Soumettre"

5. **Vérifier dans la console**
   - Ouvrir F12
   - Chercher les logs :
     ```
     📎 Upload documents - Enrollment ID: 28
     ✅ Document sauvegardé en DB: {id: 1, ...}
     ✅ Tous les documents sauvegardés: 3
     ```

6. **Vérifier en base de données**
   ```sql
   SELECT * FROM enrollment_documents 
   WHERE enrollment_id = 28;
   ```

---

## 📊 **STRUCTURE COMPLÈTE DE LA TABLE**

```sql
CREATE TABLE enrollment_documents (
  -- Clé primaire
  id SERIAL PRIMARY KEY,
  
  -- Référence à l'enrollment
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  
  -- Informations fichier
  filename VARCHAR(255) NOT NULL,           -- Nom fichier serveur (hash)
  original_filename VARCHAR(255) NOT NULL,  -- Nom fichier original
  file_path TEXT NOT NULL,                  -- Chemin complet
  mime_type VARCHAR(100),                   -- Type MIME (application/pdf, image/jpeg)
  file_size INTEGER,                        -- Taille en bytes
  document_type VARCHAR(50),                -- carnet_medical, acte_naissance, certificat_medical
  
  -- Métadonnées upload
  uploaded_by INTEGER REFERENCES users(id), -- Qui a uploadé (null si parent)
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Vérification admin
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  notes TEXT
);
```

---

## 🔧 **DÉPANNAGE**

### **Erreur : "relation enrollments does not exist"**

La table `enrollments` n'existe pas. Appliquer d'abord :
```bash
psql $DATABASE_URL -f backend/migrations/001_refactor_enrollments_workflow.sql
```

### **Erreur : "permission denied"**

Vérifier que l'utilisateur DB a les droits CREATE TABLE :
```sql
GRANT CREATE ON SCHEMA public TO your_user;
```

### **Erreur : "already exists"**

La table existe déjà. Vérifier sa structure :
```sql
\d enrollment_documents
```

Si la structure est incorrecte, supprimer et recréer :
```sql
DROP TABLE IF EXISTS enrollment_documents CASCADE;
-- Puis réexécuter le script de création
```

---

## 📝 **CHECKLIST POST-MIGRATION**

- [ ] Table `enrollment_documents` créée
- [ ] Structure vérifiée (14 colonnes)
- [ ] Index créés
- [ ] Test d'insertion réussi
- [ ] Upload documents fonctionne sur le site
- [ ] Documents visibles en base de données

---

## 🎯 **RÉSULTAT ATTENDU**

Après avoir appliqué cette migration :

1. ✅ La table `enrollment_documents` existe dans Neon
2. ✅ L'upload de documents fonctionne sans erreur 500
3. ✅ Les documents sont sauvegardés en base de données
4. ✅ Les logs backend montrent les insertions réussies

---

**Date** : 2025-11-02  
**Fichier SQL** : `/backend/migrations/create_enrollment_documents_table.sql`  
**Statut** : ⏳ À appliquer sur Neon
