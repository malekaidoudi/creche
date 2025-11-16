# 🔧 CORRECTION - Problème d'Authentification Mémos

## 🚨 Problème Identifié

**Symptôme:**
```
Staff crée un mémo → Affiché comme créé par "Admin Principal"
```

**Cause:**
Le fichier `routes_postgres/events.js` utilisait un **faux middleware d'authentification** avec un fallback qui mettait toujours `user.id = 1` (admin):

```javascript
// ❌ ANCIEN CODE (INCORRECT)
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token manquant' });
  }
  // 🔴 PROBLÈME: Fallback vers ID 1 (admin)
  req.user = { id: req.headers['x-user-id'] || 1 };
  next();
};
```

**Résultat:**
- ✅ Admin crée un mémo → `created_by = 1` ✅ Correct
- ❌ Staff crée un mémo → `created_by = 1` ❌ INCORRECT (devrait être 2)

---

## ✅ Correction Appliquée

### **Modification: `routes_postgres/events.js`**

```javascript
// ✅ NOUVEAU CODE (CORRECT)
const { authenticateToken } = require('../middleware/auth');

// Plus besoin de définir le middleware, on utilise le vrai
```

**Le vrai middleware (`middleware/auth.js`):**
```javascript
authenticateToken: (req, res, next) => {
  const token = authHeader && authHeader.split(' ')[1];
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    
    // ✅ Utilise le VRAI user.id du token JWT
    req.user = user;  // { id: 2, role: 'staff', ... }
    next();
  });
}
```

**Résultat après correction:**
- ✅ Admin crée un mémo → `created_by = 1` ✅ Correct
- ✅ Staff crée un mémo → `created_by = 2` ✅ Correct

---

## 🔧 Correction des Mémos Existants

### **Problème:**
Les mémos créés par le staff AVANT la correction ont `created_by = 1` (admin).

### **Solution:**

#### **Option 1: Script Interactif (Recommandé)**
```bash
node backend/scripts/fix-memos-created-by.js
```

**Fonctionnalités:**
1. Affiche tous les mémos avec leurs créateurs
2. Identifie les problèmes
3. Permet de:
   - Supprimer les mémos du staff créés par erreur
   - Corriger un mémo spécifique
   - Afficher les détails d'un mémo

#### **Option 2: SQL Direct**

**Voir les mémos problématiques:**
```sql
SELECT 
  e.id,
  e.title,
  e.created_by,
  u.first_name || ' ' || u.last_name as creator_name,
  u.role
FROM events e
LEFT JOIN users u ON e.created_by = u.id
WHERE e.type = 'memo' AND e.deleted_at IS NULL
ORDER BY e.created_at DESC;
```

**Supprimer les mémos du staff (si créés par erreur):**
```sql
-- Trouver l'ID du staff
SELECT id, first_name, last_name FROM users WHERE role = 'staff';
-- Résultat: id = 2

-- Supprimer les mémos créés par le staff mais marqués comme admin
DELETE FROM events
WHERE type = 'memo' 
  AND created_by = 1  -- Marqués comme admin
  AND title LIKE '%staff%';  -- Ajuster selon le titre
```

**Corriger un mémo spécifique:**
```sql
-- Changer le créateur d'un mémo
UPDATE events
SET created_by = 2  -- ID du staff
WHERE id = XX;  -- ID du mémo à corriger
```

---

## 🧪 Tests de Vérification

### **Test 1: Créer un Mémo en tant que Staff**

1. Se connecter avec `staff@mimaelghalia.tn` / `password`
2. Cliquer sur le bouton flottant (+)
3. Sélectionner "Mémo"
4. Créer un mémo: "Test mémo staff"
5. ✅ Vérifier qu'il affiche "Fatma Ben Ali" en bas (pas "Admin Principal")

### **Test 2: Vérifier en Base de Données**

```bash
node backend/scripts/check-events-table.js
```

**Résultat attendu:**
```
Derniers mémos:
┌─────────┬────┬──────────────────┬────────┬────────────┬───────────────────┐
│ (index) │ id │ title            │ type   │ created_by │ created_by_name   │
├─────────┼────┼──────────────────┼────────┼────────────┼───────────────────┤
│ 0       │ 40 │ 'Test mémo staff'│ 'memo' │ 2          │ 'Fatma Ben Ali'   │
│ 1       │ 39 │ 'Mémo admin'     │ 'memo' │ 1          │ 'Admin Principal' │
└─────────┴────┴──────────────────┴────────┴────────────┴───────────────────┘
```

### **Test 3: Vérifier l'Isolation**

```bash
node backend/scripts/test-memos-prives.js
```

**Résultat attendu:**
```
✅ Admin voit uniquement ses mémos (created_by = 1)
✅ Staff voit uniquement ses mémos (created_by = 2)
✅ TEST RÉUSSI: Les mémos sont correctement isolés
```

---

## 📋 Checklist Post-Correction

- [ ] Serveur backend redémarré
- [ ] Test création mémo en tant que staff
- [ ] Vérification en base de données
- [ ] Mémos existants corrigés ou supprimés
- [ ] Test d'isolation réussi
- [ ] Cache navigateur vidé

---

## 🎯 Actions Immédiates

### **1. Redémarrer le Serveur**
```bash
# Arrêter le serveur (Ctrl+C dans le terminal)
# Redémarrer
npm start
```

### **2. Vider le Cache du Navigateur**
```bash
# Chrome/Edge/Firefox
Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
```

### **3. Corriger les Mémos Existants**
```bash
# Option interactive
node backend/scripts/fix-memos-created-by.js

# Choisir l'option 1 pour supprimer les mémos du staff
# Ou l'option 2 pour corriger un mémo spécifique
```

### **4. Tester la Création**
```bash
1. Se connecter en staff
2. Créer un nouveau mémo
3. Vérifier qu'il affiche "Fatma Ben Ali"
```

---

## 📊 Résumé de la Correction

### **Avant:**
```
Admin crée mémo → created_by = 1 ✅
Staff crée mémo → created_by = 1 ❌ (toujours admin!)
```

### **Après:**
```
Admin crée mémo → created_by = 1 ✅
Staff crée mémo → created_by = 2 ✅ (staff correct!)
```

---

## 🔒 Garanties

- ✅ **Authentification JWT:** Utilise le vrai token
- ✅ **User ID Correct:** Extrait du token décodé
- ✅ **Pas de Fallback:** Plus de `|| 1` qui force l'admin
- ✅ **Isolation:** Chaque utilisateur voit ses propres mémos
- ✅ **Sécurité:** Impossible de créer un mémo au nom d'un autre

---

## 📄 Fichiers Modifiés

1. **`routes_postgres/events.js`** - Utilise le vrai middleware auth
2. **`scripts/fix-memos-created-by.js`** - Script de correction (nouveau)

---

**Date:** 15/11/2025  
**Version:** 2.2.2  
**Statut:** ✅ Correction appliquée - Redémarrage requis
