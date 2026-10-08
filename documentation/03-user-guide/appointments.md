# Rendez-vous

- **Objectif** : fixer le rendez-vous de visite/finalisation après l'acceptation d'un dossier.
- **Qui** : famille (par lien public ou compte), administration, personnel (consultation du jour, clôture).
- **Cycle** : proposé → (contre-proposition) → confirmé → terminé ; autres états : reporté, annulé, absent (`no_show`), échec (`failed`).
- **Comment (famille)** : e-mail d'acceptation → confirmer la date, ou proposer une autre date (identification par n° de dossier + e-mail).
- **Comment (admin)** : « Rendez-vous en attente », confirmer / contre-proposer / annuler ; personnel et admin peuvent marquer « terminé ».
- **Résultat** : notifications internes et e-mail de confirmation.
- **Limites** : l'état `no_show`/`failed` est utilisé par le contrôleur mais absent de la liste des statuts du service ; l'archivage après échecs n'est pas routé.
