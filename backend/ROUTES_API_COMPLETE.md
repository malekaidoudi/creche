# 📋 API Routes - Documentation Complète

**Backend:** Crèche Mima Elghalia  
**Version:** 2.1.0  
**Base URL:** `https://creche-backend.onrender.com`  
**Date:** 09/01/2025

---

## 🔐 Authentication

### POST /api/auth/login
**Description:** Connexion utilisateur  
**Auth:** Public  
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": { ... }
}
```

### POST /api/auth/register
**Description:** Inscription nouvel utilisateur  
**Auth:** Public  
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

### GET /api/auth/me
**Description:** Récupérer profil utilisateur connecté  
**Auth:** Bearer Token  
**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "parent"
  }
}
```

---

## 👥 Users

### GET /api/users
**Description:** Liste tous les utilisateurs  
**Auth:** Admin  
**Query Params:** `?role=parent&page=1&limit=10`

### GET /api/users/:id
**Description:** Détails d'un utilisateur  
**Auth:** Admin ou propriétaire

### POST /api/users
**Description:** Créer un utilisateur  
**Auth:** Admin

### PUT /api/users/:id
**Description:** Modifier un utilisateur  
**Auth:** Admin ou propriétaire

### DELETE /api/users/:id
**Description:** Supprimer un utilisateur  
**Auth:** Admin

### GET /api/user/has-children
**Description:** Vérifier si l'utilisateur a des enfants  
**Auth:** Bearer Token

---

## 👶 Children

### GET /api/children
**Description:** Liste tous les enfants  
**Auth:** Staff/Admin  
**Query Params:** `?parent_id=1&status=active`

### GET /api/children/:id
**Description:** Détails d'un enfant  
**Auth:** Staff/Admin ou parent propriétaire

### POST /api/children
**Description:** Ajouter un enfant  
**Auth:** Parent/Staff/Admin

### PUT /api/children/:id
**Description:** Modifier un enfant  
**Auth:** Staff/Admin ou parent propriétaire

### DELETE /api/children/:id
**Description:** Supprimer un enfant  
**Auth:** Admin

---

## 📝 Enrollments (Inscriptions)

### GET /api/enrollments
**Description:** Liste toutes les inscriptions  
**Auth:** Staff/Admin  
**Query Params:** `?status=pending&page=1`

### GET /api/enrollments/:id
**Description:** Détails d'une inscription  
**Auth:** Staff/Admin ou parent propriétaire

### POST /api/enrollments
**Description:** Créer une inscription  
**Auth:** Parent/Staff/Admin

### PUT /api/enrollments/:id
**Description:** Modifier une inscription  
**Auth:** Staff/Admin

### PATCH /api/enrollments/:id/status
**Description:** Changer le statut d'une inscription  
**Auth:** Staff/Admin  
**Body:**
```json
{
  "status": "approved",
  "appointment_date": "2025-01-15"
}
```

### DELETE /api/enrollments/:id
**Description:** Supprimer une inscription  
**Auth:** Admin

### GET /api/public-enrollments
**Description:** Formulaire d'inscription public  
**Auth:** Public

### POST /api/public-enrollments
**Description:** Soumettre une inscription publique  
**Auth:** Public

---

## 📅 Attendance (Présences)

### GET /api/attendance
**Description:** Liste des présences  
**Auth:** Staff/Admin  
**Query Params:** `?date=2025-01-09&child_id=1`

### GET /api/attendance/:id
**Description:** Détails d'une présence  
**Auth:** Staff/Admin

### POST /api/attendance
**Description:** Enregistrer une présence  
**Auth:** Staff/Admin  
**Body:**
```json
{
  "child_id": 1,
  "date": "2025-01-09",
  "status": "present",
  "check_in_time": "08:30",
  "check_out_time": "17:00"
}
```

### PUT /api/attendance/:id
**Description:** Modifier une présence  
**Auth:** Staff/Admin

### DELETE /api/attendance/:id
**Description:** Supprimer une présence  
**Auth:** Admin

---

## ✅ Tasks (Tâches Quotidiennes) 🆕

### GET /api/tasks/today
**Description:** Récupérer les tâches du jour (personnalisées + RDV)  
**Auth:** Staff/Admin  
**Response:**
```json
{
  "success": true,
  "count": 5,
  "date": "9 janvier 2025",
  "tasks": [
    {
      "id": 1,
      "type": "custom",
      "title": "Appeler parent de Sarah",
      "description": "Discuter du comportement",
      "time": "10:00",
      "priority": "high",
      "status": "pending"
    },
    {
      "id": "appointment-45",
      "type": "appointment",
      "title": "RDV: Ahmed Ben Ali",
      "time": "14:00",
      "contact": {
        "name": "Fatima Ben Ali",
        "phone": "+216 12 345 678",
        "email": "fatima@example.com"
      }
    }
  ]
}
```

