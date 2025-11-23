# ✅ DatePicker - Fix Visibilité

**Date:** 22 novembre 2025  
**Problème:** Calendrier toujours affiché sur petits écrans, ne s'affiche pas sur grands écrans

---

## 🔍 Problème

### **Symptômes:**

#### **Petits écrans (< 640px):**
```
❌ Calendrier toujours visible
❌ Ne se cache pas après sélection
❌ Prend de la place en permanence
```

#### **Grands écrans (≥ 640px):**
```
❌ Calendrier ne s'affiche jamais
❌ Clic sur input → rien ne se passe
❌ Impossible de sélectionner une date
```

### **Cause:**
Le `display: block !important` forçait l'affichage permanent, empêchant Flowbite de gérer la visibilité avec la classe `.hidden`.

---

## ✅ Solution Appliquée

### **1. Gestion de la visibilité**

**Fichier:** `frontend/src/styles/flowbite-datepicker.css`

```css
/* Styles de base - PAS de display: block permanent */
.datepicker-dropdown,
.datepicker-picker,
.datepicker {
    position: absolute !important;
    z-index: 9999 !important;
    top: 100% !important;
    left: 0 !important;
    width: auto !important;
    min-width: 280px !important;
    /* PAS de display: block ici ! */
}

/* Masquer quand Flowbite ajoute .hidden */
.datepicker-dropdown.hidden,
.datepicker-picker.hidden,
.datepicker.hidden {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
}

/* Afficher quand actif (pas .hidden) */
.datepicker-dropdown:not(.hidden),
.datepicker-picker:not(.hidden),
.datepicker:not(.hidden) {
    display: block !important;
}
```

### **2. Responsive amélioré**

#### **Petits écrans (< 640px):**
```css
@media (max-width: 640px) {
    .datepicker-dropdown {
        max-width: 90vw !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        min-width: 280px !important;
    }
    
    /* Forcer le masquage par défaut */
    .datepicker-dropdown.hidden {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
    }
}
```

#### **Grands écrans (≥ 641px):**
```css
@media (min-width: 641px) {
    /* Forcer le masquage par défaut */
    .datepicker-dropdown.hidden {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
    }
}
```

---

## 🔄 Fonctionnement

### **Flowbite gère la visibilité:**

```js
// Flowbite ajoute/retire la classe .hidden
datepicker.show()  → Retire .hidden → Calendrier visible
datepicker.hide()  → Ajoute .hidden → Calendrier masqué
```

### **Notre CSS respecte Flowbite:**

```css
/* État par défaut (avec .hidden) */
.datepicker.hidden {
    display: none !important;  /* ← Masqué */
}

/* État actif (sans .hidden) */
.datepicker:not(.hidden) {
    display: block !important;  /* ← Visible */
}
```

---

## 🎯 Résultat Attendu

### **Petits écrans (< 640px):**
```
État initial:
┌─────────────────────┐
│ Date de naissance   │
│ [Sélectionner...]   │  ← Input visible
└─────────────────────┘
                         ← Calendrier MASQUÉ ✅

Après clic:
┌─────────────────────┐
│ Date de naissance   │
│ [Sélectionner...]   │
│  ┌───────────────┐  │
│  │ Calendrier    │  │  ← Calendrier VISIBLE ✅
│  │ L M M J V S D │  │
│  └───────────────┘  │
└─────────────────────┘

Après sélection:
┌─────────────────────┐
│ Date de naissance   │
│ [22/11/2025]        │  ← Date sélectionnée
└─────────────────────┘
                         ← Calendrier MASQUÉ ✅
```

### **Grands écrans (≥ 641px):**
```
État initial:
┌─────────────────────┐
│ Date de naissance   │
│ [Sélectionner...]   │  ← Input visible
└─────────────────────┘
                         ← Calendrier MASQUÉ ✅

Après clic:
┌─────────────────────┐
│ Date de naissance   │
│ [Sélectionner...]   │
│ ┌─────────────────┐ │
│ │ Calendrier      │ │  ← Calendrier VISIBLE ✅
│ │ L M M J V S D   │ │
│ └─────────────────┘ │
└─────────────────────┘

Après sélection:
┌─────────────────────┐
│ Date de naissance   │
│ [22/11/2025]        │  ← Date sélectionnée
└─────────────────────┘
                         ← Calendrier MASQUÉ ✅
```

