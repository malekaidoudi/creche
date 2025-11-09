# 📅 SYSTÈME UNIFIÉ DE GESTION D'ÉVÉNEMENTS

Date: 09/11/2025 14:13
Version: 1.0.0
Branche: feature/unified-events-system

---

## 🎯 OBJECTIF

Créer un système complet et unifié pour gérer :
- 📝 Mémos
- ✅ Tâches
- 📅 Rendez-vous (RDV)
- 🎂 Anniversaires des enfants
- 🏖️ Rappels de vacances
- 🔔 Autres événements personnalisés

---

## 🏗️ ARCHITECTURE

### Stack Technologique

**Backend:**
- Node.js + Express
- PostgreSQL (base de données)
- node-cron (jobs périodiques)
- node-schedule (planification avancée)
- nodemailer (emails)

**Frontend:**
- React 18
- FullCalendar (vue calendrier)
- React DnD (Kanban drag & drop)
- Framer Motion (animations)
- React Query (cache & sync)

---

## 📊 MODÈLE DE DONNÉES

### Table: `events`

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  
  -- Informations de base
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- memo, task, rdv, birthday, vacation_reminder, custom
  
  -- Dates
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  all_day BOOLEAN DEFAULT false,
  
  -- Récurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule JSONB, -- {frequency: 'yearly', interval: 1, byMonth: 6, byDay: 15}
  
  -- Statut et priorité
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled, overdue
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  
  -- Assignation
  created_by INTEGER REFERENCES users(id),
  assigned_to INTEGER REFERENCES users(id),
  child_id INTEGER REFERENCES children(id), -- Pour anniversaires, RDV médicaux, etc.
  
  -- Rappels
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_offset INTEGER, -- En minutes (ex: 10080 = 7 jours)
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP,
  
  -- Métadonnées
  color VARCHAR(20), -- Pour affichage calendrier
  location VARCHAR(255), -- Pour RDV
  attendees JSONB, -- [{user_id: 1, status: 'accepted'}, ...]
  attachments JSONB, -- [{name: 'doc.pdf', url: '/uploads/...'}]
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Soft delete
  deleted_at TIMESTAMP
);

