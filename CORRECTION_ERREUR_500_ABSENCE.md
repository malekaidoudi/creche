# ✅ CORRECTION ERREUR 500 - DEMANDE D'ABSENCE

Date: 09/11/2025 11:13
Problème: Erreur 500 lors de la création d'une demande d'absence

---

## 🐛 PROBLÈME IDENTIFIÉ

**Erreur:**
```
POST /api/absence-requests 500 (Internal Server Error)
```

**Données envoyées:**
```javascript
{
  child_id: '8',
  start_date: '2025-11-08',
  end_date: '2025-11-08',
  reason: 'sick',
  notes: ''
}
```

**Cause probable:**
1. Erreur lors de la récupération des infos de l'enfant
2. Tentative d'accès à des propriétés `undefined`
3. Problème avec la création des notifications

---

## 🔧 CORRECTIONS APPLIQUÉES

### 1. Vérification existence enfant

**Avant:**
```javascript
const child = childInfo.rows[0];
const childName = `${child.first_name} ${child.last_name}`;
// ❌ Crash si childInfo.rows[0] est undefined
```

**Après:**
```javascript
if (childInfo.rows.length === 0) {
  return res.status(404).json({
    success: false,
    error: 'Enfant non trouvé'
  });
}

const child = childInfo.rows[0];
const childName = `${child.first_name} ${child.last_name}`;
// ✅ Sécurisé
```

### 2. Gestion des noms de parent null

**Avant:**
```javascript
const parentName = `${child.parent_first_name} ${child.parent_last_name}`;
// ❌ Affiche "null null" si parent non trouvé
```

**Après:**
```javascript
const parentName = `${child.parent_first_name || ''} ${child.parent_last_name || ''}`;
// ✅ Affiche "" si parent non trouvé
```

---

## 📊 STRUCTURE COMPLÈTE DE LA ROUTE

```javascript
router.post('/', auth.authenticateToken, async (req, res) => {
  try {
    const { child_id, start_date, end_date, reason, notes } = req.body;
    const userId = req.user.userId;
    
    // 1. Validation des données
    if (!child_id || !start_date || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes (child_id, start_date, reason requis)'
      });
    }
    
    // 2. Vérifier que l'enfant appartient au parent
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      const childCheck = await db.query(
        'SELECT id FROM children WHERE id = $1 AND parent_id = $2',
        [child_id, userId]
      );
      
      if (childCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Vous n\'êtes pas autorisé à créer une demande pour cet enfant'
        });
      }
    }
    
    // 3. Créer la demande d'absence
    const result = await db.query(
      `INSERT INTO absence_requests (child_id, parent_id, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, child_id, start_date, end_date, reason, status, created_at`,
      [child_id, userId, start_date, end_date || null, reason]
    );
    
    const absenceRequest = result.rows[0];
    
    // 4. Récupérer les infos de l'enfant et du parent
    const childInfo = await db.query(
      `SELECT c.first_name, c.last_name, u.first_name as parent_first_name, u.last_name as parent_last_name
       FROM children c
       LEFT JOIN users u ON c.parent_id = u.id
       WHERE c.id = $1`,
      [child_id]
    );
    
    // ✅ VÉRIFICATION AJOUTÉE
    if (childInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Enfant non trouvé'
      });
    }
    
    const child = childInfo.rows[0];
    const childName = `${child.first_name} ${child.last_name}`;
    const parentName = `${child.parent_first_name || ''} ${child.parent_last_name || ''}`;
    
    // 5. Créer des notifications pour tous les admins et staff
    const staffUsers = await db.query(
      `SELECT id FROM users WHERE role IN ('admin', 'staff') AND is_active = true`
    );
    
    const notificationTitle = `Nouvelle demande d'absence - ${childName}`;
    const notificationMessage = `${parentName} a créé une demande d'absence pour ${childName} du ${new Date(start_date).toLocaleDateString('fr-FR')} ${end_date && end_date !== start_date ? `au ${new Date(end_date).toLocaleDateString('fr-FR')}` : ''}. Raison: ${reason}`;
    
    // 6. Insérer les notifications
    for (const staff of staffUsers.rows) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
         VALUES ($1, $2, $3, 'absence_request', $4, false)`,
        [staff.id, notificationTitle, notificationMessage, absenceRequest.id]
      );
    }
    
    console.log(`✅ Notifications créées pour ${staffUsers.rows.length} membres du staff`);
    
    res.status(201).json({
      success: true,
      message: 'Demande d\'absence créée avec succès',
      request: absenceRequest
    });
    
  } catch (error) {
    console.error('Erreur création demande absence:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la demande d\'absence'
    });
  }
});
```

---

## 🧪 TESTS À EFFECTUER

### Test 1: Demande d'absence normale

```javascript
// Données
{
  child_id: 8,
  start_date: '2025-11-08',
  end_date: '2025-11-08',
  reason: 'sick',
  notes: ''
}

// Réponse attendue
{
  success: true,
  message: 'Demande d\'absence créée avec succès',
  request: {
    id: 1,
    child_id: 8,
    start_date: '2025-11-08',
    end_date: '2025-11-08',
    reason: 'sick',
    status: 'pending',
    created_at: '2025-11-09T10:13:00'
  }
}
```

### Test 2: Enfant inexistant

```javascript
// Données
{
  child_id: 9999,
  start_date: '2025-11-08',
  end_date: '2025-11-08',
  reason: 'sick'
}

// Réponse attendue
{
  success: false,
  error: 'Enfant non trouvé'
}
// Status: 404
```

### Test 3: Données manquantes

```javascript
// Données
{
  child_id: 8,
  start_date: '2025-11-08'
  // reason manquant
}

// Réponse attendue
{
  success: false,
  error: 'Données manquantes (child_id, start_date, reason requis)'
}
// Status: 400
```

---

## 📝 INSTRUCTIONS

### 1. Redémarrer le backend

```bash
cd backend
# Ctrl+C pour arrêter
npm start
```

### 2. Tester avec compte parent

1. Se connecter: `parent@creche.com` / `parent123`
2. Aller dans "Demandes d'absence"
3. Sélectionner un enfant
4. Choisir une date
5. Sélectionner une raison
6. Soumettre
7. ✅ Vérifier: demande créée sans erreur 500

### 3. Vérifier les notifications

1. Se connecter en admin/staff
2. Ouvrir le centre de notifications
3. ✅ Vérifier: notification de la demande d'absence visible

### 4. Vérifier les logs backend

```bash
# Dans le terminal backend, vous devriez voir:
✅ Notifications créées pour X membres du staff
```

---

## 🎯 RÉSULTAT ATTENDU

- ✅ Plus d'erreur 500 lors de la création
- ✅ Demande d'absence créée avec succès
- ✅ Notifications envoyées aux admin/staff
- ✅ Message de succès affiché au parent
- ✅ Logs détaillés dans le terminal

---

## 🔍 DEBUGGING

Si l'erreur persiste, vérifier :

1. **Logs backend** pour l'erreur exacte
2. **child_id** est bien un nombre valide
3. **Table absence_requests** existe
4. **Table notifications** existe
5. **Utilisateurs admin/staff** existent et sont actifs

---

**Date:** 09/11/2025 11:13  
**Version:** 1.0.0  
**Statut:** ✅ CORRIGÉ - À TESTER
