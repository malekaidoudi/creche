# 🧪 TEST - PAGE GESTION DES ABSENCES

Date: 09/11/2025 12:05

---

## 🎯 OBJECTIF

Vérifier que la page `/dashboard/absence-management` fonctionne correctement

---

## ✅ ÉTAPE 1: Accéder à la page

### Connexion Admin

```
Email: crechemimaelghalia@gmail.com
Mot de passe: password
```

### Accès à la page

**Option A - URL directe:**
```
http://localhost:5173/dashboard/absence-management
```

**Option B - Via le menu:**
```
Dashboard → Menu latéral → Gestion → Gestion des absences
```

---

## 🔍 ÉTAPE 2: Vérifier la console

### Ouvrir la console du navigateur

- **Chrome/Edge:** F12 ou Cmd+Option+I (Mac)
- **Firefox:** F12 ou Cmd+Option+K (Mac)

### Messages attendus

```
🔄 Chargement des demandes d'absence...
📥 Réponse reçue: {success: true, requests: [...]}
✅ X demande(s) chargée(s)
✅ Chargement terminé
🎨 Rendu - Loading: false Requests: X
```

### Si erreur

```
❌ Erreur chargement demandes: AxiosError {...}
Détails: {success: false, error: "..."}
```

---

## 📊 ÉTAPE 3: Vérifier l'affichage

### La page doit afficher :

1. **En-tête**
   ```
   Gestion des demandes d'absence
   Consulter et valider les demandes d'absence des parents
   ```

2. **Statistiques (3 cartes)**
   ```
   [Total: X] [En attente: X] [Validées: X]
   ```

3. **Filtres**
   ```
   Filtrer: [Tous] [En attente] [Validées]
   ```

4. **Liste des demandes**
   - Si aucune demande: "Aucune demande"
   - Si demandes: Liste avec nom enfant, parent, date, raison

---

## 🐛 PROBLÈMES POSSIBLES

### Problème 1: Page blanche

**Cause:** Erreur JavaScript

**Solution:**
1. Ouvrir la console (F12)
2. Chercher les erreurs en rouge
3. Vérifier que tous les imports sont corrects

### Problème 2: "Aucune demande" alors qu'il y en a

**Cause:** Route backend ne retourne pas les données

**Vérification:**
1. Console navigateur → Onglet "Network"
2. Chercher la requête `absence-requests/all`
3. Vérifier la réponse

**Réponse attendue:**
```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "child_first_name": "Fatima",
      "child_last_name": "Ben Ali",
      "parent_first_name": "...",
      "parent_last_name": "...",
      "start_date": "2025-11-09",
      "reason": "medical_visit",
      "status": "pending"
    }
  ]
}
```

### Problème 3: Erreur 403 (Accès refusé)

**Cause:** Utilisateur n'est pas admin/staff

**Solution:**
1. Vérifier que vous êtes connecté en admin
2. Vérifier le token JWT dans localStorage
3. Se reconnecter si nécessaire

### Problème 4: Erreur 500 (Serveur)

**Cause:** Erreur backend

**Vérification:**
1. Vérifier les logs du serveur backend
2. Chercher l'erreur SQL ou autre

**Logs backend attendus:**
```
🔍 Requête exécutée: {
  text: 'SELECT ar.id, ar.child_id, ...',
  duration: 'XXms',
  rows: X
}
GET /api/absence-requests/all 200 XXms
```

---

## ✅ ÉTAPE 4: Tester la validation

### Si vous voyez une demande "En attente"

1. Cliquer sur le bouton **"✓ Valider"**
2. Message attendu: "Demande validée"
3. La demande passe en statut "Validé" (vert)
4. Le bouton "Valider" disparaît

### Vérifier côté parent

1. Se déconnecter
2. Se connecter en parent: `parent@creche.com` / `parent123`
3. Aller dans "Demandes d'absence"
4. Vérifier que le statut est "Validé"
5. Vérifier le message "✓ Confirmé par le personnel"

---

## 🔍 VÉRIFICATION BACKEND

### Tester la route directement

**Dans un nouvel onglet ou avec Postman:**

```
GET http://localhost:3003/api/absence-requests/all
Headers:
  Authorization: Bearer <votre_token_jwt>
```

**Réponse attendue:**
```json
{
  "success": true,
  "requests": [...]
}
```

### Vérifier les logs serveur

**Terminal backend:**
```bash
# Chercher ces lignes
🔍 Requête exécutée: { text: 'SELECT ar.id...', rows: X }
GET /api/absence-requests/all 200 XXms
```

---

## 📝 CHECKLIST COMPLÈTE

- [ ] Page accessible via URL
- [ ] Page accessible via menu
- [ ] En-tête affiché
- [ ] Statistiques affichées (3 cartes)
- [ ] Filtres visibles
- [ ] Liste des demandes visible
- [ ] Console sans erreur
- [ ] Requête API réussie (Network tab)
- [ ] Bouton "Valider" visible pour demandes en attente
- [ ] Clic sur "Valider" fonctionne
- [ ] Message de succès affiché
- [ ] Statut change après validation
- [ ] Parent voit la validation

---

## 🚀 SI TOUT FONCTIONNE

### Vous devriez voir :

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
│ ⏰ En attente         [✓ Valider]       │
└─────────────────────────────────────────┘
```

### Après validation :

```
┌─────────────────────────────────────────┐
│ [Total: 1] [En attente: 0] [Validées: 1]│
├─────────────────────────────────────────┤
│ 👶 Fatima Ben Ali                       │
│ 👤 Parent: [Nom du parent]              │
│ 📅 09/11/2025                           │
│ Raison: Visite médicale                 │
│ ✅ Validé                                │
│ ✓ Validé le 09/11/2025 à 12:05         │
└─────────────────────────────────────────┘
```

---

## 📞 VÉRIFICATION COMPLÈTE

### Après validation, vérifier :

1. **Page parent (Demandes d'absence)**
   - ✅ Statut "Validé"
   - ✅ Message "Confirmé par le personnel"
   - ✅ Icône téléphone (si aujourd'hui)

2. **Dashboard admin (Absences du jour)**
   - ✅ Carte "Absences du jour" visible
   - ✅ Fatima Ben Ali affichée
   - ✅ Raison et parent affichés

---

**Date:** 09/11/2025 12:05  
**Statut:** ✅ PRÊT POUR LES TESTS  
**Action:** OUVRIR /dashboard/absence-management ET VÉRIFIER
