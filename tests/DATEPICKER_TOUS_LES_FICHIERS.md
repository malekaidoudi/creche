# 📅 Liste complète des DatePickers dans le projet

**Date:** 22 novembre 2025  
**Total:** 19 occurrences dans 14 fichiers

---

## 📋 Fichiers à migrer

### **Dashboard (6 fichiers)**

#### 1. `pages/dashboard/AddChildPage.jsx` - 2 occurrences
- **Ligne 187:** Date de naissance de l'enfant
- **Ligne 248:** Date d'inscription

#### 2. `pages/dashboard/EnrollmentsPage.jsx` - 1 occurrence
- **Ligne 697:** Date de rendez-vous (optionnel)

#### 3. `pages/dashboard/AttendanceReportPage.jsx` - 2 occurrences
- **Ligne 302:** Date de début (filtre)
- **Ligne 313:** Date de fin (filtre)

#### 4. `pages/dashboard/DashboardSettingsPage.jsx` - 2 occurrences
- **Ligne 922:** Date de début des vacances annuelles
- **Ligne 934:** Date de fin des vacances annuelles

---

### **Modals (8 fichiers)**

#### 5. `components/modals/ApproveEnrollmentModal.jsx` - 1 occurrence
- **Ligne 129:** Date de rendez-vous d'approbation

#### 6. `components/modals/CreateAppointmentModal.jsx` - 1 occurrence
- **Ligne 209:** Date proposée pour rendez-vous

#### 7. `components/modals/RescheduleAppointmentModal.jsx` - 1 occurrence
- **Ligne 140:** Nouvelle date de rendez-vous

#### 8. `components/modals/EventModal.jsx` - 1 occurrence
- **Ligne 178:** Date de l'événement

#### 9. `components/modals/ReportAbsenceModal.jsx` - 1 occurrence
- **Ligne 176:** Date d'absence

#### 10. `components/modals/TaskModal.jsx` - 2 occurrences
- **Ligne 215:** Date de début de tâche
- **Ligne 229:** Date d'échéance de tâche

#### 11. `components/modals/RejectWithProposalModal.jsx` - 1 occurrence
- **Ligne 125:** Date alternative proposée

#### 12. `components/modals/RequestAppointmentModal.jsx` - 1 occurrence
- Date de demande de rendez-vous

#### 13. `components/modals/PaymentAlertModal.jsx` - 1 occurrence
- Date de paiement

---

### **Composants (1 fichier)**

#### 14. `components/attendance/HistorySection.jsx` - 1 occurrence
- Date pour historique de présence

---

## ✅ Fichiers déjà migrés

### **Public (1 fichier)**

#### ✅ `pages/public/EnrollmentPage.jsx`
- Date de naissance
- Date d'inscription souhaitée

---

## 🎯 Priorités de migration

### **Priorité HAUTE (Utilisateur final):**
1. ✅ `pages/public/EnrollmentPage.jsx` - FAIT
2. `components/modals/RequestAppointmentModal.jsx` - Parents
3. `components/modals/ReportAbsenceModal.jsx` - Parents

### **Priorité MOYENNE (Dashboard):**
4. `pages/dashboard/AddChildPage.jsx` - Admin/Staff
5. `pages/dashboard/AttendanceReportPage.jsx` - Admin/Staff
6. `pages/dashboard/DashboardSettingsPage.jsx` - Admin

### **Priorité BASSE (Modals internes):**
7. Tous les autres modals

---

## 🔧 Plan de migration

### **Option 1: Migration manuelle (recommandée)**
Migrer fichier par fichier en utilisant le composant DatePicker

### **Option 2: Migration automatique**
Créer un script pour remplacer automatiquement

---

## 📝 Template de remplacement

### Avant:
```jsx
<input
  type="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
  className="w-full px-3 py-2 border ..."
/>
```

### Après:
```jsx
import DatePicker from '../../components/ui/DatePicker'

<DatePicker
  label="Date de naissance"
  value={date}
  onChange={setDate}
  required
  error={errors.date?.message}
/>
```

---

## ⚠️ Points d'attention

### **Format de date:**
- **Avant:** yyyy-mm-dd (ISO)
- **Après:** dd/mm/yyyy (français)
- **⚠️ Conversion nécessaire** pour le backend si il attend yyyy-mm-dd

### **Valeur par défaut:**
```jsx
// Avant
defaultValue={new Date().toISOString().split('T')[0]}

// Après
const today = new Date()
const day = String(today.getDate()).padStart(2, '0')
const month = String(today.getMonth() + 1).padStart(2, '0')
const year = today.getFullYear()
defaultValue={`${day}/${month}/${year}`}
```

### **Min/Max dates:**
```jsx
// Avant
min={new Date().toISOString().split('T')[0]}

// Après - À implémenter dans le composant DatePicker
// Flowbite supporte minDate et maxDate
```

---

## 🚀 Prochaines étapes

1. [ ] Tester le composant DatePicker actuel
2. [ ] Vérifier le format dd/mm/yyyy
3. [ ] Vérifier le fond blanc (pas transparent)
4. [ ] Vérifier titre masqué sur mobile
5. [ ] Migrer les fichiers priorité HAUTE
6. [ ] Migrer les fichiers priorité MOYENNE
7. [ ] Migrer les fichiers priorité BASSE

---

**Total: 19 date pickers à vérifier/migrer dans le projet**
