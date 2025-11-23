# 🐛 Bugs Corrigés - Session de Test

## Date: 16 Novembre 2024

---

## ✅ Bug #1: Import manquant dans EnrollmentsPage

### Problème
```
ReferenceError: useDialogContext is not defined
```

### Cause
L'import de `useDialogContext` était manquant dans `EnrollmentsPage.jsx`

### Solution
Ajout de l'import :
```javascript
import { useDialogContext } from '../../contexts/DialogContext';
```

**Fichier**: `/frontend/src/pages/dashboard/EnrollmentsPage.jsx`  
**Statut**: ✅ Corrigé

---

## ✅ Bug #2: Erreur 500 avec le filtre "Rejetées"

### Problème
```
invalid input value for enum enrollment_status: "rejected"
```

### Cause
Le backend n'accepte pas `rejected` comme statut, mais uniquement :
- `rejected_incomplete` (dossier incomplet)
- `rejected_deleted` (supprimé)

### Solution
1. Modification du filtre pour gérer les deux types de statut rejeté
2. Utilisation de `new_status` au lieu de `status`
3. Récupération de toutes les inscriptions et filtrage côté client

**Fichier**: `/frontend/src/pages/dashboard/EnrollmentsPage.jsx`  
**Statut**: ✅ Corrigé

---

## ✅ Bug #3: Filtre "Rejetées" affiche toutes les inscriptions

### Problème
Quand on clique sur l'onglet "Rejetées", toutes les inscriptions s'affichent au lieu d'afficher une liste vide (car il n'y a pas d'inscriptions rejetées).

### Cause
Le code utilisait `enrollments.map()` au lieu de `filteredEnrollments.map()` pour l'affichage.

### Solution
```javascript
// Avant (ligne 377)
{enrollments.map((enrollment) => (

// Après
{filteredEnrollments.map((enrollment) => (
```

Aussi corrigé la condition pour afficher le message "Aucune demande" :
```javascript
// Avant
enrollments.length === 0

// Après
filteredEnrollments.length === 0
```

**Fichier**: `/frontend/src/pages/dashboard/EnrollmentsPage.jsx`  
**Statut**: ✅ Corrigé

---

## ✅ Bug #4: Téléchargement de documents échoue (404)

### Problème
```
GET http://localhost:3003/api/uploads/enrollments/certificat_medical-xxx.jpg 404 (Not Found)
```

### Cause
Les fichiers sont stockés sur **Cloudinary**, pas en local. Le frontend essayait d'accéder à une URL locale inexistante.

### Solution
Modification de `handleDownloadDocument` pour utiliser les URLs Cloudinary :
```javascript
// Utiliser download_url de Cloudinary (force le téléchargement)
const documentUrl = document.download_url || document.cloudinary_url || document.view_url;

// Pour Cloudinary, ouvrir directement l'URL
if (documentUrl.includes('cloudinary.com')) {
  window.open(documentUrl, '_blank');
  return;
}
```

**Fichier**: `/frontend/src/pages/dashboard/PendingEnrollmentsPage.jsx`  
**Statut**: ✅ Corrigé

---

## 📊 Résumé des Corrections

| Bug | Fichier | Type | Statut |
|-----|---------|------|--------|
| #1 | EnrollmentsPage.jsx | Import manquant | ✅ Corrigé |
| #2 | EnrollmentsPage.jsx | Enum PostgreSQL | ✅ Corrigé |
| #3 | EnrollmentsPage.jsx | Logique de filtre | ✅ Corrigé |
| #4 | PendingEnrollmentsPage.jsx | URL Cloudinary | ✅ Corrigé |

---

## 🔧 Fichiers Modifiés

### 1. `/frontend/src/pages/dashboard/EnrollmentsPage.jsx`
**Modifications**:
- Ajout import `useDialogContext`
- Gestion des statuts `rejected_incomplete` et `rejected_deleted`
- Utilisation de `new_status || status`
- Correction du filtre pour utiliser `filteredEnrollments`
- Mise à jour des compteurs d'onglets

### 2. `/frontend/src/pages/dashboard/PendingEnrollmentsPage.jsx`
**Modifications**:
- Utilisation de `download_url` de Cloudinary
- Gestion des URLs Cloudinary pour le téléchargement
- Fallback pour fichiers locaux

---

## 🧪 Tests Effectués

### ✅ Page Enrollments
- [x] Affichage de toutes les inscriptions
- [x] Filtre "En attente" fonctionne
- [x] Filtre "Approuvées" fonctionne
- [x] Filtre "Rejetées" affiche correctement une liste vide
- [x] Compteurs des onglets corrects

### ✅ Téléchargement de Documents
- [x] Téléchargement depuis Cloudinary fonctionne
- [x] Ouverture dans un nouvel onglet

---

## 📝 Notes

### Statuts d'Inscription Valides
```javascript
'pending'              // En attente
'in_progress'          // En cours
'approved'             // Approuvé
'rejected_incomplete'  // Rejeté (dossier incomplet)
'rejected_deleted'     // Rejeté (supprimé)
'archived'             // Archivé
```

### Configuration Cloudinary
```
CLOUDINARY_CLOUD_NAME: duacvppbf
CLOUDINARY_API_KEY: 926449142625133
CLOUDINARY_API_SECRET: UkkJ4yYEhEPQMvMe1Kzkf3tdGWk
```

### URLs Cloudinary Retournées par l'API
- `cloudinary_url` : URL de base
- `view_url` : URL pour visualisation
- `download_url` : URL avec `fl_attachment` pour forcer le téléchargement

---

## ✅ Prochaines Étapes

1. Continuer les tests selon `GUIDE_TEST_COMPLET.md`
2. Tester l'approbation d'une inscription
3. Tester le rejet d'une inscription
4. Vérifier la visualisation des détails d'inscription

---

**Tous les bugs identifiés ont été corrigés ! 🎉**
