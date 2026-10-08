# Guide du rôle Parent

> Public : parents d'enfants inscrits. Document non technique.

## Ce que vous pouvez faire (« Mon Espace »)

| Fonction | Écran | Statut |
|---|---|---|
| Voir et mettre à jour votre profil (photo, coordonnées, mot de passe) | Profil | ✅ Implémenté |
| Consulter la fiche de vos enfants (détails, infos médicales, contacts d'urgence) | Mon espace → Enfant | ✅ |
| Voir les rapports journaliers de vos enfants (repas, couches, sommeil…) | Rapports journaliers | ✅ |
| Voir les traitements médicaux de votre enfant | Traitements | ✅ |
| Signaler une absence à l'avance | Demande d'absence | ✅ |
| Consulter l'historique de présence | Rapport de présence | ✅ |
| Lire les annonces de la crèche | Annonces | ✅ |
| Consulter le calendrier (événements, jours fermés) | Calendrier | ✅ |
| Voir le fil d'activités (photos/vidéos, réactions, commentaires) | Activités | ✅ |
| Écrire au personnel / à la direction | Messages | ✅ |
| Inscrire un autre enfant | Ajouter un enfant | ✅ |
| Proposer ou confirmer un rendez-vous (après acceptation du dossier) | Lien reçu par e-mail / espace | ✅ (voir [appointments](../03-user-guide/appointments.md)) |
| Déposer un témoignage | — | ⚠️ Route API présente (`POST /api/testimonials`) ; écran parent **À vérifier dans le projet** |

## Ce que vous ne pouvez pas faire
- Voir les enfants d'autres familles.
- Accéder au tableau de bord de la crèche (redirection vers une page « accès refusé »).
- Modifier les présences, les rapports ou les traitements (lecture seule côté parent).

## Premiers pas
1. Vous recevez un e-mail avec un lien pour **créer votre mot de passe** (valable 7 jours).
2. Connectez-vous, puis ouvrez « Mon Espace ».
3. Vous pouvez passer l'interface en français ou en arabe.

Voir aussi : [getting-started](../03-user-guide/getting-started.md).

## Limites connues
- Le lien de création de mot de passe expire : l'administration peut le renvoyer.
- Pas d'application mobile dans le dépôt (les notifications « push » ne sont donc pas exploitables en l'état).
