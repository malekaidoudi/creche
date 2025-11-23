# 📅 Guide Flowbite Datepicker

**Date:** 22 novembre 2025  
**Librairie:** Flowbite Datepicker

---

## 🎯 Installation

### Packages installés:
```bash
npm install flowbite flowbite-datepicker
```

### Configuration Tailwind:
```js
// tailwind.config.js
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
  "./node_modules/flowbite/**/*.js"  // ← Ajouté
],
plugins: [
  require('@tailwindcss/forms'),
  require('@tailwindcss/typography'),
  require('@tailwindcss/aspect-ratio'),
  require('flowbite/plugin')  // ← Ajouté
]
```

### Import dans main.jsx:
```js
import 'flowbite'
import 'flowbite-datepicker'
```

---

## 📦 Composants créés

### 1. **DatePicker** - Pour les dates simples
**Fichier:** `frontend/src/components/ui/DatePicker.jsx`

**Utilisation:**
```jsx
import DatePicker from '../../components/ui/DatePicker'

<DatePicker
  label="Date de naissance"
  title="Sélectionnez votre date de naissance"
  required
  error={errors.birth_date?.message}
  value={birthDate}
  onChange={(value) => setBirthDate(value)}
/>
```

**Props:**
- `label` - Label du champ
- `title` - Titre du datepicker (datepicker-title)
- `required` - Affiche * si requis
- `error` - Message d'erreur
- `value` - Valeur du champ
- `onChange` - Callback de changement
- `className` - Classes CSS additionnelles
- `containerClassName` - Classes pour le conteneur

**Fonctionnalités:**
- ✅ `datepicker-autohide` - Fermeture automatique
- ✅ `datepicker-title` - Titre personnalisé
- ✅ Bouton "Aujourd'hui"
- ✅ Bouton "Effacer"
- ✅ Format: yyyy-mm-dd
- ✅ Langue: français

---

### 2. **DateRangePicker** - Pour les plages de dates (vacances)
**Fichier:** `frontend/src/components/ui/DateRangePicker.jsx`

**Utilisation:**
```jsx
import DateRangePicker from '../../components/ui/DateRangePicker'

<DateRangePicker
  label="Période de vacances"
  title="Sélectionnez la période"
  required
  error={errors.vacation?.message}
  startValue={startDate}
  endValue={endDate}
  onStartChange={(value) => setStartDate(value)}
  onEndChange={(value) => setEndDate(value)}
/>
```

**Props:**
- `label` - Label du champ
- `title` - Titre du datepicker
- `required` - Affiche * si requis
- `error` - Message d'erreur
- `startValue` - Valeur date de début
- `endValue` - Valeur date de fin
- `onStartChange` - Callback changement début
- `onEndChange` - Callback changement fin
- `className` - Classes CSS additionnelles
- `containerClassName` - Classes pour le conteneur

**Fonctionnalités:**
- ✅ `date-rangepicker` - Sélection de plage
- ✅ Deux champs: début et fin
- ✅ Flèche de séparation
- ✅ Fermeture automatique
- ✅ Format: yyyy-mm-dd

---

### 3. **TimePicker** - Pour les heures
**Fichier:** `frontend/src/components/ui/TimePicker.jsx`

**Utilisation:**
```jsx
import TimePicker from '../../components/ui/TimePicker'

<TimePicker
  label="Heure d'arrivée"
  required
  error={errors.arrival_time?.message}
  value={arrivalTime}
  onChange={(value) => setArrivalTime(value)}
/>
```

**Props:**
- `label` - Label du champ
- `required` - Affiche * si requis
- `error` - Message d'erreur
- `value` - Valeur du champ (HH:mm)
- `onChange` - Callback de changement
- `className` - Classes CSS additionnelles
- `containerClassName` - Classes pour le conteneur

**Fonctionnalités:**
- ✅ Input HTML5 time
- ✅ Même style que Flowbite Datepicker
- ✅ Format: HH:mm (24h)
- ✅ Largeur 100% garantie

---

## 🎨 Styles appliqués

Tous les composants utilisent les mêmes classes Tailwind:

```jsx
className="
  block w-full px-4 py-3 
  border rounded-lg 
  bg-white dark:bg-gray-700 
  text-gray-900 dark:text-white 
  placeholder-gray-400
  focus:ring-2 focus:ring-primary-500 focus:border-transparent
  transition-all
  border-gray-300 dark:border-gray-600
"
```

---

## 📋 Fichiers migrés

