# 🔍 DEBUG: MENU LATÉRAL PARENTS

## 🎯 Problème

Le menu latéral n'est pas visible pour les parents malgré les corrections.

---

## 📋 Logs Ajoutés

### **1. ParentLayout.jsx**
```javascript
console.log('🔍 ParentLayout - User:', user);
```

### **2. SideMenu.jsx**
```javascript
console.log('🔍 SideMenu - User:', user);
console.log('🔍 SideMenu - Role:', user?.role);
console.log('🔍 SideMenu - isParent:', isParent);
console.log('🔍 SideMenu - Should show:', ...);
console.log('✅ SideMenu - Menu affiché');
// OU
console.log('❌ SideMenu - Menu caché, aucune permission');
```

---

## 🧪 Test à Effectuer

### **Étape 1: Rafraîchir la page**
```bash
# Dans le navigateur
Ctrl+Shift+R (ou Cmd+Shift+R sur Mac)
```

### **Étape 2: Ouvrir la console**
```bash
F12 → Console
```

### **Étape 3: Se connecter en parent**
```
Email: parent@creche.com
Mot de passe: parent123
```

### **Étape 4: Chercher les logs**

Dans la console, chercher:
```
🔍 ParentLayout - User: ...
🔍 SideMenu - User: ...
🔍 SideMenu - Role: ...
🔍 SideMenu - isParent: ...
🔍 SideMenu - Should show: ...
```

---

## 🔍 Diagnostic

### **Scénario 1: Aucun log SideMenu**

**Symptôme:**
```
🔍 ParentLayout - User: { ... }
(Pas de logs SideMenu)
```

**Cause:** SideMenu ne se charge pas du tout

**Solution:** Vérifier que `<SideMenu />` est bien dans ParentLayout.jsx

---

### **Scénario 2: User null dans SideMenu**

**Symptôme:**
```
🔍 ParentLayout - User: { id: 1, role: 'parent', ... }
🔍 SideMenu - User: null
```

**Cause:** Problème de contexte AuthContext

**Solution:** SideMenu utilise un contexte différent ou user pas encore chargé

---

### **Scénario 3: Role incorrect**

**Symptôme:**
```
🔍 SideMenu - User: { id: 1, role: 'Parent', ... }
🔍 SideMenu - Role: Parent
🔍 SideMenu - isParent: false
```

**Cause:** Role avec majuscule au lieu de minuscule

**Solution:** Vérifier la base de données, le role doit être exactement `'parent'`

---

### **Scénario 4: Menu caché**

**Symptôme:**
```
🔍 SideMenu - User: { id: 1, role: 'parent', ... }
🔍 SideMenu - Role: parent
🔍 SideMenu - isParent: true
🔍 SideMenu - Should show: true
❌ SideMenu - Menu caché, aucune permission
```

**Cause:** Logique de condition incorrecte

**Solution:** Bug dans la condition if

---

### **Scénario 5: Menu affiché mais invisible**

**Symptôme:**
```
🔍 SideMenu - User: { id: 1, role: 'parent', ... }
🔍 SideMenu - Role: parent
🔍 SideMenu - isParent: true
🔍 SideMenu - Should show: true
✅ SideMenu - Menu affiché
```

**Cause:** Problème CSS (z-index, position, etc.)

**Solution:** Vérifier les styles du menu

---

## 📊 Résultats Attendus

### **Logs Corrects:**
```
🔍 ParentLayout - User: {
  id: 1,
  email: "parent@creche.com",
  first_name: "Parent",
  last_name: "Test",
  role: "parent",
  ...
}

🔍 SideMenu - User: {
  id: 1,
  email: "parent@creche.com",
  role: "parent",
  ...
}

🔍 SideMenu - Role: parent
🔍 SideMenu - isParent: true
🔍 SideMenu - Should show: true
✅ SideMenu - Menu affiché
```

### **Menu Visible:**
- ✅ Menu flottant à droite de l'écran
- ✅ 4 boutons visibles:
  - 💬 Messages
  - 📢 Annonces
  - 📊 Rapport de présence
  - 📅 Demander un RDV

---

## 🛠️ Actions Correctives

### **Si User null:**
```javascript
// Vérifier AuthContext dans App.jsx
<AuthProvider>
  <Router>
    <Routes>
      ...
    </Routes>
  </Router>
</AuthProvider>
```

### **Si Role incorrect:**
```sql
-- Vérifier dans la base de données
SELECT id, email, role FROM users WHERE email = 'parent@creche.com';

-- Corriger si nécessaire
UPDATE users SET role = 'parent' WHERE email = 'parent@creche.com';
```

### **Si Menu caché malgré isParent = true:**
```javascript
// Dans SideMenu.jsx, simplifier la condition:
if (!user) {
  console.log('❌ SideMenu - Pas d\'utilisateur');
  return null;
}

if (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'parent') {
  console.log('❌ SideMenu - Role non autorisé:', user.role);
  return null;
}
```

---

## 📝 Checklist

- [ ] Rafraîchir la page (Ctrl+Shift+R)
- [ ] Ouvrir la console (F12)
- [ ] Se connecter en parent
- [ ] Vérifier les logs ParentLayout
- [ ] Vérifier les logs SideMenu
- [ ] Noter le scénario correspondant
- [ ] Appliquer la solution appropriée

---

## 🎯 Prochaine Étape

**Après avoir identifié le scénario dans la console, partager:**
1. Les logs complets
2. Le scénario correspondant
3. La solution à appliquer

**Le diagnostic sera alors précis et la correction rapide ! 🔍**
