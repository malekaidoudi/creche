# Entités : Message

## Message interne (`staff_messages`)
Attributs : sender_id, recipient_id, parent_message_id (fil), subject, content, statut lu. Création : rôles staff/admin/parent (staff→parent : permission `messages.parents`). Pas de suppression (Non confirmé). API : `/api/staff-messages`.

## Message de contact (`contact_messages`)
Reçu du site public (`POST /api/contact`), traité par admin : consultation, réponse e-mail, changement de statut, suppression, statistiques (`/api/admin/contact-messages`).

**Sources** : `routes_postgres/staff-messages.js`, `services/staffMessageService.js`, `contactMessages.js`, `contacts.js`.
