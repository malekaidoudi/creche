# Présences et absences

## Présences
- **Objectif** : enregistrer l'arrivée et le départ.
- **Qui** : personnel (permission « gérer les présences ») et administration. Parents : consultation de l'historique.
- **Comment** : Présences → Aujourd'hui → pointer arrivée / départ. Historique et statistiques disponibles.
- **Statuts** (schéma initial) : présent, absent, en retard, départ anticipé. Un seul enregistrement par enfant et par jour.
- **Résultat** : mise à jour de la liste « actuellement présents », des statistiques et des rapports de présence.
- **Limites** : le fichier de routes contient deux séries de routes `GET /today`, `/stats`… (doublons) ; la première déclarée prévaut — voir [inconsistencies](../09-audit/inconsistencies.md).

## Demandes d'absence (parent)
- **Qui** : parent (création), personnel/admin (consultation, « pris en compte »).
- **Comment** : Mon espace → Demande d'absence → choisir enfant, dates, motif → envoi. Le personnel marque la demande comme prise en compte.
- **Résultat** : visible dans « Gestion des absences » et « aujourd'hui ».

## Jours fermés
Jours fériés et vacances annuelles de la crèche : voir [administration](administration.md).
