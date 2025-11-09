# 🧪 GUIDE DE TEST - DEMANDES D'ABSENCE

Date: 09/11/2025 11:38
Version: 2.0.0

---

## 📋 CHECKLIST COMPLÈTE

### ✅ Préparation

- [ ] Backend démarré sur port 3003
- [ ] Frontend démarré sur port 5173
- [ ] Base de données accessible
- [ ] Colonne `related_id` ajoutée à la table `notifications`

---

## 🧪 TEST 1: Affichage des noms d'enfants

### Objectif
Vérifier que les noms d'enfants s'affichent dans "Demandes précédentes"

### Étapes

1. **Se connecter en parent**
   - Email: `parent@creche.com`
   - Mot de passe: `parent123`

2. **Aller dans "Demandes d'absence"**
   - Menu latéral → "Demandes d'absence"

3. **Vérifier la section "Demandes précédentes"**
   - [ ] Les noms d'enfants sont visibles
   - [ ] Format: "Prénom Nom" (ex: "Ahmed Ben Ali")
   - [ ] Pas de "undefined" ou de champs vides

### ✅ Résultat attendu
```
┌─────────────────────────────┐
│ 👶 Ahmed Ben Ali            │
│ 📅 09/11/2025               │
│ Raison: Maladie             │
└─────────────────────────────┘
```

---

## 🧪 TEST 2: Création de demande d'absence

### Objectif
Vérifier que la création fonctionne sans erreur 500

### Étapes

1. **Rester connecté en parent**

