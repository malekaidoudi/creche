# Migration des Modals vers DatePicker

## Modals à migrer

1. ✅ EventModal.jsx - FAIT
2. ⏳ TaskModal.jsx - 2 dates
3. ⏳ RescheduleAppointmentModal.jsx - 1 date
4. ⏳ CreateAppointmentModal.jsx - 1 date
5. ⏳ ApproveEnrollmentModal.jsx - 1 date
6. ⏳ RequestAppointmentModal.jsx - 1 date
7. ⏳ ReportAbsenceModal.jsx - 1 date
8. ⏳ PaymentAlertModal.jsx - 1 date
9. ⏳ RejectWithProposalModal.jsx - 1 date

## Changements à appliquer pour chaque modal

### 1. Imports
```js
import DatePicker from '../ui/DatePicker';
import { convertToISO, convertFromISO } from '../../utils/dateUtils';
```

### 2. Remplacer input date par DatePicker
```jsx
// AVANT
<input
  type="date"
  value={formData.date}
  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
/>

// APRÈS
<DatePicker
  label="Date"
  required
  value={formData.date}
  onChange={(value) => setFormData({ ...formData, date: value })}
/>
```

### 3. Convertir avant envoi API
```js
// AVANT
const data = {
  date: formData.date
}

// APRÈS
const data = {
  date: convertToISO(formData.date)
}
```

### 4. Convertir au chargement (si édition)
```js
// AVANT
setFormData({
  date: response.data.date
})

// APRÈS
setFormData({
  date: convertFromISO(response.data.date)
})
```