-- Index pour performance
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_assigned_to ON events(assigned_to);
CREATE INDEX idx_events_child_id ON events(child_id);
CREATE INDEX idx_events_deleted_at ON events(deleted_at);
```

### Table: `event_reminders`

```sql
CREATE TABLE event_reminders (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  
  -- Configuration du rappel
  offset_minutes INTEGER NOT NULL, -- Minutes avant l'événement
  notification_type VARCHAR(50) NOT NULL, -- email, sms, push, in_app
  
  -- Statut
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  scheduled_for TIMESTAMP NOT NULL,
  
  -- Métadonnées
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_reminders_scheduled ON event_reminders(scheduled_for, sent);
```

### Table: `event_comments`

```sql
CREATE TABLE event_comments (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  
  comment TEXT NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 BACKEND - STRUCTURE

### Routes API

```
/api/events
  GET    /                    - Liste tous les événements (avec filtres)
  POST   /                    - Créer un événement
  GET    /:id                 - Détails d'un événement
  PUT    /:id                 - Modifier un événement
  DELETE /:id                 - Supprimer (soft delete)
  PATCH  /:id/status          - Changer le statut
  PATCH  /:id/complete        - Marquer comme complété
  
  GET    /calendar            - Vue calendrier (format FullCalendar)
  GET    /upcoming            - Événements à venir
  GET    /overdue             - Événements en retard
  GET    /by-type/:type       - Filtrer par type
  GET    /by-child/:childId   - Événements d'un enfant
  
  POST   /:id/comments        - Ajouter un commentaire
  GET    /:id/comments        - Liste des commentaires
  
  POST   /:id/reminders       - Ajouter un rappel
  GET    /:id/reminders       - Liste des rappels

/api/birthdays
  GET    /                    - Anniversaires du mois
  GET    /upcoming            - Prochains anniversaires
  POST   /generate            - Générer événements anniversaires (admin)

/api/tasks
  GET    /kanban              - Vue Kanban (groupé par statut)
  PATCH  /:id/move            - Déplacer une tâche (Kanban)

/api/reminders
  GET    /pending             - Rappels en attente
  POST   /send                - Envoyer les rappels (cron job)
```

---

## 📁 STRUCTURE FICHIERS BACKEND

```
backend/
├── routes_postgres/
│   ├── events.js              ← Routes principales
│   ├── birthdays.js           ← Gestion anniversaires
│   ├── tasks.js               ← Gestion tâches (Kanban)
│   └── reminders.js           ← Gestion rappels
├── controllers/
│   ├── eventsController.js
│   ├── birthdaysController.js
│   ├── tasksController.js
│   └── remindersController.js
├── services/
│   ├── eventService.js        ← Logique métier
│   ├── birthdayService.js     ← Génération auto anniversaires
│   ├── reminderService.js     ← Envoi rappels
│   └── notificationService.js ← Notifications (email, SMS, push)
├── jobs/
│   ├── birthdayGenerator.js   ← Cron: génère anniversaires
│   ├── reminderScheduler.js   ← Cron: envoie rappels
│   └── overdueChecker.js      ← Cron: marque événements en retard
├── database/
│   └── migrations/
│       ├── create_events.sql
│       ├── create_event_reminders.sql
│       └── create_event_comments.sql
└── utils/
    ├── recurrence.js          ← Calcul récurrences
    └── dateHelpers.js         ← Helpers dates
```

---

## 🎨 FRONTEND - STRUCTURE

```
frontend/src/
├── pages/
│   ├── events/
│   │   ├── EventsCalendar.jsx      ← Vue calendrier
│   │   ├── EventsList.jsx          ← Liste avec filtres
│   │   ├── EventDetails.jsx        ← Détails + commentaires
│   │   └── EventForm.jsx           ← Création/édition
│   ├── tasks/
│   │   ├── TasksKanban.jsx         ← Vue Kanban
│   │   └── TaskDetails.jsx
│   ├── birthdays/
│   │   └── BirthdaysWidget.jsx     ← Widget anniversaires
│   └── dashboard/
│       └── EventsDashboard.jsx     ← Dashboard principal
├── components/
│   ├── events/
│   │   ├── EventCard.jsx
│   │   ├── EventFilters.jsx
│   │   ├── EventTypeIcon.jsx
│   │   ├── EventStatusBadge.jsx
│   │   ├── ReminderConfig.jsx
│   │   └── RecurrenceConfig.jsx
│   ├── calendar/
│   │   ├── CalendarView.jsx        ← FullCalendar wrapper
│   │   └── MiniCalendar.jsx
│   ├── kanban/
│   │   ├── KanbanBoard.jsx
│   │   ├── KanbanColumn.jsx
│   │   └── KanbanCard.jsx
│   └── widgets/
│       ├── UpcomingEvents.jsx
│       ├── OverdueEvents.jsx
│       └── BirthdaysThisMonth.jsx
├── hooks/
│   ├── useEvents.js
│   ├── useTasks.js
│   ├── useBirthdays.js
│   └── useReminders.js
└── services/
    └── eventsApi.js
```

---

## 🔄 FONCTIONNALITÉS DÉTAILLÉES

### 1. Création d'événement

**Types disponibles:**
- `memo` - Mémo simple
- `task` - Tâche à accomplir
- `rdv` - Rendez-vous
- `birthday` - Anniversaire
- `vacation_reminder` - Rappel vacances
- `medical` - RDV médical
- `meeting` - Réunion
- `custom` - Personnalisé

**Champs selon le type:**

**Mémo:**
- Titre, description, date
- Couleur, priorité

**Tâche:**
- Titre, description, date limite
- Assigné à, priorité, statut
- Checklist (sous-tâches)

**RDV:**
- Titre, description, date/heure
- Lieu, participants
- Rappels multiples

**Anniversaire:**
- Enfant concerné
- Récurrence annuelle automatique
- Rappel configurable

### 2. Récurrence

**Règles supportées:**
```javascript
{
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval: 1, // Tous les X jours/semaines/mois/ans
  byDay: [1, 3, 5], // Lundi, Mercredi, Vendredi
  byMonth: 6, // Juin
  byMonthDay: 15, // Le 15 du mois
  count: 10, // Nombre d'occurrences
  until: '2025-12-31' // Date de fin
}
```

### 3. Rappels

**Configuration:**
- Offset: 1h, 1j, 3j, 7j, 14j, 30j (personnalisable)
- Type: Email, SMS, Push, In-app
- Multiple rappels par événement

**Automatisation:**
- Job cron toutes les 15 minutes
- Vérifie les rappels à envoyer
- Marque comme envoyé

### 4. Statuts

**Cycle de vie:**
```
pending → in_progress → completed
                     ↘ cancelled
                     ↘ overdue (auto)
```

### 5. Priorités

**Niveaux:**
- `low` - Basse (gris)
- `medium` - Moyenne (bleu)
- `high` - Haute (orange)
- `urgent` - Urgente (rouge)

---

## 📅 VUES FRONTEND

### 1. Dashboard Principal

**Widgets:**
- 📊 Statistiques (total, complétés, en retard)
- 📅 Mini calendrier
- 🎂 Prochains anniversaires (7 jours)
- ⏰ Événements à venir (aujourd'hui + 3 jours)
- 🚨 Événements en retard
- ✅ Tâches récentes

### 2. Vue Calendrier

**Fonctionnalités:**
- Vue mois/semaine/jour
- Drag & drop pour déplacer
- Clic pour créer
- Couleurs par type
- Filtres (type, statut, assigné)

### 3. Vue Kanban (Tâches)

**Colonnes:**
- 📝 À faire (pending)
- 🔄 En cours (in_progress)
- ✅ Terminé (completed)
- ❌ Annulé (cancelled)

**Fonctionnalités:**
- Drag & drop entre colonnes
- Filtres (priorité, assigné, date)
- Compteurs par colonne

### 4. Liste avec Filtres

**Filtres:**
- Type d'événement
- Statut
- Priorité
- Assigné à
- Enfant concerné
- Plage de dates

**Tri:**
- Date (asc/desc)
- Priorité
- Statut
- Titre

---

## 🤖 AUTOMATISATIONS

### 1. Génération Anniversaires

**Job quotidien (00:00):**
```javascript
// Génère les anniversaires pour l'année suivante
// Pour chaque enfant inscrit
// Crée un événement récurrent annuel
```

### 2. Envoi Rappels

**Job toutes les 15 minutes:**
```javascript
// Vérifie les rappels à envoyer
// Envoie email/SMS/push
// Marque comme envoyé
```

### 3. Détection Retards

**Job quotidien (06:00):**
```javascript
// Vérifie les événements passés non complétés
// Change statut en 'overdue'
// Envoie notification
```

### 4. Nettoyage

**Job hebdomadaire (dimanche 02:00):**
```javascript
// Supprime définitivement les événements
// soft-deleted depuis > 30 jours
```

---

## 🔔 NOTIFICATIONS

### Types de notifications

**In-app:**
- Nouvel événement assigné
- Événement modifié
- Commentaire ajouté
- Rappel d'événement
- Événement en retard

**Email:**
- Rappels configurés
- Résumé hebdomadaire
- Événements en retard

**SMS (optionnel):**
- Rappels urgents
- RDV importants

**Push (optionnel):**
- Notifications temps réel

---

## 🎨 DESIGN UI

### Couleurs par Type

```javascript
const EVENT_COLORS = {
  memo: '#3B82F6',      // Bleu
  task: '#10B981',      // Vert
  rdv: '#F59E0B',       // Orange
  birthday: '#EC4899',  // Rose
  vacation_reminder: '#8B5CF6', // Violet
  medical: '#EF4444',   // Rouge
  meeting: '#6366F1',   // Indigo
  custom: '#6B7280'     // Gris
};
```

### Icônes par Type

```javascript
const EVENT_ICONS = {
  memo: <FileText />,
  task: <CheckSquare />,
  rdv: <Calendar />,
  birthday: <Cake />,
  vacation_reminder: <Plane />,
  medical: <Stethoscope />,
  meeting: <Users />,
  custom: <Star />
};
```

---

## 📊 EXEMPLES D'UTILISATION

### Créer un anniversaire automatique

```javascript
// Lors de l'inscription d'un enfant
await eventService.createBirthdayEvent({
  child_id: child.id,
  birth_date: child.birth_date,
  reminder_offset: 7 * 24 * 60 // 7 jours avant
});
```

### Créer une tâche

```javascript
await eventService.createEvent({
  type: 'task',
  title: 'Préparer activité peinture',
  description: 'Acheter matériel et préparer salle',
  start_date: '2025-11-15 09:00',
  assigned_to: staffId,
  priority: 'high',
  status: 'pending'
});
```

### Créer un RDV avec rappels

```javascript
await eventService.createEvent({
  type: 'rdv',
  title: 'RDV pédiatre - Ahmed',
  start_date: '2025-11-20 14:30',
  end_date: '2025-11-20 15:00',
  location: 'Cabinet Dr. Dupont',
  child_id: childId,
  reminder_enabled: true,
  reminders: [
    { offset_minutes: 24 * 60, type: 'email' },    // 1 jour
    { offset_minutes: 2 * 60, type: 'push' }       // 2 heures
  ]
});
```

---

## 🚀 PLAN D'IMPLÉMENTATION

### Phase 1: Base de données (Jour 1)
- [ ] Créer migrations SQL
- [ ] Créer seeds de test
- [ ] Tester requêtes

### Phase 2: Backend Core (Jours 2-3)
- [ ] Routes events
- [ ] Controllers
- [ ] Services
- [ ] Tests unitaires

### Phase 3: Automatisations (Jour 4)
- [ ] Jobs cron
- [ ] Service anniversaires
- [ ] Service rappels
- [ ] Service notifications

### Phase 4: Frontend Base (Jours 5-6)
- [ ] Pages principales
- [ ] Composants réutilisables
- [ ] Hooks
- [ ] Services API

### Phase 5: Vues Avancées (Jours 7-8)
- [ ] Calendrier FullCalendar
- [ ] Kanban drag & drop
- [ ] Dashboard widgets
- [ ] Filtres avancés

### Phase 6: Polish & Tests (Jours 9-10)
- [ ] Tests E2E
- [ ] Optimisations
- [ ] Documentation
- [ ] Déploiement

---

## 📝 NOTES IMPORTANTES

### Performance
- Index sur colonnes fréquemment filtrées
- Pagination sur toutes les listes
- Cache avec React Query
- Lazy loading des composants

### Sécurité
- Validation des permissions (qui peut voir/modifier quoi)
- Sanitization des inputs
- Rate limiting sur APIs
- CSRF protection

### Accessibilité
- Support clavier complet
- ARIA labels
- Contraste couleurs
- Responsive design

---

**Date:** 09/11/2025 14:13  
**Branche:** feature/unified-events-system  
**Statut:** 📋 PLAN CRÉÉ - PRÊT POUR IMPLÉMENTATION
