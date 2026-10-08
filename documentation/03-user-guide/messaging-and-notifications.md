# Messagerie et notifications

## Messagerie interne
- **Qui** : parents, personnel, administration.
- **Comment** : Messages → choisir un contact → écrire ; fil de conversation ; compteur de non-lus ; marquer comme lu.
- **Règle** : le personnel ne peut écrire aux parents que s'il possède la permission « messages parents ».
- **Résultat** : le destinataire reçoit une notification interne (et un « push » si un jeton existe — pas d'appli mobile dans le dépôt).
- **Limites** : aucune suppression/archivage de message trouvé (**Non confirmé**) ; pas de pièces jointes confirmées.

## Notifications
- Cloche : liste, marquer lue, tout marquer comme lu. Types : info, succès, avertissement, erreur (+ types spécifiques).
- Générées automatiquement (rendez-vous, messages, événements, annonces, jours fériés).
- Pas de temps réel (pas de WebSocket) : mise à jour par rafraîchissement.

## E-mails automatiques
Confirmation d'inscription, acceptation/refus, bienvenue parent/personnel, réinitialisation, confirmation de rendez-vous, notification générale.

## Courrier (formulaire de contact)
Les messages du site public arrivent dans « Mailbox » (admin/personnel) ; réponse par e-mail, statut, suppression.
