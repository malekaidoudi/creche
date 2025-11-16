# 📋 GUIDE DE TESTS POSTMAN - SYSTÈME SIMPLIFIÉ

## 🚀 INSTALLATION

### 1. Importer la collection
1. Ouvrir Postman
2. Cliquer sur **Import**
3. Sélectionner le fichier `POSTMAN_COLLECTION.json`
4. La collection "Crèche Mima El Ghalia - API Simplifiée" apparaît

### 2. Configuration
- **Base URL**: `http://localhost:3003` (déjà configuré)
- Les tokens sont automatiquement sauvegardés après login

---

## 📝 ORDRE DE TESTS RECOMMANDÉ

### ÉTAPE 1: AUTHENTIFICATION

#### 1.1 Login Admin
```
POST /api/auth/login
Body:
{
  "email": "crechemimaelghalia@gmail.com",
  "password": "password"
}
```
✅ **Résultat attendu**: Token sauvegardé automatiquement dans `{{admin_token}}`

#### 1.2 Login Staff
```
POST /api/auth/login
Body:
{
  "email": "staff@mimaelghalia.tn",
  "password": "password"
}
```
✅ **Résultat attendu**: Token sauvegardé dans `{{staff_token}}`

#### 1.3 Login Parent
```
POST /api/auth/login
Body:
{
  "email": "parent1@example.com",
  "password": "password"
}
```
✅ **Résultat attendu**: Token sauvegardé dans `{{parent_token}}`

---

### ÉTAPE 2: TÂCHES (Admin → Staff)

#### 2.1 Créer une tâche (Admin)
```
POST /api/tasks
Headers: Authorization: Bearer {{admin_token}}
Body:
{
  "title": "Préparer activité peinture",
  "description": "Préparer le matériel pour l'activité peinture de demain",
  "assigned_to": 2,
  "due_date": "2025-11-12T14:00:00Z",
  "priority": "high"
}
```
✅ **Résultat attendu**:
- Tâche créée
- Notification envoyée au staff (user_id=2)
- Status 201

#### 2.2 Voir mes tâches (Staff)
```
GET /api/tasks/my
Headers: Authorization: Bearer {{staff_token}}
```
✅ **Résultat attendu**: Liste des tâches assignées au staff

#### 2.3 Tâches d'aujourd'hui
```
GET /api/tasks/today
Headers: Authorization: Bearer {{staff_token}}
```
✅ **Résultat attendu**: Tâches dont due_date = aujourd'hui

#### 2.4 Changer statut (Staff complète la tâche)
```
PATCH /api/tasks/1/status
Headers: Authorization: Bearer {{staff_token}}
Body:
{
  "status": "completed"
}
```
✅ **Résultat attendu**:
- Statut changé à "completed"
- completed_at rempli
- Notification envoyée à l'admin

#### 2.5 Tâches en retard (Admin)
```
GET /api/tasks/overdue
Headers: Authorization: Bearer {{admin_token}}
```
✅ **Résultat attendu**: Liste des tâches avec due_date < aujourd'hui et status != completed

#### 2.6 Envoyer rappel (Admin)
```
POST /api/tasks/1/remind
Headers: Authorization: Bearer {{admin_token}}
```
✅ **Résultat attendu**: Notification de rappel envoyée au staff

---

### ÉTAPE 3: ANNONCES (Admin → Parents)

#### 3.1 Créer annonce (Admin)
```
POST /api/announcements
Headers: Authorization: Bearer {{admin_token}}
Body:
{
  "title": "Réunion parents",
  "description": "Réunion de rentrée pour tous les parents le 15 novembre à 18h",
  "event_date": "2025-11-15T18:00:00Z",
  "event_type": "reunion",
  "target_audience": "all",
  "is_published": true
}
```
✅ **Résultat attendu**:
- Annonce créée
- Si is_published=true → Tous les parents notifiés

