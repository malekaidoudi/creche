# 🎯 SYSTÈME SIMPLIFIÉ - DOCUMENTATION COMPLÈTE

## 📋 VUE D'ENSEMBLE

Refonte radicale du système d'événements en **6 tables spécialisées** pour une architecture claire et maintenable.

---

## 🗄️ ARCHITECTURE BASE DE DONNÉES

### 1. **TASKS** - Tâches Admin → Staff
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INTEGER NOT NULL,  -- Staff
  created_by INTEGER NOT NULL,   -- Admin
  due_date TIMESTAMP NOT NULL,
  status VARCHAR(20),             -- pending, in_progress, completed
  priority VARCHAR(20),           -- low, medium, high, urgent
  completed_at TIMESTAMP
);
```

**Fonctionnalités:**
- ✅ Admin crée tâche → Staff notifié
- ✅ Staff complète → Admin notifié
- ✅ Rappels pour tâches en retard
- ✅ Widget "Tâches d'aujourd'hui"
- ✅ Widget "Tâches en retard" (admin)

---

### 2. **ANNOUNCEMENTS** - Actualités pour Parents
```sql
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP NOT NULL,
  event_type VARCHAR(50),         -- general, reunion, fete, sortie, fermeture
  target_audience VARCHAR(20),    -- all, specific
  target_children INTEGER[],      -- Si specific
  is_published BOOLEAN
);
```

**Fonctionnalités:**
- ✅ Admin crée annonce
- ✅ Publication → Parents notifiés
- ✅ Ciblage: tous ou enfants spécifiques
- ✅ Widget "Actualités" (parents)

---

### 3. **APPOINTMENTS** - Rendez-vous Admin ↔ Parent
```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL,
  child_id INTEGER,
  subject VARCHAR(255) NOT NULL,
  proposed_date TIMESTAMP NOT NULL,
  confirmed_date TIMESTAMP,
  status VARCHAR(20),             -- proposed, confirmed, rescheduled, completed, cancelled
  notes TEXT
);
```

**Fonctionnalités:**
- ✅ Admin propose RDV → Parent notifié
- ✅ Parent confirme ou propose nouvelle date
- ✅ Admin marque complété avec notes
- ✅ Widget "RDV aujourd'hui" (admin)

---

### 4. **PAYMENT_REMINDERS** - Rappels de Paiement
```sql
CREATE TABLE payment_reminders (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL,
  child_id INTEGER,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  message TEXT,
  status VARCHAR(20)              -- pending, paid, overdue
);
```

**Fonctionnalités:**
- ✅ Admin envoie rappel → Parent notifié
- ✅ Suivi des paiements
- ✅ Historique

---

### 5. **STAFF_MESSAGES** - Messages Staff ↔ Admin
```sql
CREATE TABLE staff_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  parent_message_id INTEGER,      -- Pour les réponses
  subject VARCHAR(255),
  content TEXT NOT NULL,
  is_read BOOLEAN,
  read_at TIMESTAMP
);
```

**Fonctionnalités:**
- ✅ Conversation avec réponses
- ✅ Thread via parent_message_id
- ✅ Notifications automatiques
- ✅ Widget "Messages" (admin + staff)

---

### 6. **PERSONAL_MEMOS** - Mémos Personnels
```sql
CREATE TABLE personal_memos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  memo_date DATE NOT NULL,
  is_completed BOOLEAN,
  completed_at TIMESTAMP
);
```

**Fonctionnalités:**
- ✅ Mémo personnel par utilisateur
- ✅ Date spécifique
- ✅ Bouton flottant "Ajouter mémo"
- ✅ Widget "Tâches d'aujourd'hui"

---

## 📊 VUES SQL CRÉÉES

### 1. **admin_today_tasks**
Combine tâches + RDV + mémos du jour pour l'admin
```sql
SELECT * FROM admin_today_tasks;
```

### 2. **staff_today_tasks**
Tâches + mémos du jour pour le staff
```sql
SELECT * FROM staff_today_tasks WHERE assigned_to = 2;
```

### 3. **overdue_tasks**
Tâches en retard avec possibilité de rappel
```sql
SELECT * FROM overdue_tasks;
```

### 4. **upcoming_birthdays**
Anniversaires 3 jours avant
```sql
SELECT * FROM upcoming_birthdays;
```

---

## 🔌 API ENDPOINTS

### **TÂCHES** (`/api/tasks-v2`)

| Méthode | Endpoint | Rôle | Description |
|---------|----------|------|-------------|
| POST | `/` | admin | Créer tâche |
| GET | `/my` | staff/admin | Mes tâches |
| GET | `/today` | staff/admin | Tâches aujourd'hui |
| GET | `/overdue` | admin | Tâches en retard |
| PATCH | `/:id/status` | staff/admin | Changer statut |
| POST | `/:id/remind` | admin | Envoyer rappel |
| DELETE | `/:id` | admin | Supprimer |

### **ANNONCES** (`/api/announcements`)

| Méthode | Endpoint | Rôle | Description |
|---------|----------|------|-------------|
| POST | `/` | admin | Créer annonce |
| GET | `/` | admin | Toutes les annonces |
| GET | `/my` | parent | Mes annonces |
| PATCH | `/:id/publish` | admin | Publier |
| DELETE | `/:id` | admin | Supprimer |

### **RENDEZ-VOUS** (`/api/appointments`)

| Méthode | Endpoint | Rôle | Description |
|---------|----------|------|-------------|
| POST | `/` | admin | Créer RDV |
| GET | `/` | admin/parent | Mes RDV |
| GET | `/today` | admin | RDV aujourd'hui |
| PATCH | `/:id/confirm` | parent | Confirmer |
| PATCH | `/:id/reschedule` | parent | Nouvelle date |
| PATCH | `/:id/complete` | admin | Marquer complété |
| PATCH | `/:id/cancel` | admin/parent | Annuler |

### **MESSAGES STAFF** (`/api/staff-messages`)

| Méthode | Endpoint | Rôle | Description |
|---------|----------|------|-------------|
| POST | `/` | staff/admin | Envoyer message |
| GET | `/` | staff/admin | Mes messages |
| GET | `/:id/conversation` | staff/admin | Conversation |
| PATCH | `/:id/read` | staff/admin | Marquer lu |

### **MÉMOS PERSONNELS** (`/api/personal-memos`)

| Méthode | Endpoint | Rôle | Description |
|---------|----------|------|-------------|
| POST | `/` | tous | Créer mémo |
| GET | `/` | tous | Mes mémos |
| GET | `/today` | tous | Mémos aujourd'hui |
| PATCH | `/:id/complete` | tous | Marquer complété |
| DELETE | `/:id` | tous | Supprimer |

---

## 🔔 SYSTÈME DE NOTIFICATIONS

### Types de notifications créés automatiquement:

| Action | Type | Destinataire | Message |
|--------|------|--------------|---------|
| Tâche créée | `task_assigned` | Staff | "X vous a assigné une tâche" |
| Tâche complétée | `task_completed` | Admin | "X a complété la tâche" |
| Rappel tâche | `task_reminder` | Staff | "Rappel: Tâche en retard" |
| Annonce publiée | `announcement` | Parents | Titre + description |
| RDV proposé | `appointment_proposed` | Parent | "X vous propose un RDV" |
| RDV confirmé | `appointment_confirmed` | Admin | "X a confirmé le RDV" |
| RDV replanifié | `appointment_rescheduled` | Admin | "X propose nouvelle date" |
| Message envoyé | `staff_message` | Destinataire | Contenu du message |

---

## 📱 WIDGETS FRONTEND À CRÉER

### **Dashboard Admin:**
1. **Tâches d'aujourd'hui**
   - Source: `admin_today_tasks`
   - Affiche: Tâches + RDV + mémos du jour

2. **Tâches en retard**
   - Source: `overdue_tasks`
   - Bouton "Envoyer rappel" sur chaque tâche

3. **Messages staff**
   - Source: `/api/staff-messages`
   - Conversations non lues

4. **Anniversaires**
   - Source: `upcoming_birthdays`
   - 3 jours avant

### **Dashboard Staff:**
1. **Mes tâches**
   - Source: `staff_today_tasks`
   - Boutons: En cours / Complété

2. **Mes messages**
   - Source: `/api/staff-messages`
   - Bouton "Nouveau message"

3. **Mes mémos**
   - Source: `/api/personal-memos/today`
   - Bouton flottant "+"

### **Espace Parent:**
1. **Actualités**
   - Source: `/api/announcements/my`
   - Événements à venir

2. **Mes RDV**
   - Source: `/api/appointments`
   - Boutons: Confirmer / Proposer date

---

## 🧪 TESTS POSTMAN

### Fichiers fournis:
- ✅ `POSTMAN_COLLECTION.json` - Collection complète
- ✅ `GUIDE_TESTS_POSTMAN.md` - Guide détaillé

### Ordre de tests:
1. Authentification (admin, staff, parent)
2. Tâches (création, complétion, rappel)
3. Annonces (création, publication)
4. RDV (proposition, confirmation, replanification)
5. Messages (envoi, réponse, conversation)
6. Mémos (création, complétion)

---

## 🚀 DÉMARRAGE

### Backend:
```bash
cd backend
npm start
```

### Vérifier les routes:
```
✓ /api/tasks-v2 (tâches simplifiées) 🆕
✓ /api/announcements (actualités parents) 🆕
✓ /api/appointments (rendez-vous) 🆕
✓ /api/staff-messages (messages staff) 🆕
✓ /api/personal-memos (mémos personnels) 🆕
```

### Importer Postman:
1. Ouvrir Postman
2. Import → `POSTMAN_COLLECTION.json`
3. Suivre `GUIDE_TESTS_POSTMAN.md`

---

## 📈 AVANTAGES DU SYSTÈME SIMPLIFIÉ

### ✅ **Architecture claire**
- Chaque table = 1 responsabilité
- Pas de confusion entre types
- Code plus lisible

### ✅ **Performance optimisée**
- Requêtes ciblées
- Index appropriés
- Vues SQL précalculées

### ✅ **Maintenabilité**
- Services séparés
- Routes dédiées
- Tests isolés

### ✅ **Évolutivité**
- Facile d'ajouter fonctionnalités
- Pas d'impact sur autres modules
- Migrations simples

### ✅ **Sécurité**
- Permissions par rôle
- Transactions sécurisées
- Validations strictes

---

## 🎯 PROCHAINES ÉTAPES

### Phase 1: Tests Backend ✅
- [x] Créer tables
- [x] Créer services
- [x] Créer routes
- [x] Monter dans server.js
- [x] Collection Postman
- [ ] Tester toutes les routes

### Phase 2: Frontend
- [ ] Widgets dashboard admin
- [ ] Widgets dashboard staff
- [ ] Widgets espace parent
- [ ] Formulaires création
- [ ] Bouton flottant mémos
- [ ] Notifications temps réel

### Phase 3: Intégration
- [ ] Calendrier événements
- [ ] Rappels automatiques
- [ ] Emails notifications
- [ ] Export rapports

### Phase 4: Production
- [ ] Tests end-to-end
- [ ] Documentation utilisateur
- [ ] Formation équipe
- [ ] Déploiement

---

## 📞 SUPPORT

Pour toute question:
1. Consulter `GUIDE_TESTS_POSTMAN.md`
2. Vérifier les logs backend
3. Tester avec Postman
4. Vérifier la base de données

---

**Version:** 3.0.0  
**Date:** 11/11/2025  
**Status:** ✅ Backend complet - Prêt pour tests