2. **Créer une nouvelle demande**
   - Sélectionner un enfant
   - Choisir une date (aujourd'hui ou demain)
   - Sélectionner une raison (ex: "Maladie")
   - Ajouter une note (optionnel)
   - Cliquer sur "Envoyer la demande"

3. **Vérifier**
   - [ ] Pas d'erreur 500 dans la console
   - [ ] Message de succès affiché
   - [ ] Demande apparaît dans "Demandes précédentes"
   - [ ] Statut: "En attente" (jaune)

### ✅ Résultat attendu
```
✅ Demande d'absence envoyée avec succès

┌─────────────────────────────┐
│ 👶 Ahmed Ben Ali            │
│ 📅 09/11/2025               │
│ ⏰ En attente               │
│ Raison: Maladie             │
└─────────────────────────────┘
```

---

## 🧪 TEST 3: Notifications au staff

### Objectif
Vérifier que le staff reçoit les notifications

### Étapes

1. **Se déconnecter du compte parent**

2. **Se connecter en admin/staff**
   - Email: `crechemimaelghalia@gmail.com`
   - Mot de passe: `password`

3. **Ouvrir le centre de notifications**
   - Cliquer sur l'icône cloche en haut à droite

4. **Vérifier**
   - [ ] Notification visible: "Nouvelle demande d'absence - Ahmed Ben Ali"
   - [ ] Message détaillé avec nom parent, enfant, date, raison
   - [ ] Badge rouge avec le nombre de notifications non lues

### ✅ Résultat attendu
```
🔔 Notifications (1)

┌─────────────────────────────────────────────┐
│ Nouvelle demande d'absence - Ahmed Ben Ali  │
│ Fatma Ben Ali a créé une demande d'absence │
│ pour Ahmed Ben Ali du 09/11/2025.          │
│ Raison: Maladie                             │
│ Il y a 2 min                                │
└─────────────────────────────────────────────┘
```

---

## 🧪 TEST 4: Validation par le staff

### Objectif
Vérifier que le staff peut valider la demande

### Étapes

1. **Rester connecté en admin/staff**

2. **Aller dans "Demandes d'absence"**
   - Menu → Gestion → Demandes d'absence

3. **Trouver la demande créée**
   - Chercher "Ahmed Ben Ali"

4. **Valider la demande**
   - Cliquer sur "Accuser réception" ou "Valider"

5. **Vérifier**
   - [ ] Statut change de "En attente" à "Pris en compte"
   - [ ] Message de succès affiché

---

## 🧪 TEST 5: Confirmation visible pour le parent

### Objectif
Vérifier que le parent voit la validation

### Étapes

1. **Se déconnecter du compte staff**

2. **Se reconnecter en parent**
   - Email: `parent@creche.com`
   - Mot de passe: `parent123`

3. **Aller dans "Demandes d'absence"**

4. **Vérifier la demande validée**
   - [ ] Statut: "Validé" (vert) au lieu de "En attente"
   - [ ] Message: "✓ Confirmé par le personnel" visible
   - [ ] Badge vert avec icône ✓

### ✅ Résultat attendu
```
┌─────────────────────────────────────┐
│ 👶 Ahmed Ben Ali        ✅ Validé   │
│ 📅 09/11/2025                       │
│ Raison: Maladie                     │
│ ✓ Confirmé par le personnel        │
└─────────────────────────────────────┘
```

---

## 🧪 TEST 6: Icône d'appel (jour de l'absence)

### Objectif
Vérifier que l'icône téléphone apparaît le jour de l'absence

### Étapes

1. **Créer une demande pour AUJOURD'HUI**
   - Date: Date du jour actuel
   - Raison: Maladie

2. **Staff valide la demande**

3. **Parent rafraîchit la page**

4. **Vérifier**
   - [ ] Badge "(Aujourd'hui)" visible à côté de la date
   - [ ] Icône téléphone bleue visible
   - [ ] Au survol: "Appeler la crèche"
   - [ ] Clic lance l'appel (si sur mobile)

### ✅ Résultat attendu
```
┌─────────────────────────────────────┐
│ 👶 Ahmed Ben Ali    📞 ✅ Validé    │
│ 📅 09/11/2025 (Aujourd'hui)         │
│ Raison: Maladie                     │
│ ✓ Confirmé par le personnel        │
└─────────────────────────────────────┘
```

---

## 🧪 TEST 7: Dashboard absences du jour

### Objectif
Vérifier que le dashboard affiche les absences validées

### Étapes

1. **Se connecter en admin/staff**

2. **Aller au dashboard**
   - Menu → Dashboard

3. **Chercher la carte "Absences du jour"**
   - Doit être visible avant "Jours fériés"

4. **Vérifier**
   - [ ] Carte visible avec fond orange/rouge
   - [ ] Liste des enfants absents aujourd'hui
   - [ ] Nom enfant + raison + nom parent
   - [ ] Compteur: "X enfant(s) absent(s) aujourd'hui"

### ✅ Résultat attendu
```
┌─────────────────────────────────────┐
│ 🔴 Absences du jour                 │
├─────────────────────────────────────┤
│ 👶 Ahmed Ben Ali                    │
│    Maladie                          │
│    Parent: Fatma Ben Ali            │
├─────────────────────────────────────┤
│ 1 enfant absent aujourd'hui         │
└─────────────────────────────────────┘
```

---

## 🧪 TEST 8: Absences passées (pas d'icône)

### Objectif
Vérifier que l'icône téléphone n'apparaît PAS pour les absences passées

### Étapes

1. **Créer une demande pour HIER**
   - Date: Hier
   - Raison: Vacances

2. **Staff valide**

3. **Parent vérifie**
   - [ ] Pas de badge "(Aujourd'hui)"
   - [ ] Pas d'icône téléphone
   - [ ] Statut "Validé" visible
   - [ ] Message de confirmation visible

### ✅ Résultat attendu
```
┌─────────────────────────────┐
│ 👶 Ahmed Ben Ali  ✅ Validé │
│ 📅 08/11/2025               │
│ Raison: Vacances            │
│ ✓ Confirmé par le personnel│
└─────────────────────────────┘
```

---

## 🧪 TEST 9: Rafraîchissement automatique

### Objectif
Vérifier que le dashboard se rafraîchit automatiquement

### Étapes

1. **Ouvrir le dashboard admin/staff**

2. **Laisser la page ouverte 5 minutes**

3. **Pendant ce temps, créer une nouvelle absence (autre onglet)**
   - Parent crée une absence pour aujourd'hui
   - Staff valide

4. **Après 5 minutes, vérifier le dashboard**
   - [ ] La nouvelle absence apparaît automatiquement
   - [ ] Compteur mis à jour

---

## 🧪 TEST 10: Numéro de téléphone

### Objectif
Vérifier que le numéro de téléphone est correct

### Étapes

1. **Ouvrir le fichier**
   ```
   frontend/src/pages/parent/AbsenceRequestPage.jsx
   ```

2. **Chercher la ligne 162**
   ```javascript
   const nurseryPhone = '+21671234567';
   ```

3. **Vérifier**
   - [ ] Numéro correct pour la crèche
   - [ ] Format international (+216...)

4. **Si besoin, modifier**
   ```javascript
   const nurseryPhone = '+21671XXXXXX'; // Vrai numéro
   ```

---

## 📊 RÉSUMÉ DES TESTS

| Test | Fonctionnalité | Statut |
|------|----------------|--------|
| 1 | Affichage noms enfants | ⏳ |
| 2 | Création demande | ⏳ |
| 3 | Notifications staff | ⏳ |
| 4 | Validation staff | ⏳ |
| 5 | Confirmation parent | ⏳ |
| 6 | Icône appel | ⏳ |
| 7 | Dashboard absences | ⏳ |
| 8 | Absences passées | ⏳ |
| 9 | Rafraîchissement auto | ⏳ |
| 10 | Numéro téléphone | ⏳ |

---

## 🐛 PROBLÈMES COURANTS

### Erreur 500 lors de la création

**Cause:** Colonne `related_id` manquante

**Solution:**
```bash
cd backend
node scripts/fix-notifications-table.js
```

### Noms d'enfants vides

**Cause:** Colonnes mal nommées dans la requête SQL

**Solution:** Déjà corrigé dans `routes_postgres/absenceRequests.js`

### Icône téléphone ne s'affiche pas

**Vérifier:**
1. L'absence est pour aujourd'hui
2. Le statut est "acknowledged"
3. La page a été rafraîchie

### Dashboard vide

**Vérifier:**
1. Il y a des absences validées pour aujourd'hui
2. L'utilisateur est admin ou staff
3. La route `/api/absence-requests/today` fonctionne

---

## 📝 NOTES IMPORTANTES

### ⚠️ À MODIFIER AVANT PRODUCTION

**Numéro de téléphone:**
```javascript
// Fichier: frontend/src/pages/parent/AbsenceRequestPage.jsx
// Ligne: 162
const nurseryPhone = '+21671234567'; // ← CHANGER ICI
```

### ✅ Déjà configuré

- ✅ Colonne `related_id` dans `notifications`
- ✅ Route `/api/absence-requests/today`
- ✅ Composant `TodayAbsences`
- ✅ Affichage conditionnel selon le rôle
- ✅ Rafraîchissement automatique (5 min)

---

**Date:** 09/11/2025 11:38  
**Version:** 2.0.0  
**Statut:** ✅ PRÊT POUR LES TESTS
