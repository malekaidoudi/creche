# Entités : Notification et journal d'e-mails

## Notification (`notifications`)
Attributs : user_id, title, message, type (info/success/warning/error + types spécifiques), is_read, related_id, created_at. Créée par les services (rendez-vous, messages, événements, annonces, jours fériés). API : `/api/notifications`.
⚠️ Création, diffusion, suppression, « tout lu » par utilisateur et statistiques sont **sans authentification** (voir audit).

## E-mail (`email_logs`)
Statut : pending, sent, failed, bounced. Consultation `GET /api/logs/email` ; suppression `DELETE /api/logs/email/:id`.

**Sources** : `routes_postgres/notifications.js`, `services/notificationService.js`, `emails/emailService.js`.
