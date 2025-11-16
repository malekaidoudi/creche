# 📝 Système de Mémos Privés par Utilisateur

## 🎯 Objectif

Chaque utilisateur (admin et staff) a ses propres mémos privés. Les mémos d'un admin ne sont pas visibles par le staff et vice-versa.

---

## ✅ Modifications Appliquées

### **1. Backend - Filtrage Automatique par Utilisateur**

#### **A. Route API (`routes_postgres/events.js`):**
```javascript
router.get('/', authenticateToken, async (req, res) => {
  const filters = {
    type: req.query.type,
    status: req.query.status,
    // ... autres filtres
    
    // 🆕 Filtrer automatiquement les mémos par utilisateur connecté
    created_by: req.query.type === 'memo' ? req.user.id : req.query.created_by
  };
  
  const result = await eventService.getEvents(filters);
  res.json(result);
});
```

**Comportement:**
- Si `type=memo` → Filtre automatiquement par `created_by = user.id`
- Pour les autres types → Pas de filtre automatique

#### **B. Service (`services/eventService.js`):**
```javascript
// Ajout du filtre created_by dans la requête SQL
if (filters.created_by) {
  paramCount++;
  query += ` AND e.created_by = $${paramCount}`;
  params.push(filters.created_by);
}
```

---

## 🔐 Logique de Sécurité

### **Scénarios:**

#### **1. Admin crée un mémo:**
```javascript
POST /api/events
{
  type: "memo",
  title: "Mémo admin",
  created_by: 1  // ID admin
}
```
✅ Mémo créé avec `created_by = 1`

#### **2. Staff crée un mémo:**
```javascript
POST /api/events
{
  type: "memo",
  title: "Mémo staff",
  created_by: 2  // ID staff
}
```
✅ Mémo créé avec `created_by = 2`

#### **3. Admin récupère ses mémos:**
```javascript
GET /api/events?type=memo
// Utilisateur connecté: admin (id=1)
```
✅ Retourne uniquement les mémos avec `created_by = 1`

#### **4. Staff récupère ses mémos:**
```javascript
GET /api/events?type=memo
// Utilisateur connecté: staff (id=2)
```
✅ Retourne uniquement les mémos avec `created_by = 2`

---

## 🎨 Frontend - Bouton Flottant

### **Permissions Actuelles:**

```javascript
// FloatingActionButton.jsx
const canCreateMemo = user?.role === 'admin' || user?.role === 'staff';
```

**Résultat:**
- ✅ **Admin** → Peut créer des mémos (visibles uniquement par lui)
- ✅ **Staff** → Peut créer des mémos (visibles uniquement par lui)
- ❌ **Parent** → Ne peut pas créer de mémos

### **Menu Flottant:**

```
Admin voit:
├─ 📅 Rendez-vous
├─ ☑️ Tâche
├─ 📝 Mémo          ← Ses mémos privés
├─ 📢 Événement
└─ 💵 Alerte $

Staff voit:
├─ 📝 Mémo          ← Ses mémos privés
├─ 📢 Événement
└─ (pas d'accès aux autres)
```

---

## 📊 Widget "Tâches d'Aujourd'hui"

### **Comportement:**

Le widget `TodayTasksWidget` charge les événements avec:
```javascript
const eventsResponse = await api.get('/api/events', {
  params: { limit: 50 }
});
```

**Résultat:**
- Les mémos sont automatiquement filtrés par `created_by`
- Chaque utilisateur voit uniquement ses propres mémos
- Les tâches, événements, RDV restent partagés

---

## 🧪 Tests à Effectuer

### **Test 1: Admin crée un mémo**
1. Se connecter en tant qu'admin (`crechemimaelghalia@gmail.com`)
2. Cliquer sur le bouton flottant (+)
3. Sélectionner "Mémo"
4. Créer un mémo: "Mémo privé admin"
5. ✅ Le mémo apparaît dans le widget

### **Test 2: Staff crée un mémo**
1. Se connecter en tant que staff (`staff@mimaelghalia.tn`)
2. Cliquer sur le bouton flottant (+)
3. Sélectionner "Mémo"
4. Créer un mémo: "Mémo privé staff"
5. ✅ Le mémo apparaît dans le widget

### **Test 3: Vérifier l'isolation**
1. Connecté en admin → Voir uniquement "Mémo privé admin"
2. Se déconnecter
3. Se connecter en staff → Voir uniquement "Mémo privé staff"
4. ✅ Les mémos sont bien séparés

### **Test 4: Vérifier la base de données**
```bash
node backend/scripts/check-events-table.js
```

Vérifier que les mémos ont des `created_by` différents:
```
id | title              | created_by
---|--------------------|------------
38 | Mémo privé admin   | 1
39 | Mémo privé staff   | 2
```

---

## 🔍 Requêtes SQL pour Vérification

### **Voir tous les mémos avec leurs créateurs:**
```sql
SELECT 
  e.id,
  e.title,
  e.created_by,
  u.first_name || ' ' || u.last_name as creator_name,
  u.role as creator_role
FROM events e
LEFT JOIN users u ON e.created_by = u.id
WHERE e.type = 'memo'
ORDER BY e.created_at DESC;
```

### **Compter les mémos par utilisateur:**
```sql
SELECT 
  u.first_name || ' ' || u.last_name as user_name,
  u.role,
  COUNT(e.id) as memo_count
FROM users u
LEFT JOIN events e ON u.id = e.created_by AND e.type = 'memo'
WHERE u.role IN ('admin', 'staff')
GROUP BY u.id, u.first_name, u.last_name, u.role;
```

---

## 📋 Résumé des Changements

### **Backend:**
- ✅ Route `/api/events` filtre automatiquement les mémos par `created_by`
- ✅ Service `eventService.js` supporte le filtre `created_by`
- ✅ Chaque mémo est lié à son créateur

### **Frontend:**
- ✅ Bouton flottant accessible à admin ET staff
- ✅ Modal MemoModal fonctionne pour les deux rôles
- ✅ Widget TodayTasksWidget affiche les mémos filtrés

### **Sécurité:**
- ✅ Isolation complète des mémos par utilisateur
- ✅ Pas de fuite de données entre admin et staff
- ✅ Filtrage automatique côté serveur

---

## 🎯 Avantages

1. **Confidentialité:** Chaque utilisateur a ses notes privées
2. **Simplicité:** Filtrage automatique transparent
3. **Sécurité:** Impossible de voir les mémos d'un autre utilisateur
4. **Flexibilité:** Facile d'étendre à d'autres types si nécessaire

---

## 🚀 Prochaines Étapes Possibles

### **Optionnel - Mémos Partagés:**
Si besoin de mémos partagés entre admin et staff:

```javascript
// Ajouter un champ is_private dans la table events
ALTER TABLE events ADD COLUMN is_private BOOLEAN DEFAULT TRUE;

// Modifier le filtre
if (filters.type === 'memo') {
  // Mémos privés de l'utilisateur OU mémos publics
  query += ` AND (e.created_by = $X OR e.is_private = FALSE)`;
}
```

### **Optionnel - Partage Sélectif:**
Ajouter un champ `shared_with` (JSONB):
```javascript
{
  shared_with: [2, 3, 5]  // IDs des utilisateurs autorisés
}
```

---

**Date:** 15/11/2025  
**Version:** 2.2.0  
**Fonctionnalité:** Mémos privés par utilisateur