### ✅ Page d'inscription
**Fichier:** `frontend/src/pages/public/EnrollmentPage.jsx`

**Champs:**
1. Date de naissance (Étape 1)
2. Date d'inscription souhaitée (Étape 2)

---

## 📝 Exemples d'utilisation

### Exemple 1: Date simple avec react-hook-form
```jsx
import { useForm } from 'react-hook-form'
import DatePicker from '../../components/ui/DatePicker'

const MyForm = () => {
  const { register, formState: { errors }, watch, setValue } = useForm()
  
  return (
    <DatePicker
      label="Date de naissance"
      title="Sélectionnez votre date de naissance"
      required
      error={errors.birth_date?.message}
      value={watch('birth_date')}
      onChange={(value) => setValue('birth_date', value)}
    />
  )
}
```

### Exemple 2: Plage de dates pour vacances
```jsx
import { useState } from 'react'
import DateRangePicker from '../../components/ui/DateRangePicker'

const VacationForm = () => {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  return (
    <DateRangePicker
      label="Période de vacances"
      title="Sélectionnez vos dates de vacances"
      required
      startValue={startDate}
      endValue={endDate}
      onStartChange={setStartDate}
      onEndChange={setEndDate}
    />
  )
}
```

### Exemple 3: Heure avec TimePicker
```jsx
import { useState } from 'react'
import TimePicker from '../../components/ui/TimePicker'

const ScheduleForm = () => {
  const [time, setTime] = useState('09:00')
  
  return (
    <TimePicker
      label="Heure d'arrivée"
      required
      value={time}
      onChange={setTime}
    />
  )
}
```

---

## 🔧 Configuration Flowbite Datepicker

### Options par défaut:
```js
{
  autohide: true,           // Fermeture automatique
  format: 'yyyy-mm-dd',     // Format de date
  title: 'Titre',           // Titre du picker
  todayBtn: true,           // Bouton "Aujourd'hui"
  clearBtn: true,           // Bouton "Effacer"
  language: 'fr',           // Langue française
  orientation: 'bottom auto' // Position automatique
}
```

### Personnalisation:
Pour modifier les options, éditez les composants dans:
- `frontend/src/components/ui/DatePicker.jsx`
- `frontend/src/components/ui/DateRangePicker.jsx`

---

## 🧪 Tests à effectuer

### DatePicker:
- [ ] Ouvrir le calendrier
- [ ] Sélectionner une date
- [ ] Vérifier fermeture automatique
- [ ] Tester bouton "Aujourd'hui"
- [ ] Tester bouton "Effacer"
- [ ] Vérifier largeur 100%
- [ ] Tester sur Safari, Chrome, Firefox

### DateRangePicker:
- [ ] Sélectionner date de début
- [ ] Sélectionner date de fin
- [ ] Vérifier plage valide
- [ ] Tester fermeture automatique
- [ ] Vérifier largeur des deux champs

### TimePicker:
- [ ] Sélectionner une heure
- [ ] Vérifier format HH:mm
- [ ] Tester sur Safari, Chrome, Firefox
- [ ] Vérifier largeur 100%

---

## 📊 Avantages Flowbite

### Avant (input natif):
```
❌ Largeur variable selon navigateur
❌ Styles inconsistants
❌ Pas de calendrier visuel
❌ Problème Safari
```

### Après (Flowbite):
```
✅ Calendrier visuel moderne
✅ Styles uniformes
✅ Fermeture automatique
✅ Boutons Aujourd'hui/Effacer
✅ Support multilingue
✅ Largeur 100% garantie
✅ Compatible Safari
```

---

## 🚀 Prochaines étapes

### Priorité haute:
- [x] Installer Flowbite
- [x] Créer les composants
- [x] Configurer Tailwind
- [x] Migrer page inscription
- [ ] Tester sur tous les navigateurs

### Priorité moyenne:
- [ ] Migrer les autres pages si nécessaire
- [ ] Ajouter traductions AR pour le datepicker
- [ ] Personnaliser les thèmes dark/light

### Optionnel:
- [ ] Ajouter DateTimePicker (date + heure)
- [ ] Ajouter MonthPicker (mois/année)
- [ ] Ajouter WeekPicker (semaine)

---

## 📚 Documentation Flowbite

- **Site officiel:** https://flowbite.com/docs/plugins/datepicker/
- **GitHub:** https://github.com/themesberg/flowbite-datepicker
- **NPM:** https://www.npmjs.com/package/flowbite-datepicker

---

**Flowbite Datepicker configuré et prêt à l'emploi ! 🎉**