#### 3.2 Toutes les annonces (Admin)
```
GET /api/announcements?is_published=true
Headers: Authorization: Bearer {{admin_token}}
```
✅ **Résultat attendu**: Liste de toutes les annonces publiées

#### 3.3 Publier une annonce
```
PATCH /api/announcements/1/publish
Headers: Authorization: Bearer {{admin_token}}
```
✅ **Résultat attendu**:
- is_published = true
- Notifications envoyées aux parents

---

### ÉTAPE 4: RENDEZ-VOUS (Admin ↔ Parent)

#### 4.1 Créer RDV (Admin)
```
POST /api/appointments
Headers: Authorization: Bearer {{admin_token}}
Body:
{
  "parent_id": 3,
  "child_id": 1,
  "subject": "Discussion sur le comportement",
  "description": "Discuter du comportement de l'enfant en classe",
  "proposed_date": "2025-11-13T10:00:00Z",
  "location": "Bureau directrice"
}
```
✅ **Résultat attendu**:
- RDV créé avec status="proposed"
- Notification envoyée au parent

#### 4.2 Mes RDV
```
GET /api/appointments
Headers: Authorization: Bearer {{admin_token}} ou {{parent_token}}
```
✅ **Résultat attendu**: 
- Admin: Tous les RDV
- Parent: Seulement ses RDV

#### 4.3 RDV aujourd'hui (Admin)
```
GET /api/appointments/today
Headers: Authorization: Bearer {{admin_token}}
```
✅ **Résultat attendu**: RDV dont la date = aujourd'hui

#### 4.4 Confirmer RDV (Parent)
```
PATCH /api/appointments/1/confirm
Headers: Authorization: Bearer {{parent_token}}
Body:
{
  "confirmed_date": "2025-11-13T10:00:00Z"
}
```
✅ **Résultat attendu**:
- status = "confirmed"
- confirmed_date remplie
- Notification à l'admin

#### 4.5 Proposer nouvelle date (Parent)
```
PATCH /api/appointments/1/reschedule
Headers: Authorization: Bearer {{parent_token}}
Body:
{
  "new_date": "2025-11-14T14:00:00Z"
}
```
✅ **Résultat attendu**:
- status = "rescheduled"
- proposed_date mise à jour
- Notification à l'admin

#### 4.6 Marquer complété (Admin)
```
PATCH /api/appointments/1/complete
Headers: Authorization: Bearer {{admin_token}}
Body:
{
  "notes": "Réunion productive, parents coopératifs"
}
```
✅ **Résultat attendu**: status = "completed", notes enregistrées

---

### ÉTAPE 5: MESSAGES STAFF (Staff ↔ Admin)

#### 5.1 Envoyer message (Staff → Admin)
```
POST /api/staff-messages
Headers: Authorization: Bearer {{staff_token}}
Body:
{
  "recipient_id": 1,
  "subject": "Demande de congé",
  "content": "Bonjour, je souhaiterais prendre un congé le 20 novembre. Merci"
}
```
✅ **Résultat attendu**:
- Message créé
- Notification à l'admin

#### 5.2 Répondre (Admin → Staff)
```
POST /api/staff-messages
Headers: Authorization: Bearer {{admin_token}}
Body:
{
  "recipient_id": 2,
  "parent_message_id": 1,
  "content": "Bonjour, votre demande est acceptée. Bon congé !"
}
```
✅ **Résultat attendu**:
- Réponse créée avec parent_message_id
- Notification au staff

#### 5.3 Mes messages
```
GET /api/staff-messages
Headers: Authorization: Bearer {{staff_token}}
```
✅ **Résultat attendu**: Messages où user est sender OU recipient

#### 5.4 Conversation complète
```
GET /api/staff-messages/1/conversation
Headers: Authorization: Bearer {{staff_token}}
```
✅ **Résultat attendu**: Message original + toutes les réponses

#### 5.5 Marquer comme lu
```
PATCH /api/staff-messages/1/read
Headers: Authorization: Bearer {{admin_token}}
```
✅ **Résultat attendu**: is_read = true, read_at rempli