### POST /api/tasks
**Description:** Créer une nouvelle tâche personnalisée  
**Auth:** Staff/Admin  
**Body:**
```json
{
  "title": "Préparer activité peinture",
  "description": "Acheter matériel nécessaire",
  "task_date": "2025-01-09",
  "task_time": "15:30",
  "priority": "normal",
  "assigned_to": 5
}
```

### PATCH /api/tasks/:id/status
**Description:** Mettre à jour le statut d'une tâche  
**Auth:** Staff/Admin  
**Body:**
```json
{
  "status": "completed"
}
```

### DELETE /api/tasks/:id
**Description:** Supprimer une tâche personnalisée  
**Auth:** Staff/Admin  
**Note:** Les rendez-vous ne peuvent pas être supprimés

---

## 🔔 Notifications

### GET /api/notifications
**Description:** Liste des notifications de l'utilisateur  
**Auth:** Bearer Token  
**Query Params:** `?page=1&limit=20&unread=true`

### GET /api/notifications/:id
**Description:** Détails d'une notification  
**Auth:** Bearer Token

### PATCH /api/notifications/:id/read
**Description:** Marquer comme lue  
**Auth:** Bearer Token

### DELETE /api/notifications/:id
**Description:** Supprimer une notification  
**Auth:** Bearer Token

---

## 🏖️ Holidays (Jours Fériés)

### GET /api/holidays
**Description:** Liste des jours fériés  
**Auth:** Public  
**Query Params:** `?year=2025`

### POST /api/holidays
**Description:** Ajouter un jour férié  
**Auth:** Admin  
**Body:**
```json
{
  "name": "Aïd el-Fitr",
  "date": "2025-04-10",
  "type": "religious"
}
```

### PUT /api/holidays/:id
**Description:** Modifier un jour férié  
**Auth:** Admin

### DELETE /api/holidays/:id
**Description:** Supprimer un jour férié  
**Auth:** Admin

---

## ⚙️ Nursery Settings (Paramètres Crèche)

### GET /api/nursery-settings
**Description:** Récupérer les paramètres de la crèche  
**Auth:** Public

### PUT /api/nursery-settings
**Description:** Modifier les paramètres  
**Auth:** Admin  
**Body:**
```json
{
  "name": "Crèche Mima Elghalia",
  "address": "Tunis, Tunisie",
  "phone": "+216 XX XXX XXX",
  "email": "contact@creche.com",
  "capacity": 50,
  "opening_time": "07:30",
  "closing_time": "18:00"
}
```

---

## 📊 Reports (Rapports)

### GET /api/reports/stats
**Description:** Statistiques globales  
**Auth:** Admin

### GET /api/reports/attendance
**Description:** Rapport de présences  
**Auth:** Staff/Admin  
**Query Params:** `?start_date=2025-01-01&end_date=2025-01-31`

### GET /api/reports/enrollments
**Description:** Rapport d'inscriptions  
**Auth:** Admin

---

## 📄 Documents

### GET /api/documents
**Description:** Liste des documents  
**Auth:** Staff/Admin

### POST /api/documents
**Description:** Uploader un document  
**Auth:** Staff/Admin  
**Content-Type:** multipart/form-data

### GET /api/documents/:id
**Description:** Télécharger un document  
**Auth:** Staff/Admin ou parent propriétaire

### DELETE /api/documents/:id
**Description:** Supprimer un document  
**Auth:** Admin

---

## 📤 Uploads (Fichiers)

### POST /api/uploads
**Description:** Uploader un fichier (image, PDF)  
**Auth:** Bearer Token  
**Content-Type:** multipart/form-data  
**Field:** `file`

### GET /uploads/:filename
**Description:** Accéder à un fichier uploadé  
**Auth:** Public (si configuré)

---

## 📰 News & Articles

### GET /api/news
**Description:** Liste des actualités  
**Auth:** Public  
**Query Params:** `?page=1&limit=10`

### GET /api/news/:id
**Description:** Détails d'une actualité  
**Auth:** Public

### POST /api/news
**Description:** Créer une actualité  
**Auth:** Admin

### PUT /api/news/:id
**Description:** Modifier une actualité  
**Auth:** Admin

### DELETE /api/news/:id
**Description:** Supprimer une actualité  
**Auth:** Admin

### GET /api/articles
**Description:** Liste des articles  
**Auth:** Public

### POST /api/articles
**Description:** Créer un article  
**Auth:** Admin

---

## 📞 Contacts

### GET /api/contacts
**Description:** Liste des messages de contact  
**Auth:** Admin

