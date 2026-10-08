# Gestion des enfants

- **Objectif** : tenir à jour les fiches enfants.
- **Qui** : liste/fiches : personnel et administration ; parents : leurs enfants uniquement. Création : personnel/admin. Suppression, association à un parent : admin.
- **Prérequis** : enfant inscrit (ou création directe via « Ajouter un enfant »).

## Actions
| Action | Qui | Détail |
|---|---|---|
| Rechercher / filtrer (statut, sexe, âge) | personnel, admin | Pagination |
| Consulter la fiche | personnel, admin, parent concerné | |
| Créer / modifier | personnel+, parent (ses enfants) | Prénom, nom, date de naissance obligatoires |
| Infos médicales (allergies, médicaments, groupe sanguin, médecin) | accès enfant | Lecture/écriture selon accès |
| Contacts d'urgence | accès enfant | |
| Photo | selon permission `children.photos.manage` ou parent | Un partage photo avec le personnel existe (`photo_shared_with_staff`) |
| Associer / dissocier un parent | admin | |
| Supprimer / désactiver | admin | Via un service de cycle de vie (`childLifecycleService`) |
| Anniversaires du mois | tous | |

## Erreurs possibles
Accès refusé à l'enfant d'un autre parent ; champs invalides.

## Limites
Certaines routes de statistiques enfants ne sont pas protégées côté API (voir audit).
