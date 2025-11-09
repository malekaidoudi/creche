# ✅ ADAPTATIONS - SYSTÈME ÉVÉNEMENTS

Date: 09/11/2025 14:28
Branche: `feature/unified-events-system`

---

## 🔧 ADAPTATIONS EFFECTUÉES

### 1. ❌ SMS Supprimé

**Raison:** Pas de système SMS dans l'application

**Modifications:**
- ✅ Migration SQL mise à jour
- ✅ Types de notifications: `email` et `in_app` uniquement
- ✅ Suppression de toutes les références SMS

**Avant:**
```sql
notification_type IN ('email', 'sms', 'push', 'in_app')
```

**Après:**
```sql
notification_type IN ('email', 'in_app')
```

### 2. ✅ Email via Resend

**Configuration existante:**
- API: Resend
- Domaine: `mima-elghalia.com`
- From: `notifications@mima-elghalia.com`

**Service créé:** `backend/services/eventEmailService.js`

**Fonctions disponibles:**
- `sendEventReminder()` - Rappel d'événement
- `sendEventAssigned()` - Notification d'assignation
- `sendEventOverdue()` - Alerte événement en retard
- `sendBirthdayReminder()` - Rappel anniversaire

### 3. 📊 Intégration Dashboard Existant

**Composants à intégrer:**
- Widget événements à venir
- Widget tâches en retard
- Widget anniversaires du mois
- Mini calendrier
- Compteurs statistiques

**Emplacement:** Dashboard principal existant

---

## 📧 SERVICE EMAIL RESEND

### Configuration

**Variables d'environnement requises:**
```env
RESEND_API_KEY=re_xxxxx
FRONTEND_URL=http://localhost:5173
```

### Templates Email Créés

#### 1. Rappel d'Événement
**Sujet:** `Rappel: [Titre] - dans X jours`
**Contenu:**
- Type et priorité de l'événement
- Titre et description
- Date et heure
- Lieu (si RDV)
- Bouton "Voir les détails"

#### 2. Assignation de Tâche
**Sujet:** `Nouvelle tâche assignée: [Titre]`
**Contenu:**
- Qui a assigné la tâche
- Type et priorité
- Titre et description
- Date limite
- Bouton "Voir mes tâches"

#### 3. Événement en Retard
**Sujet:** `⚠️ Événement en retard: [Titre]`
**Contenu:**
- Type d'événement
- Titre et description
- Date prévue
- Bouton "Voir les détails"

#### 4. Rappel Anniversaire
**Sujet:** `🎂 Anniversaire de [Prénom] dans X jours`
**Contenu:**
- Nom de l'enfant
- Âge qu'il aura
- Nombre de jours restants
- Bouton "Voir le calendrier"

---

## 🎨 DESIGN DES EMAILS

### Couleurs par Type

