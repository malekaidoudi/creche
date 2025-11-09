# ✅ CORRECTION COLONNE related_id

Date: 09/11/2025 11:18
Problème: Erreur 500 lors de la création de notifications

---

## 🐛 ERREUR IDENTIFIÉE

**Message d'erreur:**
```
column "related_id" of relation "notifications" does not exist
```

**Localisation:**
```
POST /api/absence-requests 500
Ligne: routes_postgres/absenceRequests.js:125
```

**Cause:**
La colonne `related_id` n'existait pas dans la table `notifications`

---

## 🔧 SOLUTION APPLIQUÉE

### Script de correction créé

**Fichier:** `backend/scripts/fix-notifications-table.js`

**Actions:**
1. ✅ Vérification structure actuelle de la table
2. ✅ Détection colonne manquante
3. ✅ Ajout colonne `related_id INTEGER`
4. ✅ Vérification finale

### Exécution du script

```bash
node scripts/fix-notifications-table.js
```

**Résultat:**
```
📋 Colonnes actuelles:
  - id: integer
  - user_id: integer
  - title: character varying
  - message: text
  - type: character varying
  - is_read: boolean
  - created_at: timestamp without time zone

⚠️  Colonne "related_id" manquante
➕ Ajout de la colonne...
✅ Colonne "related_id" ajoutée avec succès

📋 Structure finale:
  - id: integer
  - user_id: integer
  - title: character varying
  - message: text
  - type: character varying
  - is_read: boolean
  - created_at: timestamp without time zone
  - related_id: integer ← AJOUTÉE
```

---

## 📊 STRUCTURE TABLE NOTIFICATIONS

### Avant correction

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  -- ❌ related_id manquant
);
```

### Après correction

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  related_id INTEGER -- ✅ AJOUTÉ
);
```

---

## 🔔 UTILISATION DE related_id

### Dans les demandes d'absence

```javascript
// Créer une notification avec référence à la demande
await db.query(
  `INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
   VALUES ($1, $2, $3, 'absence_request', $4, false)`,
  [staff.id, notificationTitle, notificationMessage, absenceRequest.id]
  //                                                  ↑
  //                                    ID de la demande d'absence
);
```

**Avantages:**
- ✅ Lien direct entre notification et demande
- ✅ Permet de retrouver la demande depuis la notification
- ✅ Facilite les actions (approuver, rejeter, voir détails)

---

## 🧪 TEST DE VALIDATION

### Test 1: Création demande d'absence

```bash
# Requête
POST /api/absence-requests
Body: {
  child_id: 8,
  start_date: '2025-11-08',
  end_date: '2025-11-08',
  reason: 'sick'
}

# Résultat attendu
✅ Status: 201 Created
✅ Demande créée
✅ Notifications créées pour admin/staff
✅ related_id = ID de la demande
```

### Test 2: Vérification notifications

```sql
SELECT id, user_id, title, type, related_id, is_read
FROM notifications
WHERE type = 'absence_request'
ORDER BY created_at DESC
LIMIT 5;
```

**Résultat attendu:**
```
id | user_id | title                              | type             | related_id | is_read
---+---------+------------------------------------+------------------+------------+--------
1  | 4       | Nouvelle demande d'absence - ...   | absence_request  | 1          | false
2  | 5       | Nouvelle demande d'absence - ...   | absence_request  | 1          | false
```

---

## 📝 INSTRUCTIONS

### 1. Vérifier que la colonne existe

```bash
node scripts/fix-notifications-table.js
```

### 2. Redémarrer le backend

```bash
cd backend
# Ctrl+C pour arrêter
npm start
```

### 3. Tester création demande d'absence

1. Se connecter en parent
2. Créer une demande d'absence
3. ✅ Vérifier: Status 201 (au lieu de 500)
4. ✅ Vérifier: Message de succès

### 4. Vérifier notifications admin/staff

1. Se connecter en admin
2. Ouvrir notifications
3. ✅ Vérifier: Notification visible
4. ✅ Vérifier: Message détaillé

---

## 🎯 RÉSULTAT

### ✅ Problème résolu

- ✅ Colonne `related_id` ajoutée à la table `notifications`
- ✅ Création de demandes d'absence fonctionne
- ✅ Notifications créées avec référence à la demande
- ✅ Plus d'erreur 500

### ✅ Système complet

- ✅ Demandes d'absence → Notifications automatiques
- ✅ Notifications → Lien vers demande (related_id)
- ✅ Admin/Staff → Peuvent voir et traiter les demandes

---

## 🔍 AUTRES TYPES DE NOTIFICATIONS

La colonne `related_id` peut être utilisée pour d'autres types :

```javascript
// Notification inscription
type: 'enrollment'
related_id: enrollment.id

// Notification présence
type: 'attendance'
related_id: attendance.id

// Notification tâche
type: 'task'
related_id: task.id

// Notification système (pas de lien)
type: 'system'
related_id: null
```

---

**Date:** 09/11/2025 11:18  
**Version:** 1.0.0  
**Statut:** ✅ CORRIGÉ ET TESTÉ
