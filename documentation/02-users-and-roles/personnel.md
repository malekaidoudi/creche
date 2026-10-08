# Guide du rôle Personnel (éducatrices)

> Public : éducatrices / personnel de la crèche. Document non technique.

## Menu accessible
Tableau de bord, messages, courrier, enfants (liste, absences), activités, planning (mensuel, hebdomadaire), rapports journaliers, traitements, présences (aujourd'hui, historique, statistiques).

## Fonctions
| Fonction | Statut | Remarque |
|---|---|---|
| Consulter la liste et la fiche des enfants | ✅ | Téléphone/e-mail des parents masqués sans les droits `parents.phone.view` / `parents.email.view` |
| Pointer arrivée / départ | ✅ | Nécessite la permission « gérer les présences » (`attendance.manage`) |
| Saisir le rapport journalier (repas, couches, sommeil, humeur…) | ✅ | Voir [daily-reports](../03-user-guide/daily-reports-and-supplies.md) |
| Gérer les fournitures par enfant | ✅ | |
| Administrer / suivre les traitements du jour | ✅ | [treatments](../03-user-guide/treatments.md) |
| Publier des activités avec photos | ✅ | Permission `activities.photos.publish` |
| Écrire aux parents | ✅ | Permission `messages.parents` |
| Gérer la photo d'un enfant | ✅ | Permission `children.photos.manage` |
| Consulter ses tâches, mémos personnels | ✅ | |
| Voir son affectation (bébés / enfants / les deux) | ✅ | `GET /api/staff-assignments/my-assignment` |

## Droits
Le personnel reçoit automatiquement un ensemble de droits « communs ». L'administrateur peut ajuster les droits de chacun (Paramètres du personnel). Voir [permissions-matrix](permissions-matrix.md).

## Ce que le personnel ne peut pas faire
Créer des comptes, approuver/rejeter une inscription, supprimer un enfant, modifier les paramètres de la crèche, voir les journaux techniques (selon l'interface ; **plusieurs routes API ne sont toutefois pas verrouillées**, cf. [security-findings](../09-audit/security-findings.md)).
