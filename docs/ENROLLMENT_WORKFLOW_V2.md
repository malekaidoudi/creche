# 📋 WORKFLOW D'INSCRIPTION V2.0 - DOCUMENTATION COMPLÈTE

## 🎯 **OBJECTIF**
Refactorisation complète du système d'inscription pour supporter un workflow en 4 phases sans obligation de `parent_id` lors de la création.

## 🏗️ **ARCHITECTURE NOUVEAU WORKFLOW**

### **Phase 1: Soumission Dossier (Visiteur)**
- Formulaire public sans authentification
- Création `enrollment` avec données `applicant_*` et `child_*`
- Upload documents dans `enrollment_documents`
- Statut: `pending` → `in_progress`

### **Phase 2: Traitement (Staff/Admin)**
- Consultation dossiers via dashboard
- Vérification documents
- Statut: `in_progress`

### **Phase 3: Décision (Admin)**
#### **3a. Approbation (Transaction Atomique)**
- Créer/trouver `users` (parent)
- Créer `children` (enfant actif)
- Transférer documents → `children_documents`
- Marquer `enrollment.status = 'approved'`

#### **3b. Rejet**
- `rejected_incomplete`: Dossier à compléter
- `rejected_deleted`: Suppression définitive

### **Phase 4: Archivage**
- Soft delete enfants: `children.is_active = false`
- Archive dans `children_archive`

---

## 🗄️ **NOUVEAU SCHÉMA BASE DE DONNÉES**

### **Table `enrollments` (Modifiée)**
```sql
CREATE TYPE enrollment_status AS ENUM (
  'pending', 'in_progress', 'approved', 
  'rejected_incomplete', 'rejected_deleted', 'archived'
);

ALTER TABLE enrollments ADD COLUMN:
- applicant_first_name VARCHAR(100)
- applicant_last_name VARCHAR(100)  
- applicant_email VARCHAR(255)
- applicant_phone VARCHAR(20)
- child_first_name VARCHAR(100)
- child_last_name VARCHAR(100)
- child_birth_date DATE
- child_gender VARCHAR(10)
- new_status enrollment_status DEFAULT 'pending'
- approved_by INTEGER REFERENCES users(id)
- approved_at TIMESTAMP
- parent_id INTEGER REFERENCES users(id) -- Nullable
- child_id INTEGER -- Nullable
```

