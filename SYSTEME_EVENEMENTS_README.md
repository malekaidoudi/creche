# 📅 SYSTÈME UNIFIÉ DE GESTION D'ÉVÉNEMENTS - README

Date: 09/11/2025 14:15
Branche: `feature/unified-events-system`
Version: 1.0.0

---

## ✅ CE QUI A ÉTÉ CRÉÉ

### 1. Plan Complet (`PLAN_SYSTEME_EVENEMENTS.md`)

Un document détaillé de 500+ lignes contenant :
- 🏗️ Architecture complète
- 📊 Modèle de données
- 🔧 Structure backend
- 🎨 Structure frontend
- 🤖 Automatisations
- 📅 Vues UI
- 🚀 Plan d'implémentation (10 jours)

### 2. Migration Base de Données (`backend/database/migrations/create_events_system.sql`)

**Tables créées :**
- ✅ `events` - Table principale (tous les types d'événements)
- ✅ `event_reminders` - Rappels configurables
- ✅ `event_comments` - Commentaires sur événements
- ✅ `event_attachments` - Pièces jointes
- ✅ `event_history` - Historique des changements

**Vues créées :**
- 📊 `upcoming_events` - Événements à venir
- 🚨 `overdue_events` - Événements en retard
- ✅ `tasks_kanban` - Vue Kanban des tâches

**Fonctionnalités SQL :**
- ⏰ Trigger auto `updated_at`
- 📝 Logging automatique des changements
- 🔍 Index optimisés pour performance
- ✅ Contraintes et validations

---

## 🎯 TYPES D'ÉVÉNEMENTS SUPPORTÉS

| Type | Icône | Couleur | Usage |
|------|-------|---------|-------|
| `memo` | 📝 | Bleu | Mémos simples |
| `task` | ✅ | Vert | Tâches à accomplir |
| `rdv` | 📅 | Orange | Rendez-vous |
| `birthday` | 🎂 | Rose | Anniversaires enfants |
| `vacation_reminder` | 🏖️ | Violet | Rappels vacances |
| `medical` | 🏥 | Rouge | RDV médicaux |
| `meeting` | 👥 | Indigo | Réunions |
| `custom` | ⭐ | Gris | Personnalisé |

---

## 📊 STRUCTURE DE LA TABLE `events`

### Champs Principaux

```sql
-- Informations de base
title VARCHAR(255)           -- Titre de l'événement
description TEXT             -- Description détaillée
type VARCHAR(50)             -- Type (memo, task, rdv, etc.)

-- Dates
start_date TIMESTAMP         -- Date/heure de début
end_date TIMESTAMP           -- Date/heure de fin (optionnel)
all_day BOOLEAN              -- Événement toute la journée

-- Récurrence
is_recurring BOOLEAN         -- Est récurrent ?
recurrence_rule JSONB        -- Règle de récurrence
parent_event_id INTEGER      -- Événement parent (si récurrence)

-- Statut et priorité
status VARCHAR(50)           -- pending, in_progress, completed, cancelled, overdue
priority VARCHAR(20)         -- low, medium, high, urgent

-- Assignation
created_by INTEGER           -- Créateur
assigned_to INTEGER          -- Assigné à
child_id INTEGER             -- Enfant concerné (optionnel)

-- Rappels
reminder_enabled BOOLEAN     -- Rappels activés ?
reminder_offset INTEGER      -- Délai en minutes
reminder_sent BOOLEAN        -- Rappel envoyé ?

-- Métadonnées
color VARCHAR(20)            -- Couleur (calendrier)
location VARCHAR(255)        -- Lieu (pour RDV)
attendees JSONB              -- Participants
attachments JSONB            -- Pièces jointes
```

---

## 🔄 CYCLE DE VIE D'UN ÉVÉNEMENT

```
┌─────────────┐
│   CREATED   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   PENDING   │ ← État initial
└──────┬──────┘
       │
       ├──→ IN_PROGRESS (tâche commencée)
       │
       ├──→ COMPLETED (terminé)
       │
       ├──→ CANCELLED (annulé)
       │
       └──→ OVERDUE (en retard, auto)
```

---

## 🤖 AUTOMATISATIONS PRÉVUES

### 1. Génération Anniversaires
**Fréquence :** Quotidien (00:00)
**Action :**
- Scan tous les enfants inscrits
- Génère événements anniversaires pour l'année suivante
- Configure rappels automatiques (7 jours avant)

### 2. Envoi Rappels
**Fréquence :** Toutes les 15 minutes
**Action :**
- Vérifie les rappels à envoyer
- Envoie email/SMS/push selon config
- Marque comme envoyé

### 3. Détection Retards
**Fréquence :** Quotidien (06:00)
**Action :**
- Vérifie événements passés non complétés
- Change statut en `overdue`
- Envoie notification

### 4. Nettoyage
**Fréquence :** Hebdomadaire (dimanche 02:00)
**Action :**
- Supprime définitivement événements soft-deleted > 30 jours
- Archive anciens événements

---

## 📅 VUES FRONTEND PRÉVUES

### 1. Dashboard Principal
**URL :** `/dashboard/events`
**Widgets :**
- 📊 Statistiques (total, complétés, en retard)
- 📅 Mini calendrier
- 🎂 Prochains anniversaires (7 jours)
- ⏰ Événements à venir (3 jours)
- 🚨 Événements en retard
- ✅ Tâches récentes

### 2. Vue Calendrier
**URL :** `/dashboard/events/calendar`
**Fonctionnalités :**
- Vue mois/semaine/jour
- Drag & drop pour déplacer
- Clic pour créer
- Couleurs par type
- Filtres multiples

### 3. Vue Kanban (Tâches)
**URL :** `/dashboard/tasks/kanban`
**Colonnes :**
- 📝 À faire
- 🔄 En cours
- ✅ Terminé
- ❌ Annulé

### 4. Liste avec Filtres
**URL :** `/dashboard/events/list`
**Filtres :**
- Type, statut, priorité
- Assigné à, enfant
- Plage de dates

---

## 🚀 PROCHAINES ÉTAPES

### Phase 1: Backend Core ⏳
```bash
# Créer les routes
backend/routes_postgres/events.js
backend/routes_postgres/birthdays.js
backend/routes_postgres/tasks.js
backend/routes_postgres/reminders.js

# Créer les controllers
backend/controllers/eventsController.js
backend/controllers/birthdaysController.js
backend/controllers/tasksController.js
backend/controllers/remindersController.js

# Créer les services
backend/services/eventService.js
backend/services/birthdayService.js
backend/services/reminderService.js
```

### Phase 2: Jobs Automatiques ⏳
```bash
# Créer les jobs cron
backend/jobs/birthdayGenerator.js
backend/jobs/reminderScheduler.js
backend/jobs/overdueChecker.js
backend/jobs/cleanup.js
```

### Phase 3: Frontend Base ⏳
```bash
# Créer les pages
frontend/src/pages/events/EventsCalendar.jsx
frontend/src/pages/events/EventsList.jsx
frontend/src/pages/events/EventDetails.jsx
frontend/src/pages/events/EventForm.jsx
frontend/src/pages/tasks/TasksKanban.jsx
frontend/src/pages/dashboard/EventsDashboard.jsx

# Créer les composants
frontend/src/components/events/EventCard.jsx
frontend/src/components/events/EventFilters.jsx
frontend/src/components/calendar/CalendarView.jsx
frontend/src/components/kanban/KanbanBoard.jsx
```

### Phase 4: Intégration ⏳
```bash
# Hooks personnalisés
frontend/src/hooks/useEvents.js
frontend/src/hooks/useTasks.js
frontend/src/hooks/useBirthdays.js

# Services API
frontend/src/services/eventsApi.js
```

---

## 📝 EXEMPLES D'UTILISATION

### Créer un Mémo
```javascript
POST /api/events
{
  "type": "memo",
  "title": "Rappel: Commande fournitures",
  "description": "Commander crayons, papier, peinture",
  "start_date": "2025-11-15T09:00:00",
  "priority": "medium",
  "color": "#3B82F6"
}
```

### Créer une Tâche
```javascript
POST /api/events
{
  "type": "task",
  "title": "Préparer activité peinture",
  "description": "Acheter matériel et préparer salle",
  "start_date": "2025-11-15T09:00:00",
  "assigned_to": 2,
  "priority": "high",
  "status": "pending"
}
```

### Créer un RDV avec Rappels
```javascript
POST /api/events
{
  "type": "rdv",
  "title": "RDV pédiatre - Ahmed",
  "start_date": "2025-11-20T14:30:00",
  "end_date": "2025-11-20T15:00:00",
  "location": "Cabinet Dr. Dupont",
  "child_id": 5,
  "reminder_enabled": true,
  "reminders": [
    { "offset_minutes": 1440, "notification_type": "email" },
    { "offset_minutes": 120, "notification_type": "push" }
  ]
}
```

### Créer un Anniversaire Automatique
```javascript
POST /api/birthdays/generate
{
  "child_id": 5,
  "reminder_days": 7
}

// Génère automatiquement:
// - Événement récurrent annuel
// - Rappel 7 jours avant
// - Couleur rose
// - Type: birthday
```

---

## 🔍 REQUÊTES UTILES

### Événements à venir (7 jours)
```sql
SELECT * FROM upcoming_events 
WHERE start_date <= CURRENT_TIMESTAMP + INTERVAL '7 days'
LIMIT 10;
```

### Événements en retard
```sql
SELECT * FROM overdue_events;
```

### Tâches par statut (Kanban)
```sql
SELECT status, COUNT(*) as count
FROM tasks_kanban
GROUP BY status;
```

### Anniversaires du mois
```sql
SELECT * FROM events
WHERE type = 'birthday'
  AND EXTRACT(MONTH FROM start_date) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
  AND deleted_at IS NULL
ORDER BY EXTRACT(DAY FROM start_date);
```

---

## 🎨 DESIGN TOKENS

### Couleurs par Type
```javascript
const EVENT_COLORS = {
  memo: '#3B82F6',           // Bleu
  task: '#10B981',           // Vert
  rdv: '#F59E0B',            // Orange
  birthday: '#EC4899',       // Rose
  vacation_reminder: '#8B5CF6', // Violet
  medical: '#EF4444',        // Rouge
  meeting: '#6366F1',        // Indigo
  custom: '#6B7280'          // Gris
};
```

### Couleurs par Priorité
```javascript
const PRIORITY_COLORS = {
  low: '#6B7280',      // Gris
  medium: '#3B82F6',   // Bleu
  high: '#F59E0B',     // Orange
  urgent: '#EF4444'    // Rouge
};
```

### Couleurs par Statut
```javascript
const STATUS_COLORS = {
  pending: '#6B7280',       // Gris
  in_progress: '#3B82F6',   // Bleu
  completed: '#10B981',     // Vert
  cancelled: '#EF4444',     // Rouge
  overdue: '#DC2626'        // Rouge foncé
};
```

---

## 📦 DÉPENDANCES À INSTALLER

### Backend
```bash
npm install node-cron node-schedule
```

### Frontend
```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
npm install react-beautiful-dnd
npm install @tanstack/react-query
npm install date-fns
```

---

## 🧪 TESTS À EFFECTUER

### Backend
- [ ] Migration SQL s'exécute sans erreur
- [ ] Contraintes et validations fonctionnent
- [ ] Index créés correctement
- [ ] Triggers fonctionnent
- [ ] Vues retournent données correctes

### Frontend
- [ ] Calendrier affiche événements
- [ ] Kanban drag & drop fonctionne
- [ ] Filtres appliquent correctement
- [ ] Création/édition événements
- [ ] Rappels configurables

### Automatisations
- [ ] Job anniversaires génère événements
- [ ] Job rappels envoie notifications
- [ ] Job retards change statuts
- [ ] Job nettoyage supprime anciens

---

## 📚 DOCUMENTATION

### Fichiers Créés
1. ✅ `PLAN_SYSTEME_EVENEMENTS.md` - Plan complet (500+ lignes)
2. ✅ `create_events_system.sql` - Migration base de données
3. ✅ `SYSTEME_EVENEMENTS_README.md` - Ce fichier

### À Créer
- [ ] API Documentation (Swagger/OpenAPI)
- [ ] Guide utilisateur
- [ ] Guide développeur
- [ ] Tests E2E

---

## 🎯 ESTIMATION

**Temps total :** 10 jours (1 développeur)

**Répartition :**
- Base de données : 1 jour
- Backend core : 2 jours
- Automatisations : 1 jour
- Frontend base : 2 jours
- Vues avancées : 2 jours
- Tests & polish : 2 jours

---

## ✅ CHECKLIST AVANT DÉMARRAGE

- [x] Branche créée (`feature/unified-events-system`)
- [x] Plan détaillé rédigé
- [x] Migration SQL créée
- [x] README créé
- [ ] Migration testée en local
- [ ] Backend routes créées
- [ ] Frontend pages créées
- [ ] Tests unitaires
- [ ] Documentation API

---

**Date:** 09/11/2025 14:15  
**Branche:** `feature/unified-events-system`  
**Statut:** 📋 PLANIFICATION TERMINÉE - PRÊT POUR DÉVELOPPEMENT  
**Prochaine étape:** Tester la migration SQL
