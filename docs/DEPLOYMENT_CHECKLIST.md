# ✅ CHECKLIST DE DÉPLOIEMENT - WORKFLOW D'INSCRIPTION

## 🎯 **CE QUI A ÉTÉ IMPLÉMENTÉ**

### **✅ Backend Complet**
- [x] Service email avec 3 types d'emails (confirmation, approbation, rejet)
- [x] Endpoint approbation avec date RDV et génération token
- [x] Endpoint rejet avec 4 types (âge, maladie, dossier, autre)
- [x] Endpoint choix RDV parent
- [x] Endpoint création mot de passe
- [x] Endpoint upload documents
- [x] Migration SQL avec nouveaux champs
- [x] Routes avec validations express-validator

### **✅ Frontend Partiel**
- [x] Formulaire inscription sans mot de passe
- [x] Upload documents optionnel
- [ ] Page création mot de passe (`/create-password`)
- [ ] Page upload documents (`/upload-documents`)
- [ ] Modal rejet admin avec 4 options
- [ ] Sélecteur date/heure RDV

---

## 📋 **ÉTAPES DE DÉPLOIEMENT**

### **1. Appliquer la migration SQL** ⏳
```bash
# Via Render Shell ou Neon Console
psql $DATABASE_URL -f backend/migrations/add_enrollment_workflow_fields.sql
```
📚 Guide détaillé : `/docs/APPLY_MIGRATION.md`

### **2. Configurer les variables d'environnement** ⏳
Sur Render Dashboard → Environment :
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=crechemimaelghalia@gmail.com
SMTP_PASSWORD=qeyp kwpf yhhe voax
EMAIL_FROM=crechemimaelghalia@gmail.com
FRONTEND_URL=https://malekaidoudi.github.io/creche
```
📚 Guide détaillé : `/docs/RENDER_EMAIL_CONFIG.md`

### **3. Redémarrer le backend** ⏳
- Render redémarre automatiquement après push
- Ou manuellement via Dashboard → Manual Deploy

### **4. Tester les endpoints** ⏳
```bash
# Test création inscription
curl -X POST https://creche-backend-prod.onrender.com/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{
    "applicant_first_name": "Test",
    "applicant_last_name": "Parent",
    "applicant_email": "test@example.com",
    "applicant_phone": "12345678",
    "child_first_name": "Test",
    "child_last_name": "Enfant",
    "child_birth_date": "2020-01-01",
    "child_gender": "M"
  }'

# Vérifier l'email de confirmation
```

---

## 🚀 **PROCHAINES ÉTAPES (Frontend)**

### **Page création mot de passe** (`/create-password`)
**Fichier à créer** : `/frontend/src/pages/public/CreatePasswordPage.jsx`

**Fonctionnalités** :
- Récupérer `token` et `email` depuis URL params
- Formulaire avec 2 champs mot de passe
- Validation : correspondance + longueur min 6
- Appel API : `POST /api/auth/create-password`
- Redirection automatique vers `/login` après succès

**Code de base** :
```jsx
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function CreatePasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Mot de passe minimum 6 caractères');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/api/auth/create-password', {
        token,
        email,
        password
      });
      
      // Sauvegarder le token JWT
      localStorage.setItem('token', response.data.token);
      
      toast.success('Compte créé avec succès !');
      
      // Redirection vers login
      setTimeout(() => navigate('/login'), 2000);
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit}>
        {/* Formulaire */}
      </form>
    </div>
  );
}
```

---

### **Page upload documents** (`/upload-documents`)
**Fichier à créer** : `/frontend/src/pages/public/UploadDocumentsPage.jsx`

**Fonctionnalités** :
- Récupérer `token` et `enrollment` depuis URL params
- Upload 3 fichiers : carnet médical, acte naissance, certificat médical
- Appel API : `POST /api/enrollments/:id/documents`
- Message de confirmation

---

### **Modal rejet admin**
**Fichier à créer** : `/frontend/src/components/admin/RejectEnrollmentModal.jsx`

**Fonctionnalités** :
- 4 boutons radio : âge dépassé, maladie, dossier manquant, autre
- Champ texte pour "autre"
- Sélecteur date/heure pour "dossier manquant"
- Appel API : `PUT /api/enrollments/:id/reject`

---

### **Sélecteur date RDV**
**Fichier à modifier** : Page d'approbation admin

**Fonctionnalités** :
- Date picker + heure picker
- Validation jours ouvrables
- Appel API : `POST /api/enrollments/:id/approve` avec `appointment_date`

---

## 🧪 **TESTS À EFFECTUER**

### **Test 1 : Inscription complète**
1. Soumettre formulaire inscription
2. Vérifier email de confirmation reçu
3. Vérifier dossier créé en DB avec statut "pending"

### **Test 2 : Approbation**
1. Admin approuve avec date RDV
2. Vérifier email d'approbation reçu
3. Cliquer sur lien création MDP
4. Créer mot de passe
5. Vérifier compte parent créé
6. Vérifier connexion automatique

### **Test 3 : Rejet âge dépassé**
1. Admin rejette avec raison "âge dépassé"
2. Vérifier email de rejet reçu
3. Vérifier message approprié

### **Test 4 : Rejet dossier manquant avec RDV**
1. Admin rejette avec "dossier manquant" + date RDV
2. Vérifier email avec 2 options (upload OU RDV)
3. Parent clique "Prendre RDV"
4. Vérifier notification admin
5. Vérifier email confirmation RDV parent

---

## 📊 **STATUT ACTUEL**

### **✅ TERMINÉ (Backend)**
- Service email complet
- Tous les endpoints implémentés
- Migration SQL prête
- Routes configurées
- Validations en place

### **⏳ EN ATTENTE (Déploiement)**
- Appliquer migration SQL
- Configurer variables email
- Tester endpoints

### **📋 À FAIRE (Frontend)**
- Page création mot de passe
- Page upload documents
- Modal rejet admin
- Sélecteur date RDV

---

## 🎯 **PRIORITÉS**

1. **URGENT** : Appliquer migration + configurer email
2. **IMPORTANT** : Tester workflow backend complet
3. **MOYEN** : Implémenter pages frontend
4. **BONUS** : Tests end-to-end automatisés

---

**Date** : 2025-11-02
**Version** : v1.0.0
**Statut Backend** : ✅ Complet et prêt
**Statut Frontend** : ⏳ Partiel (pages manquantes)
