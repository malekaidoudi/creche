# 📱 Menu Latéral Transparent - Documentation

## 🎯 Objectif

Remplacer le bouton flottant par un **menu latéral transparent** à droite de l'écran pour les utilisateurs admin et staff, offrant un accès rapide aux actions principales.

---

## ✨ Fonctionnalités

### **Menu Latéral (Admin & Staff)**

**Position:** Fixé à droite de l'écran, centré verticalement

**Apparence:**
- Boutons semi-transparents avec effet de verre (backdrop-blur)
- Dégradés de couleurs selon l'action
- Labels qui apparaissent au survol
- Animations fluides et modernes

**Actions Disponibles:**

#### **Pour le Staff:**
1. **📝 Mémo Personnel** (Jaune)
   - Créer des notes privées
   - Visibles uniquement par le créateur

2. **💬 Message Staff** (Bleu)
   - Envoyer des messages/événements
   - Communication interne

#### **Pour l'Admin (en plus):**
3. **✅ Nouvelle Tâche** (Violet)
   - Créer des tâches
   - Assigner à des membres

4. **💰 Alerte Paiement** (Rouge)
   - Envoyer des alertes de paiement
   - Notifier les parents

---

## 🎨 Design

### **Boutons:**
```
┌─────────────────────────────┐
│                             │
│  [Label au survol] ◄─┐      │
│                      │      │
│                   ┌──┴──┐   │
│                   │ 📝  │   │ ← Bouton icône
│                   └─────┘   │
│                             │
└─────────────────────────────┘
```

### **Couleurs:**
- **Mémo:** Jaune/Ambre (`from-yellow-500 to-amber-500`)
- **Message:** Bleu/Cyan (`from-blue-500 to-cyan-500`)
- **Tâche:** Violet/Rose (`from-purple-500 to-pink-500`)
- **Paiement:** Rouge/Orange (`from-red-500 to-orange-500`)

### **Animations:**
- **Survol:** Agrandissement (scale 110%) + Déplacement vers la gauche
- **Label:** Apparition en fondu avec translation
- **Shadow:** Augmentation de l'ombre au survol

---

## 📂 Structure des Fichiers

### **Nouveau Composant:**
```
frontend/src/components/ui/SideMenu.jsx
```

**Responsabilités:**
- Afficher les boutons d'action selon les permissions
- Gérer l'ouverture des modals
- Animations et effets visuels
- Dispatch des événements de mise à jour

### **Fichier Modifié:**
```
frontend/src/layouts/DashboardLayout.jsx
```

**Changements:**
- Import de `SideMenu` et `useAuth`
- Logique conditionnelle: `showSideMenu` selon le rôle
- Affichage: `SideMenu` pour admin/staff, `FloatingActionButton` pour les autres

---

## 🔧 Logique d'Affichage

### **Règles:**
```javascript
// Admin et Staff → SideMenu
if (user.role === 'admin' || user.role === 'staff') {
  return <SideMenu />;
}

// Autres rôles → FloatingActionButton (si permissions)
return <FloatingActionButton />;
```

### **Permissions par Rôle:**

| Action           | Admin | Staff | Parent |
|------------------|-------|-------|--------|
| Mémo Personnel   | ✅    | ✅    | ❌     |
| Message Staff    | ✅    | ✅    | ❌     |
| Nouvelle Tâche   | ✅    | ❌    | ❌     |
| Alerte Paiement  | ✅    | ❌    | ❌     |

---

## 💻 Code Principal

### **SideMenu.jsx - Structure:**

```jsx
export default function SideMenu() {
  const { user } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);
  
  // États des modals
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  // ...

  // Configuration des items du menu
  const menuItems = [
    {
      id: 'memo',
      icon: StickyNote,
      label: 'Mémo Personnel',
      color: 'from-yellow-500 to-amber-500',
      show: canCreateMemo,
      onClick: () => setShowMemoModal(true)
    },
    // ...
  ].filter(item => item.show);

  return (
    <>
      {/* Menu latéral */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        {menuItems.map((item) => (
          <MenuItem key={item.id} {...item} />
        ))}
      </div>

      {/* Modals */}
      {showMemoModal && <MemoModal ... />}
      {/* ... */}
    </>
  );
}
```

---

## 🎯 Avantages

### **Par rapport au bouton flottant:**

1. **Accessibilité:**
   - Toujours visible (pas besoin de cliquer pour ouvrir)
   - Actions directement accessibles
   - Labels explicites au survol

2. **UX Moderne:**
   - Design transparent et élégant
   - Animations fluides
   - Feedback visuel immédiat

3. **Gain d'Espace:**
   - Pas de menu qui s'ouvre et cache le contenu
   - Icônes compactes sur le côté
   - Pas d'overlay nécessaire