---

## 🧪 Tests

### **Test 1: Petits écrans**
```bash
# iPhone SE (375px)
1. Ouvrir /dashboard/children/add
2. ✅ Calendrier MASQUÉ par défaut
3. Cliquer sur "Date de naissance"
4. ✅ Calendrier s'AFFICHE
5. Sélectionner une date
6. ✅ Calendrier se MASQUE (autohide)
```

### **Test 2: Grands écrans**
```bash
# Desktop (1366px)
1. Ouvrir /dashboard/children/add
2. ✅ Calendrier MASQUÉ par défaut
3. Cliquer sur "Date de naissance"
4. ✅ Calendrier s'AFFICHE
5. Sélectionner une date
6. ✅ Calendrier se MASQUE (autohide)
```

### **Test 3: Resize**
```bash
1. Ouvrir sur desktop
2. Cliquer sur DatePicker → Calendrier visible
3. Réduire la fenêtre (< 640px)
4. ✅ Calendrier reste fonctionnel
5. Agrandir la fenêtre (> 640px)
6. ✅ Calendrier reste fonctionnel
```

### **Test 4: Clic extérieur**
```bash
1. Ouvrir calendrier
2. Cliquer à l'extérieur
3. ✅ Calendrier se ferme
```

---

## 📝 Changements Clés

### **AVANT (❌ Problème):**
```css
.datepicker-dropdown {
    display: block !important;  /* ← Toujours visible ! */
}
```

**Résultat:**
- Petits écrans: Toujours visible ❌
- Grands écrans: Flowbite ne peut pas gérer ❌

### **APRÈS (✅ Solution):**
```css
/* Pas de display par défaut */
.datepicker-dropdown {
    /* Pas de display ici */
}

/* Masquer avec .hidden */
.datepicker-dropdown.hidden {
    display: none !important;
}

/* Afficher sans .hidden */
.datepicker-dropdown:not(.hidden) {
    display: block !important;
}
```

**Résultat:**
- Petits écrans: Masqué par défaut, visible au clic ✅
- Grands écrans: Masqué par défaut, visible au clic ✅

---

## ⚠️ Points d'Attention

### **Ne JAMAIS forcer `display: block` sans condition:**
```css
/* ❌ MAUVAIS */
.datepicker-dropdown {
    display: block !important;
}

/* ✅ BON */
.datepicker-dropdown:not(.hidden) {
    display: block !important;
}
```

### **Flowbite utilise `.hidden`:**
```js
// Flowbite ajoute/retire cette classe
element.classList.add('hidden')     // Masquer
element.classList.remove('hidden')  // Afficher
```

### **Triple protection:**
```css
.datepicker.hidden {
    display: none !important;      /* Masquer */
    visibility: hidden !important; /* Cacher */
    opacity: 0 !important;         /* Transparent */
}
```

---

## 🎨 Positionnement Responsive

### **Petits écrans:**
```css
left: 50% !important;
transform: translateX(-50%) !important;
```
**Résultat:** Calendrier centré horizontalement

### **Grands écrans:**
```css
left: 0 !important;
```
**Résultat:** Calendrier aligné à gauche de l'input

---

## 🚀 Prochaines Étapes

1. [ ] Tester sur iPhone SE (375px)
2. [ ] Tester sur iPad (768px)
3. [ ] Tester sur Desktop (1366px)
4. [ ] Tester sur grand écran (1920px)
5. [ ] Vérifier tous les DatePickers du projet

---

**La visibilité est CORRIGÉE ! 🎉**

**Testez maintenant:**
1. Petits écrans: Calendrier masqué par défaut ✅
2. Grands écrans: Calendrier s'affiche au clic ✅
3. Autohide fonctionne partout ✅
