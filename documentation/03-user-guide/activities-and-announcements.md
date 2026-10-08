# Activités et annonces

## Fil d'activités
- **Qui** : lecture : utilisateurs connectés (et page publique `/activites` : **À vérifier** quelles données). Publication : personnel avec permission `activities.photos.publish`, admin.
- **Comment** : Activités → publier (texte, photos/vidéos via Cloudinary) ; réactions, commentaires (suppression par auteur/admin selon route).
- **Limites** : vidéos volumineuses : envoi direct vers Cloudinary via une signature (`/api/cloudinary/signature`).

## Annonces
- **Qui** : création, liste complète, publication, suppression : **admin**. Les parents/personnel lisent « mes annonces ».
- **Cycle** : brouillon → publié ; la publication génère des notifications.

## Témoignages
Dépôt par utilisateur, validation/rejet/mise en avant par admin ; affichage public des témoignages approuvés.

## Visite virtuelle
Images publiques ; remplacement/suppression par admin.
