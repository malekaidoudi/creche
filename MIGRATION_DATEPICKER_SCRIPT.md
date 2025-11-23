# 🔄 Script de Migration DatePicker

**Fichiers restants à migrer:** 12 fichiers, 16 occurrences

---

## ✅ Fichiers déjà migrés (3/15)

1. ✅ `pages/public/EnrollmentPage.jsx` - 2 occurrences
2. ✅ `pages/dashboard/AddChildPage.jsx` - 2 occurrences  
3. ✅ `pages/dashboard/EnrollmentsPage.jsx` - 1 occurrence

**Total migré:** 5 occurrences

---

## ⏳ Fichiers à migrer (12/15)

### Dashboard (2 fichiers, 4 occurrences)

#### 4. `pages/dashboard/AttendanceReportPage.jsx`
```jsx
// Ligne 302 - Date de début
<DatePicker
  label={isRTL ? 'من تاريخ' : 'Date de début'}
  value={filters.dateFrom}
  onChange={(value) => handleFilterChange('dateFrom', value)}
/>

// Ligne 313 - Date de fin
<DatePicker
  label={isRTL ? 'إلى تاريخ' : 'Date de fin'}
  value={filters.dateTo}
  onChange={(value) => handleFilterChange('dateTo', value)}
/>
```

#### 5. `pages/dashboard/DashboardSettingsPage.jsx`
```jsx
// Ligne 922 - Date début vacances
<DatePicker
  label={isRTL ? 'تاريخ البداية' : 'Date de début'}
  value={settings.annualVacationStartDate || ''}
  onChange={(value) => handleSettingChange('annualVacationStartDate', value)}
/>

// Ligne 934 - Date fin vacances
<DatePicker
  label={isRTL ? 'تاريخ النهاية' : 'Date de fin'}
  value={settings.annualVacationEndDate || ''}
  onChange={(value) => handleSettingChange('annualVacationEndDate', value)}
/>
```

---

### Modals (8 fichiers, 9 occurrences)

#### 6. `components/modals/ApproveEnrollmentModal.jsx`
```jsx
// Ligne 129
<DatePicker
  label={isRTL ? 'تاريخ الموعد' : 'Date de rendez-vous'}
  required
  value={appointmentDate}
  onChange={setAppointmentDate}
/>
```

#### 7. `components/modals/CreateAppointmentModal.jsx`
```jsx
// Ligne 209
<DatePicker
  label={isRTL ? 'التاريخ المقترح' : 'Date proposée'}
  required
  value={formData.proposed_date}
  onChange={(value) => setFormData({ ...formData, proposed_date: value })}
/>
```

#### 8. `components/modals/RescheduleAppointmentModal.jsx`
```jsx
// Ligne 140
<DatePicker
  label={isRTL ? 'التاريخ الجديد' : 'Nouvelle date'}
  required
  value={formData.new_date}
  onChange={(value) => setFormData({ ...formData, new_date: value })}
/>
```

#### 9. `components/modals/EventModal.jsx`
```jsx
// Ligne 178
<DatePicker
  label="Date"
  required
  value={formData.event_date}
  onChange={(value) => setFormData({ ...formData, event_date: value })}
/>
```

#### 10. `components/modals/ReportAbsenceModal.jsx`
```jsx
// Ligne 176
<DatePicker
  label={isRTL ? 'تاريخ الغياب' : 'Date d\'absence'}
  required
  value={formData.absence_date}
  onChange={(value) => handleInputChange('absence_date', value)}
/>
```

#### 11. `components/modals/TaskModal.jsx`
```jsx
// Ligne 215 - Date début
<DatePicker
  label="Date de début"
  required
  value={formData.start_date}
  onChange={(value) => setFormData({ ...formData, start_date: value })}
/>

// Ligne 229 - Date échéance
<DatePicker
  label="Date d'échéance"
  required
  value={formData.end_date}
  onChange={(value) => setFormData({ ...formData, end_date: value })}
/>
```

#### 12. `components/modals/RejectWithProposalModal.jsx`
```jsx
// Ligne 125
<DatePicker
  label={isRTL ? 'التاريخ البديل' : 'Nouvelle date'}
  required
  value={formData.proposed_date}
  onChange={(value) => handleChange({ target: { name: 'proposed_date', value } })}
/>
```

#### 13. `components/modals/RequestAppointmentModal.jsx`
```jsx
<DatePicker
  label={isRTL ? 'التاريخ المفضل' : 'Date souhaitée'}
  required
  value={formData.preferred_date}
  onChange={(value) => setFormData({ ...formData, preferred_date: value })}
/>
```

#### 14. `components/modals/PaymentAlertModal.jsx`
```jsx
<DatePicker
  label={isRTL ? 'تاريخ الدفع' : 'Date de paiement'}
  value={formData.payment_date}
  onChange={(value) => setFormData({ ...formData, payment_date: value })}
/>
```

---

### Composants (1 fichier, 1 occurrence)

#### 15. `components/attendance/HistorySection.jsx`
```jsx
<DatePicker
  label={isRTL ? 'التاريخ' : 'Date'}
  value={selectedDate}
  onChange={setSelectedDate}
/>
```

---

## 📝 Template de remplacement

### Étape 1: Ajouter l'import
```jsx
import DatePicker from '../../components/ui/DatePicker';
```

### Étape 2: Remplacer l'input
```jsx
// AVANT
<input
  type="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
  className="..."
/>

// APRÈS
<DatePicker
  label="Date de naissance"
  title="Date de naissance"
  value={date}
  onChange={setDate}
  required
  error={errors.date?.message}
/>
```

---

## ⚠️ Points d'attention

### Format de date
- **Flowbite:** dd/mm/yyyy
- **Backend (si ISO):** yyyy-mm-dd
- **Conversion nécessaire** si le backend attend ISO

### Conversion dd/mm/yyyy → yyyy-mm-dd
```js
const convertToISO = (ddmmyyyy) => {
  if (!ddmmyyyy) return '';
  const [day, month, year] = ddmmyyyy.split('/');
  return `${year}-${month}-${day}`;
};
```

### Conversion yyyy-mm-dd → dd/mm/yyyy
```js
const convertFromISO = (yyyymmdd) => {
  if (!yyyymmdd) return '';
  const [year, month, day] = yyyymmdd.split('-');
  return `${day}/${month}/${year}`;
};
```

---

## 🚀 Commande pour migrer tous les fichiers

Utilisez ce script pour migrer automatiquement :

```bash
# Liste des fichiers à migrer
files=(
  "frontend/src/pages/dashboard/AttendanceReportPage.jsx"
  "frontend/src/pages/dashboard/DashboardSettingsPage.jsx"
  "frontend/src/components/modals/ApproveEnrollmentModal.jsx"
  "frontend/src/components/modals/CreateAppointmentModal.jsx"
  "frontend/src/components/modals/RescheduleAppointmentModal.jsx"
  "frontend/src/components/modals/EventModal.jsx"
  "frontend/src/components/modals/ReportAbsenceModal.jsx"
  "frontend/src/components/modals/TaskModal.jsx"
  "frontend/src/components/modals/RejectWithProposalModal.jsx"
  "frontend/src/components/modals/RequestAppointmentModal.jsx"
  "frontend/src/components/modals/PaymentAlertModal.jsx"
  "frontend/src/components/attendance/HistorySection.jsx"
)

echo "Fichiers à migrer: ${#files[@]}"
```

---

**Migration en cours: 5/19 occurrences migrées (26%)**
