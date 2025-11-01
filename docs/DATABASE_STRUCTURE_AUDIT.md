# 📊 AUDIT STRUCTURE BASE DE DONNÉES - CRÈCHE MIMA ELGHALIA

## 🗄️ TABLES PRINCIPALES

### 1. **USERS** (Utilisateurs)
```sql
- id (PK, integer, auto-increment)
- email (varchar, NOT NULL, unique)
- password (varchar, NOT NULL)
- first_name (varchar, NOT NULL)
- last_name (varchar, NOT NULL)
- phone (varchar, nullable)
- role (varchar, default: 'parent') -- admin, staff, parent
- profile_image (varchar, nullable)
- is_active (boolean, default: true)
- created_at (timestamp, default: CURRENT_TIMESTAMP)
- updated_at (timestamp, default: CURRENT_TIMESTAMP)
```

### 2. **CHILDREN** (Enfants)
```sql
- id (PK, integer, auto-increment)
- first_name (varchar, NOT NULL)
- last_name (varchar, NOT NULL)
- birth_date (date, NOT NULL)
- gender (varchar, nullable)
- medical_info (text, nullable)
- emergency_contact_name (varchar, nullable)
- emergency_contact_phone (varchar, nullable)
- photo_url (varchar, nullable)
- is_active (boolean, default: true)
- created_at (timestamp, default: CURRENT_TIMESTAMP)
- updated_at (timestamp, default: CURRENT_TIMESTAMP)
- parent_id (integer, FK -> users.id) -- ✅ AJOUTÉ RÉCEMMENT
```

### 3. **ENROLLMENTS** (Inscriptions)
```sql
- id (PK, integer, auto-increment)
- parent_id (integer, FK -> users.id, nullable)
- child_id (integer, FK -> children.id, nullable)
- enrollment_date (date, nullable)
- status (varchar, nullable) -- ANCIEN CHAMP
- new_status (enrollment_status ENUM, default: 'pending') -- NOUVEAU CHAMP
- approved_by (integer, FK -> users.id, nullable)
- approved_at (timestamp, nullable)
- applicant_first_name (varchar, nullable)
- applicant_last_name (varchar, nullable)
- applicant_email (varchar, nullable)
- applicant_phone (varchar, nullable)
- child_first_name (varchar, nullable)
- child_last_name (varchar, nullable)
- child_birth_date (date, nullable)
- child_gender (varchar, nullable)
- child_medical_info (text, nullable)
- emergency_contact_name (varchar, nullable)
- emergency_contact_phone (varchar, nullable)
- created_at (timestamp, default: CURRENT_TIMESTAMP)
- updated_at (timestamp, default: CURRENT_TIMESTAMP)
```

### 4. **ATTENDANCE** (Présences)
```sql
- id (PK, integer, auto-increment)
- child_id (integer, FK -> children.id)
- date (date, NOT NULL)
- check_in_time (timestamp, nullable)
- check_out_time (timestamp, nullable)
- notes (text, nullable)
- created_at (timestamp, default: CURRENT_TIMESTAMP)
- updated_at (timestamp, default: CURRENT_TIMESTAMP)
```

### 5. **NOTIFICATIONS** (Notifications)
```sql
- id (PK, integer, auto-increment)
- user_id (integer, FK -> users.id)
- title (varchar, NOT NULL)
- message (text, NOT NULL)
- type (varchar, default: 'info')
- is_read (boolean, default: false)
- created_at (timestamp, default: CURRENT_TIMESTAMP)
```

### 6. **HOLIDAYS** (Jours fériés)
```sql
- id (PK, integer, auto-increment)
- name (varchar, NOT NULL)
- date (date, NOT NULL)
- is_closed (boolean, default: true)
- description (text, nullable)
- created_at (timestamp, default: CURRENT_TIMESTAMP)
- updated_at (timestamp, default: CURRENT_TIMESTAMP)
```

### 7. **NURSERY_SETTINGS** (Paramètres crèche)
```sql
- id (PK, integer, auto-increment)
- setting_key (varchar, NOT NULL, unique)
- setting_value (text, nullable)
- setting_type (varchar, default: 'text')
- description (text, nullable)
- is_public (boolean, default: false)
- created_at (timestamp, default: CURRENT_TIMESTAMP)
- updated_at (timestamp, default: CURRENT_TIMESTAMP)
```

## 🔗 RELATIONS PRINCIPALES

1. **users.id** ← **children.parent_id** (1:N)
2. **users.id** ← **enrollments.parent_id** (1:N)
3. **children.id** ← **enrollments.child_id** (1:N)
4. **children.id** ← **attendance.child_id** (1:N)
5. **users.id** ← **notifications.user_id** (1:N)

## ⚠️ PROBLÈMES IDENTIFIÉS

1. **ENROLLMENTS** : Double champ status (`status` + `new_status`)
2. **ENROLLMENTS** : Données dupliquées (enfant dans enrollment ET table children)
3. **CHILDREN** : Relation parent_id récemment ajoutée, cohérence à vérifier
4. **ATTENDANCE** : Pas de champ status (présent/absent/excusé)

## 🎯 RECOMMANDATIONS

1. **Nettoyer la table enrollments** (supprimer ancien champ status)
2. **Standardiser les statuts** dans toutes les tables
3. **Vérifier la cohérence** des données parent-enfant
4. **Ajouter des index** sur les clés étrangères pour les performances
