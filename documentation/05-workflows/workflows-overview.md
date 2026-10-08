# Workflows

## 1. Inscription → approbation → rendez-vous → compte parent
```mermaid
sequenceDiagram
    actor F as Famille
    participant API as API
    actor A as Admin
    F->>API: POST /api/enrollments (formulaire public)
    API-->>F: e-mail REGISTRATION_CONFIRMATION
    API->>A: tâche + notification
    F->>API: POST /enrollments/:id/documents
    A->>API: POST /enrollments/:id/approve (appointment_date)
    API->>API: crée parent (password_token 7 j) + rendez-vous
    API-->>F: e-mail ENROLLMENT_ACCEPTED (lien /create-password)
    F->>API: confirme ou contre-propose (appointments/public/*)
    A->>API: PATCH /appointments/:id/complete
    F->>API: POST /auth/create-password
```
Rejet : `PUT /:id/reject` → `rejected_incomplete` (e-mail documents manquants) ou `rejected_deleted` (e-mail de refus).

## 2. Authentification
```mermaid
flowchart LR
  L[POST /auth/login] -->|bcrypt OK| T[JWT 7j] --> S[localStorage token] --> H[Authorization: Bearer]
  H --> M[authenticateToken] --> R[requireRole / requirePermission]
```

## 3. Réinitialisation du mot de passe
`POST /auth/forgot-password` (réponse identique que le compte existe ou non) → e-mail avec jeton 1 h → `GET /auth/verify-reset-token/:token` → `POST /auth/reset-password`.

## 4. Négociation de rendez-vous
```mermaid
stateDiagram-v2
  [*] --> proposed
  proposed --> confirmed: confirm
  proposed --> counter_proposed: counter-propose
  counter_proposed --> confirmed: confirm
  counter_proposed --> proposed: nouvelle proposition
  confirmed --> completed: complete
  proposed --> cancelled: cancel
  confirmed --> cancelled: cancel
```
(`rescheduled`, `no_show`, `failed` existent dans le code sans transitions routées confirmées.)

## 5. Traitement médical
Création → apparition dans « aujourd'hui » → `POST /:id/administer` (trace) → cron (2 h) notifie les doses → annulation `DELETE /:id`.

## 6. Messagerie
Expéditeur → `POST /api/staff-messages` (contrôle `messages.parents` si staff→parent) → notification + push → destinataire lit (`PATCH /:id/read`).

## 7. Rapport journalier
brouillon → terminé → envoyé ; le parent lit via `/parent/my-children`.

## 8. Création de compte par l'admin
`POST /user-workflow/create-parent|create-staff` → e-mail avec jeton 7 j → `POST /user-workflow/set-password` ; `resend-password-link` si expiré.