### **Table `enrollment_documents` (Nouvelle)**
```sql
CREATE TABLE enrollment_documents (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  document_type VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

### **Table `children_documents` (Nouvelle)**
```sql
CREATE TABLE children_documents (
  id SERIAL PRIMARY KEY,
  child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  document_type VARCHAR(50),
  transferred_from_enrollment INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🛣️ **NOUVELLES ROUTES API**

### **Routes Publiques (Visiteurs)**

#### `POST /api/enrollments`
**Objectif**: Création dossier d'inscription
**Auth**: Aucune
**Body**:
```json
{
  "applicant_first_name": "Jean",
  "applicant_last_name": "Dupont", 
  "applicant_email": "jean@email.com",
  "applicant_phone": "0123456789",
  "child_first_name": "Pierre",
  "child_last_name": "Dupont",
  "child_birth_date": "2020-03-15",
  "child_gender": "M",
  "child_medical_info": "Aucune allergie",
  "emergency_contact_name": "Marie Dupont",
  "emergency_contact_phone": "0987654321"
}
```
**Response**:
```json
{
  "success": true,
  "enrollment": {
    "id": 123,
    "status": "pending",
    "created_at": "2025-10-31T20:00:00Z"
  }
}
```

#### `GET /api/enrollments/:id/status?email=xxx`
**Objectif**: Vérifier statut dossier
**Auth**: Aucune (avec email de vérification)

### **Routes Protégées (Staff/Admin)**

#### `GET /api/enrollments`
**Objectif**: Liste dossiers
**Auth**: `requireRole('staff', 'admin')`
**Query**: `?status=pending&page=1&limit=20&search=nom`

#### `GET /api/enrollments/:id`
**Objectif**: Détails dossier avec documents
**Auth**: `requireRole('staff', 'admin')`

#### `POST /api/enrollments/:id/approve`
**Objectif**: **APPROBATION ATOMIQUE**
**Auth**: `requireRole('admin')`
**Transaction**:
1. Créer/trouver parent dans `users`
2. Créer enfant dans `children`
3. Transférer documents
4. Marquer enrollment approuvé

#### `POST /api/enrollments/:id/reject`
**Objectif**: Rejeter dossier
**Auth**: `requireRole('staff', 'admin')`
**Body**:
```json
{
  "reason": "Documents manquants",
  "type": "incomplete" // ou "delete"
}
```

---

## 🔧 **CONTROLLERS REFACTORISÉS**

### **enrollmentsController_v2.js**
- `createEnrollment()`: Création sans parent_id
- `approveEnrollment()`: Transaction atomique complète
- `rejectEnrollment()`: Gestion des rejets
- `uploadDocuments()`: Upload avec multer

### **childrenController_v2.js**
- `getAllChildren()`: Nouvelle requête via enrollments
- `createChild()`: **DÉPRÉCIÉ** (retourne 410)
- `archiveChild()`: Soft delete avec traçabilité

---

## 🔐 **SÉCURITÉ ET PERMISSIONS**

### **Middleware auth_v2.js**
- `requireOwnershipOrStaff()`: Vérification propriété ressource
- `requireDocumentAccess()`: Contrôle accès documents
- `rateLimitPublic()`: Limitation requêtes publiques

### **Permissions par Rôle**
- **Visiteur**: Création enrollment, vérification statut
- **Parent**: Accès ses propres enrollments/enfants
- **Staff**: Consultation tous dossiers, rejet
- **Admin**: Toutes actions + approbation

---

## 🧪 **TESTS ET VALIDATION**

### **Tests Unitaires**
```bash
npm test -- enrollments.test.js
```

### **Tests d'Intégration**
- Workflow complet: Création → Approbation → Vérification
- Atomicité des transactions
- Gestion des erreurs et rollbacks

### **Collection Postman**
```json
{
  "name": "Enrollment Workflow v2",
  "requests": [
    {
      "name": "Create Enrollment",
      "method": "POST",
      "url": "{{base_url}}/api/enrollments"
    },
    {
      "name": "Approve Enrollment", 
      "method": "POST",
      "url": "{{base_url}}/api/enrollments/{{enrollment_id}}/approve",
      "headers": {"Authorization": "Bearer {{admin_token}}"}
    }
  ]
}
```

---

## 🚀 **DÉPLOIEMENT**

### **Scripts de Migration**
```bash
# 1. Appliquer migration schéma
psql -f migrations/001_refactor_enrollments_workflow.sql

# 2. Migrer données existantes  
node migrations/migrate_existing_data.js

# 3. Vérifier migration
node test_system.js
```

### **Rollback**
```bash
# Annuler migration si problème
psql -f migrations/001_rollback_enrollments_workflow.sql
```

### **Variables d'Environnement**
```env
JWT_SECRET=your_secret_key
DATABASE_URL=postgresql://user:pass@host:port/db
UPLOAD_MAX_SIZE=10485760  # 10MB
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf
```

---

## 📊 **MONITORING ET LOGS**

### **Métriques Clés**
- Nombre d'enrollments par statut
- Temps moyen d'approbation
- Taux de rejet par raison
- Erreurs de transaction

### **Logs Structurés**
```javascript
console.log('📝 Enrollment créé:', { 
  id: enrollment.id, 
  applicant_email: enrollment.applicant_email,
  timestamp: new Date().toISOString()
});
```

---

## ⚠️ **POINTS D'ATTENTION**

### **Atomicité Critique**
- Toute approbation doit être dans une transaction
- Rollback automatique en cas d'erreur
- Vérification intégrité données post-transaction

### **Gestion Fichiers**
- Upload dans dossiers temporaires puis déplacement
- Nettoyage fichiers orphelins
- Respect RGPD pour suppression

### **Performance**
- Index sur `enrollments.new_status`
- Index sur `enrollments.applicant_email`
- Pagination obligatoire sur listes

---

## 🎯 **RÉSULTAT FINAL**

✅ **Workflow en 4 phases fonctionnel**
✅ **Transactions atomiques garanties**  
✅ **Sécurité renforcée par rôles**
✅ **Traçabilité complète des actions**
✅ **Tests automatisés complets**
✅ **Documentation API détaillée**
✅ **Plan de rollback validé**

Le nouveau système d'inscription est maintenant robuste, sécurisé et évolutif, supportant parfaitement le workflow métier demandé.
