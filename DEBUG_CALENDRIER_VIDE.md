# 🔍 DEBUG: CALENDRIER VIDE

## 🎯 Problème

Les événements, tâches et RDV ne s'affichent pas dans le calendrier.

---

## 📋 Vérifications à Faire

### **1. Vérifier les logs de chargement**

**Dans la console, chercher:**
```javascript
🔄 CHARGEMENT CALENDRIER - Début
📋 Filtres actifs: []
📅 Période: { start: "...", end: "..." }
🌐 Requête événements: /api/events/views/calendar?...
📅 Réponse API events: { success: true, events: [...] }
```

**Questions:**
- `events` est-il un tableau vide `[]` ?
- Combien d'événements sont retournés ?

---

### **2. Vérifier la base de données**

**Exécuter dans psql:**
```sql
-- Voir tous les événements
SELECT id, title, type, start_date, end_date, status 
FROM events 
ORDER BY start_date DESC 
LIMIT 20;

-- Compter par type
SELECT type, COUNT(*) 
FROM events 
GROUP BY type;
```

**Résultat attendu:**
- Des événements avec `type = 'event'`
- Des tâches avec `type = 'task'`
- Des RDV avec `type = 'rdv'` OU dans la table `appointments`

---

### **3. Vérifier l'API**

**Test direct de l'API:**
```bash
# Dans le terminal
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3003/api/events/views/calendar?start=2025-01-01&end=2025-12-31"
```

**OU dans la console du navigateur:**
```javascript
// Copier-coller dans la console
fetch('/api/events/views/calendar?start=2025-01-01&end=2025-12-31', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(data => console.log('📊 Événements:', data));
```

---

## 🔍 Diagnostic selon les résultats

### **CAS A: `events: []` (tableau vide)**

**Cause:** Aucun événement dans la base de données OU mauvaise requête SQL

**Solution:**
1. Vérifier la base de données (voir section 2)
2. Vérifier les logs backend pour voir la requête SQL exécutée

---

### **CAS B: `events: [...]` (avec données) mais rien dans le calendrier**

**Cause:** Problème de format des dates ou de transformation

**Solution:**
1. Vérifier le format des dates dans la réponse API
2. Vérifier que `start_date` et `end_date` sont au bon format ISO

**Format attendu:**
```javascript
{
  id: 1,
  title: "Réunion",
  type: "event",
  start_date: "2025-11-20T14:00:00",  // ISO format
  end_date: "2025-11-20T16:00:00",
  all_day: false
}
```

---

### **CAS C: Événements créés mais pas retournés par l'API**

**Cause:** Problème dans la route `/api/events/views/calendar`

**Vérifier:**
```javascript
// Dans backend/routes_postgres/events.js
router.get('/views/calendar', async (req, res) => {
  // Cette route existe-t-elle ?
  // Retourne-t-elle tous les types d'événements ?
});
```

---

### **CAS D: RDV dans table `appointments` séparée**

**Problème:** Les RDV sont peut-être dans une table différente

**Solution:** Charger aussi les RDV depuis `/api/appointments`

```javascript
// Dans EventsCalendar.jsx
const appointmentsResponse = await api.get('/api/appointments');
const appointmentEvents = appointmentsResponse.data.appointments.map(apt => ({
  id: `apt-${apt.id}`,
  title: apt.subject,
  start: apt.proposed_date,
  backgroundColor: EVENT_TYPE_COLORS.rdv,
  extendedProps: { type: 'rdv' }
}));
```

---

## 🧪 Test Étape par Étape

### **Étape 1: Créer un événement test**

1. Menu latéral → Événement
2. Remplir:
   - Type: Réunion
   - Destination: Tous
   - Titre: "TEST CALENDRIER"
   - Date: Aujourd'hui
   - Heure: 14:00
3. Créer
4. ✅ Vérifier le message de succès

---

### **Étape 2: Vérifier dans la base de données**

```sql
SELECT * FROM events 
WHERE title = 'TEST CALENDRIER';
```

**Si l'événement existe:**
- ✅ La création fonctionne
- ❌ Le problème est dans l'affichage

**Si l'événement n'existe pas:**
- ❌ La création ne fonctionne pas
- Vérifier les logs backend

---

### **Étape 3: Recharger le calendrier**

1. Aller sur Calendrier
2. Ouvrir la console
3. Chercher les logs:
   ```
   📅 Réponse API events: { success: true, events: [...] }
   ```
4. Vérifier si "TEST CALENDRIER" est dans le tableau

---

### **Étape 4: Vérifier le rendu**

**Si l'événement est dans la réponse API mais pas visible:**

Vérifier dans la console:
```javascript
// Copier-coller
console.log('📊 Événements FullCalendar:', 
  document.querySelector('.fc-event')
);
```

**Si `null`:** Problème de transformation ou de dates

---

## 🎯 Actions Immédiates

**MAINTENANT:**

1. **Ouvrir le calendrier**
2. **Ouvrir la console (F12)**
3. **Chercher:** `📅 Réponse API events:`
4. **Copier la réponse complète ici**

**Avec cette info, on saura exactement où est le problème ! 🔍**
