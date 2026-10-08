# Rapports journaliers et fournitures

## Rapport journalier
- **Objectif** : informer les parents de la journée de l'enfant.
- **Qui** : saisie par personnel/admin ; lecture par les parents (leurs enfants).
- **Comment** : Rapports journaliers → enfants du jour → ouvrir/saisir → enregistrer. Types : **bébé** ou **enfant**. Statuts : brouillon, terminé, envoyé (`PATCH /:id/status`).
- **Contenu** : repas, changements de couche, et autres champs selon le type (sommeil, humeur : **détail exact À vérifier dans `dailyReportsController`**).
- **Résultat** : le parent consulte les rapports via « Rapports journaliers » (historique par enfant).
- **Limites** : suppression réservée selon contrôles de la route (voir endpoints).

## Fournitures (couches, lingettes, crème…)
- **Objectif** : suivre le stock apporté par les parents.
- **Types** : couches, lingettes, crème, autre ; un seuil d'alerte par type.
- **Actions** : réapprovisionnement (`refill`), utilisation (`use`), historique, fournitures apportées aujourd'hui, options de nourriture de l'enfant.
- **Qui** : personnel/admin ; **À vérifier** pour la visibilité parent.

## Affectations du personnel
L'administrateur affecte chaque membre à « bébés », « enfants » ou « les deux » ; chacun voit son affectation.
