# 📋 WORKFLOW COMPLET D'INSCRIPTION

## 🎯 VUE D'ENSEMBLE

Ce document décrit le processus complet d'inscription à la crèche Mima Elghalia, de la soumission du formulaire jusqu'à la création du compte parent.

---

## 📝 PHASE 1 : SOUMISSION DU FORMULAIRE

### **Actions du parent :**
1. Remplit le formulaire d'inscription sur le site
2. Fournit les informations :
   - Informations de l'enfant (prénom, nom, date de naissance, genre)
   - Informations du parent (prénom, nom, email, téléphone)
   - Documents (optionnel à cette étape)
3. **IMPORTANT** : Pas de mot de passe demandé à cette étape
4. Soumet le formulaire

### **Actions automatiques du système :**
1. ✅ Création du dossier d'inscription (statut: `pending`)
2. ✅ Upload des documents si fournis
3. ✅ Envoi automatique d'un email de confirmation

### **Email de confirmation envoyé :**
```
Objet: Confirmation de votre demande d'inscription - Crèche Mima Elghalia

Contenu:
- Numéro de dossier
- Statut: En attente de traitement
- ⏰ Délai de traitement: 48 heures (jours ouvrables)
- Prochaines étapes
```

---

## 🔍 PHASE 2 : TRAITEMENT PAR L'ADMIN/STAFF

### **Actions de l'admin/staff :**
L'admin ou le staff examine le dossier et peut :

#### **OPTION A : APPROUVER LE DOSSIER** ✅

1. Clique sur "Approuver"
2. **Choisit une date de rendez-vous** à la crèche
3. Confirme l'approbation

**Email automatique envoyé au parent :**
```
Objet: Inscription approuvée - Crèche Mima Elghalia

Contenu:
- ✅ Statut: APPROUVÉ
- 📅 Date et heure du rendez-vous à la crèche
- 📋 Liste des documents à apporter:
  * Carnet de santé de l'enfant
  * Acte de naissance
  * Certificat médical récent
  * 2 photos d'identité de l'enfant
  * Pièce d'identité du parent
- 🔐 Lien pour créer le mot de passe (valide 48h)
```

#### **OPTION B : REJETER LE DOSSIER** ❌

1. Clique sur "Rejeter"
2. **Choisit la raison du rejet** parmi 4 options :

---

### **🔴 RAISON 1 : Âge de l'enfant dépassé**

**Email envoyé :**
```
Objet: Mise à jour de votre demande d'inscription

Contenu:
- 📅 Âge de l'enfant dépassé
- Message: L'âge dépasse la limite d'admission (3 mois - 3 ans)
- Suggestion de consulter d'autres structures
```

---

### **🔴 RAISON 2 : Maladie contagieuse**

**Email envoyé :**
```
Objet: Mise à jour de votre demande d'inscription

Contenu:
- 🩺 Maladie contagieuse
- Message: Pour la sécurité de tous les enfants
- Suggestion de consulter un pédiatre
- Possibilité de soumettre une nouvelle demande après guérison
```

---

### **🔴 RAISON 3 : Dossier manquant** (CAS SPÉCIAL)

**L'admin peut :**
- Soit rejeter sans RDV
- Soit **fixer un rendez-vous** pour apporter les documents

**Email envoyé (SANS rendez-vous) :**
```
Objet: Dossier incomplet - Documents manquants

Contenu:
- 📋 Dossier incomplet
- Liste des documents manquants
- 🔗 Lien pour télécharger les documents en ligne
```

**Email envoyé (AVEC rendez-vous) :**
```
Objet: Dossier incomplet - Rendez-vous fixé

Contenu:
- 📋 Dossier incomplet
- 📅 Date et heure du rendez-vous
- Deux options:
  1. 🔗 Télécharger les documents en ligne
  2. Apporter les documents le jour du rendez-vous
- Liste des documents requis
```

**Notification à l'admin/staff :**
```
Notification interne:
- 📅 Rendez-vous fixé avec [Nom du parent]
- 📋 Raison: Documents manquants
- 👤 Traité par: [Nom de l'admin/staff]
```

---

### **🔴 RAISON 4 : Autre**

**L'admin peut :**
- Saisir une raison personnalisée

**Email envoyé :**
```
Objet: Mise à jour de votre demande d'inscription

Contenu:
- 📝 Autre raison
- Message personnalisé de l'admin
- Invitation à contacter la crèche pour plus d'informations
```