---

### ÉTAPE 6: MÉMOS PERSONNELS

#### 6.1 Créer mémo
```
POST /api/personal-memos
Headers: Authorization: Bearer {{staff_token}}
Body:
{
  "content": "Appeler le fournisseur de jouets",
  "memo_date": "2025-11-12"
}
```
✅ **Résultat attendu**: Mémo créé pour l'utilisateur connecté

#### 6.2 Mes mémos
```
GET /api/personal-memos
Headers: Authorization: Bearer {{staff_token}}
```
✅ **Résultat attendu**: Tous les mémos de l'utilisateur

#### 6.3 Mémos d'aujourd'hui
```
GET /api/personal-memos/today
Headers: Authorization: Bearer {{staff_token}}
```
✅ **Résultat attendu**: Mémos où memo_date = aujourd'hui et is_completed = false

#### 6.4 Marquer complété
```
PATCH /api/personal-memos/1/complete
Headers: Authorization: Bearer {{staff_token}}
```
✅ **Résultat attendu**: is_completed = true, completed_at rempli

#### 6.5 Supprimer mémo
```
DELETE /api/personal-memos/1
Headers: Authorization: Bearer {{staff_token}}
```
✅ **Résultat attendu**: Mémo supprimé

---

## 🔍 VÉRIFICATIONS IMPORTANTES

### Notifications
Après chaque action importante, vérifier:
```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
```

### Tâches d'aujourd'hui (Vue)
```sql
SELECT * FROM admin_today_tasks;
SELECT * FROM staff_today_tasks WHERE assigned_to = 2;
```

### Tâches en retard (Vue)
```sql
SELECT * FROM overdue_tasks;
```

### Anniversaires (Vue)
```sql
SELECT * FROM upcoming_birthdays;
```

---

## ⚠️ ERREURS COURANTES

### 401 Unauthorized
- Token expiré ou invalide
- Relancer le login

### 403 Forbidden
- Mauvais rôle (ex: staff essaie d'accéder à une route admin)
- Vérifier les permissions

### 404 Not Found
- ID inexistant
- Vérifier que la ressource existe

### 500 Internal Server Error
- Erreur serveur
- Vérifier les logs backend
- Vérifier la structure des données

---

## 📊 SCÉNARIOS DE TEST COMPLETS

### Scénario 1: Cycle complet d'une tâche
1. Admin crée tâche → Staff notifié
2. Staff voit tâche dans "Mes tâches"
3. Staff change statut à "in_progress"
4. Staff complète tâche → Admin notifié
5. Admin vérifie dans "Tâches complétées"

### Scénario 2: Cycle RDV
1. Admin propose RDV → Parent notifié
2. Parent propose nouvelle date → Admin notifié
3. Admin accepte → Parent notifié
4. RDV apparaît dans "RDV aujourd'hui"
5. Admin marque complété avec notes

### Scénario 3: Conversation staff
1. Staff envoie message → Admin notifié
2. Admin répond → Staff notifié
3. Staff voit conversation complète
4. Staff marque comme lu

---

## ✅ CHECKLIST FINALE

- [ ] Tous les logins fonctionnent
- [ ] Tâches: CRUD complet
- [ ] Annonces: Création + publication + notifications
- [ ] RDV: Proposition + confirmation + replanification
- [ ] Messages: Envoi + réponse + conversation
- [ ] Mémos: CRUD complet
- [ ] Notifications créées correctement
- [ ] Permissions respectées (admin/staff/parent)
- [ ] Vues SQL fonctionnent
- [ ] Pas d'erreurs 500

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Tester toutes les routes
2. ✅ Vérifier les notifications
3. ✅ Valider les permissions
4. 🔄 Créer le frontend
5. 🔄 Intégrer les widgets
6. 🔄 Tests end-to-end

---

**Bon courage pour les tests ! 🚀**
