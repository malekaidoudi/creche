# 🎯 GUIDE COMPLET - SYSTÈME D'ABSENCES

Date: 09/11/2025 11:55
Version: 4.0.0

---

## ⚠️ IMPORTANT À COMPRENDRE

### Le système fonctionne en 2 étapes :

1. **Parent crée une demande** → Statut "En attente"
2. **Admin/Staff valide la demande** → Statut "Validé"

### ⚠️ Les fonctionnalités suivantes NE SONT VISIBLES QUE SI LA DEMANDE EST VALIDÉE :

- ✅ Message "Confirmé par le personnel" (parent)
- ✅ Icône téléphone pour appeler (parent)
- ✅ Apparition dans le dashboard "Absences du jour" (admin/staff)

---

## 📋 FLUX COMPLET ÉTAPE PAR ÉTAPE

### ÉTAPE 1: Parent crée une demande d'absence

**Compte:** `parent@creche.com` / `parent123`

1. Se connecter en tant que parent
2. Aller dans **"Demandes d'absence"**
3. Cliquer sur **"Nouvelle demande"**
4. Remplir le formulaire :
   - Enfant: Fatima Ben Ali
   - Date: 09/11/2025 (Aujourd'hui)
   - Raison: Visite médicale
   - Notes: (optionnel)
5. Cliquer sur **"Envoyer la demande"**

**Résultat:**
```
┌─────────────────────────────────────┐
│ 👶 Fatima Ben Ali                   │
│ ⏰ En attente                        │
│ 📅 09/11/2025 (Aujourd'hui)         │
│ Raison: Visite médicale             │
└─────────────────────────────────────┘
```

**À ce stade:**
- ❌ Pas de message "Confirmé par le personnel"
- ❌ Pas d'icône téléphone
- ❌ N'apparaît PAS dans le dashboard "Absences du jour"
- ✅ Notification envoyée à l'admin/staff

---

### ÉTAPE 2: Admin/Staff reçoit la notification

**Compte:** `crechemimaelghalia@gmail.com` / `password`

1. Se connecter en tant qu'admin
2. Voir la notification (cloche en haut à droite)
3. Notification affichée :
   ```
   🔔 Nouvelle demande d'absence - Fatima Ben Ali
   Parent: [Nom du parent] a créé une demande d'absence
   pour Fatima Ben Ali du 09/11/2025.
   Raison: Visite médicale
   ```

**⚠️ IMPORTANT:** 
Voir la notification ne change PAS le statut de la demande !
Il faut aller dans la page de gestion pour valider.

---

### ÉTAPE 3: Admin/Staff valide la demande

**Toujours connecté en admin**

#### Option A: Via le menu

1. Menu latéral → **"Gestion"**
2. Cliquer sur **"Gestion des absences"**
3. URL: `http://localhost:5173/dashboard/absence-management`

#### Option B: URL directe

Aller directement sur: `http://localhost:5173/dashboard/absence-management`

#### Sur la page de gestion :

```
┌─────────────────────────────────────────┐
│ Gestion des demandes d'absence          │
├─────────────────────────────────────────┤
│ [Total: 1] [En attente: 1] [Validées: 0]│
├─────────────────────────────────────────┤
│ Filtres: [Tous] [En attente] [Validées] │
├─────────────────────────────────────────┤
│ 👶 Fatima Ben Ali                       │
│ 👤 Parent: [Nom du parent]              │
│ 📅 09/11/2025                           │
│ Raison: Visite médicale                 │
│ ⏰ En attente         [✓ Valider]  ← CLIQUER ICI
└─────────────────────────────────────────┘
```

4. Cliquer sur le bouton **"✓ Valider"**
5. Message de succès: "Demande validée"
6. Le statut change automatiquement à "Validé"

**Résultat après validation:**
```
┌─────────────────────────────────────────┐
│ 👶 Fatima Ben Ali                       │
│ 👤 Parent: [Nom du parent]              │
│ 📅 09/11/2025                           │
│ Raison: Visite médicale                 │
│ ✅ Validé                                │
│ ✓ Validé le 09/11/2025 à 11:55         │
└─────────────────────────────────────────┘
```

---

### ÉTAPE 4: Parent voit la validation

**Se reconnecter en parent:** `parent@creche.com` / `parent123`

1. Aller dans **"Demandes d'absence"**
2. Rafraîchir la page (F5)

**Résultat:**
```
┌─────────────────────────────────────────┐
│ 👶 Fatima Ben Ali          📞 ✅ Validé │
│ 📅 09/11/2025 (Aujourd'hui)             │
│ Raison: Visite médicale                 │
│ ✓ Confirmé par le personnel             │
└─────────────────────────────────────────┘
```

**Maintenant visible:**
- ✅ Statut "Validé" (vert)
- ✅ Message "✓ Confirmé par le personnel"
- ✅ Icône téléphone 📞 (car absence aujourd'hui ET validée)

3. Cliquer sur l'icône téléphone 📞
4. L'appel vers la crèche se lance automatiquement

---

### ÉTAPE 5: Dashboard affiche l'absence

**Reconnecter en admin:** `crechemimaelghalia@gmail.com` / `password`

1. Aller sur le **Dashboard** (page d'accueil)
2. Descendre jusqu'à la section **"Absences du jour"**

**Résultat:**
```
┌─────────────────────────────────────────┐
│ 🔴 Absences du jour                     │
├─────────────────────────────────────────┤
│ 👶 Fatima Ben Ali                       │
│    Visite médicale                      │
│    Parent: [Nom du parent]              │
├─────────────────────────────────────────┤
│ 1 enfant absent aujourd'hui             │
└─────────────────────────────────────────┘
```

**⚠️ IMPORTANT:**
Cette carte n'apparaît QUE si :
- Il y a des absences pour aujourd'hui
- Ces absences sont VALIDÉES (status = 'acknowledged')

---

## 🔍 RÉSOLUTION DES PROBLÈMES

### Problème 1: "Parent pas au courant que le staff a lu"

**Cause:** La demande n'est pas encore validée

**Solution:**
1. Admin doit aller dans "Gestion des absences"
2. Cliquer sur "Valider" pour la demande
3. Parent verra alors "✓ Confirmé par le personnel"

### Problème 2: "Pas d'icône téléphone"

**Cause:** La demande n'est pas validée OU ce n'est pas le jour de l'absence

**Solution:**
1. Admin doit valider la demande
2. L'icône apparaît UNIQUEMENT si :
   - La demande est validée (status = 'acknowledged')
   - C'est le jour de l'absence (start_date = aujourd'hui)

### Problème 3: "Dashboard n'affiche pas les absences"

**Cause:** Aucune absence validée pour aujourd'hui

**Solution:**
1. Créer une demande pour AUJOURD'HUI
2. Admin doit VALIDER cette demande
3. La carte "Absences du jour" apparaîtra automatiquement

**Note:** La carte ne s'affiche PAS si :
- Aucune absence aujourd'hui
- Les absences ne sont pas validées
- Les absences sont pour un autre jour

---

## 📱 NUMÉRO DE TÉLÉPHONE

### Configuration actuelle

**Fichier:** `frontend/src/pages/parent/AbsenceRequestPage.jsx`
**Ligne:** 162

```javascript
const nurseryPhone = '+21671234567';
```

### ⚠️ À MODIFIER AVANT PRODUCTION

Remplacer par le vrai numéro de la crèche :

```javascript
const nurseryPhone = '+216XXXXXXXX'; // Numéro réel
```

---

## 🎯 CHECKLIST COMPLÈTE

### Pour que TOUT fonctionne :

- [ ] Parent crée une demande d'absence
- [ ] Demande créée avec succès (statut "En attente")
- [ ] Admin reçoit la notification
- [ ] Admin va dans "Gestion des absences"
- [ ] Admin clique sur "Valider"
- [ ] Statut change à "Validé"
- [ ] Parent rafraîchit la page
- [ ] Parent voit "✓ Confirmé par le personnel"
- [ ] Si absence aujourd'hui → Icône téléphone visible
- [ ] Dashboard affiche l'absence dans "Absences du jour"

---

## 🔗 LIENS RAPIDES

### Parent
- Demandes d'absence: `http://localhost:5173/parent/absence-request`

### Admin/Staff
- Dashboard: `http://localhost:5173/dashboard`
- Gestion des absences: `http://localhost:5173/dashboard/absence-management`
- Notifications: Cliquer sur la cloche en haut à droite

---

## 📊 RÉCAPITULATIF DES STATUTS

| Statut | Couleur | Icône | Signification | Actions parent | Actions admin |
|--------|---------|-------|---------------|----------------|---------------|
| **pending** | Jaune | ⏰ | En attente de validation | Attendre | Valider |
| **acknowledged** | Vert | ✅ | Validé par le staff | Voir confirmation + Appeler | Aucune |

---

## 🎓 EXEMPLE COMPLET

### Scénario: Fatima est malade aujourd'hui

1. **08:00** - Parent crée demande (Fatima, aujourd'hui, Maladie)
2. **08:01** - Admin reçoit notification
3. **08:05** - Admin va dans "Gestion des absences"
4. **08:06** - Admin clique "Valider"
5. **08:07** - Parent rafraîchit et voit "Confirmé"
6. **08:08** - Parent clique sur 📞 pour appeler la crèche
7. **08:10** - Dashboard affiche Fatima dans "Absences du jour"

**Résultat:** Tout le monde est informé et peut agir !

---

## 🚀 ACCÈS RAPIDE ADMIN

### Menu Dashboard → Gestion → Gestion des absences

```
Dashboard
├── Tableau de bord
├── Gestion
│   ├── Enfants
│   ├── Présences
│   ├── Inscriptions en attente
│   ├── Toutes les inscriptions
│   ├── Documents
│   └── Gestion des absences ← ICI
└── Utilisateurs
```

---

**Date:** 09/11/2025 11:55  
**Version:** 4.0.0  
**Statut:** ✅ GUIDE COMPLET  
**Action:** SUIVRE LES ÉTAPES DANS L'ORDRE
