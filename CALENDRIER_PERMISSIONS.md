# ✅ CALENDRIER - PERMISSIONS PAR RÔLE

## 🎯 Modifications Effectuées

### **1. Backend - Permissions**

**Fichier:** `backend/services/eventService.js`

**Fonction `getCalendarEvents` modifiée pour gérer 3 rôles:**

#### **Admin:**
- Voit tout ce qui lui est assigné OU créé par lui
- Accès complet à tous les types d'événements

#### **Staff:**
- Voit tout SAUF:
  - ❌ Mémos de l'admin (type='memo' ET created_by != staff)
  - ❌ RDV non assignés à lui
  - ❌ Tâches non assignées à lui
- Voit:
  - ✅ Ses propres mémos
  - ✅ RDV assignés à lui
  - ✅ Tâches assignées à lui
  - ✅ Tous les événements publics (réunions, célébrations, etc.)
  - ✅ Anniversaires
  - ✅ Vacances

#### **Parent:**
- Voit uniquement:
  - ✅ Réunions (event_type='meeting')
  - ✅ Célébrations (event_type='celebration')
  - ✅ Anniversaires (type='birthday')
  - ✅ Vacances (type='vacation_reminder')
  - ✅ RDV liés à lui (assigned_to OU parent_id)
- Ne voit PAS:
  - ❌ Mémos
  - ❌ Tâches
  - ❌ RDV des autres parents

---

### **2. Frontend - Menu Latéral**

**Fichier:** `frontend/src/components/ui/SideMenu.jsx`

**Ajout du bouton Calendrier pour les parents:**
```javascript
{
  id: 'parent-calendar',
  icon: Calendar,
  label: 'Calendrier',
  color: 'from-purple-500 to-indigo-500',
  onClick: () => navigate('/mon-espace/calendar')
}
```

**Ordre des boutons pour les parents:**
1. 💬 Messages
2. 📢 Annonces
3. 📅 **Calendrier** (nouveau)
4. 📊 Rapport de présence
5. 📅 Demander un RDV

---

### **3. Frontend - Route**

**Fichier:** `frontend/src/App.jsx`

**Nouvelle route ajoutée:**
```javascript
<Route
  path="mon-espace/calendar"
  element={
    <ProtectedRoute roles={['parent']}>
      <EventsCalendar />
    </ProtectedRoute>
  }
/>
```

---

## 🔍 Requêtes SQL Générées

### **Admin:**
```sql
SELECT * FROM events
WHERE deleted_at IS NULL
  AND start_date >= $1
  AND start_date <= $2
  AND (assigned_to = $3 OR created_by = $3)
ORDER BY start_date ASC
```

### **Staff:**
```sql
SELECT * FROM events
WHERE deleted_at IS NULL
  AND start_date >= $1
  AND start_date <= $2
  AND (
    (type NOT IN ('memo', 'rdv', 'task'))
    OR (type = 'memo' AND created_by = $3)
    OR (type = 'rdv' AND assigned_to = $3)
    OR (type = 'task' AND assigned_to = $3)
  )
ORDER BY start_date ASC
```

### **Parent:**
```sql
SELECT * FROM events
WHERE deleted_at IS NULL
  AND start_date >= $1
  AND start_date <= $2
  AND (
    (type = 'event' AND event_type IN ('meeting', 'celebration'))
    OR type = 'birthday'
    OR type = 'vacation_reminder'
    OR (type = 'rdv' AND (assigned_to = $3 OR parent_id = $3))
  )
ORDER BY start_date ASC
```

---

## 🧪 Tests à Effectuer

### **Test 1: Admin**
1. Se connecter en admin
2. Aller sur Calendrier
3. ✅ Voir tous les événements créés ou assignés

### **Test 2: Staff**
1. Se connecter en staff
2. Aller sur Calendrier
3. ✅ Voir les événements publics
4. ✅ Voir ses propres mémos
5. ✅ Voir les RDV/tâches assignés à lui
6. ❌ Ne PAS voir les mémos de l'admin
7. ❌ Ne PAS voir les RDV/tâches des autres

### **Test 3: Parent**
1. Se connecter en parent
2. Menu latéral → Cliquer "Calendrier"
3. ✅ Voir les réunions
4. ✅ Voir les célébrations
5. ✅ Voir les anniversaires
6. ✅ Voir les vacances
7. ✅ Voir ses propres RDV
8. ❌ Ne PAS voir les mémos
9. ❌ Ne PAS voir les tâches
10. ❌ Ne PAS voir les RDV des autres

---

## 📊 Exemple de Données

### **Événements dans la base:**
```
ID | Type              | Event_Type  | Assigned_To | Created_By | Parent_ID
1  | memo              | NULL        | 2           | 1          | NULL
2  | event             | meeting     | NULL        | 1          | NULL
3  | event             | celebration | NULL        | 1          | NULL
4  | task              | NULL        | 2           | 1          | NULL
5  | rdv               | NULL        | 3           | 1          | 3
6  | birthday          | NULL        | NULL        | 1          | NULL
7  | vacation_reminder | NULL        | NULL        | 1          | NULL
```

### **Ce que voit chaque rôle:**

**Admin (ID=1):**
- Tous (1-7) car created_by=1

**Staff (ID=2):**
- 2, 3, 4, 6, 7
- Pas 1 (mémo de l'admin)
- Pas 5 (RDV d'un parent)

**Parent (ID=3):**
- 2, 3, 5, 6, 7
- Pas 1 (mémo)
- Pas 4 (tâche)

---

## ✅ Résultat Final

**Tous les rôles ont maintenant accès au calendrier avec les bonnes permissions ! 🎉**

- ✅ Admin: Accès complet
- ✅ Staff: Accès filtré (sans mémos admin, sans RDV/tâches non assignés)
- ✅ Parent: Accès limité (réunions, célébrations, anniversaires, vacances, ses RDV)
- ✅ Menu latéral parent: Bouton Calendrier ajouté
- ✅ Route parent: `/mon-espace/calendar` créée
