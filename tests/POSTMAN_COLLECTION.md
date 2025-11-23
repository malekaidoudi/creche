# Collection Postman - Crèche Mima Elghalia

## Configuration
- **Base URL**: `http://localhost:3003`
- **Variables à créer dans Postman**:
  - `baseUrl`: http://localhost:3003
  - `token`: (sera rempli automatiquement après login)
  - `userId`: (sera rempli automatiquement après login)
  - `childId`: (à définir manuellement ou via tests)
  - `enrollmentId`: (à définir manuellement ou via tests)

## 🔐 Authentication

### 1. Login - Admin
```
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "crechemimaelghalia@gmail.com",
  "password": "password"
}
```

### 2. Login - Staff
```
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "staff@mimaelghalia.tn",
  "password": "password"
}
```

### 3. Login - Parent
```
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "parent1@example.com",
  "password": "password"
}
```

### 4. Get Current User
```
GET {{baseUrl}}/api/auth/me
Authorization: Bearer {{token}}
```

### 5. Logout
```
POST {{baseUrl}}/api/auth/logout
Authorization: Bearer {{token}}
```

## 👶 Children

### 1. Get All Children
```
GET {{baseUrl}}/api/children
Authorization: Bearer {{token}}
```

### 2. Get Child by ID
```
GET {{baseUrl}}/api/children/{{childId}}
Authorization: Bearer {{token}}
```

### 3. Create Child
```
POST {{baseUrl}}/api/children
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "first_name": "Test",
  "last_name": "Enfant",
  "date_of_birth": "2021-05-15",
  "gender": "M",
  "parent_id": "{{userId}}"
}
```

### 4. Update Child
```
PUT {{baseUrl}}/api/children/{{childId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "first_name": "Test Updated"
}
```

### 5. Delete Child
```
DELETE {{baseUrl}}/api/children/{{childId}}
Authorization: Bearer {{token}}
```

## 📝 Enrollments

### 1. Get All Enrollments
```
GET {{baseUrl}}/api/enrollments
Authorization: Bearer {{token}}
```

### 2. Get Pending Enrollments
```
GET {{baseUrl}}/api/enrollments?status=pending
Authorization: Bearer {{token}}
```

### 3. Create Enrollment (Public)
```
POST {{baseUrl}}/api/enrollments
Content-Type: application/json

{
  "child_first_name": "Ahmed",
  "child_last_name": "Ben Ali",
  "child_date_of_birth": "2021-03-10",
  "child_gender": "M",
  "parent_first_name": "Mohamed",
  "parent_last_name": "Ben Ali",
  "parent_email": "test@example.com",
  "parent_phone": "+216 20 123 456",
  "start_date": "2024-01-15"
}
```

### 4. Approve Enrollment
```
PUT {{baseUrl}}/api/enrollments/{{enrollmentId}}/status
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "approved"
}
```

### 5. Reject Enrollment
```
PUT {{baseUrl}}/api/enrollments/{{enrollmentId}}/status
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "rejected",
  "rejection_reason": "Places complètes"
}
```

## 📅 Attendance

### 1. Get Today's Attendance
```
GET {{baseUrl}}/api/attendance/today
Authorization: Bearer {{token}}
```

### 2. Get Attendance by Date
```
GET {{baseUrl}}/api/attendance?date=2024-11-16
Authorization: Bearer {{token}}
```

### 3. Mark Attendance
```
POST {{baseUrl}}/api/attendance
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "child_id": "{{childId}}",
  "status": "present",
  "check_in_time": "08:30:00"
}
```

### 4. Update Attendance
```
PUT {{baseUrl}}/api/attendance/{{childId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "absent",
  "notes": "Malade"
}
```

## 📆 Events

### 1. Get All Events
```
GET {{baseUrl}}/api/events
Authorization: Bearer {{token}}
```

### 2. Create Event
```
POST {{baseUrl}}/api/events
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Fête de fin d'année",
  "description": "Célébration avec les parents",
  "event_date": "2024-12-20",
  "start_time": "14:00:00",
  "end_time": "17:00:00",
  "location": "Salle principale"
}
```

### 3. Update Event
```
PUT {{baseUrl}}/api/events/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Fête de fin d'année - Modifié"
}
```

