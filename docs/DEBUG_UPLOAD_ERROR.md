# 🔍 Guide de Diagnostic - Erreur Upload Documents

## 🚨 **SYMPTÔMES**

```
[Error] Failed to load resource: the server responded with a status of 500
[Error] ❌ API Error: {success: false, error: "Erreur lors de l'upload des documents"}
```

---

## 🛠️ **CORRECTIONS APPLIQUÉES**

### **1. Auto-création du dossier uploads**

**Problème** : Le dossier `uploads/enrollments/` n'existe pas sur Render

**Solution** :
```javascript
const uploadsDir = path.join(__dirname, '../uploads/enrollments');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Dossier uploads/enrollments créé');
}
```

### **2. Logs détaillés ajoutés**

Chaque étape est maintenant loggée :
- ✅ Réception de la requête
- ✅ Vérification enrollment existe
- ✅ Détails de chaque fichier
- ✅ Insertion en base de données
- ✅ Erreurs avec stack trace

---

## 📊 **VÉRIFIER LES LOGS RENDER**

### **Étape 1 : Accéder aux logs**

1. Aller sur https://dashboard.render.com
2. Sélectionner le service **`creche-backend`**
3. Cliquer sur l'onglet **"Logs"**
4. Filtrer par "upload" ou "documents"

### **Étape 2 : Chercher les logs d'upload**

Logs attendus lors d'un upload :
```
📎 Upload documents - Enrollment ID: 26
📁 Fichiers reçus: [ 'carnet_medical', 'acte_naissance', 'certificat_medical' ]
🔍 Vérification enrollment ID: 26
✅ Enrollment trouvé, sauvegarde des documents...
📄 Sauvegarde document: carnet_medical { filename: '...', ... }
✅ Document sauvegardé en DB: { id: 1, ... }
✅ Tous les documents sauvegardés: 3
```

### **Étape 3 : Identifier l'erreur**

Si erreur, chercher :
```
❌ Aucun fichier fourni
❌ Enrollment non trouvé: 26
❌ Erreur DB pour document: carnet_medical
❌ Erreur upload documents: [message d'erreur]
```

---

## 🧪 **TESTS DE DIAGNOSTIC**

### **Test 1 : Vérifier que la table existe**

Connectez-vous à Neon et exécutez :

```sql
-- Vérifier que la table enrollment_documents existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'enrollment_documents';

-- Vérifier la structure
\d enrollment_documents
```

**Résultat attendu** :
```
 Column            | Type                     | Nullable
-------------------+--------------------------+----------
 id                | integer                  | not null
 enrollment_id     | integer                  | not null
 filename          | character varying(255)   | not null
 original_filename | character varying(255)   | not null
 file_path         | text                     | not null
 mime_type         | character varying(100)   |
 file_size         | integer                  |
 document_type     | character varying(50)    |
 uploaded_by       | integer                  |
 uploaded_at       | timestamp                |
 is_verified       | boolean                  |
 verified_by       | integer                  |
 verified_at       | timestamp                |
 notes             | text                     |
```

### **Test 2 : Vérifier que l'enrollment existe**

```sql
SELECT id, applicant_email, child_first_name, new_status
FROM enrollments
WHERE id = 26;
```

**Résultat attendu** : Une ligne avec l'enrollment ID 26

### **Test 3 : Tester l'insertion manuelle**

```sql
INSERT INTO enrollment_documents (
  enrollment_id, document_type, filename, original_filename, 
  file_path, file_size, mime_type
) VALUES (
  26, 'test', 'test.pdf', 'test.pdf', 
  '/tmp/test.pdf', 1000, 'application/pdf'
) RETURNING *;
```

**Si erreur** : La table n'existe pas ou a un problème de structure

---

## 🔧 **SOLUTIONS SELON L'ERREUR**

### **Erreur : "relation enrollment_documents does not exist"**

**Cause** : La migration n'a pas été appliquée

**Solution** : Appliquer la migration manuellement

```bash
# Via Neon SQL Editor
psql $DATABASE_URL -f backend/migrations/001_refactor_enrollments_workflow.sql
```

Ou via Neon Dashboard :
1. Aller sur https://console.neon.tech
2. Sélectionner le projet
3. Onglet "SQL Editor"
4. Copier-coller le contenu de `001_refactor_enrollments_workflow.sql`
5. Exécuter

### **Erreur : "column file_path does not exist"**

**Cause** : Structure de table incorrecte

**Solution** : Recréer la table

```sql
DROP TABLE IF EXISTS enrollment_documents CASCADE;

CREATE TABLE enrollment_documents (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size INTEGER,
  document_type VARCHAR(50),
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  notes TEXT
);
```

### **Erreur : "ENOENT: no such file or directory"**

**Cause** : Dossier uploads n'existe pas

**Solution** : Le code crée maintenant automatiquement le dossier

Vérifier dans les logs Render :
```
✅ Dossier uploads/enrollments créé
```

### **Erreur : "Cannot read property 'filename' of undefined"**

**Cause** : Multer n'a pas traité les fichiers

**Solution** : Vérifier la configuration multer dans la route

```javascript
router.post('/:id/documents', 
  upload.fields([
    { name: 'carnet_medical', maxCount: 1 },
    { name: 'acte_naissance', maxCount: 1 },
    { name: 'certificat_medical', maxCount: 1 }
  ]),
  enrollmentsController.uploadDocuments
);
```

---

## 📝 **CHECKLIST DE VÉRIFICATION**

Avant de tester l'upload, vérifier :

- [ ] Backend Render redémarré (uptime < 60s)
- [ ] Table `enrollment_documents` existe dans Neon
- [ ] Enrollment ID existe dans la table `enrollments`
- [ ] Dossier `uploads/enrollments/` créé (log visible)
- [ ] Route configurée avec multer
- [ ] Logs détaillés activés

---

## 🎯 **COMMANDES UTILES**

### **Vérifier l'uptime du serveur**
```bash
curl -s https://creche-backend-prod.onrender.com/api/health | jq '.uptime'
```

### **Tester l'endpoint (sans fichiers)**
```bash
curl -X POST https://creche-backend-prod.onrender.com/api/enrollments/26/documents
```

**Résultat attendu** :
```json
{
  "success": false,
  "error": "Aucun fichier fourni"
}
```

### **Voir les logs en temps réel**
```bash
# Via Render CLI (si installé)
render logs -s creche-backend --tail
```

---

## 📊 **RÉSUMÉ DES MODIFICATIONS**

| Fichier | Modification | Statut |
|---------|--------------|--------|
| `enrollmentsController.js` | Auto-création dossier uploads | ✅ |
| `enrollmentsController.js` | Logs détaillés | ✅ |
| `enrollmentsController.js` | Gestion erreurs améliorée | ✅ |
| Migration SQL | Table enrollment_documents | ⏳ À vérifier |

---

**Date** : 2025-11-02  
**Commit** : d98a40e  
**Statut** : ⏳ En attente de redéploiement Render