---

## 🔐 PHASE 3 : CRÉATION DU COMPTE PARENT (Après approbation)

### **Actions du parent :**
1. Reçoit l'email d'approbation
2. Clique sur le lien "Créer mon mot de passe"
3. Arrive sur une page dédiée
4. **Saisit son mot de passe deux fois**
5. Valide le formulaire

### **Validation du formulaire :**
- Mot de passe minimum 6 caractères
- Les deux mots de passe doivent correspondre
- Le token doit être valide (< 48h)

### **Actions automatiques du système :**
1. ✅ Création du compte parent dans la base de données
2. ✅ Association du compte avec l'enfant
3. ✅ Redirection automatique vers la page de login

### **Résultat :**
Le parent peut maintenant se connecter avec :
- Email : celui fourni lors de l'inscription
- Mot de passe : celui qu'il vient de créer

---

## 📊 RÉSUMÉ DU WORKFLOW

```
┌─────────────────────────────────────────────────────────────┐
│  PARENT: Soumet formulaire (SANS mot de passe)             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  SYSTÈME: Email confirmation (délai 48h jours ouvrables)   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  ADMIN/STAFF: Examine le dossier                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
    ┌─────────┐            ┌──────────┐
    │ APPROUVER│            │ REJETER  │
    └────┬────┘            └────┬─────┘
         │                      │
         │                      ├─► Âge dépassé
         │                      ├─► Maladie contagieuse
         │                      ├─► Dossier manquant (+ RDV optionnel)
         │                      └─► Autre raison
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  SYSTÈME: Email approbation + Date RDV + Lien création MDP │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  PARENT: Crée son mot de passe (2x) → Redirection login    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 IMPLÉMENTATION TECHNIQUE

### **Backend - Service Email**
Fichier: `/backend/services/emailService.js`

**Méthodes disponibles :**
```javascript
// Email de confirmation (après soumission)
emailService.sendEnrollmentConfirmation({
  id, applicant_email, applicant_first_name, child_first_name
})

// Email d'approbation (avec RDV et lien création MDP)
emailService.sendApprovalEmail({
  applicant_email, applicant_first_name, child_first_name,
  appointment_date, enrollment_id
})

// Email de rejet (4 types)
emailService.sendRejectionEmail(
  enrollmentData,
  rejectionType, // 'age_depasse' | 'maladie_contagieuse' | 'dossier_manquant' | 'autre'
  customReason,  // Pour 'autre'
  appointmentDate // Optionnel pour 'dossier_manquant'
)
```

### **Frontend - Pages à créer**

1. **Page création de mot de passe**
   - Route: `/create-password?token=xxx&email=xxx`
   - Formulaire: 2 champs mot de passe
   - Validation: correspondance + longueur
   - Redirection: `/login` après succès

2. **Page upload documents**
   - Route: `/upload-documents?token=xxx&enrollment=xxx`
   - Upload: carnet médical, acte naissance, certificat médical
   - Notification admin après upload

### **Base de données - Champs requis**

Table `enrollments` :
```sql
- appointment_date (TIMESTAMP) -- Date du RDV
- password_token (VARCHAR) -- Token pour création MDP
- password_token_expires (TIMESTAMP) -- Expiration du token
- rejection_type (VARCHAR) -- Type de rejet
- rejection_reason (TEXT) -- Raison personnalisée
- processed_by (INT) -- ID de l'admin/staff qui a traité
```

---

## ✅ CHECKLIST D'IMPLÉMENTATION

### **Backend :**
- [x] Service email avec 3 types d'emails
- [ ] Endpoint approbation avec date RDV
- [ ] Endpoint rejet avec 4 types
- [ ] Génération et validation de tokens
- [ ] Endpoint création mot de passe
- [ ] Endpoint upload documents manquants

### **Frontend :**
- [x] Retrait champ mot de passe du formulaire
- [ ] Page création mot de passe
- [ ] Page upload documents
- [ ] Modal rejet avec 4 options
- [ ] Sélecteur date/heure RDV

### **Emails :**
- [x] Template confirmation (48h)
- [x] Template approbation (RDV + lien MDP)
- [x] Template rejet (4 types)

---

**Date de création** : 2025-11-02
**Version** : 1.0.0
**Statut** : En cours d'implémentation
