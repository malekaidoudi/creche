# 🔧 Dépannage - Mémos Visibles par Mauvais Utilisateur

## ✅ Tests Effectués

### **1. Test SQL Direct:**
```
✅ Admin voit 8 mémos (tous créés par lui)
✅ Staff voit 0 mémos
✅ Isolation: OK
```

### **2. Test API Simulé:**
```
✅ Filtre SQL fonctionne correctement
✅ Requête avec user_id filtre bien les mémos
✅ Pas de fuite de données
```

---

## 🔍 Causes Possibles

### **1. Cache du Navigateur**
Le frontend peut avoir mis en cache les anciennes données.

**Solution:**
```bash
# Vider le cache du navigateur
1. Ouvrir DevTools (F12)
2. Onglet Network
3. Cliquer sur "Disable cache"
4. Rafraîchir la page (Cmd+Shift+R ou Ctrl+Shift+R)
```

### **2. Ancien Mémo avec Mauvais created_by**
Un mémo créé avant l'implémentation du filtre peut avoir un `created_by` incorrect.

**Vérification:**
```bash
node backend/scripts/check-events-table.js
```

**Correction:**
```sql
-- Voir les mémos avec leurs créateurs
SELECT 
  id, title, type, created_by,
  (SELECT first_name || ' ' || last_name FROM users WHERE id = created_by) as creator
FROM events
WHERE type = 'memo' AND deleted_at IS NULL;

-- Si un mémo a le mauvais created_by, le corriger:
UPDATE events 
SET created_by = 1  -- ID du bon utilisateur
WHERE id = XX;  -- ID du mémo problématique
```

### **3. Authentification Incorrecte**
Le `req.user.id` peut être incorrect.

**Vérification:**
```javascript
// Ajouter un log dans routes_postgres/events.js
console.log('🔐 User authentifié:', req.user);
console.log('📋 Filtres appliqués:', filters);
```

### **4. Serveur Non Redémarré**
Les modifications backend ne sont pas prises en compte.

**Solution:**
```bash
# Arrêter le serveur (Ctrl+C)
# Redémarrer
npm start
```

---

## 🧪 Tests de Dépannage

### **Test 1: Vérifier l'Authentification**

Ajouter temporairement dans `routes_postgres/events.js`:
```javascript
router.get('/', authenticateToken, async (req, res) => {
  console.log('═══════════════════════════════════════');
  console.log('🔐 Utilisateur authentifié:');
  console.log('   ID:', req.user.id);
  console.log('   Headers:', req.headers.authorization?.substring(0, 50) + '...');
  console.log('═══════════════════════════════════════');
  
  // ... reste du code
});
```

### **Test 2: Vérifier les Mémos Retournés**

Ajouter dans `services/eventService.js`:
```javascript
async function getEvents(filters = {}) {
  // ... code existant
  
  const result = await pool.query(query, params);
  
  // 🔍 DEBUG: Afficher les mémos retournés
  const memos = result.rows.filter(r => r.type === 'memo');
  if (memos.length > 0) {
    console.log('📝 Mémos retournés:', memos.map(m => ({
      id: m.id,
      title: m.title,
      created_by: m.created_by,
      created_by_name: m.created_by_name
    })));
  }
  
  return { success: true, events: result.rows };
}
```

### **Test 3: Vérifier dans le Frontend**

Ouvrir la console du navigateur (F12) et vérifier:
```javascript
// Dans TodayTasksWidget.jsx, ajouter:
console.log('📊 Événements chargés:', eventsResponse.data.events);
console.log('📝 Mémos filtrés:', eventsResponse.data.events.filter(e => e.type === 'memo'));
```

---

## 🔧 Solutions Rapides

### **Solution 1: Vider le Cache**
```bash
# Chrome/Edge
Cmd+Shift+Delete (Mac) ou Ctrl+Shift+Delete (Windows)
→ Cocher "Cached images and files"
→ Cliquer "Clear data"

# Firefox
Cmd+Shift+Delete (Mac) ou Ctrl+Shift+Delete (Windows)
→ Cocher "Cache"
→ Cliquer "Clear Now"
```

### **Solution 2: Mode Incognito**
```bash
# Tester dans une fenêtre de navigation privée
Cmd+Shift+N (Mac) ou Ctrl+Shift+N (Windows)
```

### **Solution 3: Redémarrer Tout**
```bash
# 1. Arrêter le serveur backend
Ctrl+C

# 2. Arrêter le serveur frontend
Ctrl+C

# 3. Redémarrer
npm start
```

### **Solution 4: Corriger les Mémos Existants**
```sql
-- Mettre à jour tous les mémos sans created_by
UPDATE events
SET created_by = 1  -- ID de l'admin par défaut
WHERE type = 'memo' AND created_by IS NULL;

-- Ou supprimer les mémos problématiques
DELETE FROM events
WHERE type = 'memo' AND created_by != 1 AND created_by != 2;
```

---

## 📋 Checklist de Vérification

- [ ] Serveur backend redémarré
- [ ] Serveur frontend redémarré
- [ ] Cache navigateur vidé
- [ ] Test en mode incognito
- [ ] Vérifier les logs serveur
- [ ] Vérifier les logs console navigateur
- [ ] Exécuter `node scripts/test-api-memos.js`
- [ ] Vérifier la base de données directement

---

## 🎯 Si le Problème Persiste

### **1. Identifier le Mémo Problématique**
```sql
-- Trouver le mémo qui s'affiche mal
SELECT 
  e.id,
  e.title,
  e.type,
  e.created_by,
  u.first_name || ' ' || u.last_name as creator_name,
  u.role as creator_role
FROM events e
LEFT JOIN users u ON e.created_by = u.id
WHERE e.type = 'memo' AND e.deleted_at IS NULL
ORDER BY e.created_at DESC;
```

### **2. Vérifier Qui Devrait le Voir**
```sql
-- Ce mémo devrait être visible par l'utilisateur avec ID = created_by
SELECT 
  id, 
  title, 
  created_by,
  'Devrait être visible par utilisateur ID: ' || created_by as note
FROM events
WHERE id = XX;  -- ID du mémo problématique
```

### **3. Corriger ou Supprimer**
```sql
-- Option 1: Corriger le created_by
UPDATE events
SET created_by = 1  -- ID du bon utilisateur
WHERE id = XX;

-- Option 2: Supprimer le mémo
DELETE FROM events
WHERE id = XX;
```

---

## 📊 Logs à Surveiller

### **Backend:**
```
🔐 Utilisateur authentifié: { id: 1 }
📋 Filtres appliqués: { user_id: 1, type: 'memo', ... }
📝 Mémos retournés: [{ id: 38, title: 'Mémo personnel', created_by: 1 }]
```

### **Frontend:**
```
📊 Événements chargés: Array(20)
📝 Mémos filtrés: Array(8)
  - Tous avec created_by = 1 (si admin connecté)
```

---

## ✅ Confirmation du Bon Fonctionnement

Après correction, vous devriez voir:

**Admin connecté:**
- ✅ Voit uniquement ses mémos (created_by = 1)
- ✅ Ne voit PAS les mémos du staff

**Staff connecté:**
- ✅ Voit uniquement ses mémos (created_by = 2)
- ✅ Ne voit PAS les mémos de l'admin

---

**Date:** 15/11/2025  
**Version:** 2.2.1  
**Statut:** Filtre SQL testé et fonctionnel