**Rappel d'événement:**
- Gradient: Violet (#667eea → #764ba2)
- Bouton: #667eea

**Assignation:**
- Gradient: Vert (#10b981 → #059669)
- Bouton: #10b981

**En retard:**
- Gradient: Rouge (#ef4444 → #dc2626)
- Bouton: #ef4444

**Anniversaire:**
- Gradient: Rose (#ec4899 → #db2777)
- Bouton: #ec4899

### Structure HTML

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* Styles inline pour compatibilité email */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <!-- En-tête avec gradient -->
    </div>
    
    <div class="content">
      <!-- Contenu principal -->
      <div class="event-card">
        <!-- Détails événement -->
      </div>
      
      <a href="..." class="button">
        <!-- Action -->
      </a>
      
      <div class="footer">
        <!-- Signature -->
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 🔔 TYPES DE NOTIFICATIONS

### 1. Email (via Resend)
**Quand:**
- Rappels configurés (X minutes avant)
- Assignation de tâche
- Événement en retard
- Anniversaire à venir

**Destinataires:**
- Utilisateur assigné
- Créateur (si différent)
- Tous les staff (pour anniversaires)

### 2. In-App (Notifications internes)
**Quand:**
- Nouvel événement créé
- Événement modifié
- Commentaire ajouté
- Statut changé

**Affichage:**
- Badge de notification
- Centre de notifications
- Toast temporaire

---

## 📊 INTÉGRATION DASHBOARD

### Widgets à Ajouter

#### 1. Événements à Venir (3 jours)
```jsx
<UpcomingEventsWidget />
```
**Affiche:**
- 5 prochains événements
- Type, titre, date
- Priorité (couleur)
- Lien vers détails

#### 2. Tâches en Retard
```jsx
<OverdueTasksWidget />
```
**Affiche:**
- Tâches overdue
- Nombre de jours de retard
- Assigné à
- Bouton "Traiter"

#### 3. Anniversaires du Mois
```jsx
<BirthdaysWidget />
```
**Affiche:**
- Enfants avec anniversaire ce mois
- Photo, nom, date
- Âge qu'ils auront
- Icône 🎂

#### 4. Mini Calendrier
```jsx
<MiniCalendar />
```
**Affiche:**
- Vue mois
- Points colorés sur dates avec événements
- Clic → Ouvre calendrier complet

#### 5. Statistiques
```jsx
<EventsStatsWidget />
```
**Affiche:**
- Total événements
- Complétés ce mois
- En retard
- À venir cette semaine

---

## 🚀 PROCHAINES ÉTAPES

### Phase 1: Backend ⏳
- [ ] Créer routes events.js
- [ ] Créer controller eventsController.js
- [ ] Créer service eventService.js
- [ ] Tester envoi emails Resend

### Phase 2: Jobs Cron ⏳
- [ ] Job reminderScheduler.js (15 min)
- [ ] Job birthdayGenerator.js (quotidien)
- [ ] Job overdueChecker.js (quotidien)
- [ ] Configurer node-cron

### Phase 3: Frontend ⏳
- [ ] Créer widgets dashboard
- [ ] Intégrer dans DashboardHome.jsx
- [ ] Créer page EventsCalendar.jsx
- [ ] Créer page TasksKanban.jsx

### Phase 4: Tests ⏳
- [ ] Tester envoi emails
- [ ] Tester jobs cron
- [ ] Tester widgets dashboard
- [ ] Tests E2E

---

## 📝 EXEMPLE D'UTILISATION

### Créer un Événement avec Rappel Email

```javascript
// Backend - Route POST /api/events
const event = await db.query(`
  INSERT INTO events (
    title, description, type, start_date, 
    assigned_to, priority, reminder_enabled
  ) VALUES ($1, $2, $3, $4, $5, $6, true)
  RETURNING *
`, [
  'Préparer activité peinture',
  'Acheter matériel et préparer salle',
  'task',
  '2025-11-15 09:00:00',
  staffId,
  'high'
]);

// Créer le rappel email
await db.query(`
  INSERT INTO event_reminders (
    event_id, offset_minutes, notification_type, scheduled_for
  ) VALUES ($1, $2, 'email', $3)
`, [
  event.id,
  1440, // 1 jour avant
  new Date(event.start_date - 1440 * 60 * 1000)
]);

// Envoyer email d'assignation
const assignedUser = await getUser(staffId);
const creatorUser = await getUser(createdBy);
await sendEventAssigned(event, assignedUser, creatorUser);
```

### Job Cron - Envoi Rappels

```javascript
// backend/jobs/reminderScheduler.js
const cron = require('node-cron');
const { sendEventReminder } = require('../services/eventEmailService');

// Toutes les 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('🔔 Vérification des rappels à envoyer...');
  
  // Récupérer rappels à envoyer
  const reminders = await db.query(`
    SELECT er.*, e.*, u.email, u.first_name, u.last_name
    FROM event_reminders er
    JOIN events e ON er.event_id = e.id
    JOIN users u ON e.assigned_to = u.id
    WHERE er.sent = false
      AND er.notification_type = 'email'
      AND er.scheduled_for <= NOW()
      AND e.deleted_at IS NULL
  `);
  
  // Envoyer chaque rappel
  for (const reminder of reminders.rows) {
    const result = await sendEventReminder(
      reminder,
      { email: reminder.email, first_name: reminder.first_name },
      reminder.offset_minutes
    );
    
    if (result.success) {
      // Marquer comme envoyé
      await db.query(`
        UPDATE event_reminders
        SET sent = true, sent_at = NOW()
        WHERE id = $1
      `, [reminder.id]);
    } else {
      // Logger l'erreur
      await db.query(`
        UPDATE event_reminders
        SET error_message = $1
        WHERE id = $2
      `, [result.error, reminder.id]);
    }
  }
  
  console.log(`✅ ${reminders.rows.length} rappel(s) traité(s)`);
});
```

---

## ✅ CHECKLIST

### Configuration
- [x] Migration SQL adaptée (sans SMS)
- [x] Service email Resend créé
- [x] Templates email créés
- [ ] Variables d'environnement configurées
- [ ] Resend API key ajoutée

### Backend
- [ ] Routes events créées
- [ ] Controllers créés
- [ ] Services créés
- [ ] Jobs cron créés
- [ ] Tests unitaires

### Frontend
- [ ] Widgets dashboard créés
- [ ] Intégration dans DashboardHome
- [ ] Pages événements créées
- [ ] Composants créés
- [ ] Tests E2E

### Tests
- [ ] Envoi email rappel
- [ ] Envoi email assignation
- [ ] Envoi email retard
- [ ] Envoi email anniversaire
- [ ] Jobs cron fonctionnels
- [ ] Widgets affichés correctement

---

## 📦 DÉPENDANCES

### Backend
```bash
cd backend
npm install node-cron
# Resend déjà installé
```

### Frontend
```bash
cd frontend
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
npm install react-beautiful-dnd
npm install @tanstack/react-query
npm install date-fns
```

---

## 🎯 RÉSUMÉ DES CHANGEMENTS

### Supprimé ❌
- SMS (pas de système SMS)
- Push notifications (simplifié)

### Conservé ✅
- Email via Resend (déjà configuré)
- Notifications in-app
- Tous les types d'événements (8)
- Calendrier, Kanban, Dashboard
- Jobs cron automatiques
- Rappels configurables

### Ajouté ✨
- Service email Resend complet
- 4 templates email professionnels
- Intégration dashboard existant
- Widgets événements
- Documentation adaptée

---

**Date:** 09/11/2025 14:28  
**Branche:** `feature/unified-events-system`  
**Statut:** ✅ ADAPTATIONS TERMINÉES  
**Prochaine étape:** Créer les routes backend et tester l'envoi d'emails
