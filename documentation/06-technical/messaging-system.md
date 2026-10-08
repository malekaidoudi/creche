# Système de messagerie

- Table `staff_messages` (sender_id, recipient_id, parent_message_id, subject, content, lu).
- Routes `/api/staff-messages` : `POST /`, `GET /`, `/unread`, `/conversations`, `/conversation/:contactId`, `/:id/conversation`, `PATCH /:id/read` ; rôles staff/admin/parent.
- `staffMessageService` : vérifie `messages.parents` (staff→parent), insère une notification, envoie un push Expo.
- Contacts disponibles : `GET /api/users/contacts`.
- Mémos personnels : `/api/personal-memos` (séparé).
- Pas de temps réel (ni WebSocket ni SSE), pas de suppression de message, pièces jointes **Non confirmées**.
- Le courrier du site public : `/api/contacts` (envoi) et `/api/admin/contact-messages` (traitement).