### POST /api/contacts
**Description:** Envoyer un message de contact  
**Auth:** Public  
**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question",
  "message": "Bonjour..."
}
```

### DELETE /api/contacts/:id
**Description:** Supprimer un message  
**Auth:** Admin

---

## 🚫 Absences

### GET /api/absences
**Description:** Liste des absences  
**Auth:** Staff/Admin

### POST /api/absences
**Description:** Déclarer une absence  
**Auth:** Parent/Staff/Admin  
**Body:**
```json
{
  "child_id": 1,
  "start_date": "2025-01-15",
  "end_date": "2025-01-17",
  "reason": "Maladie"
}
```

### GET /api/absence-requests
**Description:** Liste des demandes d'absence  
**Auth:** Staff/Admin

### PATCH /api/absence-requests/:id/status
**Description:** Approuver/Rejeter une demande  
**Auth:** Staff/Admin

---

## 👤 Profile

### GET /api/profile
**Description:** Profil de l'utilisateur connecté  
**Auth:** Bearer Token

### PUT /api/profile
**Description:** Modifier son profil  
**Auth:** Bearer Token  
**Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+216 XX XXX XXX"
}
```

### PUT /api/profile/password
**Description:** Changer son mot de passe  
**Auth:** Bearer Token  
**Body:**
```json
{
  "current_password": "old123",
  "new_password": "new456"
}
```

---

## 📅 Schedule Settings

### GET /api/schedule-settings
**Description:** Paramètres d'horaires  
**Auth:** Staff/Admin

### PUT /api/schedule-settings
**Description:** Modifier les horaires  
**Auth:** Admin

---

## 📝 Logs

### GET /api/logs
**Description:** Logs système  
**Auth:** Admin  
**Query Params:** `?limit=50&level=error`

---

## 🏥 Health Check

### GET /api/health
**Description:** Vérifier l'état du serveur  
**Auth:** Public  
**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": 3600,
  "timestamp": "2025-01-09T08:00:00Z"
}
```

---

## 🔧 Setup & Maintenance

### POST /api/setup
**Description:** Configuration initiale  
**Auth:** Admin (première installation)

### POST /api/fix-user-role
**Description:** Corriger les rôles utilisateurs  
**Auth:** Admin

---

## 📋 Résumé des Routes

| Catégorie | Nombre de Routes | Auth Requise |
|-----------|------------------|--------------|
| Authentication | 3 | Public/Token |
| Users | 6 | Admin/Token |
| Children | 5 | Staff/Admin/Parent |
| Enrollments | 8 | Staff/Admin/Public |
| Attendance | 5 | Staff/Admin |
| **Tasks** 🆕 | **4** | **Staff/Admin** |
| Notifications | 4 | Token |
| Holidays | 4 | Public/Admin |
| Nursery Settings | 2 | Public/Admin |
| Reports | 3 | Staff/Admin |
| Documents | 4 | Staff/Admin |
| Uploads | 2 | Token/Public |
| News & Articles | 8 | Public/Admin |
| Contacts | 3 | Public/Admin |
| Absences | 4 | Parent/Staff/Admin |
| Profile | 3 | Token |
| Schedule | 2 | Staff/Admin |
| Logs | 1 | Admin |
| Health | 1 | Public |
| Setup | 2 | Admin |

**Total: ~70+ routes**

---

## 🔑 Authentification

Toutes les routes protégées nécessitent un header:
```
Authorization: Bearer <jwt_token>
```

Obtenir un token via `/api/auth/login`

---

## 📊 Codes de Statut HTTP

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Non trouvé |
| 500 | Erreur serveur |

---

## 🎯 Rôles Utilisateurs

| Rôle | Permissions |
|------|-------------|
| `admin` | Accès complet |
| `staff` | Gestion quotidienne |
| `parent` | Ses enfants uniquement |

---

## 📝 Notes Importantes

1. **Rate Limiting:** 1000 requêtes par 15 minutes
2. **Taille max upload:** 10 MB
3. **Format dates:** ISO 8601 (`YYYY-MM-DD`)
4. **Format heures:** 24h (`HH:MM`)
5. **Pagination:** `?page=1&limit=10`
6. **Tri:** `?sort=created_at&order=desc`

---

## 🆕 Nouveautés v2.1.0

- ✅ Routes `/api/tasks` pour gestion des tâches quotidiennes
- ✅ Rendez-vous automatiques dans les tâches
- ✅ Gestion des priorités (low, normal, high, urgent)
- ✅ Statuts de tâches (pending, in_progress, completed, cancelled)

---

**Dernière mise à jour:** 09/01/2025  
**Fichier source:** `backend/server_postgres.js`