### 4. Delete Event
```
DELETE {{baseUrl}}/api/events/1
Authorization: Bearer {{token}}
```

## 📋 Tasks

### 1. Get All Tasks
```
GET {{baseUrl}}/api/tasks
Authorization: Bearer {{token}}
```

### 2. Get My Tasks
```
GET {{baseUrl}}/api/tasks/my-tasks
Authorization: Bearer {{token}}
```

### 3. Create Task
```
POST {{baseUrl}}/api/tasks
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Préparer activité peinture",
  "description": "Acheter matériel et préparer l'espace",
  "due_date": "2024-11-20",
  "priority": "high",
  "assigned_to": "{{userId}}"
}
```

### 4. Update Task Status
```
PUT {{baseUrl}}/api/tasks/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "completed"
}
```

## 🗓️ Appointments

### 1. Get All Appointments
```
GET {{baseUrl}}/api/appointments
Authorization: Bearer {{token}}
```

### 2. Create Appointment
```
POST {{baseUrl}}/api/appointments
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "appointment_date": "2024-11-25",
  "appointment_time": "10:00:00",
  "reason": "Discussion sur le développement de l'enfant"
}
```

### 3. Update Appointment Status
```
PUT {{baseUrl}}/api/appointments/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "confirmed"
}
```

## 🔔 Notifications

### 1. Get All Notifications
```
GET {{baseUrl}}/api/notifications
Authorization: Bearer {{token}}
```

### 2. Get Unread Notifications
```
GET {{baseUrl}}/api/notifications?is_read=false
Authorization: Bearer {{token}}
```

### 3. Mark Notification as Read
```
PUT {{baseUrl}}/api/notifications/1/read
Authorization: Bearer {{token}}
```

### 4. Mark All as Read
```
PUT {{baseUrl}}/api/notifications/mark-all-read
Authorization: Bearer {{token}}
```

## 🏥 Absences

### 1. Get All Absence Requests
```
GET {{baseUrl}}/api/absences
Authorization: Bearer {{token}}
```

### 2. Create Absence Request
```
POST {{baseUrl}}/api/absences
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "child_id": "{{childId}}",
  "start_date": "2024-11-18",
  "end_date": "2024-11-20",
  "reason": "Maladie"
}
```

### 3. Approve Absence
```
PUT {{baseUrl}}/api/absences/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "approved"
}
```

## 📄 Documents

### 1. Get Documents
```
GET {{baseUrl}}/api/documents
Authorization: Bearer {{token}}
```

### 2. Upload Document
```
POST {{baseUrl}}/api/documents
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

file: [FILE]
document_type: medical_certificate
child_id: {{childId}}
```

## ⚙️ Settings

### 1. Get Settings
```
GET {{baseUrl}}/api/settings
Authorization: Bearer {{token}}
```

### 2. Get Contact Info (Public)
```
GET {{baseUrl}}/api/contact/info
```

### 3. Update Settings
```
PUT {{baseUrl}}/api/settings
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nursery_name": "Crèche Mima Elghalia",
  "email": "contact@mimaelghalia.tn",
  "phone": "+216 70 123 456"
}
```

## 👥 Users

### 1. Get All Users
```
GET {{baseUrl}}/api/users
Authorization: Bearer {{token}}
```

### 2. Get User by ID
```
GET {{baseUrl}}/api/users/{{userId}}
Authorization: Bearer {{token}}
```

### 3. Create User
```
POST {{baseUrl}}/api/users
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "first_name": "Nouveau",
  "last_name": "Utilisateur",
  "role": "staff"
}
```

### 4. Update User
```
PUT {{baseUrl}}/api/users/{{userId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "first_name": "Nom Modifié"
}
```

### 5. Delete User
```
DELETE {{baseUrl}}/api/users/{{userId}}
Authorization: Bearer {{token}}
```

## 📊 Reports

### 1. Get Attendance Report
```
GET {{baseUrl}}/api/reports/attendance?start_date=2024-11-01&end_date=2024-11-30
Authorization: Bearer {{token}}
```

### 2. Get Enrollment Report
```
GET {{baseUrl}}/api/reports/enrollments?year=2024
Authorization: Bearer {{token}}
```

### 3. Get Financial Report
```
GET {{baseUrl}}/api/reports/financial?month=11&year=2024
Authorization: Bearer {{token}}
```