4. **Clarté:**
   - Chaque action a sa couleur
   - Icônes reconnaissables
   - Labels au survol pour confirmation

---

## 📱 Responsive

### **Desktop (> 1024px):**
- Menu fixé à droite
- Boutons de 56x56px
- Labels au survol

### **Tablet (768px - 1024px):**
- Menu fixé à droite
- Boutons légèrement plus petits
- Labels au survol

### **Mobile (< 768px):**
- **Option 1:** Menu caché, accessible via bouton
- **Option 2:** Boutons plus petits en bas à droite
- **Option 3:** Retour au FloatingActionButton

**Recommandation:** Utiliser FloatingActionButton sur mobile pour économiser l'espace.

---

## 🧪 Tests

### **Test 1: Admin**
```
1. Se connecter en admin
2. Vérifier présence du menu latéral à droite
3. Survoler chaque bouton → Label apparaît
4. Cliquer sur "Mémo" → Modal s'ouvre
5. Cliquer sur "Tâche" → Modal s'ouvre
6. Cliquer sur "Paiement" → Modal s'ouvre
```

### **Test 2: Staff**
```
1. Se connecter en staff
2. Vérifier présence du menu latéral à droite
3. Vérifier 2 boutons: Mémo + Message
4. Pas de bouton Tâche ni Paiement
5. Cliquer sur "Mémo" → Modal s'ouvre
6. Créer un mémo → Événement dispatché
```

### **Test 3: Parent**
```
1. Se connecter en parent
2. Vérifier absence du menu latéral
3. Vérifier présence du FloatingActionButton (si permissions)
```

---

## 🎨 Personnalisation

### **Changer les Couleurs:**
```jsx
const menuItems = [
  {
    id: 'memo',
    color: 'from-yellow-500 to-amber-500',  // ← Modifier ici
    hoverColor: 'hover:from-yellow-600 hover:to-amber-600',
    // ...
  }
];
```

### **Changer la Position:**
```jsx
// Actuellement: Droite, centré verticalement
<div className="fixed right-0 top-1/2 -translate-y-1/2">

// Gauche:
<div className="fixed left-0 top-1/2 -translate-y-1/2">

// En haut à droite:
<div className="fixed right-0 top-20">

// En bas à droite:
<div className="fixed right-0 bottom-20">
```

### **Changer la Taille:**
```jsx
// Actuellement: 56x56px (w-14 h-14)
<button className="w-14 h-14">

// Plus petit: 48x48px
<button className="w-12 h-12">

// Plus grand: 64x64px
<button className="w-16 h-16">
```

---

## 🔄 Événements Dispatché

Après création réussie d'un mémo/tâche/événement:

```javascript
window.dispatchEvent(new CustomEvent('taskUpdated'));
```

**Écouteurs:**
- `TodayTasksWidget` → Recharge les tâches
- Autres widgets → Peuvent s'abonner à cet événement

---

## 📊 Comparaison

### **FloatingActionButton (Ancien):**
```
✅ Compact
✅ Familier
❌ Nécessite un clic pour voir les options
❌ Menu peut cacher le contenu
❌ Moins accessible
```

### **SideMenu (Nouveau):**
```
✅ Toujours visible
✅ Accès direct aux actions
✅ Design moderne
✅ Meilleure UX
✅ Pas d'overlay
❌ Prend un peu d'espace sur le côté
```

---

## 🚀 Améliorations Futures

### **Possibles:**

1. **Mode Compact:**
   - Bouton pour réduire/agrandir le menu
   - Icônes seules vs Icônes + Labels

2. **Raccourcis Clavier:**
   - `Ctrl+M` → Ouvrir Mémo
   - `Ctrl+T` → Ouvrir Tâche
   - etc.

3. **Notifications:**
   - Badge sur les boutons
   - Nombre de tâches en attente
   - Alertes non lues

4. **Drag & Drop:**
   - Réorganiser les boutons
   - Personnaliser l'ordre

5. **Thème:**
   - Mode sombre/clair
   - Couleurs personnalisables
   - Transparence ajustable

---

## ✅ Résumé

### **Ce qui a été fait:**
- ✅ Création du composant `SideMenu.jsx`
- ✅ Intégration dans `DashboardLayout.jsx`
- ✅ Logique conditionnelle selon le rôle
- ✅ Permissions par rôle
- ✅ Animations et effets visuels
- ✅ Dispatch d'événements

### **Résultat:**
- ✅ **Admin:** Voit 4 boutons (Mémo, Message, Tâche, Paiement)
- ✅ **Staff:** Voit 2 boutons (Mémo, Message)
- ✅ **Parent:** Voit le FloatingActionButton (si permissions)

---

**Date:** 15/11/2025  
**Version:** 2.3.0  
**Fonctionnalité:** Menu latéral transparent pour admin/staff
